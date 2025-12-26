import React, { useState, useRef } from 'react';
import { X, Utensils, DollarSign, Image, Tag, Leaf, Flame } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateMenuItemModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main',
    isVeg: true,
    isSpicy: false,
    isPopular: false,
    calories: '',
    imageUrl: ''
  });

  const categories = [
    { id: 'starters', label: 'Starters', icon: '🥗' },
    { id: 'main', label: 'Main Course', icon: '🍛' },
    { id: 'desserts', label: 'Desserts', icon: '🍰' },
    { id: 'beverages', label: 'Beverages', icon: '🥤' },
    { id: 'snacks', label: 'Snacks', icon: '🍟' },
    { id: 'specials', label: 'Specials', icon: '⭐' }
  ];

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await axios.post(`${API}/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter item name');
      return;
    }
    if (!formData.price) {
      toast.error('Please enter price');
      return;
    }

    setLoading(true);
    try {
      const menuData = {
        ...formData,
        tribeId,
        addedBy: currentUser.id,
        price: parseFloat(formData.price),
        calories: formData.calories ? parseInt(formData.calories) : null,
        image: formData.imageUrl
      };

      await axios.post(`${API}/menu-items?userId=${currentUser.id}`, menuData);
      toast.success('Menu item added! 🍽️');
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error('Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <Utensils size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Menu Item</h2>
              <p className="text-xs text-gray-400">Share your dish</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Photo</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full"
                >
                  <X size={16} className="text-white" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-yellow-500 hover:text-yellow-500 transition"
              >
                <Image size={32} />
                <span className="text-sm mt-2">Add Photo</span>
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Item Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Paneer Tikka Masala"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the dish..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          {/* Price & Calories */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="199"
                  className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Calories</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                placeholder="350"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                  className={`p-2 rounded-xl text-center transition ${formData.category === cat.id ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <p className="text-xs mt-1">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isVeg: !prev.isVeg }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${formData.isVeg ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                <Leaf size={16} />
                Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isSpicy: !prev.isSpicy }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${formData.isSpicy ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                <Flame size={16} />
                Spicy
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isPopular: !prev.isPopular }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${formData.isPopular ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}
              >
                ⭐ Popular
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add to Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMenuItemModal;
