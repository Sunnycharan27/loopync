import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateReviewModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    text: '',
    recommend: true,
    aspects: {
      quality: 0,
      service: 0,
      value: 0,
      ambiance: 0
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!formData.text.trim()) {
      toast.error('Please write your review');
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        ...formData,
        tribeId,
        authorId: currentUser.id,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          handle: currentUser.handle
        }
      };

      await axios.post(`${API}/reviews?userId=${currentUser.id}`, reviewData);
      toast.success('Review posted! ⭐');
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error('Failed to post review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, size = 'lg' }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition hover:scale-110"
        >
          <Star
            size={size === 'lg' ? 32 : 20}
            className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
          />
        </button>
      ))}
    </div>
  );

  const AspectRating = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition hover:scale-110"
          >
            <Star
              size={16}
              className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <Star size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Write Review</h2>
              <p className="text-xs text-gray-400">Share your experience</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Overall Rating */}
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">How would you rate your experience?</p>
            <div className="flex justify-center">
              <StarRating value={formData.rating} onChange={(r) => setFormData(prev => ({ ...prev, rating: r }))} />
            </div>
            <p className="text-yellow-400 font-semibold mt-2">
              {formData.rating === 0 ? 'Tap to rate' : 
               formData.rating === 1 ? 'Poor' :
               formData.rating === 2 ? 'Fair' :
               formData.rating === 3 ? 'Good' :
               formData.rating === 4 ? 'Very Good' : 'Excellent!'}
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Review Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Review *</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Tell others about your experience..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          {/* Aspect Ratings */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Rate specific aspects</label>
            <div className="space-y-3 p-3 bg-gray-800/30 rounded-xl">
              <AspectRating 
                label="Quality" 
                value={formData.aspects.quality} 
                onChange={(v) => setFormData(prev => ({ ...prev, aspects: { ...prev.aspects, quality: v } }))}
              />
              <AspectRating 
                label="Service" 
                value={formData.aspects.service} 
                onChange={(v) => setFormData(prev => ({ ...prev, aspects: { ...prev.aspects, service: v } }))}
              />
              <AspectRating 
                label="Value for Money" 
                value={formData.aspects.value} 
                onChange={(v) => setFormData(prev => ({ ...prev, aspects: { ...prev.aspects, value: v } }))}
              />
              <AspectRating 
                label="Ambiance" 
                value={formData.aspects.ambiance} 
                onChange={(v) => setFormData(prev => ({ ...prev, aspects: { ...prev.aspects, ambiance: v } }))}
              />
            </div>
          </div>

          {/* Recommend */}
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
            <span className="text-gray-300">Would you recommend this?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, recommend: true }))}
                className={`px-4 py-2 rounded-lg text-sm transition ${formData.recommend ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}
              >
                👍 Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, recommend: false }))}
                className={`px-4 py-2 rounded-lg text-sm transition ${!formData.recommend ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}
              >
                👎 No
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateReviewModal;
