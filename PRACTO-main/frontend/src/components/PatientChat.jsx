import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const PatientChat = ({ appointmentId, userId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const chatContainerRef = useRef();

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchMessages = async () => {
        if (!appointmentId) return;
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
        const trimmed = newMessage.trim();
        if (!trimmed || loading) return;
        if (!userId) {
            toast.error("Please wait — still loading your profile.");
            return;
        }

        setLoading(true);
        const messageToSend = trimmed;
        setNewMessage('');
        try {
            const { data } = await axios.post(`${backendUrl}/api/chat/send`, {
                appointmentId,
                senderType: 'patient',
                senderId: userId,
                message: messageToSend
            });

            if (data.success) {
                fetchMessages();
            } else {
                setNewMessage(messageToSend);
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error) {
            setNewMessage(messageToSend);
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!appointmentId) return;
        fetchMessages().then(() => {
            setIsInitialLoad(false);
        });
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [appointmentId]);

    // Auto-scroll within chat container only (not the entire page)
    // Skip on initial load to prevent page jumping
    useEffect(() => {
        if (isInitialLoad) return;
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isInitialLoad]);

    return (
        <div className="flex flex-col h-[400px] w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-primary p-4 flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold tracking-wide">Doctor Feedback</h3>
                    <p className="text-[10px] opacity-80 uppercase font-black tracking-widest">Secure Chat Channel</p>
                </div>
            </div>

            {/* Message Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                        <MessageSquare size={48} className="mb-2" />
                        <p className="text-sm font-medium">No messages yet. Ask your doctor a question.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={msg._id || index}
                            className={`flex ${msg.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm ${msg.senderType === 'patient'
                                    ? 'bg-primary text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                <p className="text-sm leading-relaxed font-medium">{msg.message}</p>
                                <div className={`flex items-center gap-1 mt-2 opacity-60 text-[8px] uppercase font-black tracking-tighter ${msg.senderType === 'patient' ? 'justify-end' : 'justify-start'
                                    }`}>
                                    <Clock size={8} />
                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-3">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message to your doctor..."
                    className="flex-1 bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-3 text-sm focus:border-primary focus:bg-white transition-all outline-none"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default PatientChat;
