import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    HMSRoomProvider,
    useHMSActions,
    useHMSStore,
    selectIsConnectedToRoom,
    selectLocalPeer,
    selectPeers,
    useVideo,
} from "@100mslive/react-sdk";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const VideoCallContent = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AppContext);
    const hmsActions = useHMSActions();
    const isConnected = useHMSStore(selectIsConnectedToRoom);
    const peers = useHMSStore(selectPeers);
    const localPeer = useHMSStore(selectLocalPeer);

    const [loading, setLoading] = useState(true);

    const joinRoom = async () => {
        try {
            const roomId = import.meta.env.VITE_HMS_ROOM_ID || "68300f05a5ba8326e6eb11a8";

            // 1. Get token from backend
            const { data } = await axios.post(`${backendUrl}/api/100ms/generate-token`, {
                room_id: roomId,
                user_id: user?._id || `user-${Date.now()}`,
                role: "broadcaster" // Use broadcaster for both for a 1-1 call simplicity
            });

            if (data.token) {
                // 2. Join room
                await hmsActions.join({
                    userName: user?.name || "Patient",
                    authToken: data.token,
                });
                setLoading(false);
            } else {
                toast.error("Failed to get video call token");
            }
        } catch (err) {
            console.error("Video Call Error:", err);
            toast.error("Error joining video call");
            navigate(-1);
        }
    };

    useEffect(() => {
        joinRoom();
        return () => {
            hmsActions.leave();
        };
    }, []);

    const handleLeave = async () => {
        await hmsActions.leave();
        navigate("/my-appointments");
    };

    if (loading && !isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Initializing Secure Video Link...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 min-h-[85vh] rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative text-white border border-white/5">
            {/* Header - More Minimal */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 pointer-events-auto">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase opacity-90">Secure Medical Link</h2>
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    <span className="text-[10px] text-gray-400 font-mono tracking-wider">APT-{appointmentId?.slice(-6)}</span>
                </div>

                <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 pointer-events-auto">
                    <span className="text-xs font-semibold text-emerald-400">● LIVE</span>
                    <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
            </div>

            {/* Video Main Area - Theater Mode */}
            <div className="flex-1 relative flex items-center justify-center bg-[#050510]">
                {peers.length === 0 ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-indigo-300 font-medium animate-pulse">Establishing Connection...</p>
                    </div>
                ) : (
                    <div className="w-full h-full relative">
                        {/* 1. Remote Peers (Doctor) - Large Grid */}
                        <div className="w-full h-full flex items-center justify-center p-4">
                            {peers.filter(p => !p.isLocal).length > 0 ? (
                                <div className="w-full h-full">
                                    {peers.filter(p => !p.isLocal).map(peer => (
                                        <Peer key={peer.id} peer={peer} isRemote />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center max-w-md">
                                    <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                                        <span className="text-4xl">👨‍⚕️</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Connecting with your specialist</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Please stay on the line. Your doctor will join the secure
                                        consultation room in a moment.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 2. Local Peer (Patient) - Picture-in-Picture */}
                        {localPeer && (
                            <div className="absolute bottom-32 right-8 w-48 sm:w-64 aspect-video z-20 shadow-2xl group transition-all hover:scale-105">
                                <Peer peer={localPeer} isLocal />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls - Floating Bar */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-30 px-6">
                <ControlButtons hmsActions={hmsActions} onLeave={handleLeave} />
            </div>

            {/* Watermark */}
            <div className="absolute bottom-8 left-8 opacity-20 pointer-events-none select-none">
                <h1 className="text-lg font-bold tracking-tighter text-white/50">PRESCRIPTO <span className="text-indigo-500">PRO</span></h1>
            </div>
        </div>
    );
};

const Peer = ({ peer, isLocal, isRemote }) => {
    const { videoRef } = useVideo({
        trackId: peer.videoTrack,
    });

    return (
        <div className={`relative w-full h-full rounded-[1.5rem] overflow-hidden bg-[#0a0a1f] border transition-all duration-500 ${isLocal
            ? 'shadow-[0_20px_40px_rgba(0,0,0,0.6)] border-white/20'
            : 'border-transparent'
            }`}>
            <video
                ref={videoRef}
                autoPlay
                muted={isLocal}
                playsInline
                className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
            />

            {/* Metadata Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <div className={`w-1.5 h-1.5 rounded-full ${peer.audioTrack ? 'bg-indigo-400' : 'bg-red-500 animate-pulse'}`}></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                        {peer.name || (isLocal ? "Patient" : "Doctor")} {isLocal ? "(You)" : ""}
                    </p>
                </div>

                {!peer.audioTrack && (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center">
                        <span className="text-xs">🔇</span>
                    </div>
                )}
            </div>

            {/* Signal Indicator (Minimalist) */}
            <div className="absolute top-4 right-4 flex gap-1 items-end h-3">
                <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="w-1 h-2 bg-white/40 rounded-full"></div>
                <div className="w-1 h-3 bg-indigo-400 rounded-full"></div>
            </div>
        </div>
    );
};

const ControlButtons = ({ hmsActions, onLeave }) => {
    const [isAudioOff, setAudioOff] = useState(false);
    const [isVideoOff, setVideoOff] = useState(false);

    const toggleAudio = async () => {
        await hmsActions.setLocalAudioEnabled(isAudioOff);
        setAudioOff(!isAudioOff);
    };

    const toggleVideo = async () => {
        await hmsActions.setLocalVideoEnabled(isVideoOff);
        setVideoOff(!isVideoOff);
    };

    return (
        <div className="flex items-center gap-6 bg-black/60 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all hover:border-indigo-500/30">
            {/* Mic */}
            <button
                onClick={toggleAudio}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isAudioOff
                        ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] rotate-12'
                        : 'bg-white/5 hover:bg-white/10 active:scale-90'
                    }`}
                title={isAudioOff ? "Unmute" : "Mute"}
            >
                <span className="text-xl">{isAudioOff ? '🔇' : '🎤'}</span>
            </button>

            {/* Video */}
            <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isVideoOff
                        ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] rotate-12'
                        : 'bg-white/5 hover:bg-white/10 active:scale-90'
                    }`}
                title={isVideoOff ? "Start Video" : "Stop Video"}
            >
                <span className="text-xl">{isVideoOff ? '🚫' : '📹'}</span>
            </button>

            <div className="w-px h-8 bg-white/10 mx-2"></div>

            {/* End Call */}
            <button
                onClick={onLeave}
                className="bg-red-500 hover:bg-red-600 px-8 h-14 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center gap-3 transition-all duration-300 active:scale-95 shadow-[0_10px_30px_rgba(239,68,68,0.3)] hover:shadow-[0_10px_40px_rgba(239,68,68,0.5)]"
            >
                <span className="text-lg">📞</span> LEAVE
            </button>
        </div>
    );
};

const VideoCall = () => {
    return (
        <HMSRoomProvider>
            <VideoCallContent />
        </HMSRoomProvider>
    );
};

export default VideoCall;
