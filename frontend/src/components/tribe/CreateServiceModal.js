import React, { useState, useRef } from 'react';
import { X, Briefcase, DollarSign, Clock, Image, Star } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateServiceModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'consulting',
    price: '',
    priceType: 'fixed',
    duration: '',
    features: [],
    imageUrl: '',
    availability: 'available'
  });
  const [newFeature, setNewFeature] = useState('');

  const categories = [
    { id: 'consulting', label: '💼 Consulting' },
    { id: 'design', label: '🎨 Design' },
    { id: 'development', label: '💻 Development' },
    { id: 'marketing', label: '📢 Marketing' },
    { id: 'writing', label: '✍️ Writing' },
    { id: 'coaching', label: '🎯 Coaching' },
    { id: 'other', label: '📦 Other' }
  ];
  const priceTypes = [{ id: 'fixed', label: 'Fixed' }, { id: 'hourly', label: 'Per Hour' }, { id: 'monthly', label: 'Monthly' }, { id: 'negotiable', label: 'Negotiable' }];

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await axios.post(`${API}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch { toast.error('Upload failed'); setImagePreview(null); }
    finally { setUploading(false); }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter service title'); return; }
    setLoading(true);
    try {
      const serviceData = { ...formData, tribeId, providerId: currentUser.id, provider: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }, rating: 0, reviewCount: 0 };
      await axios.post(`${API}/services?userId=${currentUser.id}`, serviceData);
      toast.success('Service listed! 🎯');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to list service'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center"><Briefcase size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">List Service</h2><p className="text-xs text-gray-400">Offer your expertise</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Service Image</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden"><img src={imagePreview} alt="" className="w-full h-full object-cover" /><button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); }} className="absolute top-2 right-2 p-1 bg-black/70 rounded-full"><X size={14} className="text-white" /></button></div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition"><Image size={24} className="mr-2" />Add Image</button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Service Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Website Development" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">{categories.map(c => (<button key={c.id} type="button" onClick={() => setFormData(prev => ({ ...prev, category: c.id }))} className={`px-2 py-2 rounded-lg text-xs transition ${formData.category === c.id ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>{c.label}</button>))}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe your service..." rows={3} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span><input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="5000" className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price Type</label>
              <select value={formData.priceType} onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white">{priceTypes.map(p => (<option key={p.id} value={p.id}>{p.label}</option>))}</select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">What's Included</label>
            <div className="flex gap-2 mb-2"><input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} placeholder="Add feature..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm" /><button type="button" onClick={addFeature} className="px-3 py-2 bg-green-500 text-white rounded-lg">Add</button></div>
            <div className="space-y-1">{formData.features.map((f, i) => (<div key={i} className="flex items-center gap-2 text-sm text-gray-300"><span className="text-green-400">✓</span>{f}<button type="button" onClick={() => setFormData(prev => ({ ...prev, features: prev.features.filter(x => x !== f) }))} className="ml-auto text-red-400"><X size={14} /></button></div>))}</div>
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl disabled:opacity-50">{loading ? 'Listing...' : 'List Service'}</button></div>
      </div>
    </div>
  );
};

export default CreateServiceModal;
