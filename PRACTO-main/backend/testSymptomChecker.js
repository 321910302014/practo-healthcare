import axios from 'axios';

const testSymptomChecker = async () => {
    try {
        console.log("🚀 Testing Symptom Checker API...");
        const response = await axios.post('http://localhost:4000/api/symptom-checker', {
            symptoms: "I have a headache and feel dizzy"
        });
        console.log("✅ Success:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ Error 500 Detected!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
};

testSymptomChecker();
