import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { getMediaUrl } from '../utils/mediaUtils';
import { toast } from 'sonner';
import { 
  ArrowLeft, Heart, MessageCircle, Bookmark, Share2, Eye, Users, 
  Rocket, Github, ExternalLink, Calendar, Clock, Star, Send, Trash2,
  Code, Globe, Play, Edit3, X
} from 'lucide-react';
import SkillTag from '../components/SkillTag';
import VerifiedBadge from '../components/VerifiedBadge';
import BottomNav from '../components/BottomNav';

const ProjectDetail = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ githubUrl: '', liveUrl: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${API}/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please login to like');
      return;
    }
    try {
      const res = await axios.post(`${API}/projects/${id}/like?userId=${currentUser.id}`);
      setProject(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      toast.error('Failed to like project');
    }
  };

  const handleComment = async () => {
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }
    if (!comment.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/projects/${id}/comment`, {
        userId: currentUser.id,
        text: comment.trim()
      });
      setProject(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data]
      }));
      setComment('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'idea': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'on-hold':
      case 'on_hold': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const isLiked = project?.likes?.includes(currentUser?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="text-center">
          <Rocket size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <button onClick={() => navigate('/projects')} className="px-6 py-2 bg-cyan-400 text-black rounded-xl font-semibold">
            Browse Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0f021e]/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full transition">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Project Details</h1>
          <button onClick={handleShare} className="p-2 hover:bg-gray-800 rounded-full transition">
            <Share2 size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Cover Image */}
        {(project.coverImage || project.imageUrl) && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-6">
            <img 
              src={getMediaUrl(project.coverImage || project.imageUrl)} 
              alt={project.title} 
              className="w-full h-full object-cover" 
            />
            {project.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <a href={project.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition">
                  <Play size={32} className="text-white ml-1" />
                </a>
              </div>
            )}
            {project.isStartup && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-purple-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                <Rocket size={14} />Startup
              </div>
            )}
          </div>
        )}

        {/* Title & Status */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                {project.status?.replace('_', ' ').replace('-', ' ')}
              </span>
              {project.reputationScore && (
                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 text-sm font-semibold">{project.reputationScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Author */}
        {project.author && (
          <div 
            onClick={() => navigate(`/@${project.author.handle}`)}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700 mb-6 cursor-pointer hover:border-cyan-400/30 transition"
          >
            <img
              src={project.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author.name}`}
              alt={project.author.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{project.author.name}</span>
                {project.author.isVerified && <VerifiedBadge size={16} />}
              </div>
              <span className="text-sm text-gray-400">@{project.author.handle}</span>
            </div>
            <span className="text-xs text-gray-500">
              {project.createdAt && new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Action Buttons / Links Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Globe size={18} className="text-cyan-400" />Project Links
          </h2>
          
          {(project.githubUrl || project.demoUrl || project.liveUrl || project.videoUrl) ? (
            <div className="flex flex-wrap gap-3">
              {project.githubUrl && (
                <a href={project.githubUrl.startsWith('http') ? project.githubUrl : `https://${project.githubUrl}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition">
                  <Github size={18} />View on GitHub
                </a>
              )}
              {(project.demoUrl || project.liveUrl) && (
                <a href={(project.demoUrl || project.liveUrl).startsWith('http') ? (project.demoUrl || project.liveUrl) : `https://${project.demoUrl || project.liveUrl}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-sm font-semibold transition">
                  <ExternalLink size={18} />Live Preview
                </a>
              )}
              {project.videoUrl && (
                <a href={project.videoUrl.startsWith('http') ? project.videoUrl : `https://${project.videoUrl}`} 
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl text-sm font-medium transition">
                  <Play size={18} />Watch Demo
                </a>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 text-gray-500 text-sm">
              <p className="flex items-center gap-2">
                <ExternalLink size={16} />
                No project links added yet
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {(project.description || project.shortDescription) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">About This Project</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {project.description || project.shortDescription}
            </p>
          </div>
        )}

        {/* Tech Stack */}
        {project.techStack?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Code size={18} className="text-cyan-400" />Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm border border-cyan-500/20">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {project.skills?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Skills Used</h2>
            <div className="flex flex-wrap gap-2">
              {project.skills.map((skill, idx) => (
                <SkillTag key={idx} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        {project.lookingForMembers && project.memberRoles?.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Users size={18} className="text-purple-400" />Looking for Team Members
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.memberRoles.map((role, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats & Engagement */}
        <div className="flex items-center justify-between py-4 border-y border-gray-800 mb-6">
          <div className="flex items-center gap-6">
            <button onClick={handleLike} className={`flex items-center gap-2 ${isLiked ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'} transition`}>
              <Heart size={24} className={isLiked ? 'fill-current' : ''} />
              <span className="font-semibold">{project.likeCount || project.likes?.length || 0}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle size={24} />
              <span className="font-semibold">{project.comments?.length || 0}</span>
            </div>
            <button className="text-gray-400 hover:text-cyan-400 transition">
              <Bookmark size={24} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Eye size={18} />
            <span>{project.views || 0} views</span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Comments</h2>
          
          {/* Add Comment */}
          {currentUser && (
            <div className="flex gap-3 mb-6">
              <img 
                src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.handle}`}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <button 
                  onClick={handleComment}
                  disabled={submitting || !comment.trim()}
                  className="px-4 py-2 bg-cyan-400 text-black rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '...' : <Send size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {project.comments?.length > 0 ? (
              project.comments.map((c, idx) => (
                <div key={c.id || idx} className="flex gap-3 p-3 rounded-xl bg-gray-800/30">
                  <img 
                    src={c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author?.name || 'user'}`}
                    alt={c.author?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{c.author?.name || 'User'}</span>
                      <span className="text-xs text-gray-500">
                        {c.createdAt && new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{c.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProjectDetail;
