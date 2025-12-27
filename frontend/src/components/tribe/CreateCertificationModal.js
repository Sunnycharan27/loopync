import React, { useState, useRef } from 'react';
import { X, Award, Calendar, Link, Image, Building2 } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateCertificationModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    description: '',
    credentialId: '',
    credentialUrl: '',
    issueDate: '',
    expiryDate: '',
    imageUrl: '',
    skills: []
  });

  const [newSkill, setNewSkill] = useState('');

  const popularIssuers = [
    'Google', 'Microsoft', 'AWS', 'Meta', 'IBM', 'Coursera', 'Udemy', 'LinkedIn Learning', 'HackerRank', 'freeCodeCamp'
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
    } catch (error) { toast.error('Failed to upload'); setImagePreview(null); }
    finally { setUploading(false); }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Please enter certification title'); return; }
    if (!formData.issuer.trim()) { toast.error('Please enter issuer name'); return; }
    setLoading(true);
    try {
      const certData = { ...formData, tribeId, authorId: currentUser.id, author: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar } };
      await axios.post(`${API}/certifications?userId=${currentUser.id}`, certData);
      toast.success('Certification added! 🎓');
      onCreated?.();
      onClose();
    } catch (error) { toast.error('Failed to add certification'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center"><Award size={20} className="text-white" /></div>
            <div><h2 className="text-lg font-bold text-white">Add Certification</h2><p className="text-xs text-gray-400">Showcase your credentials</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X size={24} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Certificate Image</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); }} className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full"><X size={16} className="text-white" /></button></div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-yellow-500 hover:text-yellow-500 transition"><Image size={32} /><span className="text-sm mt-2">Upload Certificate</span></button>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Certification Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., AWS Solutions Architect" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Issuing Organization *</label>
            <div className="relative"><Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={formData.issuer} onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))} placeholder="e.g., Amazon Web Services" className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500" /></div>
            <div className="flex flex-wrap gap-2 mt-2">{popularIssuers.map(issuer => (<button key={issuer} type="button" onClick={() => setFormData(prev => ({ ...prev, issuer }))} className={`px-2 py-1 rounded-full text-xs transition ${formData.issuer === issuer ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{issuer}</button>))}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Issue Date</label><input type="date" value={formData.issueDate} onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label><input type="date" value={formData.expiryDate} onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Credential ID</label>
            <input type="text" value={formData.credentialId} onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))} placeholder="ABC123XYZ" className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Credential URL</label>
            <div className="relative"><Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="url" value={formData.credentialUrl} onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))} placeholder="https://..." className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
            <div className="flex gap-2 mb-2"><input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill..." className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm" /><button type="button" onClick={addSkill} className="px-3 py-2 bg-yellow-500 text-black rounded-lg text-sm">Add</button></div>
            <div className="flex flex-wrap gap-2">{formData.skills.map((skill, i) => (<span key={i} className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">{skill}<button type="button" onClick={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))}><X size={12} /></button></span>))}</div>
          </div>
        </form>
        <div className="p-4 border-t border-gray-800"><button onClick={handleSubmit} disabled={loading || uploading} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50">{loading ? 'Adding...' : 'Add Certification'}</button></div>
      </div>
    </div>
  );
};

export default CreateCertificationModal;
