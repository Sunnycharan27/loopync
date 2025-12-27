import React, { useState, useRef } from 'react';
import { X, Rocket, Link, Image, Plus, Trash2, Github, Globe } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateProjectModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    techStack: [],
    skills: [],
    githubUrl: '',
    liveUrl: '',
    imageUrl: '',
    status: 'in-progress',
    lookingForMembers: false,
    memberRoles: []
  });

  const [newTech, setNewTech] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newRole, setNewRole] = useState('');

  const statuses = [
    { id: 'idea', label: '💡 Idea Stage', color: 'yellow' },
    { id: 'in-progress', label: '🚧 In Progress', color: 'blue' },
    { id: 'completed', label: '✅ Completed', color: 'green' },
    { id: 'on-hold', label: '⏸️ On Hold', color: 'gray' }
  ];

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await axios.post(`${API}/upload`, formDataUpload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
      toast.success('Image uploaded');
    } catch (error) { toast.error('Failed to upload image'); setImagePreview(null); }
    finally { setUploading(false); }
  };

  const addItem = (field, value, setter) => {
    if (!value.trim()) return;
    if (!formData[field].includes(value.trim())) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    }
    setter('');
  };

  const removeItem = (field, item) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter(i => i !== item) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter a project title'); return; }
    setLoading(true);
    try {
      const projectData = {
        ...formData,
        tribeId,
        authorId: currentUser.id,
        author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }
      };
      await axios.post(`${API}/projects?userId=${currentUser.id}`, projectData);
      toast.success('Project added! 🚀');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to add project'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Rocket size={20} className="text-white" />
            </div>
            <div><h2 className="text-lg font-bold text-white">Add Project</h2><p className="text-xs text-gray-400">Showcase your work</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); }} className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full"><X size={16} className="text-white" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-purple-500 hover:text-purple-500 transition"><Image size={32} /><span className="text-sm mt-2">Add Cover</span></button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., AI Study Planner" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="What does your project do?" rows={3} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(s => (
                <button key={s.id} type="button" onClick={() => setFormData(prev => ({ ...prev, status: s.id }))} className={`px-3 py-2 rounded-lg text-sm transition ${formData.status === s.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tech Stack</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={newTech} onChange={(e) => setNewTech(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('techStack', newTech, setNewTech))} placeholder="Add technology..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500" />
              <button type="button" onClick={() => addItem('techStack', newTech, setNewTech)} className="px-3 py-2 bg-purple-500 text-white rounded-lg"><Plus size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2">{formData.techStack.map((tech, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">{tech}<button type="button" onClick={() => removeItem('techStack', tech)}><X size={12} /></button></span>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
              <div className="relative"><Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="url" value={formData.githubUrl} onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))} placeholder="github.com/..." className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Live URL</label>
              <div className="relative"><Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="url" value={formData.liveUrl} onChange={(e) => setFormData(prev => ({ ...prev, liveUrl: e.target.value }))} placeholder="yourproject.com" className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500" /></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
            <span className="text-gray-300">Looking for team members?</span>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, lookingForMembers: !prev.lookingForMembers }))} className={`w-12 h-6 rounded-full transition ${formData.lookingForMembers ? 'bg-green-500' : 'bg-gray-700'}`}><div className={`w-5 h-5 rounded-full bg-white transition transform ${formData.lookingForMembers ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
          </div>
        </form>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Adding...' : 'Add Project'}</button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
