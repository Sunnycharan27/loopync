import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, API } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, Image, Upload, Globe, Lock, X, Plus
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const CreateTribe = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    rules: [],
    coverImage: '',
    icon: ''
  });
  
  const [newRule, setNewRule] = useState('');

  const categories = [
    'Technology', 'Gaming', 'Music', 'Art', 'Sports', 
    'Fashion', 'Food', 'Travel', 'Education', 'Business',
    'Entertainment', 'Health', 'Lifestyle', 'Other'
  ];

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const token = localStorage.getItem('loopync_token');
      const res = await axios.post(`${API}/upload`, data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setFormData(prev => ({
        ...prev,
        [type]: res.data.url
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const addRule = () => {
    if (newRule.trim() && formData.rules.length < 10) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a tribe name');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('loopync_token');
      const tribeData = {
        ...formData,
        creatorId: currentUser.id,
        members: [currentUser.id],
        admins: [currentUser.id]
      };

      const res = await axios.post(`${API}/tribes`, tribeData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      toast.success('Tribe created successfully!');
      navigate(`/tribes/${res.data.id}`);
    } catch (error) {
      console.error('Create tribe error:', error);
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || 'Failed to create tribe');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-center">
          <p className="text-white text-lg mb-4">Please login to create a tribe</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-cyan-400 text-black font-semibold rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-purple-800/30" style={{ background: 'rgba(15, 2, 30, 0.95)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white hover:text-cyan-400 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={24} className="text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Create Tribe</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Cover Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
          <div 
            onClick={() => document.getElementById('cover-input').click()}
            className="relative w-full h-40 rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-600 hover:border-cyan-400 transition-colors"
            style={{ background: formData.coverImage ? `url(${formData.coverImage}) center/cover` : 'rgba(31, 41, 55, 0.5)' }}
          >
            {!formData.coverImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400" />
                ) : (
                  <>
                    <Upload size={32} className="text-gray-500 mb-2" />
                    <p className="text-gray-500 text-sm">Click to upload cover image</p>
                  </>
                )}
              </div>
            )}
            {formData.coverImage && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white font-semibold">Change Cover</p>
              </div>
            )}
          </div>
          <input
            id="cover-input"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'coverImage')}
          />
        </div>

        {/* Icon Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tribe Icon</label>
          <div className="flex items-center gap-4">
            <div 
              onClick={() => document.getElementById('icon-input').click()}
              className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-600 hover:border-cyan-400 transition-colors flex items-center justify-center"
              style={{ 
                background: formData.icon 
                  ? `url(${formData.icon}) center/cover` 
                  : 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)'
              }}
            >
              {!formData.icon && <Users size={32} className="text-white" />}
            </div>
            <p className="text-gray-500 text-sm">Click to upload icon (optional)</p>
          </div>
          <input
            id="icon-input"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'icon')}
          />
        </div>

        {/* Tribe Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tribe Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Enter tribe name"
            maxLength={50}
          />
          <p className="text-gray-500 text-xs mt-1">{formData.name.length}/50 characters</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[100px]"
            placeholder="What is your tribe about?"
            maxLength={500}
          />
          <p className="text-gray-500 text-xs mt-1">{formData.description.length}/500 characters</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Privacy</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, privacy: 'public' }))}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                formData.privacy === 'public'
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Globe size={20} />
              Public
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, privacy: 'private' }))}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                formData.privacy === 'private'
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Lock size={20} />
              Private
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {formData.privacy === 'public' 
              ? 'Anyone can see and join this tribe' 
              : 'Only approved members can join this tribe'}
          </p>
        </div>

        {/* Rules */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Tribe Rules (optional)</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Add a rule"
              maxLength={200}
            />
            <button
              type="button"
              onClick={addRule}
              disabled={!newRule.trim() || formData.rules.length >= 10}
              className="px-4 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </div>
          {formData.rules.length > 0 && (
            <div className="space-y-2">
              {formData.rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-800 rounded-lg p-3">
                  <span className="text-cyan-400 font-bold">{index + 1}.</span>
                  <span className="flex-1 text-white text-sm">{rule}</span>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-gray-500 text-xs mt-1">{formData.rules.length}/10 rules</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-xl hover:from-cyan-300 hover:to-purple-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
              Creating...
            </>
          ) : (
            <>
              <Users size={20} />
              Create Tribe
            </>
          )}
        </button>
      </form>

      <BottomNav active="discover" />
    </div>
  );
};

export default CreateTribe;
