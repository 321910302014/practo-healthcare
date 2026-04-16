import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { toast } from "react-toastify";
import { DoctorContext } from "../context/DoctorContext";
import { AdminContext } from "../context/AdminContext";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const VideoCallContent = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { dToken } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);

  const [loading, setLoading] = useState(true);
  const [fallbackRoom, setFallbackRoom] = useState(false);

  useEffect(() => {
    const joinRoom = async () => {
      try {
        if (!appointmentId) {
          toast.error("Missing appointment id");
          navigate(-1);
          return;
        }

        const authToken = dToken || aToken;
        if (!authToken) {
          toast.error("Please log in again");
          navigate("/");
          return;
        }

        const { data } = await axios.post(
          `${backendUrl}/api/100ms/appointment-token-clinician`,
          { appointmentId },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (!data?.success || !data.token) {
          toast.error(data?.message || "Failed to get video call token");
          navigate(-1);
          return;
        }

        setFallbackRoom(Boolean(data.fallback));

        await hmsActions.join({
          userName: aToken ? "Clinic Staff" : "Doctor",
          authToken: data.token,
        });
        setLoading(false);
      } catch (err) {
        console.error("Video Call Error:", err);
        toast.error(err.response?.data?.message || "Error joining video call");
        navigate(-1);
      }
    };

    joinRoom();
    return () => {
      hmsActions.leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const handleLeave = async () => {
    await hmsActions.leave();
    navigate(-1);
  };

  if (loading && !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Connecting to consultation…</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-[85vh] rounded-3xl overflow-hidden flex flex-col relative text-white">
      {fallbackRoom && (
        <div className="absolute top-0 inset-x-0 z-30 bg-amber-500/90 text-black text-xs font-semibold text-center py-1.5 tracking-wide">
          ⚠️ Shared demo room — per-appointment rooms are not configured on this deployment
        </div>
      )}
      <div className="absolute top-6 left-6 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Consultation · APT-{appointmentId?.slice(-6)}
        </span>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-[#050510]">
        {peers.length === 0 ? (
          <p className="text-indigo-300 animate-pulse">Establishing connection…</p>
        ) : (
          <div className="w-full h-full">
            <div className="w-full h-full flex items-center justify-center p-4">
              {peers.filter((p) => !p.isLocal).length > 0 ? (
                peers.filter((p) => !p.isLocal).map((peer) => (
                  <Peer key={peer.id} peer={peer} isRemote />
                ))
              ) : (
                <div className="text-center max-w-sm">
                  <div className="w-24 h-24 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                    <span className="text-4xl">👤</span>
                  </div>
                  <h3 className="text-lg font-bold">Waiting for the other party to join…</h3>
                </div>
              )}
            </div>

            {localPeer && (
              <div className="absolute bottom-32 right-8 w-48 sm:w-64 aspect-video z-20 shadow-2xl">
                <Peer peer={localPeer} isLocal />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-30 px-6">
        <ControlButtons hmsActions={hmsActions} onLeave={handleLeave} />
      </div>
    </div>
  );
};

const Peer = ({ peer, isLocal }) => {
  const { videoRef } = useVideo({ trackId: peer.videoTrack });
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0a0a1f] border border-white/10">
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
      />
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {peer.name || (isLocal ? "You" : "Remote")}
        </span>
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
    <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10">
      <button
        onClick={toggleAudio}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isAudioOff ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
        title={isAudioOff ? "Unmute" : "Mute"}
      >
        <span>{isAudioOff ? "🔇" : "🎤"}</span>
      </button>
      <button
        onClick={toggleVideo}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isVideoOff ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
        title={isVideoOff ? "Start Video" : "Stop Video"}
      >
        <span>{isVideoOff ? "🚫" : "📹"}</span>
      </button>
      <button
        onClick={onLeave}
        className="bg-red-500 hover:bg-red-600 px-6 h-12 rounded-2xl font-bold text-xs tracking-widest"
      >
        LEAVE
      </button>
    </div>
  );
};

const VideoCall = () => (
  <HMSRoomProvider>
    <VideoCallContent />
  </HMSRoomProvider>
);

export default VideoCall;
