// controllers/symptomCheckerController.js
import axios from "axios";
import dotenv from "dotenv";
import doctorModel from "../models/doctorModel.js";

dotenv.config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "mistralai/mixtral-8x7b-instruct";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173/";

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

// Maps loose specialization names (as an LLM or a rule may phrase them) to
// search stems that match the speciality titles stored on doctor documents
// (e.g. "Cardiologist", "General physician", "Pediatricians").
const SPECIALITY_STEMS = {
  cardiology: "cardio",
  cardiologist: "cardio",
  heart: "cardio",
  dermatology: "dermato",
  dermatologist: "dermato",
  skin: "dermato",
  neurology: "neuro",
  neurologist: "neuro",
  gastroenterology: "gastro",
  gastroenterologist: "gastro",
  gynecology: "gyn",
  gynaecology: "gyn",
  gynecologist: "gyn",
  obstetrics: "gyn",
  pediatrics: "pediatric",
  paediatrics: "pediatric",
  pediatrician: "pediatric",
  "general physician": "general",
  "general practitioner": "general",
  "family medicine": "general",
  "internal medicine": "general",
  "primary care": "general",
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toSearchStem(term) {
  const key = String(term || "").toLowerCase().trim();
  if (!key) return null;
  if (SPECIALITY_STEMS[key]) return SPECIALITY_STEMS[key];
  // fall back to a prefix of the word itself so "Cardiology" still hits "Cardiologist"
  const word = key.split(/\s+/)[0];
  return word.length > 6 ? word.slice(0, 6) : word;
}

async function findDoctorsForSpecializations(specializations) {
  const stems = Array.from(
    new Set((specializations || []).map(toSearchStem).filter(Boolean))
  ).slice(0, 4);

  const select = "name speciality rating reviewsCount image fees available";
  let doctors = [];

  if (stems.length > 0) {
    const orQuery = stems.map((stem) => ({
      speciality: { $regex: escapeRegex(stem), $options: "i" },
    }));
    doctors = await doctorModel
      .find({ $or: orQuery })
      .select(select)
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(6)
      .lean();
  }

  // Nothing matched — suggest general physicians, then any top-rated doctors,
  // so the user always gets someone to book.
  if (doctors.length === 0) {
    doctors = await doctorModel
      .find({ speciality: { $regex: "general", $options: "i" } })
      .select(select)
      .limit(6)
      .lean();
  }
  if (doctors.length === 0) {
    doctors = await doctorModel
      .find({})
      .select(select)
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(6)
      .lean();
  }
  return doctors;
}

// ---------------------------------------------------------------------------
// Rule-based analyzer used whenever the AI call fails (bad key, network,
// unparseable output). Keyword driven; intentionally conservative.
// ---------------------------------------------------------------------------
const RULES = [
  {
    keywords: ["chest pain", "chest tightness", "palpitation", "heart pain", "irregular heartbeat"],
    condition: "Possible cardiac issue (e.g. angina)",
    speciality: "cardiology",
    urgent: true,
  },
  {
    keywords: ["shortness of breath", "breathless", "difficulty breathing", "wheez"],
    condition: "Respiratory or cardiac strain",
    speciality: "cardiology",
    urgent: true,
  },
  {
    keywords: ["headache", "migraine", "dizzy", "dizziness", "numbness", "seizure", "memory loss", "blurred vision", "fainted", "fainting"],
    condition: "Neurological issue (e.g. migraine, vertigo)",
    speciality: "neurology",
  },
  {
    keywords: ["rash", "itch", "acne", "skin", "eczema", "pimple", "hives", "psoriasis"],
    condition: "Skin condition (e.g. dermatitis, allergy)",
    speciality: "dermatology",
  },
  {
    keywords: ["stomach", "abdominal", "nausea", "vomit", "diarrhea", "diarrhoea", "constipation", "acidity", "heartburn", "indigestion", "bloating", "gas"],
    condition: "Digestive issue (e.g. gastritis, indigestion)",
    speciality: "gastroenterology",
  },
  {
    keywords: ["period", "menstrual", "pregnan", "vaginal", "pcos", "pelvic pain"],
    condition: "Gynecological concern",
    speciality: "gynecology",
  },
  {
    keywords: ["child", "baby", "infant", "toddler", "my son", "my daughter"],
    condition: "Pediatric concern",
    speciality: "pediatrics",
  },
  {
    keywords: ["fever", "cold", "cough", "sore throat", "flu", "fatigue", "body ache", "body pain", "tired", "weakness", "runny nose", "sneez"],
    condition: "Common infection (e.g. viral fever, flu, common cold)",
    speciality: "general physician",
  },
];

function localSymptomAnalysis(symptoms) {
  const text = symptoms.toLowerCase();
  const conditions = [];
  const specializations = [];
  let urgent = false;

  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      if (!conditions.includes(rule.condition)) conditions.push(rule.condition);
      if (!specializations.includes(rule.speciality)) specializations.push(rule.speciality);
      if (rule.urgent) urgent = true;
    }
  }

  if (conditions.length === 0) {
    conditions.push("Symptoms need an in-person evaluation");
    specializations.push("general physician");
  }

  const recommendations = urgent
    ? [
        "Some of these symptoms can be serious — if they are severe or sudden, seek emergency care immediately",
        "Book the earliest available consultation with the suggested specialist",
        "Avoid physical exertion until you have been examined",
      ]
    : [
        "Book a consultation with one of the suggested specialists",
        "Rest, stay hydrated, and monitor your symptoms",
        "Seek urgent care if symptoms worsen or new severe symptoms appear",
      ];

  return {
    conditions: conditions.slice(0, 3),
    confidence: conditions.slice(0, 3).map(() => "moderate"),
    recommendations,
    specializations: specializations.slice(0, 3),
  };
}

async function askOpenRouter(symptoms) {
  const prompt = `
You are a clinical-level virtual health assistant (non-diagnostic advisor). A patient reports the following symptoms: "${symptoms}".

Return a JSON object ONLY (no extra commentary) with this schema:
{
  "conditions": ["Most likely condition 1", "condition 2", ...],
  "confidence": ["high"|"moderate"|"low", ...] (same length as conditions),
  "recommendations": ["Immediate advice / triage (e.g. see ER)", "next steps", ...],
  "specializations": ["pediatrics", "general physician", "cardiology", ...] (specialties to consult)
}

Keep arrays short (3 items max each).
`;

  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": FRONTEND,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const raw = response?.data?.choices?.[0]?.message?.content?.trim() || "";
  return safeParseJSON(raw);
}

export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string" || !symptoms.trim()) {
      return res.status(400).json({ success: false, message: "Valid symptoms are required." });
    }

    let ai = null;
    let source = "ai";
    try {
      ai = await askOpenRouter(symptoms.trim());
      if (!ai) throw new Error("Model returned unparseable output");
    } catch (aiError) {
      console.error(
        "⚠️ AI symptom analysis unavailable, using built-in analyzer:",
        aiError.response?.status || aiError.message
      );
      ai = localSymptomAnalysis(symptoms.trim());
      source = "local-fallback";
    }

    const {
      conditions = [],
      confidence = [],
      recommendations = [],
      specializations = [],
    } = ai;

    const suggestedDoctors = await findDoctorsForSpecializations(specializations);

    res.json({
      success: true,
      ai: { conditions, confidence, recommendations, specializations },
      suggestedDoctors,
      source,
    });
  } catch (error) {
    console.error("❌ Symptom Checker Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to analyze symptoms." });
  }
};
