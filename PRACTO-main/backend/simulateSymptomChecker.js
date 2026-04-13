import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import doctorModel from "./models/doctorModel.js";

dotenv.config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "mistralai/mixtral-8x7b-instruct";
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173/";

const simulateCheckSymptoms = async (symptoms) => {
    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI, { dbName: "prescripta" });
        console.log("✅ Connected.");

        const prompt = `
You are a clinical-level virtual health assistant (non-diagnostic advisor). A patient reports the following symptoms: "${symptoms.trim()}".

Return a JSON object ONLY (no extra commentary) with this schema:
{
  "conditions": ["Most likely condition 1", "condition 2", ...],
  "confidence": ["high"|"moderate"|"low", ...] (same length as conditions),
  "recommendations": ["Immediate advice / triage (e.g. see ER)", "next steps", ...],
  "specializations": ["pediatrics", "general physician", "cardiology", ...] (specialties to consult)
}

Keep arrays short (3 items max each). Use plain words for specializations that match common doctor.specialization values in the DB.
`;

        console.log("📡 Sending request to OpenRouter...");
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
            }
        );

        const raw = response?.data?.choices?.[0]?.message?.content?.trim() || "";
        console.log("🤖 AI Raw Response:", raw);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.warn("⚠️ JSON Parse failed, trying extract...");
            const jsonStart = raw.indexOf("{");
            const jsonEnd = raw.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1) {
                parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
            }
        }

        if (parsed) {
            const { specializations = [] } = parsed;
            const uniqueSpecs = Array.from(new Set(specializations.map(s => s.toLowerCase()))).slice(0, 4);
            console.log("🔍 Mapped Specializations:", uniqueSpecs);

            if (uniqueSpecs.length > 0) {
                const orQuery = uniqueSpecs.map(spec => ({ speciality: { $regex: `^${spec}`, $options: "i" } }));
                const doctors = await doctorModel.find({ $or: orQuery }).limit(6).lean();
                console.log(`👨‍⚕️ Found ${doctors.length} doctors.`);
            }
        }

        console.log("🏁 Simulation Finished Successfully.");
    } catch (error) {
        console.error("❌ Simulation Error:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    } finally {
        await mongoose.connection.close();
    }
};

simulateCheckSymptoms("I have a sharp headache and feel dizzy");
