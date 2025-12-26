import React, { useState } from 'react';
import { X, Trophy, Calendar, Users, Target, Award } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateChallengeModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'fitness',
    duration: '7',
    goal: '',
    unit: 'days',
    maxParticipants: '',
    prizes: '',
    rules: ''
  });

  const challengeTypes = [
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'steps', label: 'Steps', icon: '👟' },
    { id: 'workout', label: 'Workout', icon: '🏋️' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
    { id: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
    { id: 'custom', label: 'Custom', icon: '⭐' }
  ];

  const durations = [
    { value: '7', label: '7 Days' },
    { value: '14', label: '14 Days' },
    { value: '21', label: '21 Days' },
    { value: '30', label: '30 Days' },
    { value: '60', label: '60 Days' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a challenge title');
      return;
    }
    if (!formData.goal.trim()) {
      toast.error('Please set a goal');
      return;
    }

    setLoading(true);
    try {
      const challengeData = {
        ...formData,
        tribeId,
        creatorId: currentUser.id,
        duration: parseInt(formData.duration),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        participants: [currentUser.id],
        status: 'active'
      };

      await axios.post(`${API}/challenges?userId=${currentUser.id}`, challengeData);
      toast.success('Challenge created! 🏆');
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error('Failed to create challenge');
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
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Challenge</h2>
              <p className="text-xs text-gray-400">Motivate your tribe members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Challenge Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., 30 Day Fitness Challenge"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Challenge Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Challenge Type</label>
            <div className="grid grid-cols-3 gap-2">
              {challengeTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                  className={`p-3 rounded-xl text-center transition ${formData.type === type.id ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <p className="text-xs mt-1">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's the challenge about?"
              rows={2}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Goal *</label>
            <div className="relative">
              <Target size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="e.g., Complete 30 workouts, Walk 10,000 steps daily"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
            <div className="flex gap-2">
              {durations.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration: d.value }))}
                  className={`flex-1 py-2 rounded-lg text-sm transition ${formData.duration === d.value ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Participants (optional)</label>
            <div className="relative">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                placeholder="Leave empty for unlimited"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Prizes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prizes (optional)</label>
            <div className="relative">
              <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={formData.prizes}
                onChange={(e) => setFormData(prev => ({ ...prev, prizes: e.target.value }))}
                placeholder="e.g., Badge, Recognition, Gift card"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rules</label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
              placeholder="Challenge rules and guidelines..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500 resize-none"
            />
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
            {loading ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChallengeModal;
