import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Heart, MessageCircle, Eye, ChevronLeft, ChevronRight, Pause, Play, MapPin } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../App";
import MusicBadge from "./MusicBadge";

const VibeCapsuleViewer = ({ stories, currentUserId, onClose }) => {
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentCapsuleIndex, setCurrentCapsuleIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const audioRef = useRef(null);

  const currentStory = stories[currentStoryIndex];
  const currentCapsule = currentStory?.capsules[currentCapsuleIndex];

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

    const timer = setInterval(() => {
      elapsed += interval;
      const progressPercent = (elapsed / duration) * 100;
      setProgress(progressPercent);

      if (elapsed >= duration) {
        goToNext();
      }
    }, interval);

    return () => clearInterval(timer);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, onClose]);

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
    if (!currentUserId) {
      toast.error("Please login to react");
      return;
    }
    try {
      await axios.post(
        `${API}/capsules/${currentCapsule.id}/react?userId=${currentUserId}&reaction=${emoji}`
      );
      toast.success(`Reacted with ${emoji}`);
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  const getMediaUrl = (url) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (!backendUrl) return url;
    if (url?.startsWith('/uploads') || url?.startsWith('/api/uploads')) {
      return `${backendUrl}${url.startsWith('/api') ? url : `/api${url}`}`;
    }
    return url;
  };

  const handleMediaError = () => {
    console.error("Failed to load media:", currentCapsule?.mediaUrl);
    setMediaError(true);
  };

  if (!currentStory || !currentCapsule) return null;

  const canGoPrevious = currentCapsuleIndex > 0 || currentStoryIndex > 0;
  const canGoNext = currentCapsuleIndex < currentStory.capsules.length - 1 || currentStoryIndex < stories.length - 1;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black flex items-center justify-center" style={{ zIndex: 9999 }}>
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1" style={{ zIndex: 10001 }}>
        {currentStory.capsules.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: idx === currentCapsuleIndex ? `${progress}%` : idx < currentCapsuleIndex ? "100%" : "0%"
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between" style={{ zIndex: 10001 }}>
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            onClose();
            navigate(`/profile/${currentStory.author?.id}`);
          }}
        >
          <img
            src={currentStory.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStory.author?.name || 'user'}`}
            alt={currentStory.author?.name}
            className="w-10 h-10 rounded-full border-2 border-white object-cover"
          />
          <div>
            <p className="text-white font-semibold">{currentStory.author?.name || 'User'}</p>
            <p className="text-white/80 text-xs">@{currentStory.author?.handle || 'user'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Pause/Play button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            {isPaused ? (
              <Play size={20} className="text-white" />
            ) : (
              <Pause size={20} className="text-white" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Side Navigation - Left */}
      <button
        onClick={goToPrevious}
        disabled={!canGoPrevious}
        className={`absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2 transition-opacity ${
          canGoPrevious ? 'opacity-100 cursor-pointer' : 'opacity-0 cursor-default'
        }`}
        style={{ zIndex: 10000 }}
      >
        <div className={`p-3 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50 transition-all ${
          canGoPrevious ? 'opacity-100' : 'opacity-0'
        }`}>
          <ChevronLeft size={32} className="text-white" />
        </div>
      </button>

      {/* Side Navigation - Right */}
      <button
        onClick={goToNext}
        className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2 cursor-pointer"
        style={{ zIndex: 10000 }}
      >
        <div className="p-3 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50 transition-all">
          <ChevronRight size={32} className="text-white" />
        </div>
      </button>

      {/* Tap zones for mobile */}
      <div className="absolute inset-0 flex md:hidden" style={{ zIndex: 9999 }}>
        <button
          onClick={goToPrevious}
          className="flex-1"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        />
        <button
          onClick={goToNext}
          className="flex-1"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-lg h-full flex items-center justify-center px-16" style={{ zIndex: 9998 }}>
        {mediaError ? (
          <div className="flex flex-col items-center justify-center gap-4 text-white">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold mb-1">Unable to load media</p>
              <p className="text-sm text-gray-400">This story content is unavailable</p>
            </div>
          </div>
        ) : currentCapsule.mediaType === "image" ? (
          <img
            src={getMediaUrl(currentCapsule.mediaUrl)}
            alt="Story"
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={handleMediaError}
          />
        ) : (
          <video
            src={getMediaUrl(currentCapsule.mediaUrl)}
            autoPlay
            muted={false}
            playsInline
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={handleMediaError}
            onPause={() => setIsPaused(true)}
            onPlay={() => setIsPaused(false)}
          />
        )}

        {/* Paused indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
            <div className="p-4 bg-black/50 rounded-full">
              <Pause size={48} className="text-white" />
            </div>
          </div>
        )}

        {/* Caption */}
        {currentCapsule.caption && !mediaError && (
          <div className="absolute bottom-32 left-0 right-0 px-4">
            <p className="text-white text-lg font-medium bg-black/50 backdrop-blur-sm rounded-xl p-4 text-center">
              {currentCapsule.caption}
            </p>
          </div>
        )}

        {/* Music Badge Overlay */}
        {currentCapsule.music && !mediaError && (
          <div className="absolute bottom-44 left-4">
            <MusicBadge track={currentCapsule.music} size="md" showPlay={true} autoPlay={!isPaused} />
          </div>
        )}

        {/* Location Badge Overlay */}
        {currentCapsule.location && !mediaError && (
          <div className="absolute top-20 left-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full">
              <MapPin size={16} className="text-red-400" />
              <span className="text-white text-sm font-medium">{currentCapsule.location.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Story indicator dots */}
      {stories.length > 1 && (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-2" style={{ zIndex: 10001 }}>
          {stories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStoryIndex(idx);
                setCurrentCapsuleIndex(0);
                setProgress(0);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStoryIndex ? 'bg-white w-4' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Reactions Bar */}
      <div className="absolute bottom-8 left-4 right-4" style={{ zIndex: 10001 }}>
        <div className="flex items-center justify-center gap-4 bg-black/50 backdrop-blur-sm rounded-full p-3 max-w-md mx-auto">
          {["❤️", "🔥", "😂", "😮", "👏", "😍"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* View Count */}
        <div className="flex items-center justify-center gap-2 mt-3 text-white/80 text-sm">
          <Eye size={16} />
          <span>{currentCapsule.views?.length || currentCapsule.viewCount || 0} views</span>
          <span className="mx-2">•</span>
          <span>Tap sides to navigate</span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-white/40 text-xs hidden md:block" style={{ zIndex: 10001 }}>
        ← → Navigate • Space: Next • P: Pause • Esc: Close
      </div>
    </div>,
    document.body
  );
};

export default VibeCapsuleViewer;
