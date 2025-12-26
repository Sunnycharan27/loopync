import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Calendar, MessageCircle, MapPin } from 'lucide-react';
import SkillTag from './SkillTag';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '../App';

const TeamPostCard = ({ post, currentUser, onApply }) => {
  const navigate = useNavigate();

  const handleApply = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please login to apply');
      return;
    }
    try {
      await axios.post(`${API}/team-posts/${post.id}/apply?userId=${currentUser.id}`);
      toast.success('Application sent!');
      if (onApply) onApply(post.id);
    } catch (error) {
      toast.error('Failed to apply');
    }
  };

  const hasApplied = post.applicants?.includes(currentUser?.id);
  const isOwner = post.authorId === currentUser?.id;

  return (
    <div className="p-4 rounded-xl border border-gray-800 hover:border-cyan-400/30 transition bg-gray-800/50">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-white text-lg">{post.title}</h4>
          {post.author && (
            <p className="text-sm text-gray-400" onClick={(e) => { e.stopPropagation(); navigate(`/@${post.author.handle}`); }}>
              by <span className="text-cyan-400 hover:underline cursor-pointer">@{post.author.handle}</span>
            </p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          post.status === 'open' ? 'bg-green-500/20 text-green-400' :
          post.status === 'filled' ? 'bg-gray-500/20 text-gray-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {post.status || 'open'}
        </span>
      </div>

      {/* Description */}
      {post.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.description}</p>
      )}

      {/* Roles Needed */}
      {post.roles?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Looking for:</p>
          <div className="flex flex-wrap gap-1">
            {post.roles.map(role => (
              <span key={role} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {post.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.skills.slice(0, 4).map(skill => (
            <SkillTag key={skill} skill={skill} size="sm" />
          ))}
        </div>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
        {post.commitment && (
          <span className="flex items-center gap-1"><Clock size={12} />{post.commitment}</span>
        )}
        {post.duration && (
          <span className="flex items-center gap-1"><Calendar size={12} />{post.duration}</span>
        )}
        {post.location && (
          <span className="flex items-center gap-1"><MapPin size={12} />{post.location}</span>
        )}
        <span className="flex items-center gap-1">
          <Users size={12} />{post.applicants?.length || 0} applicants
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/messages?userId=${post.authorId}`); }}
          className="flex items-center gap-1 text-gray-400 hover:text-white text-sm"
        >
          <MessageCircle size={16} />
          Message
        </button>
        {!isOwner && (
          <button
            onClick={handleApply}
            disabled={hasApplied}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
              hasApplied
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-cyan-400 text-black hover:bg-cyan-300'
            }`}
          >
            {hasApplied ? 'Applied' : 'Apply'}
          </button>
        )}
        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/team-posts/${post.id}/applicants`); }}
            className="px-4 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-semibold"
          >
            View Applicants
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamPostCard;
