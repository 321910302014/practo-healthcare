import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

const SymptomChecker = () => {
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let final = "";
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript + " ";
            }
            setSymptoms(prev => (final ? prev + final : prev));
        };

        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
        return () => recognition.stop?.();
    }, []);

    const handleStartListening = () => {
        if (!recognitionRef.current) {
            toast.error("Speech Recognition not supported in this browser.");
            return;
        }
        setSymptoms("");
        recognitionRef.current.start();
        setListening(true);
    };

    const handleStopListening = () => {
        recognitionRef.current?.stop();
        setListening(false);
    };

    const checkSymptoms = async () => {
        if (!symptoms.trim()) {
            toast.warning("Please describe your symptoms first.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/symptom-checker`, { symptoms });

            if (data.success) {
                toast.success("AI Analysis Complete!");
                // Redirect to doctors page with AI results
                navigate('/doctors', {
                    state: {
                        aiResults: data.ai,
                        suggestedDoctors: data.suggestedDoctors,
                        originalSymptoms: symptoms
                    }
                });
            } else {
                toast.error(data.message || "Failed to analyze symptoms.");
            }
        } catch (error) {
            console.error("AI Checker Error:", error);
            toast.error("Network error. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center py-10">
            <div className="w-full max-w-2xl p-8 bg-white shadow-lg rounded-2xl border border-gray-100">
                <h2 className="text-3xl font-bold text-center text-primary mb-2">AI Symptom Checker</h2>
                <p className="text-center text-gray-500 mb-8">Describe how you feel, and our AI will suggest the best specialists for you.</p>

                <div className="relative mb-6">
                    <textarea
                        className="w-full p-4 h-40 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-all text-lg resize-none"
                        placeholder="E.g., I have a sharp headache and feel dizzy since morning..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                    />
                    {listening && (
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium text-red-500 uppercase tracking-wider">Listening...</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {SpeechRecognition && (
                        <button
                            onClick={listening ? handleStopListening : handleStartListening}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${listening
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                    : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                                }`}
                        >
                            {listening ? '🛑 Stop Recording' : '🎙️ Speak Symptoms'}
                        </button>
                    )}

                    <button
                        onClick={checkSymptoms}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-10 py-3 bg-primary text-white rounded-full font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Analyzing...
                            </>
                        ) : (
                            '✨ Get AI Recommendations'
                        )}
                    </button>
                </div>

                <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                    <strong>Note:</strong> This is an AI-powered helper, not a medical diagnosis. Please consult a doctor for clinical advice.
                </div>
            </div>
        </div>
    );
};

export default SymptomChecker;
