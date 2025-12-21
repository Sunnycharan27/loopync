import React, { useState, useEffect } from "react";
import { Users, Lock, Globe, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";

const TribeCardEnhanced = ({ tribe, currentUser, onJoinLeave, onSettingsClick }) => {
  const navigate = useNavigate();
  const [memberAvatars, setMemberAvatars] = useState([]);

  // Safety check for tribe data
  if (!tribe || !tribe.id) {
    return null;
  }

  const members = Array.isArray(tribe.members) ? tribe.members : [];
  const isMember = currentUser?.id && members.includes(currentUser.id);
  const isOwner = currentUser?.id === tribe.ownerId;
  const tags = Array.isArray(tribe.tags) ? tribe.tags : [];

  // Fetch member avatars
  useEffect(() => {
    const fetchMemberAvatars = async () => {
      if (members.length === 0) return;
      try {
        const res = await axios.get(`${API}/tribes/${tribe.id}/members`);
        if (Array.isArray(res.data)) {
          setMemberAvatars(res.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch member avatars:", error);
      }
    };
    fetchMemberAvatars();
  }, [tribe.id, members.length]);

  const handleCardClick = () => {
    navigate(`/tribes/${tribe.id}`);
  };

  const handleJoinClick = (e) => {
    e.stopPropagation();
    if (onJoinLeave) {
      onJoinLeave(tribe.id, isMember);
    }
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    if (onSettingsClick) {
      onSettingsClick(tribe);
    }
  };

  const defaultCover = `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}&backgroundColor=1a1a2e`;

  return (
    <div 
      className="rounded-2xl overflow-hidden cursor-pointer group border border-gray-800 hover:border-cyan-400/30 transition-all hover:shadow-lg hover:shadow-cyan-400/10"
      onClick={handleCardClick}
      style={{ background: 'linear-gradient(180deg, #1a0b2e 0%, #0f021e 100%)' }}
    >
      {/* Cover Image */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={tribe.coverImage || defaultCover}
          alt="Cover"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = defaultCover;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Privacy Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          tribe.type === 'private' 
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
            : 'bg-green-500/20 text-green-400 border border-green-500/30'
        }`}>
          {tribe.type === 'private' ? <Lock size={12} /> : <Globe size={12} />}
          {tribe.type === 'private' ? 'Private' : 'Public'}
        </div>

        {/* Settings Button for Owners */}
        {isOwner && (
          <button
            onClick={handleSettingsClick}
            className="absolute top-3 left-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
          >
            <Settings size={16} className="text-white" />
          </button>
        )}

        {/* Avatar positioned on cover */}
        <div className="absolute -bottom-8 left-4">
          <img
            src={tribe.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`}
            alt={tribe.name || 'Tribe'}
            className="w-16 h-16 rounded-xl object-cover border-4 border-gray-900 bg-gray-800"
          />
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 px-4 pb-4">
        {/* Tribe Name */}
        <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors truncate">
          {tribe.name || 'Unnamed Tribe'}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-400 mt-1 line-clamp-2 min-h-[40px]">
          {tribe.description || 'No description available'}
        </p>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx} 
                className="px-2 py-0.5 rounded-full text-xs bg-cyan-400/10 text-cyan-400"
              >
                #{typeof tag === 'string' ? tag : ''}
              </span>
            ))}
          </div>
        )}

        {/* Member Avatars & Count */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            {/* Stacked Avatars */}
            <div className="flex -space-x-2">
              {memberAvatars.slice(0, 4).map((member, idx) => (
                <img
                  key={member.id || idx}
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.handle || idx}`}
                  alt={member.name}
                  className="w-7 h-7 rounded-full border-2 border-gray-900 object-cover"
                  title={member.name}
                />
              ))}
              {members.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">+{members.length - 4}</span>
                </div>
              )}
            </div>
            <span className="ml-3 text-sm text-gray-500">
              {tribe.memberCount || members.length} member{(tribe.memberCount || members.length) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {currentUser && (
            <button
              onClick={handleJoinClick}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isOwner
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-default'
                  : isMember
                  ? 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:shadow-lg hover:shadow-cyan-400/30'
              }`}
              disabled={isOwner}
            >
              {isOwner ? '👑 Owner' : isMember ? 'Leave Tribe' : 'Join Tribe'}
            </button>
          )}

          {!currentUser && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/auth');
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
            >
              Login to Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TribeCardEnhanced;
