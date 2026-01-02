import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "../App";
import { Heart, MessageCircle, Share, Volume2, VolumeX, Bookmark, MoreHorizontal, Play, ChevronUp, ChevronDown } from "lucide-react";
import ReelCommentsModal from "./ReelCommentsModal";
import UniversalShareModal from "./UniversalShareModal";
import { useNavigate } from "react-router-dom";

const ReelViewer = ({ reels, currentUser, onLike }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [bookmarked, setBookmarked] = useState({});
  const [showHeart, setShowHeart] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const currentReel = reels[currentIndex];

  // Play/pause video when current index changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (playing) {
        videoRef.current.play().catch(() => {});
      }
    }
    // Track view
    if (currentReel) {
      axios.post(`${API}/reels/${currentReel.id}/view`).catch(() => {});
    }
  }, [currentIndex, currentReel]);

  // Handle scroll for navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentIndex < reels.length - 1) {
          // Swipe up - next reel
          setCurrentIndex(prev => prev + 1);
        } else if (diff < 0 && currentIndex > 0) {
          // Swipe down - previous reel
          setCurrentIndex(prev => prev - 1);
        }
      }
      isDragging = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [currentIndex, reels.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < reels.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm') {
        setMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    }
  };

  const handleDoubleTap = () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    if (onLike && currentReel) {
      onLike(currentReel.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    try {
      await axios.post(`${API}/posts/${currentReel.id}/bookmark?userId=${currentUser.id}`);
      setBookmarked(prev => ({ ...prev, [currentReel.id]: !prev[currentReel.id] }));
    } catch (error) {
      console.error("Failed to bookmark:", error);
    }
  };

  if (!currentReel) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-gray-400">No reels available</p>
        </div>
      </div>
    );
  }

  const isLiked = currentReel.likedBy?.includes(currentUser?.id);
  const isBookmarked = bookmarked[currentReel.id];

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full bg-black relative overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Video */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        onClick={togglePlayPause}
        onDoubleClick={handleDoubleTap}
      >
        <video
          ref={videoRef}
          src={currentReel.videoUrl}
          className="h-full w-full object-cover"
          loop
          playsInline
          muted={muted}
          autoPlay
          poster={currentReel.thumbnailUrl}
        />

        {/* Play button overlay when paused */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play size={40} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Double-tap heart animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart 
              size={120} 
              className="text-red-500 animate-ping" 
              fill="red" 
            />
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        <h1 className="text-white text-xl font-bold">VibeZone</h1>
        <div className="flex items-center gap-4">
          <span className="text-white/70 text-sm">
            {currentIndex + 1} / {reels.length}
          </span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-20">
        {/* Author avatar */}
        <button 
          onClick={() => navigate(`/user/${currentReel.authorId}`)}
          className="relative"
        >
          <img
            src={currentReel.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentReel.author?.name || 'user'}`}
            alt={currentReel.author?.name}
            className="w-12 h-12 rounded-full border-2 border-white object-cover"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
            +
          </div>
        </button>

        {/* Like */}
        <button 
          onClick={() => {
            if (!currentUser) {
              navigate('/auth');
              return;
            }
            onLike && onLike(currentReel.id);
          }}
          className="flex flex-col items-center"
        >
          <div className={`p-2 rounded-full ${isLiked ? 'bg-red-500/20' : ''}`}>
            <Heart 
              size={28} 
              className={isLiked ? 'text-red-500' : 'text-white'} 
              fill={isLiked ? 'red' : 'none'}
            />
          </div>
          <span className="text-white text-xs mt-1">{currentReel.stats?.likes || 0}</span>
        </button>

        {/* Comment */}
        <button 
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center"
        >
          <MessageCircle size={28} className="text-white" />
          <span className="text-white text-xs mt-1">{currentReel.stats?.comments || 0}</span>
        </button>

        {/* Share */}
        <button 
          onClick={() => setShowShare(true)}
          className="flex flex-col items-center"
        >
          <Share size={28} className="text-white" />
          <span className="text-white text-xs mt-1">{currentReel.stats?.shares || 0}</span>
        </button>

        {/* Bookmark */}
        <button 
          onClick={handleBookmark}
          className="flex flex-col items-center"
        >
          <Bookmark 
            size={28} 
            className={isBookmarked ? 'text-yellow-400' : 'text-white'} 
            fill={isBookmarked ? 'yellow' : 'none'}
          />
        </button>

        {/* Mute/Unmute */}
        <button 
          onClick={() => setMuted(!muted)}
          className="flex flex-col items-center"
        >
          {muted ? (
            <VolumeX size={28} className="text-white" />
          ) : (
            <Volume2 size={28} className="text-white" />
          )}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-4 right-20 z-20">
        {/* Author name */}
        <button 
          onClick={() => navigate(`/user/${currentReel.authorId}`)}
          className="flex items-center gap-2 mb-2"
        >
          <span className="text-white font-bold text-lg">@{currentReel.author?.handle || 'user'}</span>
          {currentReel.author?.isVerified && (
            <span className="w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </span>
          )}
        </button>

        {/* Caption */}
        <p className="text-white text-sm line-clamp-3 mb-2">
          {currentReel.caption}
        </p>

        {/* Music info - if reel has music */}
        {currentReel.music && (
          <div className="flex items-center gap-2 mb-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
              <span className="text-white text-[8px]">♪</span>
            </div>
            <span className="text-white text-sm truncate max-w-[200px]">
              {currentReel.music.name} - {currentReel.music.artist}
            </span>
          </div>
        )}

        {/* Views */}
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <span>{currentReel.stats?.views || 0} views</span>
        </div>
      </div>

      {/* Navigation arrows (visible on desktop) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10 hidden md:flex">
        <button
          onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
          disabled={currentIndex === 0}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm disabled:opacity-30 hover:bg-white/20 transition"
        >
          <ChevronUp size={24} className="text-white" />
        </button>
        <button
          onClick={() => currentIndex < reels.length - 1 && setCurrentIndex(prev => prev + 1)}
          disabled={currentIndex === reels.length - 1}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm disabled:opacity-30 hover:bg-white/20 transition"
        >
          <ChevronDown size={24} className="text-white" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-16 left-0 right-0 h-1 bg-white/20 z-20">
        <div 
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / reels.length) * 100}%` }}
        />
      </div>

      {/* Comments Modal */}
      {showComments && (
        <ReelCommentsModal
          reel={currentReel}
          currentUser={currentUser}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Share Modal */}
      {showShare && (
        <UniversalShareModal
          currentUser={currentUser}
          item={currentReel}
          type="reel"
          onClose={() => setShowShare(false)}
        />
      )}

      <style>{`
        @keyframes ping {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping {
          animation: ping 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ReelViewer;
