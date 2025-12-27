import React, { useState } from 'react';
import { X, Users, Target, Calendar, Zap } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateTeamPostModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectIdea: '',
    teamSize: '2-4',
    lookingFor: [],
    deadline: '',
    commitment: 'part-time',
    skills: []
  });
  const [newRole, setNewRole] = useState('');
  const [newSkill, setNewSkill] = useState('');

  const teamSizes = ['2-4', '5-8', '8-12', '12+'];
  const commitments = [{ id: 'part-time', label: '⏰ Part-time' }, { id: 'full-time', label: '💼 Full-time' }, { id: 'flexible', label: '🔄 Flexible' }];
  const commonRoles = ['Frontend Dev', 'Backend Dev', 'Designer', 'PM', 'ML Engineer', 'Mobile Dev', 'DevOps', 'Marketing'];

  const addRole = () => {
    if (newRole.trim() && !formData.lookingFor.includes(newRole.trim())) {
      setFormData(prev => ({ ...prev, lookingFor: [...prev.lookingFor, newRole.trim()] }));
      setNewRole('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter a title'); return; }
    if (formData.lookingFor.length === 0) { toast.error('Please add roles you\'re looking for'); return; }
    setLoading(true);
    try {
      const teamData = { ...formData, tribeId, authorId: currentUser.id, author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }, applications: [], status: 'open' };
      await axios.post(`${API}/team-posts?userId=${currentUser.id}`, teamData);
      toast.success('Team post created! 👥');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to create team post'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center"><Users size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Find Team Members</h2><p className="text-xs text-gray-400">Build your dream team</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Looking for Co-founders for EdTech Startup" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Idea</label>
            <div className="relative"><Target size={16} className="absolute left-3 top-3 text-gray-500" /><textarea value={formData.projectIdea} onChange={(e) => setFormData(prev => ({ ...prev, projectIdea: e.target.value }))} placeholder="Describe your project idea..." rows={3} className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 resize-none" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Looking For *</label>
            <div className="flex flex-wrap gap-2 mb-2">{commonRoles.map(role => (<button key={role} type="button" onClick={() => { if (!formData.lookingFor.includes(role)) setFormData(prev => ({ ...prev, lookingFor: [...prev.lookingFor, role] })); }} className={`px-3 py-1.5 rounded-full text-sm transition ${formData.lookingFor.includes(role) ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{role}</button>))}</div>
            <div className="flex gap-2"><input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())} placeholder="Custom role..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm" /><button type="button" onClick={addRole} className="px-3 py-2 bg-cyan-500 text-white rounded-lg">Add</button></div>
            <div className="flex flex-wrap gap-2 mt-2">{formData.lookingFor.map((role, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">{role}<button type="button" onClick={() => setFormData(prev => ({ ...prev, lookingFor: prev.lookingFor.filter(r => r !== role) }))}><X size={12} /></button></span>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Team Size</label>
              <div className="flex flex-wrap gap-2">{teamSizes.map(size => (<button key={size} type="button" onClick={() => setFormData(prev => ({ ...prev, teamSize: size }))} className={`px-3 py-2 rounded-lg text-sm transition ${formData.teamSize === size ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{size}</button>))}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Commitment</label>
              <div className="flex flex-wrap gap-2">{commitments.map(c => (<button key={c.id} type="button" onClick={() => setFormData(prev => ({ ...prev, commitment: c.id }))} className={`px-3 py-2 rounded-lg text-sm transition ${formData.commitment === c.id ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{c.label}</button>))}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Application Deadline</label>
            <input type="date" value={formData.deadline} onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Details</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Any other requirements or information..." rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 resize-none" />
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Posting...' : 'Post Team Request'}</button></div>
      </div>
    </div>
  );
};

export default CreateTeamPostModal;
