import React, { useState, useEffect, useContext } from "react";
import { MessageCircle, Bell, Mic, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VoiceBotModal from "./VoiceBotModal";
import { AuthContext } from "../App";
import { getMediaUrl } from "../utils/mediaUtils";

const TopHeader = ({ title, subtitle, showIcons = true }) => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [showVoiceBot, setShowVoiceBot] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  return (
    <>
      <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 p-4 mb-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/loopync-logo.jpg" 
            alt="Loopync" 
            className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform aspect-square object-cover flex-shrink-0"
            onClick={() => navigate('/')}
          />
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {title}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-white font-semibold">
                🇮🇳 Made in India
              </span>
            </h1>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        
        {showIcons && (
          <div className="flex items-center gap-2">
            {/* AI Voice Bot Button - More Prominent */}
            <button
              onClick={() => setShowVoiceBot(true)}
              className="relative w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-500 hover:to-blue-600 transition-all shadow-lg shadow-cyan-400/50 hover:scale-110"
              title="AI Voice Assistant"
              aria-label="Open AI Voice Assistant"
            >
              <Mic size={22} className="drop-shadow-lg" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800 animate-pulse"></span>
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              data-testid="header-notifications-btn"
            >
              <Bell size={20} />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400"></div>
          </button>
          <button
            onClick={() => navigate('/messenger')}
            className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            data-testid="header-messenger-btn"
          >
            <MessageCircle size={20} />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400"></div>
          </button>
          
          {/* Profile Icon */}
          {currentUser ? (
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400 hover:border-cyan-300 transition-colors aspect-square flex-shrink-0"
              data-testid="header-profile-btn"
            >
              {currentUser.avatar ? (
                <img 
                  src={getMediaUrl(currentUser.avatar)} 
                  alt="Profile" 
                  className="w-full h-full object-cover preserve-aspect"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name || currentUser.email}`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500 text-black">
                  <User size={20} />
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <User size={20} />
            </button>
          )}
        </div>
      )}
    </div>

    {/* Voice Bot Modal */}
    <VoiceBotModal isOpen={showVoiceBot} onClose={() => setShowVoiceBot(false)} />
  </>
  );
};

export default TopHeader;
