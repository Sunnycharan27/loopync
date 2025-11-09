import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

const WebRTCCallModal = ({ 
  callData, 
  currentUser,
  socket,
  onClose,
  isIncoming = false
}) => {
  const [callState, setCallState] = useState(isIncoming ? 'ringing' : 'connecting');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callData?.callType === 'video');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);
  const iceCandidatesQueue = useRef([]);

  // STUN servers configuration (free Google STUN servers)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    isMountedRef.current = true;
    initializeCall();
    
    return () => {
      isMountedRef.current = false;
      cleanupCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      console.log('🚀 Initializing WebRTC call...');
      
      // Get user media
      const stream = await getUserMedia();
      localStreamRef.current = stream;
      
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peerConnection;

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log('📤 Sending ICE candidate');
          socket.emit('webrtc-ice-candidate', {
            candidate: event.candidate,
            to: callData.otherUserId,
            callId: callData.callId
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('📥 Received remote stream');
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setRemoteUserJoined(true);
          setCallState('connected');
          startTimer();
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setCallState('connected');
          setRemoteUserJoined(true);
          toast.success('Call connected!');
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          toast.error('Call disconnected');
          handleEndCall();
        }
      };

      // Setup WebSocket listeners
      if (socket) {
        socket.on('webrtc-offer', handleReceiveOffer);
        socket.on('webrtc-answer', handleReceiveAnswer);
        socket.on('webrtc-ice-candidate', handleReceiveIceCandidate);
        socket.on('call-ended', handleRemoteCallEnd);
      }

      // If outgoing call, create and send offer
      if (!isIncoming) {
        await createAndSendOffer();
      }

    } catch (error) {
      console.error('❌ Error initializing call:', error);
      toast.error('Failed to initialize call: ' + error.message);
      onClose();
    }
  };

  const getUserMedia = async () => {
    try {
      const constraints = {
        audio: true,
        video: callData?.callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got user media:', stream.getTracks().map(t => t.kind));
      return stream;
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      throw new Error('Could not access camera/microphone. Please grant permissions.');
    }
  };

  const createAndSendOffer = async () => {
    try {
      console.log('📤 Creating offer...');
      const peerConnection = peerConnectionRef.current;
      
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callData?.callType === 'video'
      });

      await peerConnection.setLocalDescription(offer);

      // Send offer via WebSocket
      if (socket) {
        socket.emit('webrtc-offer', {
          offer: offer,
          to: callData.otherUserId,
          from: currentUser.id,
          callId: callData.callId,
          callType: callData.callType,
          callerName: currentUser.name
        });
        console.log('✅ Offer sent');
      }
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      toast.error('Failed to create call offer');
    }
  };

  const handleReceiveOffer = async (data) => {
    try {
      console.log('📥 Received offer from:', data.from);
      const peerConnection = peerConnectionRef.current;
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }

      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        answer: answer,
        to: data.from,
        callId: data.callId
      });

      console.log('✅ Answer sent');
      setCallState('connecting');
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      toast.error('Failed to accept call');
    }
  };

  const handleReceiveAnswer = async (data) => {
    try {
      console.log('📥 Received answer');
      const peerConnection = peerConnectionRef.current;
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      
      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      
      console.log('✅ Answer processed');
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  };

  const handleReceiveIceCandidate = async (data) => {
    try {
      console.log('📥 Received ICE candidate');
      const peerConnection = peerConnectionRef.current;
      
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('✅ ICE candidate added');
      } else {
        // Queue candidates until remote description is set
        iceCandidatesQueue.current.push(data.candidate);
        console.log('📦 ICE candidate queued');
      }
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  };

  const handleRemoteCallEnd = () => {
    console.log('📞 Remote user ended call');
    toast.info('Call ended by other user');
    handleEndCall();
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        toast.success(audioTrack.enabled ? 'Microphone on' : 'Microphone off');
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        toast.success(videoTrack.enabled ? 'Camera on' : 'Camera off');
      }
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);
  };

  const handleEndCall = async () => {
    console.log('🔴 Ending call...');
    
    // Notify other user via WebSocket
    if (socket && callData) {
      socket.emit('end-call', {
        to: callData.otherUserId,
        callId: callData.callId
      });
    }

    cleanupCall();
    onClose();
  };

  const cleanupCall = () => {
    console.log('🧹 Cleaning up call resources...');
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Remove WebSocket listeners
    if (socket) {
      socket.off('webrtc-offer', handleReceiveOffer);
      socket.off('webrtc-answer', handleReceiveAnswer);
      socket.off('webrtc-ice-candidate', handleReceiveIceCandidate);
      socket.off('call-ended', handleRemoteCallEnd);
    }
  };

  const handleAcceptCall = async () => {
    console.log('✅ Accepting call...');
    setCallState('connecting');
    // Offer will be received via WebSocket and handled by handleReceiveOffer
  };

  const handleRejectCall = () => {
    console.log('❌ Rejecting call...');
    if (socket && callData) {
      socket.emit('reject-call', {
        to: callData.otherUserId,
        callId: callData.callId
      });
    }
    cleanupCall();
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const callModalContent = (
    <div className={`fixed inset-0 bg-black z-[9999] flex flex-col ${isFullscreen ? '' : 'p-4'}`}>
      {/* Remote Video (Full Screen) */}
      <div className="relative flex-1 bg-gray-900">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {!remoteUserJoined && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold">
                {callData?.otherUserName?.[0]?.toUpperCase() || '?'}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{callData?.otherUserName || 'Unknown'}</h2>
              <p className="text-gray-400">
                {callState === 'ringing' && 'Incoming call...'}
                {callState === 'connecting' && 'Connecting...'}
                {callState === 'connected' && 'Connected'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {isVideoEnabled && (
          <div className="absolute top-4 right-4 w-32 h-40 bg-gray-800 rounded-lg overflow-hidden border-2 border-cyan-400 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call Info */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-white font-semibold">
            {callState === 'connected' ? formatTime(elapsedTime) : callState}
          </p>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/70"
        >
          {isFullscreen ? <Minimize2 size={20} className="text-white" /> : <Maximize2 size={20} className="text-white" />}
        </button>
      </div>

      {/* Call Controls */}
      <div className="bg-gray-900/95 backdrop-blur-sm py-6">
        {callState === 'ringing' && isIncoming ? (
          <div className="flex justify-center gap-6">
            <button
              onClick={handleRejectCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
            >
              <PhoneOff size={28} className="text-white" />
            </button>
            <button
              onClick={handleAcceptCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg animate-pulse"
            >
              <Phone size={28} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4">
            {/* Mute Audio */}
            <button
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isAudioEnabled ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-white" />}
            </button>

            {/* Toggle Video */}
            {callData?.callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isVideoEnabled ? <Video size={24} className="text-white" /> : <VideoOff size={24} className="text-white" />}
              </button>
            )}

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg"
            >
              <PhoneOff size={28} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(callModalContent, document.body);
};

export default WebRTCCallModal;
