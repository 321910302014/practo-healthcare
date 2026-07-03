import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const DoctorChat = ({ appointmentId, doctorId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef();

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchMessages = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/chat/${appointmentId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/chat/send`, {
                appointmentId,
                senderType: 'doctor', // In admin panel, we act as doctor/staff
                senderId: doctorId,
                message: newMessage
            });

            if (data.success) {
                setNewMessage('');
                fetchMessages();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    // Poll for new messages every 3 seconds
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [appointmentId]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-[400px] w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 p-4 flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold">Patient Conversation</h3>
                    <p className="text-[10px] opacity-80 uppercase tracking-widest">Live Consultation Channel</p>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                        <MessageSquare size={48} className="mb-2" />
                        <p className="text-sm font-medium">No messages yet. Start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.senderType === 'doctor' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.senderType === 'doctor'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                <p className="text-xs leading-relaxed">{msg.message}</p>
                                <div className={`flex items-center gap-1 mt-1.5 opacity-60 text-[8px] uppercase font-bold ${msg.senderType === 'doctor' ? 'justify-end' : 'justify-start'
                                    }`}>
                                    <Clock size={8} />
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-50"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default DoctorChat;
