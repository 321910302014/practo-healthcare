// utils/aiPrescriptionValidator.js

import fetch from "node-fetch";

/**
 * Convert weight to kilograms if in pounds.
 */
const convertWeightToKg = (weight, unit = "kg") => {
  if (!weight) return null;
  if (unit.toLowerCase().includes("lb") || unit.toLowerCase().includes("pound")) {
    return (parseFloat(weight) * 0.453592).toFixed(2);
  }
  return parseFloat(weight);
};

/**
 * Calculate age using DOB and a reference date (prescription date).
 */
const calculateAgeFromDOB = (dobString, referenceDate) => {
  if (!dobString || !referenceDate) return null;
  const parsed = new Date(dobString);
  if (isNaN(parsed)) return null;

  let age = referenceDate.getFullYear() - parsed.getFullYear();
  const m = referenceDate.getMonth() - parsed.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < parsed.getDate())) {
    age--;
  }
  return age;
};

export const validatePrescription = async (reportText, patientData = {}) => {
  let age = patientData.age ?? null;
  let weight = patientData.weight ?? null;
  let prescriptionDate = null;

  // 1️⃣ Extract prescription date if present (Month Day, Year format)
  const dateMatch = reportText.match(
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},\s*\d{4}\b/i
  );
  if (dateMatch) prescriptionDate = new Date(dateMatch[0]);

  // 2️⃣ Calculate age using DOB & prescription date
  if (!age && prescriptionDate) {
    const dobMatch = reportText.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
    if (dobMatch) {
      const calculated = calculateAgeFromDOB(dobMatch[0], prescriptionDate);
      if (calculated !== null) age = calculated;
    }
  }

  // 3️⃣ Parse weight (supports X lbs, X pounds, X kg, decimals)
  const weightMatch = reportText.match(/(\d{1,4}(?:\.\d{1,2})?)\s*(pounds|lbs|lb|kg)/i);
  if (weightMatch) weight = convertWeightToKg(weightMatch[1], weightMatch[2]);

  // Debug logging for developers
  console.log("🟢 Parsed DOB:", reportText.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/)?.[0] ?? "not found");
  console.log("🟢 Prescription Date:", prescriptionDate ? prescriptionDate.toDateString() : "not found");
  console.log("🟢 Calculated Age:", age ?? "unknown");
  console.log("🟢 Parsed Weight:", weight ? `${weight} kg` : "unknown");

  // 4️⃣ Build prompt for AI
  const prompt = `
You are a medical prescription safety checker.

VERY IMPORTANT:
- TRUST the provided age (${age ?? "unknown"}) and weight (${weight ?? "unknown"} kg).
- Do NOT claim age or weight are wrong or missing.
- If age >= 12, treat dosing as adult unless clearly toxic.
- Use weight ONLY to flag clearly dangerous overdoses (10x unsafe).
- Do NOT output weight or age complaints.
- Focus ONLY on medicine safety, contraindications, overdoses, and interactions.

Respond ONLY in JSON:
{
  "status": "safe" | "warning" | "unsafe",
  "issues": ["short, focused safety-related issues only"]
}

Prescription text:
${reportText}

Patient:
Age: ${age ?? "unknown"} years (calculated from DOB & prescription date if available)
Weight: ${weight ? `${weight} kg` : "unknown"}
History: ${patientData.history?.join(", ") ?? "none"}
Allergies: ${patientData.allergies?.join(", ") ?? "none"}
`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [{ role: "system", content: prompt }],
        temperature: 0,
      }),
      signal: controller.signal,
    });

    const data = await response.json();
    clearTimeout(timeout);
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("No response from AI model");
    }

    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
    } catch {
      const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { status: "warning", issues: ["Could not parse AI response."] };
    }

    if (!result.status) result.status = "warning";
    if (!Array.isArray(result.issues)) result.issues = ["Unable to parse detailed issues."];

    // Map "unsafe" → "warning" to avoid schema errors in backend
    if (result.status === "unsafe") {
      result.status = "warning";
      result.issues.unshift("⚠️ Severe issue detected: originally flagged as UNSAFE.");
    }

    return result;
  } catch (error) {
    clearTimeout(timeout);
    console.error("AI validation failed:", error.name === 'AbortError' ? 'timeout' : error.message);
    return {
      status: "warning",
      issues: ["AI validation failed. Please review prescription manually."],
    };
  }
};
