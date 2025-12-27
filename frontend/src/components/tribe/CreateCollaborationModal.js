import React, { useState } from 'react';
import { X, Handshake, Calendar, Users, Zap, DollarSign } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateCollaborationModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'creative',
    lookingFor: [],
    compensation: 'collaboration',
    budget: '',
    deadline: '',
    commitment: 'project-based'
  });
  const [newRole, setNewRole] = useState('');

  const collabTypes = [
    { id: 'creative', label: '🎨 Creative Project' },
    { id: 'content', label: '📱 Content Creation' },
    { id: 'brand', label: '🏷️ Brand Collab' },
    { id: 'event', label: '🎉 Event' },
    { id: 'startup', label: '🚀 Startup' },
    { id: 'other', label: '✨ Other' }
  ];
  const compensations = [
    { id: 'collaboration', label: 'Mutual Collab' },
    { id: 'paid', label: 'Paid' },
    { id: 'revenue-share', label: 'Revenue Share' },
    { id: 'exposure', label: 'Exposure/Credit' }
  ];
  const creativeRoles = ['Illustrator', 'Photographer', 'Videographer', 'Designer', 'Writer', 'Animator', 'Musician', 'Voice Artist'];

  const addRole = () => {
    if (newRole.trim() && !formData.lookingFor.includes(newRole.trim())) {
      setFormData(prev => ({ ...prev, lookingFor: [...prev.lookingFor, newRole.trim()] }));
      setNewRole('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter title'); return; }
    if (formData.lookingFor.length === 0) { toast.error('Please specify who you\'re looking for'); return; }
    setLoading(true);
    try {
      const collabData = { ...formData, tribeId, authorId: currentUser.id, author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }, applications: [], status: 'open' };
      await axios.post(`${API}/collaborations?userId=${currentUser.id}`, collabData);
      toast.success('Collaboration posted! 🤝');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to post collaboration'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center"><Handshake size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Find Collaborators</h2><p className="text-xs text-gray-400">Connect with creative minds</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Looking for Artist for Music Video" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Collaboration Type</label>
            <div className="grid grid-cols-3 gap-2">{collabTypes.map(t => (<button key={t.id} type="button" onClick={() => setFormData(prev => ({ ...prev, type: t.id }))} className={`px-3 py-2 rounded-lg text-xs transition ${formData.type === t.id ? 'bg-violet-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{t.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe your collaboration idea..." rows={3} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Looking For *</label>
            <div className="flex flex-wrap gap-2 mb-2">{creativeRoles.map(role => (<button key={role} type="button" onClick={() => { if (!formData.lookingFor.includes(role)) setFormData(prev => ({ ...prev, lookingFor: [...prev.lookingFor, role] })); }} className={`px-3 py-1.5 rounded-full text-xs transition ${formData.lookingFor.includes(role) ? 'bg-violet-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{role}</button>))}</div>
            <div className="flex gap-2"><input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())} placeholder="Custom role..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm" /><button type="button" onClick={addRole} className="px-3 py-2 bg-violet-500 text-white rounded-lg">Add</button></div>
            <div className="flex flex-wrap gap-2 mt-2">{formData.lookingFor.map((role, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs">{role}<button type="button" onClick={() => setFormData(prev => ({ ...prev, lookingFor: prev.lookingFor.filter(r => r !== role) }))}><X size={12} /></button></span>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Compensation</label>
            <div className="flex flex-wrap gap-2">{compensations.map(c => (<button key={c.id} type="button" onClick={() => setFormData(prev => ({ ...prev, compensation: c.id }))} className={`px-3 py-2 rounded-lg text-sm transition ${formData.compensation === c.id ? 'bg-violet-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{c.label}</button>))}</div>
          </div>
          {formData.compensation === 'paid' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Budget</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="text" value={formData.budget} onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))} placeholder="10,000 - 50,000" className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" /></div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
            <input type="date" value={formData.deadline} onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500" />
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Posting...' : 'Post Collaboration'}</button></div>
      </div>
    </div>
  );
};

export default CreateCollaborationModal;
