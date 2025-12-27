import React, { useState, useRef } from 'react';
import { X, Palette, Image, Link, Plus, Eye } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreatePortfolioModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'illustration',
    tools: [],
    projectUrl: '',
    tags: []
  });
  const [newTool, setNewTool] = useState('');
  const [newTag, setNewTag] = useState('');

  const categories = [
    { id: 'illustration', label: '🎨 Illustration' },
    { id: 'ui-design', label: '📱 UI Design' },
    { id: 'photography', label: '📸 Photography' },
    { id: '3d', label: '🎮 3D Art' },
    { id: 'animation', label: '🎬 Animation' },
    { id: 'branding', label: '🏷️ Branding' },
    { id: 'typography', label: '✏️ Typography' },
    { id: 'other', label: '✨ Other' }
  ];
  const popularTools = ['Figma', 'Photoshop', 'Illustrator', 'Blender', 'After Effects', 'Procreate', 'Canva'];

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 6) { toast.error('Max 6 images allowed'); return; }
    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image too large'); continue; }
      try {
        const reader = new FileReader();
        reader.onloadend = () => {};
        reader.readAsDataURL(file);
        const fd = new FormData(); fd.append('file', file);
        const res = await axios.post(`${API}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImages(prev => [...prev, { url: res.data.url, preview: URL.createObjectURL(file) }]);
      } catch { toast.error('Upload failed'); }
    }
    setUploading(false);
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  const addTool = (tool) => {
    if (tool && !formData.tools.includes(tool)) {
      setFormData(prev => ({ ...prev, tools: [...prev.tools, tool] }));
      setNewTool('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter title'); return; }
    if (images.length === 0) { toast.error('Please add at least one image'); return; }
    setLoading(true);
    try {
      const portfolioData = { ...formData, tribeId, authorId: currentUser.id, author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }, images: images.map(i => i.url), views: 0, likes: 0 };
      await axios.post(`${API}/portfolios?userId=${currentUser.id}`, portfolioData);
      toast.success('Portfolio added! 🎨');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to add portfolio'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center"><Palette size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Add to Portfolio</h2><p className="text-xs text-gray-400">Showcase your creative work</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Images * (Max 6)</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-black/70 rounded-full"><X size={12} className="text-white" /></button>
                </div>
              ))}
              {images.length < 6 && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-pink-500 hover:text-pink-500 transition">
                  {uploading ? <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" /> : <><Plus size={24} /><span className="text-xs mt-1">Add</span></>}
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Brand Identity for Tech Startup" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">{categories.map(c => (<button key={c.id} type="button" onClick={() => setFormData(prev => ({ ...prev, category: c.id }))} className={`px-2 py-2 rounded-lg text-xs transition ${formData.category === c.id ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{c.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Tell the story behind this work..." rows={3} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tools Used</label>
            <div className="flex flex-wrap gap-2 mb-2">{popularTools.map(t => (<button key={t} type="button" onClick={() => addTool(t)} className={`px-3 py-1.5 rounded-full text-xs transition ${formData.tools.includes(t) ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t}</button>))}</div>
            <div className="flex flex-wrap gap-2">{formData.tools.filter(t => !popularTools.includes(t)).map((t, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">{t}<button type="button" onClick={() => setFormData(prev => ({ ...prev, tools: prev.tools.filter(x => x !== t) }))}><X size={12} /></button></span>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project URL (optional)</label>
            <div className="relative"><Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="url" value={formData.projectUrl} onChange={(e) => setFormData(prev => ({ ...prev, projectUrl: e.target.value }))} placeholder="https://..." className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" /></div>
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Adding...' : 'Add to Portfolio'}</button></div>
      </div>
    </div>
  );
};

export default CreatePortfolioModal;
