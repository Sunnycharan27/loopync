import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Phone, Video, X, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

const IncomingCallModal = ({ callData, onAccept, onReject }) => {
  const [ringing, setRinging] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Incoming ${callData.callType} call`, {
        body: `${callData.callerName} is calling you...`,
        icon: callData.callerAvatar || '/logo192.png',
        tag: 'incoming-call',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return () => {
        notification.close();
      };
    }
  }, [callData]);

  useEffect(() => {
    // Timer to show how long the call has been ringing
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Auto-reject after 60 seconds
    const autoRejectTimer = setTimeout(() => {
      console.log('Call auto-rejected after 60 seconds');
      toast.info('Missed call');
      onReject();
    }, 60000);

    return () => {
      clearInterval(timer);
      clearTimeout(autoRejectTimer);
    };
  }, [onReject]);

  const handleAccept = () => {
    setRinging(false);
    toast.success(`Connecting to ${callData.callerName}...`);
    onAccept();
  };

  const handleReject = () => {
    setRinging(false);
    toast.info('Call declined');
    onReject();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center" style={{ zIndex: 10000 }}>
      <div className="relative w-full max-w-md mx-4">
        {/* Animated ripple effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {ringing && (
            <>
              <div 
                className="absolute w-80 h-80 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-20 animate-ping" 
                style={{ animationDuration: '2s' }}
              ></div>
              <div 
                className="absolute w-64 h-64 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-30 animate-ping" 
                style={{ animationDuration: '2s', animationDelay: '0.5s' }}
              ></div>
              <div 
                className="absolute w-48 h-48 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-40 animate-ping" 
                style={{ animationDuration: '2s', animationDelay: '1s' }}
              ></div>
            </>
          )}
        </div>

        {/* Call info card */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700 backdrop-blur-xl">
          {/* Call type badge */}
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold">
              {callData.callType === 'video' ? (
                <>
                  <Video className="w-4 h-4" />
                  <span>Video Call</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Voice Call</span>
                </>
              )}
            </div>
          </div>

          {/* Caller avatar */}
          <div className="flex justify-center mb-6 mt-4">
            <div className="relative">
              <img
                src={callData.callerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callData.callerId}`}
                alt={callData.callerName}
                className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover"
              />
              {ringing && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-pulse"></div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                    <Volume2 className="w-6 h-6 text-white" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Caller info */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              {callData.callerName}
            </h2>
            <p className="text-lg text-gray-300 mb-3">
              Incoming call...
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Ringing {timeElapsed}s</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center items-center gap-8 mb-4">
            {/* Reject button */}
            <div className="text-center">
              <button
                onClick={handleReject}
                className="group relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-red-500/50"
                aria-label="Decline call"
              >
                <X className="w-10 h-10 text-white" />
              </button>
              <p className="text-white text-sm font-medium mt-2">Decline</p>
            </div>

            {/* Accept button */}
            <div className="text-center">
              <button
                onClick={handleAccept}
                className="group relative w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl animate-pulse hover:animate-none hover:shadow-green-500/50"
                aria-label="Accept call"
              >
                {callData.callType === 'video' ? (
                  <Video className="w-12 h-12 text-white" />
                ) : (
                  <Phone className="w-12 h-12 text-white" />
                )}
              </button>
              <p className="text-white text-sm font-bold mt-2">Accept</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-gray-700">
            <button className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <Phone className="w-4 h-4" />
              <span>Remind me</span>
            </button>
            <button className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
              <span>Message</span>
            </button>
          </div>
        </div>

        {/* Swipe up instruction (mobile) */}
        <div className="text-center mt-4 text-gray-400 text-sm animate-pulse">
          <p>Accept or decline to respond</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallModal;
