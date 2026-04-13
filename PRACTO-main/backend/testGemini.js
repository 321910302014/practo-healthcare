import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const testGemini = async () => {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        console.log("🚀 Testing Gemini API...");
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: "Respond 'Hello' if you can read this." }]
            }]
        });
        console.log("✅ Success:", response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("❌ Gemini API Error:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
};

testGemini();
