import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { 
  ArrowLeft, Plus, X, Users, Clock, Calendar, MessageCircle,
  Briefcase, Rocket
} from 'lucide-react';

const CreateTeamPost = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [constants, setConstants] = useState({ teamRoles: [], skills: [] });
  
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDescription: '',
    requiredRoles: [],
    requiredSkills: [],
    commitmentLevel: 'part_time',
    duration: '',
    startDate: '',
    contactMethod: 'dm',
    contactInfo: ''
  });
  
  const [selectedRole, setSelectedRole] = useState('');
  const [roleCount, setRoleCount] = useState(1);
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    fetchConstants();
  }, []);

  const fetchConstants = async () => {
    try {
      const res = await axios.get(`${API}/student/constants`);
      setConstants(res.data);
    } catch (error) {
      console.error('Failed to load constants');
    }
  };

  const handleAddRole = () => {
    if (!selectedRole) return;
    
    const existingIndex = formData.requiredRoles.findIndex(r => r.roleId === selectedRole);
    if (existingIndex >= 0) {
      toast.error('Role already added');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      requiredRoles: [...prev.requiredRoles, { roleId: selectedRole, count: roleCount }]
    }));
    setSelectedRole('');
    setRoleCount(1);
  };

  const handleRemoveRole = (roleId) => {
    setFormData(prev => ({
      ...prev,
      requiredRoles: prev.requiredRoles.filter(r => r.roleId !== roleId)
    }));
  };

  const handleSkillToggle = (skillId) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skillId)
        ? prev.requiredSkills.filter(s => s !== skillId)
        : [...prev.requiredSkills, skillId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.projectTitle.trim()) {
      toast.error('Project title is required');
      return;
    }
    if (formData.requiredRoles.length === 0) {
      toast.error('Add at least one required role');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/team-posts?userId=${currentUser.id}`, formData);
      toast.success('Team post created! 🚀');
      navigate(`/team-posts/${res.data.id}`);
    } catch (error) {
      toast.error('Failed to create team post');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (roleId) => {
    return constants.teamRoles?.find(r => r.id === roleId)?.label || roleId;
  };

  const getRoleIcon = (roleId) => {
    return constants.teamRoles?.find(r => r.id === roleId)?.icon || '👤';
  };

  const filteredSkills = skillSearch
    ? constants.skills.filter(s => s.label.toLowerCase().includes(skillSearch.toLowerCase()))
    : constants.skills.slice(0, 20);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-white">Find Team Members</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.projectTitle.trim() || formData.requiredRoles.length === 0}
            className={`px-5 py-2 rounded-full font-semibold transition-all ${
              loading || !formData.projectTitle.trim() || formData.requiredRoles.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90'
            }`}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 pb-24">
        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Rocket size={16} className="inline mr-2" />
            Project / Idea Name *
          </label>
          <input
            type="text"
            value={formData.projectTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
            placeholder="e.g., AI-powered Study Assistant"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Project Description
          </label>
          <textarea
            value={formData.projectDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
            placeholder="Describe your project idea and what you're trying to build..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
          />
        </div>

        {/* Required Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Users size={16} className="inline mr-2" />
            Required Roles *
          </label>
          
          {/* Added roles */}
          {formData.requiredRoles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.requiredRoles.map(role => (
                <span 
                  key={role.roleId}
                  className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2"
                >
                  {getRoleIcon(role.roleId)} {getRoleLabel(role.roleId)}
                  {role.count > 1 && <span className="text-xs opacity-70">×{role.count}</span>}
                  <button onClick={() => handleRemoveRole(role.roleId)} className="hover:text-white">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add role */}
          <div className="flex gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="">Select role...</option>
              {constants.teamRoles?.map(role => (
                <option key={role.id} value={role.id}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="10"
              value={roleCount}
              onChange={(e) => setRoleCount(parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center"
            />
            <button
              onClick={handleAddRole}
              disabled={!selectedRole}
              className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Required Skills
          </label>
          
          {formData.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-800/50 rounded-xl">
              {formData.requiredSkills.map(skillId => {
                const skill = constants.skills.find(s => s.id === skillId);
                return skill ? (
                  <span key={skillId} className="px-3 py-1 bg-cyan-400/20 text-cyan-400 rounded-full text-sm flex items-center gap-1">
                    {skill.label}
                    <button onClick={() => handleSkillToggle(skillId)} className="hover:text-white">×</button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          <input
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 mb-3"
          />

          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {filteredSkills.map(skill => {
              const isSelected = formData.requiredSkills.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => handleSkillToggle(skill.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    isSelected
                      ? 'bg-cyan-400 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {skill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Commitment Level */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Clock size={16} className="inline mr-2" />
            Commitment Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'full_time', label: 'Full-time' },
              { id: 'part_time', label: 'Part-time' },
              { id: 'flexible', label: 'Flexible' }
            ].map(level => (
              <button
                key={level.id}
                onClick={() => setFormData(prev => ({ ...prev, commitmentLevel: level.id }))}
                className={`py-2.5 rounded-xl border-2 transition-all ${
                  formData.commitmentLevel === level.id
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Briefcase size={16} className="inline mr-2" />
              Duration
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g., 3 months"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Contact Method */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <MessageCircle size={16} className="inline mr-2" />
            How should applicants reach you?
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { id: 'dm', label: 'Loopync DM' },
              { id: 'email', label: 'Email' },
              { id: 'discord', label: 'Discord' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setFormData(prev => ({ ...prev, contactMethod: method.id }))}
                className={`py-2.5 rounded-xl border-2 transition-all ${
                  formData.contactMethod === method.id
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
          
          {formData.contactMethod !== 'dm' && (
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
              placeholder={formData.contactMethod === 'email' ? 'your@email.com' : 'Your Discord username'}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTeamPost;
