import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Award, Star, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const AddTrainerModal = ({ tribeId, currentUser, onClose, onAdded }) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [step, setStep] = useState('search'); // 'search' or 'details'
  
  const [formData, setFormData] = useState({
    specialization: 'General Fitness',
    experience: '',
    bio: '',
    certifications: [],
    availability: 'Available',
    isVerified: false
  });

  const specializations = [
    'General Fitness',
    'Weight Training',
    'Cardio & HIIT',
    'Yoga & Meditation',
    'CrossFit',
    'Martial Arts',
    'Swimming',
    'Nutrition Coach',
    'Personal Training',
    'Group Classes',
    'Sports Specific',
    'Rehabilitation'
  ];

  const availabilityOptions = [
    'Available',
    'Limited Availability',
    'Weekends Only',
    'Evenings Only',
    'By Appointment',
    'Currently Unavailable'
  ];

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async (query) => {
    setSearching(true);
    try {
      const res = await axios.get(`${API}/trainers/search?q=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(res.data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);
    try {
      const trainerData = {
        trainerId: selectedUser.id,
        ...formData
      };

      await axios.post(
        `${API}/tribes/${tribeId}/trainers?userId=${currentUser.id}`,
        trainerData
      );
      
      toast.success(`${selectedUser.name} added as trainer! 🏋️`);
      onAdded?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add trainer');
    } finally {
      setLoading(false);
    }
  };

  // Search Step
  if (step === 'search') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <UserPlus size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Add Trainer</h2>
                <p className="text-xs text-gray-400">Search for a user to add as trainer</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, handle, or email..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                autoFocus
              />
              {searching && (
                <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4 pt-0">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">@{user.handle || user.email?.split('@')[0]}</p>
                    </div>
                    <UserPlus size={20} className="text-orange-400" />
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 && !searching ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">Search for a user to add as trainer</p>
                <p className="text-gray-500 text-sm mt-1">Enter at least 2 characters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Details Step
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('search')} className="p-2 hover:bg-gray-800 rounded-full">
              <X size={20} className="text-gray-400" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Trainer Details</h2>
              <p className="text-xs text-gray-400">Set up trainer profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Selected User */}
        {selectedUser && (
          <div className="p-4 bg-orange-500/10 border-b border-orange-500/20">
            <div className="flex items-center gap-3">
              <img
                src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`}
                alt={selectedUser.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-orange-500"
              />
              <div>
                <p className="text-white font-bold">{selectedUser.name}</p>
                <p className="text-orange-400 text-sm">@{selectedUser.handle || selectedUser.email?.split('@')[0]}</p>
              </div>
              <Check size={24} className="text-orange-400 ml-auto" />
            </div>
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Specialization</label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Experience</label>
            <input
              type="text"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              placeholder="e.g., 5+ years, NASM Certified"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Brief description about the trainer..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
            <select
              value={formData.availability}
              onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            >
              {availabilityOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Verified Badge */}
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
            <div className="flex items-center gap-2">
              <Award size={20} className="text-yellow-400" />
              <span className="text-gray-300">Verified Trainer Badge</span>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isVerified: !prev.isVerified }))}
              className={`w-12 h-6 rounded-full transition ${formData.isVerified ? 'bg-yellow-500' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition transform ${formData.isVerified ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Add as Trainer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTrainerModal;
