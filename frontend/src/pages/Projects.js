import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API, AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import { 
  Plus, Search, Filter, Github, ExternalLink, Heart, MessageCircle, 
  Bookmark, Eye, Users, Rocket, Code, ChevronDown, X, Play
} from 'lucide-react';
import VerifiedBadge from '../components/VerifiedBadge';

const Projects = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    skill: '',
    status: '',
    startup: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [constants, setConstants] = useState({ skills: [], projectStatus: [] });

  useEffect(() => {
    fetchProjects();
    fetchConstants();
  }, [filters]);

  const fetchConstants = async () => {
    try {
      const res = await axios.get(`${API}/student/constants`);
      setConstants(res.data);
    } catch (error) {
      console.error('Failed to load constants');
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.status) params.append('status', filters.status);
      if (filters.startup !== null) params.append('startup', filters.startup);
      
      const res = await axios.get(`${API}/projects?${params.toString()}`);
      setProjects(res.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (projectId) => {
    if (!currentUser) {
      toast.error('Please login to like');
      return;
    }
    try {
      const res = await axios.post(`${API}/projects/${projectId}/like?userId=${currentUser.id}`);
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            likeCount: res.data.likeCount,
            likes: res.data.action === 'liked' 
              ? [...(p.likes || []), currentUser.id]
              : (p.likes || []).filter(id => id !== currentUser.id)
          };
        }
        return p;
      }));
    } catch (error) {
      toast.error('Failed to like project');
    }
  };

  const handleSave = async (projectId) => {
    if (!currentUser) {
      toast.error('Please login to save');
      return;
    }
    try {
      const res = await axios.post(`${API}/projects/${projectId}/save?userId=${currentUser.id}`);
      toast.success(res.data.action === 'saved' ? 'Project saved!' : 'Project unsaved');
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'idea': return 'bg-yellow-500/20 text-yellow-400';
      case 'on_hold': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredProjects = searchQuery
    ? projects.filter(p => 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Projects</h1>
              <p className="text-gray-400 text-sm">Discover student projects</p>
            </div>
            <button
              onClick={() => navigate('/projects/create')}
              className="p-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full text-black"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-800/50 rounded-xl space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, startup: null }))}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                    filters.startup === null ? 'bg-cyan-400 text-black' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, startup: true }))}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1 ${
                    filters.startup === true ? 'bg-cyan-400 text-black' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <Rocket size={14} /> Startups
                </button>
              </div>

              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">All Status</option>
                {constants.projectStatus?.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              <select
                value={filters.skill}
                onChange={(e) => setFilters(prev => ({ ...prev, skill: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">All Skills</option>
                {constants.skills?.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Code size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No projects found</p>
            <button
              onClick={() => navigate('/projects/create')}
              className="mt-4 px-6 py-2 bg-cyan-400 text-black rounded-full font-semibold"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                currentUser={currentUser}
                onLike={handleLike}
                onSave={handleSave}
                onView={() => navigate(`/projects/${project.id}`)}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

const ProjectCard = ({ project, currentUser, onLike, onSave, onView, getStatusColor }) => {
  const isLiked = project.likes?.includes(currentUser?.id);

  return (
    <div 
      onClick={onView}
      className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-400/30 transition-all"
    >
      {/* Cover Image */}
      {project.coverImage && (
        <div className="relative aspect-video">
          <img
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          {project.isStartup && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Rocket size={12} />
              Startup
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
        </div>

        {/* Author */}
        {project.author && (
          <div className="flex items-center gap-2 mb-3">
            <img
              src={project.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${project.author.name}`}
              alt={project.author.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-400">{project.author.name}</span>
            {project.author.isVerified && <VerifiedBadge size={14} />}
          </div>
        )}

        {/* Skills */}
        {project.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.skills.slice(0, 4).map(skill => (
              <span key={skill} className="px-2 py-0.5 bg-cyan-400/10 text-cyan-400 rounded text-xs">
                {skill}
              </span>
            ))}
            {project.skills.length > 4 && (
              <span className="text-xs text-gray-500">+{project.skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 mb-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            >
              <Github size={14} />
              GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              <ExternalLink size={14} />
              Live Demo
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(project.id); }}
              className={`flex items-center gap-1.5 ${isLiked ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'}`}
            >
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              <span className="text-sm">{project.likeCount || 0}</span>
            </button>
            <div className="flex items-center gap-1.5 text-gray-400">
              <MessageCircle size={18} />
              <span className="text-sm">{project.comments || 0}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSave(project.id); }}
              className="text-gray-400 hover:text-cyan-400"
            >
              <Bookmark size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {project.views || 0}
            </span>
            {project.isTeamProject && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {project.teamMembers?.length || 0}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
