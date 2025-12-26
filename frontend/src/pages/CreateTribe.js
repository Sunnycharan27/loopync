import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { ArrowLeft, Camera, Users, Lock, Globe, Hash, GraduationCap, Dumbbell, Utensils, Briefcase, Palette } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '../components/BottomNav';

const TRIBE_CATEGORIES = [
  { id: 'college', label: 'College/Education', icon: GraduationCap, color: 'from-blue-500 to-purple-500', description: 'Projects, Certifications, Jobs' },
  { id: 'tech', label: 'Tech & Coding', icon: Briefcase, color: 'from-cyan-400 to-blue-500', description: 'Projects, Teams, Internships' },
  { id: 'fitness', label: 'Fitness & Gym', icon: Dumbbell, color: 'from-orange-500 to-red-500', description: 'Workouts, Challenges, Trainers' },
  { id: 'food', label: 'Food & Restaurant', icon: Utensils, color: 'from-yellow-500 to-orange-500', description: 'Menu, Deals, Reviews' },
  { id: 'business', label: 'Business & Services', icon: Briefcase, color: 'from-green-500 to-teal-500', description: 'Services, Deals, Reviews' },
  { id: 'creative', label: 'Creative & Art', icon: Palette, color: 'from-pink-500 to-purple-500', description: 'Portfolios, Collaborations' }
];

const CreateTribe = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Category, 2: Details
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'public',
    tags: [],
    avatar: null,
    coverImage: null
  });
  const [tagInput, setTagInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({ ...prev, category: categoryId }));
    setStep(2);
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'avatar') setAvatarPreview(reader.result);
        else setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim().toLowerCase()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { toast.error('Please login'); return; }
    if (!formData.name.trim()) { toast.error('Please enter tribe name'); return; }
    if (!formData.category) { toast.error('Please select a category'); return; }

    setLoading(true);
    try {
      let avatarUrl = null, coverUrl = null;

      // Upload images if provided
      if (formData.avatar) {
        const avatarForm = new FormData();
        avatarForm.append('file', formData.avatar);
        const avatarRes = await axios.post(`${API}/upload`, avatarForm, { headers: { 'Content-Type': 'multipart/form-data' } });
        avatarUrl = avatarRes.data.url;
      }
      if (formData.coverImage) {
        const coverForm = new FormData();
        coverForm.append('file', formData.coverImage);
        const coverRes = await axios.post(`${API}/upload`, coverForm, { headers: { 'Content-Type': 'multipart/form-data' } });
        coverUrl = coverRes.data.url;
      }

      const tribeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        type: formData.type,
        tags: formData.tags,
        avatar: avatarUrl,
        coverImage: coverUrl,
        ownerId: currentUser.id
      };

      const res = await axios.post(`${API}/tribes`, tribeData);
      toast.success('Tribe created!');
      navigate(`/tribes/${res.data.id}`);
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to create tribe');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = TRIBE_CATEGORIES.find(c => c.id === formData.category);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0f021e]/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Create Tribe</h1>
            <p className="text-gray-400 text-sm">Step {step} of 2</p>
          </div>
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">What type of tribe?</h2>
          <p className="text-gray-400 mb-6">Choose a category to get relevant features</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TRIBE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                  formData.category === cat.id 
                    ? 'border-cyan-400 bg-cyan-400/10' 
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${cat.color} flex items-center justify-center mb-3`}>
                  <cat.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-lg">{cat.label}</h3>
                <p className="text-sm text-gray-400">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Tribe Details */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="px-4 py-6 max-w-2xl mx-auto space-y-6">
          {/* Selected Category Badge */}
          {selectedCategory && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${selectedCategory.color}`}>
              <selectedCategory.icon size={16} className="text-white" />
              <span className="text-white font-semibold text-sm">{selectedCategory.label}</span>
            </div>
          )}

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
            <label className="block relative h-32 rounded-xl border-2 border-dashed border-gray-700 hover:border-gray-500 cursor-pointer overflow-hidden">
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Camera size={24} />
                  <span className="text-sm mt-1">Add cover</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'coverImage')} />
            </label>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tribe Avatar</label>
            <label className="block relative w-20 h-20 rounded-xl border-2 border-dashed border-gray-700 hover:border-gray-500 cursor-pointer overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Camera size={20} />
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'avatar')} />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tribe Name *</label>
            <div className="relative">
              <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tribe name"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                maxLength={50}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this tribe about?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
              maxLength={300}
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Privacy</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'public' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition ${
                  formData.type === 'public' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-gray-700 text-gray-400'
                }`}
              >
                <Globe size={18} />
                Public
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'private' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition ${
                  formData.type === 'private' ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-gray-700 text-gray-400'
                }`}
              >
                <Lock size={18} />
                Private
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags (up to 5)</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag"
                  className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 text-sm"
                />
              </div>
              <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">Add</button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-cyan-400/20 text-cyan-400 rounded-full text-sm flex items-center gap-1">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Tribe'}
          </button>
        </form>
      )}

      <BottomNav />
    </div>
  );
};

export default CreateTribe;
