import React, { useState } from 'react';
import { X, Lightbulb, Target, Users, Zap } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateIdeaModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem: '',
    solution: '',
    category: 'product',
    stage: 'concept',
    lookingFor: [],
    isPublic: true
  });
  const [newRole, setNewRole] = useState('');

  const categories = [
    { id: 'product', label: '📦 Product' },
    { id: 'service', label: '🛎️ Service' },
    { id: 'social', label: '🌍 Social Impact' },
    { id: 'tech', label: '💻 Technology' },
    { id: 'education', label: '📚 Education' },
    { id: 'health', label: '🏥 Healthcare' },
    { id: 'other', label: '✨ Other' }
  ];

  const stages = [
    { id: 'concept', label: '💡 Just an Idea', color: 'yellow' },
    { id: 'validating', label: '🔍 Validating', color: 'blue' },
    { id: 'building', label: '🔨 Building MVP', color: 'purple' },
    { id: 'launched', label: '🚀 Launched', color: 'green' }
  ];

  const roles = ['Co-founder', 'Developer', 'Designer', 'Marketer', 'Investor', 'Mentor', 'Domain Expert'];

  const addRole = () => {
    if (newRole.trim() && !formData.lookingFor.includes(newRole.trim())) {
      setFormData(prev => ({ ...prev, lookingFor: [...prev.lookingFor, newRole.trim()] }));
      setNewRole('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter idea title'); return; }
    if (!formData.problem.trim()) { toast.error('Please describe the problem'); return; }
    setLoading(true);
    try {
      const ideaData = {
        ...formData,
        tribeId,
        authorId: currentUser.id,
        author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
        votes: 0,
        comments: [],
        supporters: []
      };
      await axios.post(`${API}/ideas?userId=${currentUser.id}`, ideaData);
      toast.success('Idea shared! 💡');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to share idea'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center"><Lightbulb size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Share an Idea</h2><p className="text-xs text-gray-400">Get feedback from the community</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Idea Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., AI-powered Study Buddy" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">{categories.map(c => (<button key={c.id} type="button" onClick={() => setFormData(prev => ({ ...prev, category: c.id }))} className={`px-2 py-2 rounded-lg text-xs transition ${formData.category === c.id ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>{c.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><Target size={14} className="inline mr-1" />Problem You're Solving *</label>
            <textarea value={formData.problem} onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))} placeholder="What problem does this solve?" rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><Zap size={14} className="inline mr-1" />Your Solution</label>
            <textarea value={formData.solution} onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))} placeholder="How does your idea solve it?" rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
            <div className="flex flex-wrap gap-2">{stages.map(s => (<button key={s.id} type="button" onClick={() => setFormData(prev => ({ ...prev, stage: s.id }))} className={`px-3 py-2 rounded-lg text-sm transition ${formData.stage === s.id ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>{s.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><Users size={14} className="inline mr-1" />Looking For</label>
            <div className="flex flex-wrap gap-2 mb-2">{roles.map(role => (<button key={role} type="button" onClick={() => { if (!formData.lookingFor.includes(role)) setFormData(prev => ({ ...prev, lookingFor: [...prev.lookingFor, role] })); }} className={`px-3 py-1.5 rounded-full text-xs transition ${formData.lookingFor.includes(role) ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{role}</button>))}</div>
            <div className="flex flex-wrap gap-2">{formData.lookingFor.map((r, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">{r}<button type="button" onClick={() => setFormData(prev => ({ ...prev, lookingFor: prev.lookingFor.filter(x => x !== r) }))}><X size={12} /></button></span>))}</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
            <span className="text-gray-300">Share publicly</span>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))} className={`w-12 h-6 rounded-full transition ${formData.isPublic ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`w-5 h-5 rounded-full bg-white transition transform ${formData.isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50">{loading ? 'Sharing...' : 'Share Idea'}</button></div>
      </div>
    </div>
  );
};

export default CreateIdeaModal;
