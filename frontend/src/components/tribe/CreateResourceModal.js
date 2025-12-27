import React, { useState, useRef } from 'react';
import { X, BookOpen, Link, FileText, Image, Tag, Download } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateResourceModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    category: 'tutorial',
    resourceUrl: '',
    fileUrl: '',
    thumbnailUrl: '',
    tags: [],
    isPremium: false,
    price: ''
  });
  const [newTag, setNewTag] = useState('');

  const types = [
    { id: 'document', label: '📄 Document', icon: FileText },
    { id: 'video', label: '🎬 Video', icon: FileText },
    { id: 'tool', label: '🔧 Tool/Template', icon: FileText },
    { id: 'course', label: '📚 Course', icon: FileText },
    { id: 'ebook', label: '📖 E-Book', icon: FileText },
    { id: 'link', label: '🔗 External Link', icon: Link }
  ];

  const categories = [
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'guide', label: 'Guide' },
    { id: 'template', label: 'Template' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'case-study', label: 'Case Study' },
    { id: 'research', label: 'Research' },
    { id: 'other', label: 'Other' }
  ];

  const handleThumbnailSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, thumbnailUrl: res.data.url }));
    } catch { toast.error('Upload failed'); setThumbnailPreview(null); }
    finally { setUploading(false); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File too large (max 50MB)'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, fileUrl: res.data.url }));
      toast.success('File uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter title'); return; }
    if (!formData.resourceUrl && !formData.fileUrl) { toast.error('Please add a link or upload a file'); return; }
    setLoading(true);
    try {
      const resourceData = {
        ...formData,
        tribeId,
        authorId: currentUser.id,
        author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
        downloads: 0,
        views: 0,
        likes: 0
      };
      await axios.post(`${API}/resources?userId=${currentUser.id}`, resourceData);
      toast.success('Resource shared! 📚');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to share resource'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center"><BookOpen size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Share Resource</h2><p className="text-xs text-gray-400">Help others learn and grow</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail</label>
            <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} className="hidden" />
            {thumbnailPreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden"><img src={thumbnailPreview} alt="" className="w-full h-full object-cover" /><button type="button" onClick={() => { setThumbnailPreview(null); setFormData(prev => ({ ...prev, thumbnailUrl: '' })); }} className="absolute top-2 right-2 p-1 bg-black/70 rounded-full"><X size={14} className="text-white" /></button></div>
            ) : (
              <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"><Image size={20} className="mr-2" />Add Thumbnail</button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Complete React Guide" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Resource Type</label>
            <div className="grid grid-cols-3 gap-2">{types.map(t => (<button key={t.id} type="button" onClick={() => setFormData(prev => ({ ...prev, type: t.id }))} className={`px-2 py-2 rounded-lg text-xs transition ${formData.type === t.id ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{t.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white">{categories.map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}</select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="What's in this resource?" rows={2} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><Link size={14} className="inline mr-1" />Resource URL</label>
            <input type="url" value={formData.resourceUrl} onChange={(e) => setFormData(prev => ({ ...prev, resourceUrl: e.target.value }))} placeholder="https://..." className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Or Upload File</label>
            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full py-3 border border-dashed rounded-xl flex items-center justify-center gap-2 transition ${formData.fileUrl ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-700 text-gray-500 hover:border-blue-500 hover:text-blue-500'}`}>
              {uploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : formData.fileUrl ? <><Download size={18} />File Uploaded</> : <><FileText size={18} />Upload File</>}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2"><Tag size={14} className="inline mr-1" />Tags</label>
            <div className="flex gap-2 mb-2"><input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm" /><button type="button" onClick={addTag} className="px-3 py-2 bg-blue-500 text-white rounded-lg">Add</button></div>
            <div className="flex flex-wrap gap-2">{formData.tags.map((t, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">#{t}<button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) }))}><X size={12} /></button></span>))}</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
            <span className="text-gray-300">Premium Resource</span>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))} className={`w-12 h-6 rounded-full transition ${formData.isPremium ? 'bg-yellow-500' : 'bg-gray-700'}`}><div className={`w-5 h-5 rounded-full bg-white transition transform ${formData.isPremium ? 'translate-x-6' : 'translate-x-0.5'}`} /></button>
          </div>
          {formData.isPremium && (
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Price</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="99" className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" /></div></div>
          )}
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Sharing...' : 'Share Resource'}</button></div>
      </div>
    </div>
  );
};

export default CreateResourceModal;
