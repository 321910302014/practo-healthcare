import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    HMSRoomProvider,
    useHMSActions,
    useHMSStore,
    selectIsConnectedToRoom,
    selectLocalPeer,
    selectPeers,
    useVideo,
} from '@100mslive/react-sdk'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { toast } from 'react-toastify'

const backendUrl = import.meta.env.VITE_BACKEND_URL

const Peer = ({ peer, isLocal }) => {
    const { videoRef } = useVideo({ trackId: peer.videoTrack })
    return (
        <div className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 ${isLocal ? 'shadow-2xl' : 'w-full h-full'}`}>
            <video
                ref={videoRef}
                autoPlay
                muted={isLocal}
                playsInline
                className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
            />
            <p className='absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-widest text-white bg-black/50 px-2 py-1 rounded-lg'>
                {peer.name || (isLocal ? 'You' : 'Participant')} {isLocal ? '(You)' : ''}
            </p>
        </div>
    )
}

const VideoCallContent = () => {
    const { appointmentId } = useParams()
    const navigate = useNavigate()
    const { dToken } = useContext(DoctorContext)
    const { aToken } = useContext(AdminContext)
    const hmsActions = useHMSActions()
    const isConnected = useHMSStore(selectIsConnectedToRoom)
    const peers = useHMSStore(selectPeers)
    const localPeer = useHMSStore(selectLocalPeer)

    const [loading, setLoading] = useState(true)
    const [isAudioOff, setAudioOff] = useState(false)
    const [isVideoOff, setVideoOff] = useState(false)

    const exitPath = dToken ? '/doctor-appointments' : '/all-appointments'

    const joinRoom = async () => {
        try {
            const authHeader = dToken || aToken
            const { data } = await axios.post(
                `${backendUrl}/api/100ms/join-appointment`,
                { appointmentId },
                { headers: { Authorization: `Bearer ${authHeader}` } }
            )
            if (data.success && data.token) {
                await hmsActions.join({ userName: data.userName || 'Doctor', authToken: data.token })
                setLoading(false)
            } else {
                toast.error(data.message || 'Failed to join video call')
                navigate(exitPath)
            }
        } catch (err) {
            console.error('Video Call Error:', err)
            toast.error(err.response?.data?.message || 'Error joining video call')
            navigate(exitPath)
        }
    }

    useEffect(() => {
        joinRoom()
        return () => {
            hmsActions.leave()
        }
    }, [])

    const handleLeave = async () => {
        await hmsActions.leave()
        navigate(exitPath)
    }

    const toggleAudio = async () => {
        await hmsActions.setLocalAudioEnabled(isAudioOff)
        setAudioOff(!isAudioOff)
    }

    const toggleVideo = async () => {
        await hmsActions.setLocalVideoEnabled(isVideoOff)
        setVideoOff(!isVideoOff)
    }

    if (loading && !isConnected) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[70vh] w-full'>
                <div className='w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
                <p className='text-gray-600 font-medium'>Connecting to consultation room...</p>
            </div>
        )
    }

    const remotePeers = peers.filter(p => !p.isLocal)

    return (
        <div className='w-full m-5 bg-slate-950 min-h-[85vh] rounded-3xl relative overflow-hidden flex flex-col text-white'>
            <div className='absolute top-4 left-4 z-20 bg-black/50 backdrop-blur px-4 py-2 rounded-xl border border-white/10'>
                <p className='text-xs font-bold tracking-widest uppercase'>Consultation • APT-{appointmentId?.slice(-6)}</p>
            </div>

            <div className='flex-1 flex items-center justify-center p-6'>
                {remotePeers.length > 0 ? (
                    <div className='w-full h-[70vh]'>
                        {remotePeers.map(peer => <Peer key={peer.id} peer={peer} />)}
                    </div>
                ) : (
                    <div className='text-center'>
                        <div className='text-5xl mb-4'>🧑‍⚕️</div>
                        <h3 className='text-lg font-bold mb-1'>Waiting for the patient to join</h3>
                        <p className='text-gray-400 text-sm'>Keep this window open — the patient joins from "My Appointments".</p>
                    </div>
                )}
            </div>

            {localPeer && (
                <div className='absolute bottom-24 right-6 w-48 aspect-video z-20'>
                    <Peer peer={localPeer} isLocal />
                </div>
            )}

            <div className='absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-30'>
                <button
                    onClick={toggleAudio}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAudioOff ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
                    title={isAudioOff ? 'Unmute' : 'Mute'}
                >
                    {isAudioOff ? '🔇' : '🎤'}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${isVideoOff ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}
                    title={isVideoOff ? 'Start Video' : 'Stop Video'}
                >
                    {isVideoOff ? '🚫' : '📹'}
                </button>
                <button
                    onClick={handleLeave}
                    className='bg-red-500 hover:bg-red-600 px-6 h-12 rounded-xl font-bold text-xs tracking-widest'
                >
                    📞 LEAVE
                </button>
            </div>
        </div>
    )
}

const VideoCall = () => (
    <HMSRoomProvider>
        <VideoCallContent />
    </HMSRoomProvider>
)

export default VideoCall
