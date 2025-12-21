import React from "react";
import { Users, Lock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TribeCard = ({ tribe, currentUser, onJoinLeave }) => {
  const navigate = useNavigate();

  // Safety check for tribe data
  if (!tribe || !tribe.id) {
    return null;
  }

  const members = Array.isArray(tribe.members) ? tribe.members : [];
  const isMember = currentUser?.id && members.includes(currentUser.id);
  const isOwner = currentUser?.id === tribe.ownerId;
  const tags = Array.isArray(tribe.tags) ? tribe.tags : [];

  const handleCardClick = () => {
    navigate(`/tribes/${tribe.id}`);
  };

  const handleJoinClick = (e) => {
    e.stopPropagation();
    if (onJoinLeave) {
      onJoinLeave(tribe.id, isMember);
    }
  };

  return (
    <div 
      className="glass-card p-5 hover:scale-[1.02] transition-all cursor-pointer group border border-gray-800 hover:border-cyan-400/30"
      onClick={handleCardClick}
    >
      {/* Tribe Avatar & Type Badge */}
      <div className="relative mb-4">
        <img
          src={tribe.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`}
          alt={tribe.name || 'Tribe'}
          className="w-16 h-16 rounded-2xl object-cover bg-gray-800"
        />
        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${
          tribe.type === 'private' ? 'bg-yellow-500' : 'bg-green-500'
        }`}>
          {tribe.type === 'private' ? (
            <Lock size={12} className="text-black" />
          ) : (
            <Globe size={12} className="text-black" />
          )}
        </div>
      </div>

      {/* Tribe Info */}
      <h3 className="font-bold text-lg mb-1 text-white group-hover:text-cyan-400 transition-colors">
        {tribe.name || 'Unnamed Tribe'}
      </h3>
      <p className="text-sm text-gray-400 mb-3 line-clamp-2 min-h-[40px]">
        {tribe.description || 'No description available'}
      </p>
      
      {/* Member Count */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Users size={16} className="text-cyan-400" />
        <span>{tribe.memberCount || members.length} member{(tribe.memberCount || members.length) !== 1 ? 's' : ''}</span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 rounded-full text-xs bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
            >
              #{typeof tag === 'string' ? tag : ''}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Action Button */}
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

      {/* Not logged in message */}
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
  );
};

export default TribeCard;
