import React, { useState, useRef } from 'react';
import { X, Sparkles, Link, Image, Plus, Trophy, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateShowcaseModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'startup',
    stage: 'idea',
    metrics: '',
    achievements: [],
    websiteUrl: '',
    pitchDeckUrl: '',
    fundingStage: 'bootstrapped',
    teamSize: '1-5',
    location: ''
  });
  const [newAchievement, setNewAchievement] = useState('');

  const categories = [
    { id: 'startup', label: '🚀 Startup' },
    { id: 'project', label: '💻 Side Project' },
    { id: 'business', label: '🏢 Business' },
    { id: 'nonprofit', label: '💚 Non-Profit' },
    { id: 'community', label: '👥 Community' }
  ];

  const stages = [
    { id: 'idea', label: '💡 Idea' },
    { id: 'mvp', label: '🔧 MVP' },
    { id: 'growth', label: '📈 Growth' },
    { id: 'scale', label: '🚀 Scale' }
  ];

  const fundingStages = [
    { id: 'bootstrapped', label: 'Bootstrapped' },
    { id: 'pre-seed', label: 'Pre-Seed' },
    { id: 'seed', label: 'Seed' },
    { id: 'series-a', label: 'Series A+' }
  ];

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) { toast.error('Max 4 images'); return; }
    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image too large'); continue; }
      try {
        const fd = new FormData(); fd.append('file', file);
        const res = await axios.post(`${API}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImages(prev => [...prev, { url: res.data.url, preview: URL.createObjectURL(file) }]);
      } catch { toast.error('Upload failed'); }
    }
    setUploading(false);
  };

  const addAchievement = () => {
    if (newAchievement.trim() && formData.achievements.length < 5) {
      setFormData(prev => ({ ...prev, achievements: [...prev.achievements, newAchievement.trim()] }));
      setNewAchievement('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter title'); return; }
    setLoading(true);
    try {
      const showcaseData = {
        ...formData,
        tribeId,
        authorId: currentUser.id,
        author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
        images: images.map(i => i.url),
        views: 0,
        likes: 0,
        featured: false
      };
      await axios.post(`${API}/showcases?userId=${currentUser.id}`, showcaseData);
      toast.success('Startup showcased! 🚀');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to showcase'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Startup Showcase</h2><p className="text-xs text-gray-400">Share your venture with the world</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Images (Max 4)</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-black/70 rounded-full"><X size={12} className="text-white" /></button>
                </div>
              ))}
              {images.length < 4 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 hover:border-purple-500 hover:text-purple-500 transition">
                  {uploading ? <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : <Plus size={20} />}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Startup Name *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., TechNova" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white">{categories.map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}</select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
              <select value={formData.stage} onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white">{stages.map(s => (<option key={s.id} value={s.id}>{s.label}</option>))}</select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="What does your startup do?" rows={3} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><TrendingUp size={14} className="inline mr-1" />Key Metrics</label>
            <input type="text" value={formData.metrics} onChange={(e) => setFormData(prev => ({ ...prev, metrics: e.target.value }))} placeholder="e.g., 10K users, $50K MRR" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><Trophy size={14} className="inline mr-1" />Achievements</label>
            <div className="flex gap-2 mb-2"><input type="text" value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())} placeholder="e.g., YC W24" className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm" /><button type="button" onClick={addAchievement} className="px-3 py-2 bg-purple-500 text-white rounded-lg">Add</button></div>
            <div className="flex flex-wrap gap-2">{formData.achievements.map((a, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">🏆 {a}<button type="button" onClick={() => setFormData(prev => ({ ...prev, achievements: prev.achievements.filter(x => x !== a) }))}><X size={12} /></button></span>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Funding Stage</label>
              <select value={formData.fundingStage} onChange={(e) => setFormData(prev => ({ ...prev, fundingStage: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white">{fundingStages.map(f => (<option key={f.id} value={f.id}>{f.label}</option>))}</select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Team Size</label>
              <select value={formData.teamSize} onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white"><option value="1-5">1-5</option><option value="6-20">6-20</option><option value="21-50">21-50</option><option value="50+">50+</option></select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><Link size={14} className="inline mr-1" />Website</label>
            <input type="url" value={formData.websiteUrl} onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))} placeholder="https://yoursite.com" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500" />
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Showcasing...' : 'Showcase Startup'}</button></div>
      </div>
    </div>
  );
};

export default CreateShowcaseModal;
