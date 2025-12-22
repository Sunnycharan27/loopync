import React, { useState, useRef } from "react";
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, Film } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import UniversalShareModal from "./UniversalShareModal";
import VerifiedBadge from "./VerifiedBadge";
import { getMediaUrl } from "../utils/mediaUtils";

const FeedReelCard = ({ reel, currentUser, onLike }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showShare, setShowShare] = useState(false);
  
  const isLiked = reel.likedBy?.includes(currentUser?.id);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = () => {
    if (!currentUser) {
      toast.error("Please login to like");
      return;
    }
    if (onLike) {
      onLike(reel.id);
    }
  };

  const handleViewFullReel = () => {
    navigate(`/vibezone?reel=${reel.id}`);
  };

  return (
    <div className="glass-card overflow-hidden mb-4">
      {/* Header - Author Info */}
      <div className="p-3 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/profile/${reel.authorId}`)}
        >
          <img
            src={reel.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.authorId}`}
            alt={reel.author?.name || 'User'}
            className="w-10 h-10 rounded-full ring-2 ring-cyan-400/20"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-white text-sm">{reel.author?.name || 'User'}</h3>
              {reel.author?.isVerified && <VerifiedBadge size={14} />}
            </div>
            <p className="text-xs text-gray-400">@{reel.author?.handle || reel.authorId?.substring(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full flex items-center gap-1">
            <Film size={12} />
            Reel
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div 
        className="relative aspect-[9/16] max-h-[500px] bg-black cursor-pointer group"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={getMediaUrl(reel.videoUrl)}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          poster={reel.thumbnail || undefined}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play size={32} className="text-white ml-1" />
            </div>
          </div>
        )}

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* View Full Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewFullReel();
          }}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-cyan-400/80 text-black text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View Full
        </button>
      </div>

      {/* Caption */}
      {reel.caption && (
        <div className="px-3 py-2">
          <p className="text-white text-sm line-clamp-2">{reel.caption}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-6 text-gray-400">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 hover:text-pink-400 transition-colors ${isLiked ? 'text-pink-400' : ''}`}
        >
          <Heart size={18} className={isLiked ? 'fill-current' : ''} />
          <span className="text-sm">{reel.stats?.likes || 0}</span>
        </button>

        <button 
          onClick={handleViewFullReel}
          className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-sm">{reel.stats?.comments || 0}</span>
        </button>

        <button 
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
        >
          <Share2 size={18} />
        </button>

        <div className="ml-auto text-xs text-gray-500">
          {reel.stats?.views || 0} views
        </div>
      </div>

      {/* Share Modal */}
      {showShare && (
        <UniversalShareModal
          item={reel}
          type="reel"
          currentUser={currentUser}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
};

export default FeedReelCard;
