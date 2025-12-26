import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Eye, Users, Rocket, Github, ExternalLink, Play, Star } from 'lucide-react';
import SkillTag from './SkillTag';
import VerifiedBadge from './VerifiedBadge';

const ProjectCard = ({ project, currentUser, onLike, onSave, onSkillClick, compact = false }) => {
  const navigate = useNavigate();
  const isLiked = project.likes?.includes(currentUser?.id);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'idea': return 'bg-yellow-500/20 text-yellow-400';
      case 'on_hold': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (onLike) onLike(project.id);
  };

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-400/30 transition-all"
    >
      {/* Cover Image */}
      {project.coverImage && !compact && (
        <div className="relative aspect-video">
          <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" loading="lazy" />
          {project.isStartup && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Rocket size={12} />Startup
            </div>
          )}
          {project.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play size={24} className="text-white ml-1" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-lg">{project.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status?.replace('_', ' ')}
              </span>
            </div>
            {project.shortDescription && (
              <p className="text-gray-400 text-sm line-clamp-2">{project.shortDescription}</p>
            )}
          </div>
          {/* Reputation Score */}
          {project.reputationScore && (
            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-sm font-semibold">{project.reputationScore}</span>
            </div>
          )}
        </div>

        {/* Author */}
        {project.author && (
          <div className="flex items-center gap-2 mb-3" onClick={(e) => { e.stopPropagation(); navigate(`/@${project.author.handle}`); }}>
            <img
              src={project.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author.name}`}
              alt={project.author.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-400 hover:text-cyan-400">{project.author.name}</span>
            {project.author.isVerified && <VerifiedBadge size={14} />}
          </div>
        )}

        {/* Skills - Clickable */}
        {project.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.skills.slice(0, 4).map(skill => (
              <SkillTag key={skill} skill={skill} size="sm" onClick={onSkillClick} />
            ))}
            {project.skills.length > 4 && (
              <span className="text-xs text-gray-500">+{project.skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 mb-3">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
              <Github size={14} />GitHub
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
              <ExternalLink size={14} />Live Demo
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className={`flex items-center gap-1.5 ${isLiked ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'}`}>
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              <span className="text-sm">{project.likeCount || 0}</span>
            </button>
            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageCircle size={18} />
              <span className="text-sm">{project.comments || 0}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); }} className="text-gray-400 hover:text-cyan-400">
              <Bookmark size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <span className="flex items-center gap-1"><Eye size={14} />{project.views || 0}</span>
            {project.isTeamProject && (
              <span className="flex items-center gap-1"><Users size={14} />{project.teamMembers?.length || 0}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
