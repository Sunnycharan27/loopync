import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Heart, Eye, ChevronLeft, ChevronRight, Pause, Play, MapPin, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";

const VibeCapsuleViewer = ({ stories, currentUserId, onClose }) => {
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentCapsuleIndex, setCurrentCapsuleIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const currentStory = stories[currentStoryIndex];
  const currentCapsule = currentStory?.capsules[currentCapsuleIndex];

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Handle music playback when capsule changes
  useEffect(() => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }

    // Play new music if capsule has music and not paused
    if (currentCapsule?.music?.previewUrl && !isPaused) {
      playMusic();
    }
  }, [currentStoryIndex, currentCapsuleIndex, currentCapsule?.id]);

  // Handle pause/resume
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [isPaused]);

  // Handle mute toggle
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const playMusic = () => {
    if (!currentCapsule?.music?.previewUrl) return;

    // Clean up existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current.onended = null;
      audioRef.current.onplay = null;
      audioRef.current.onpause = null;
      audioRef.current = null;
    }

    const music = currentCapsule.music;
    const startTime = music.startTime || 0;
    const clipDuration = music.clipDuration || 15;

    const audio = new Audio(music.previewUrl);
    audio.volume = 0.8;
    audio.muted = isMuted;
    audioRef.current = audio;

    // Set start time after audio is ready
    audio.addEventListener('loadedmetadata', () => {
      if (audioRef.current === audio) {
        audio.currentTime = Math.min(startTime, audio.duration - 1);
      }
    });

    // Loop within clip duration
    audio.ontimeupdate = () => {
      if (audioRef.current !== audio) return;
      if (audio.currentTime >= startTime + clipDuration) {
        audio.currentTime = startTime;
      }
    };

    audio.onended = () => {
      if (audioRef.current !== audio) return;
      audio.currentTime = startTime;
      audio.play().catch(console.error);
    };

    audio.onplay = () => {
      if (audioRef.current === audio) setIsPlaying(true);
    };
    
    audio.onpause = () => {
      if (audioRef.current === audio) setIsPlaying(false);
    };

    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.log('Autoplay blocked, user needs to interact:', err);
        setIsPlaying(false);
      });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // If audio wasn't playing due to autoplay block, try to play on user interaction
    if (!isPlaying && audioRef.current && !isPaused) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const goToNext = useCallback(() => {
    if (currentCapsuleIndex < currentStory.capsules.length - 1) {
      setCurrentCapsuleIndex(currentCapsuleIndex + 1);
      setProgress(0);
    } else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setCurrentCapsuleIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentCapsuleIndex, currentStory?.capsules?.length, currentStoryIndex, stories.length, onClose]);

  const goToPrevious = useCallback(() => {
    if (currentCapsuleIndex > 0) {
      setCurrentCapsuleIndex(currentCapsuleIndex - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentCapsuleIndex(prevStory.capsules.length - 1);
      setProgress(0);
    }
  }, [currentCapsuleIndex, currentStoryIndex, stories]);

  useEffect(() => {
    if (!currentCapsule || isPaused) return;

    setMediaError(false);
    markAsViewed();

    const duration = currentCapsule.mediaType === "video" ? (currentCapsule.duration || 15) * 1000 : 5000;
    const interval = 50;
    let elapsed = 0;

    progressIntervalRef.current = setInterval(() => {
      elapsed += interval;
      const progressPercent = (elapsed / duration) * 100;
      setProgress(progressPercent);

      if (elapsed >= duration) {
        goToNext();
      }
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStoryIndex, currentCapsuleIndex, isPaused, currentCapsule, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'p') {
        setIsPaused(prev => !prev);
      } else if (e.key === 'm') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, onClose, isMuted]);

  const markAsViewed = async () => {
    if (!currentCapsule || !currentUserId) return;
    try {
      await axios.post(
        `${API}/capsules/${currentCapsule.id}/view?userId=${currentUserId}`
      );
    } catch (error) {
      console.error("Failed to mark as viewed:", error);
    }
  };

  const handleReaction = async (emoji) => {
    if (!currentCapsule || !currentUserId) return;
    try {
      toast.success(`Reacted with ${emoji}`);
    } catch (error) {
      console.error("Failed to react:", error);
    }
  };

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
      goToPrevious();
    } else if (x > (width * 2) / 3) {
      goToNext();
    } else {
      setIsPaused(prev => !prev);
    }
  };

  if (!currentCapsule) return null;

  const author = currentStory.user;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black flex items-center justify-center" style={{ zIndex: 10000 }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition"
        style={{ zIndex: 10002 }}
      >
        <X size={28} />
      </button>

      {/* Navigation arrows */}
      {currentStoryIndex > 0 || currentCapsuleIndex > 0 ? (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition hidden md:block"
          style={{ zIndex: 10002 }}
        >
          <ChevronLeft size={28} className="text-white" />
        </button>
      ) : null}

      {(currentStoryIndex < stories.length - 1 || currentCapsuleIndex < currentStory.capsules.length - 1) ? (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition hidden md:block"
          style={{ zIndex: 10002 }}
        >
          <ChevronRight size={28} className="text-white" />
        </button>
      ) : null}

      {/* Story Container */}
      <div 
        className="relative w-full max-w-md h-full max-h-[85vh] bg-gray-900 rounded-xl overflow-hidden mx-4 my-8"
        onClick={handleTap}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
          {currentStory.capsules.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-50"
                style={{ 
                  width: idx < currentCapsuleIndex ? '100%' : 
                         idx === currentCapsuleIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 px-4 pt-4 flex items-center gap-3 z-20">
          <img
            src={author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.name}`}
            alt={author?.name}
            className="w-10 h-10 rounded-full border-2 border-white object-cover"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${author?.id}`);
            }}
          />
          <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${author?.id}`); }}>
            <p className="text-white font-semibold text-sm truncate">{author?.name}</p>
            <p className="text-white/60 text-xs">
              {new Date(currentCapsule.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Mute/Unmute Button - Always visible when story has music */}
          {currentCapsule.music && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className={`p-2.5 rounded-full transition-all ${
                isMuted 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white text-black'
              }`}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}

          {/* Pause/Play Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused(!isPaused);
            }}
            className="p-2 bg-white/20 rounded-full text-white"
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>

        {/* Media */}
        {currentCapsule.mediaType === "video" ? (
          <video
            key={currentCapsule.id}
            src={currentCapsule.mediaUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setMediaError(true)}
          />
        ) : (
          <img
            key={currentCapsule.id}
            src={currentCapsule.mediaUrl}
            alt="Story"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setMediaError(true)}
          />
        )}

        {/* Error State */}
        {mediaError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <p className="text-gray-400">Failed to load media</p>
          </div>
        )}

        {/* Paused indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="p-4 bg-black/50 rounded-full">
              <Pause size={48} className="text-white" />
            </div>
          </div>
        )}

        {/* Location Badge */}
        {currentCapsule.location && !mediaError && (
          <div className="absolute top-24 left-4 z-10">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full">
              <MapPin size={16} className="text-red-400" />
              <span className="text-white text-sm font-medium">{currentCapsule.location.name}</span>
            </div>
          </div>
        )}

        {/* Music Info - Instagram Style */}
        {currentCapsule.music && !mediaError && (
          <div className="absolute bottom-36 left-4 right-4 z-10">
            <div 
              className="flex items-center gap-3 p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
            >
              {/* Spinning Album Art */}
              <div className="relative">
                <img
                  src={currentCapsule.music.albumArtSmall || currentCapsule.music.albumArt}
                  alt={currentCapsule.music.album}
                  className={`w-12 h-12 rounded-full object-cover shadow-lg ${
                    isPlaying && !isMuted ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '3s' }}
                />
                {/* Sound waves indicator */}
                {isPlaying && !isMuted && (
                  <div className="absolute -right-1 -bottom-1 flex items-end gap-0.5 p-1 bg-green-500 rounded-full">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-white rounded-full animate-bounce"
                        style={{ 
                          height: '6px',
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '0.5s'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{currentCapsule.music.name}</p>
                <p className="text-white/60 text-xs truncate">{currentCapsule.music.artist}</p>
              </div>

              {/* Volume Icon */}
              <div className={`p-2 rounded-full ${isMuted ? 'bg-white/10' : 'bg-green-500'}`}>
                {isMuted ? (
                  <VolumeX size={18} className="text-white" />
                ) : (
                  <Volume2 size={18} className="text-white" />
                )}
              </div>
            </div>

            {/* Tap to unmute hint */}
            {isMuted && (
              <p className="text-white/50 text-xs text-center mt-2">Tap to unmute</p>
            )}
          </div>
        )}

        {/* Caption */}
        {currentCapsule.caption && !mediaError && (
          <div className="absolute bottom-24 left-4 right-4 z-10">
            <p className="text-white text-base font-medium bg-black/50 backdrop-blur-sm rounded-xl p-3 text-center">
              {currentCapsule.caption}
            </p>
          </div>
        )}

        {/* Reactions Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center justify-center gap-4 bg-black/50 backdrop-blur-sm rounded-full p-3 max-w-sm mx-auto">
            {["❤️", "🔥", "😂", "😮", "👏", "😍"].map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction(emoji);
                }}
                className="text-2xl hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* View Count */}
        <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-2 text-white/50 text-xs z-10">
          <Eye size={12} />
          <span>{currentCapsule.views?.length || currentCapsule.viewCount || 0} views</span>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-white/30 text-xs hidden md:block" style={{ zIndex: 10001 }}>
        ← → Navigate • Space: Next • P: Pause • M: Mute • Esc: Close
      </div>

      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default VibeCapsuleViewer;
