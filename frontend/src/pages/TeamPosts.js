import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API, AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import { 
  Plus, Search, Users, Clock, Calendar, MapPin, 
  Briefcase, Send, Filter, ChevronDown, CheckCircle, XCircle
} from 'lucide-react';
import VerifiedBadge from '../components/VerifiedBadge';

const TeamPosts = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [constants, setConstants] = useState({ teamRoles: [], skills: [] });

  useEffect(() => {
    fetchPosts();
    fetchConstants();
  }, [selectedRole]);

  const fetchConstants = async () => {
    try {
      const res = await axios.get(`${API}/student/constants`);
      setConstants(res.data);
    } catch (error) {
      console.error('Failed to load constants');
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = selectedRole ? `?role=${selectedRole}` : '';
      const res = await axios.get(`${API}/team-posts${params}`);
      setPosts(res.data);
    } catch (error) {
      toast.error('Failed to load team posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = searchQuery
    ? posts.filter(p =>
        p.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Find Your Team</h1>
              <p className="text-gray-400 text-sm">Join exciting projects</p>
            </div>
            <button
              onClick={() => navigate('/team-posts/create')}
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
              placeholder="Search team opportunities..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Role Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedRole('')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                !selectedRole ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300'
              }`}
            >
              All Roles
            </button>
            {constants.teamRoles?.slice(0, 6).map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  selectedRole === role.id ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {role.icon} {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No team opportunities found</p>
            <button
              onClick={() => navigate('/team-posts/create')}
              className="mt-4 px-6 py-2 bg-cyan-400 text-black rounded-full font-semibold"
            >
              Post Opportunity
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <TeamPostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                constants={constants}
                onView={() => navigate(`/team-posts/${post.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

const TeamPostCard = ({ post, currentUser, constants, onView }) => {
  const hasApplied = post.applications?.some(app => app.userId === currentUser?.id);
  const isMember = post.teamMembers?.some(m => m.userId === currentUser?.id);
  const isOwner = post.userId === currentUser?.id;

  const getRoleLabel = (roleId) => {
    return constants.teamRoles?.find(r => r.id === roleId)?.label || roleId;
  };

  const getRoleIcon = (roleId) => {
    return constants.teamRoles?.find(r => r.id === roleId)?.icon || '👤';
  };

  return (
    <div 
      onClick={onView}
      className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 cursor-pointer hover:border-cyan-400/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-lg">{post.projectTitle}</h3>
            {post.status === 'open' && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                Open
              </span>
            )}
          </div>
          {post.projectDescription && (
            <p className="text-gray-400 text-sm line-clamp-2">{post.projectDescription}</p>
          )}
        </div>
      </div>

      {/* Author */}
      {post.author && (
        <div className="flex items-center gap-2 mb-3">
          <img
            src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name}`}
            alt={post.author.name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-white font-medium">{post.author.name}</span>
              {post.author.isVerified && <VerifiedBadge size={14} />}
            </div>
          </div>
        </div>
      )}

      {/* Required Roles */}
      {post.requiredRoles?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Looking for:</p>
          <div className="flex flex-wrap gap-2">
            {post.requiredRoles.map((role, idx) => (
              <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1">
                {getRoleIcon(role.roleId)} {getRoleLabel(role.roleId)}
                {role.count > 1 && <span className="text-xs opacity-70">×{role.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Required Skills */}
      {post.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.requiredSkills.slice(0, 5).map(skill => (
            <span key={skill} className="px-2 py-0.5 bg-cyan-400/10 text-cyan-400 rounded text-xs">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="flex flex-wrap gap-4 text-gray-400 text-sm mb-3">
        {post.commitmentLevel && (
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {post.commitmentLevel.replace('_', ' ')}
          </span>
        )}
        {post.duration && (
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {post.duration}
          </span>
        )}
      </div>

      {/* Team Members */}
      {post.teamMembers?.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-gray-500" />
          <div className="flex -space-x-2">
            {post.teamMemberInfo?.slice(0, 4).map(member => (
              <img
                key={member.id}
                src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                alt={member.name}
                className="w-6 h-6 rounded-full border-2 border-gray-800"
                title={member.name}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {post.teamMembers.length} team member{post.teamMembers.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <span>{post.views || 0} views</span>
          <span>•</span>
          <span>{post.applicationCount || 0} applications</span>
        </div>

        {isOwner ? (
          <span className="text-xs text-cyan-400">Your post</span>
        ) : isMember ? (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle size={14} />
            Team member
          </span>
        ) : hasApplied ? (
          <span className="flex items-center gap-1 text-xs text-yellow-400">
            <Clock size={14} />
            Applied
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-400 text-black rounded-full text-xs font-semibold"
          >
            <Send size={12} />
            Apply
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamPosts;
