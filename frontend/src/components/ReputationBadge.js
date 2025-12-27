import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { Award, Star, TrendingUp, Sparkles, ThumbsUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ReputationBadge = ({ userId, size = 'md', showEndorse = false }) => {
  const { currentUser } = useContext(AuthContext);
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchReputation();
    }
  }, [userId]);

  const fetchReputation = async () => {
    try {
      const res = await axios.get(`${API}/users/${userId}/reputation`);
      setReputation(res.data);
    } catch (error) {
      console.error('Failed to fetch reputation:', error);
      setReputation({ score: 0, endorsements: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getLevel = (score) => {
    if (score >= 1000) return { name: 'Legend', color: 'from-yellow-400 to-orange-500', icon: '👑' };
    if (score >= 500) return { name: 'Expert', color: 'from-purple-400 to-pink-500', icon: '🌟' };
    if (score >= 200) return { name: 'Pro', color: 'from-cyan-400 to-blue-500', icon: '💎' };
    if (score >= 50) return { name: 'Rising', color: 'from-green-400 to-emerald-500', icon: '🚀' };
    return { name: 'Newbie', color: 'from-gray-400 to-gray-500', icon: '🌱' };
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-700 rounded-full ${size === 'sm' ? 'w-16 h-6' : 'w-24 h-8'}`} />
    );
  }

  const level = getLevel(reputation?.score || 0);
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${level.color} text-white font-semibold shadow-lg hover:opacity-90 transition ${sizeClasses[size]}`}
      >
        <span>{level.icon}</span>
        <span>{level.name}</span>
        {size !== 'sm' && <span className="opacity-80">• {reputation?.score || 0}</span>}
      </button>

      {showModal && (
        <ReputationModal
          userId={userId}
          reputation={reputation}
          level={level}
          onClose={() => setShowModal(false)}
          showEndorse={showEndorse && currentUser && currentUser.id !== userId}
          onEndorseSuccess={fetchReputation}
        />
      )}
    </>
  );
};

const ReputationModal = ({ userId, reputation, level, onClose, showEndorse, onEndorseSuccess }) => {
  const { currentUser } = useContext(AuthContext);
  const [endorsing, setEndorsing] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [userSkills, setUserSkills] = useState([]);

  useEffect(() => {
    fetchUserSkills();
  }, [userId]);

  const fetchUserSkills = async () => {
    try {
      const res = await axios.get(`${API}/users/${userId}`);
      setUserSkills(res.data?.skills || ['Leadership', 'Teamwork', 'Problem Solving', 'Communication']);
    } catch (error) {
      setUserSkills(['Leadership', 'Teamwork', 'Problem Solving', 'Communication']);
    }
  };

  const handleEndorse = async () => {
    if (!selectedSkill) {
      toast.error('Please select a skill to endorse');
      return;
    }

    setEndorsing(true);
    try {
      await axios.post(
        `${API}/users/${userId}/endorse?endorserId=${currentUser.id}&skill=${encodeURIComponent(selectedSkill)}&message=${encodeURIComponent(message)}`
      );
      toast.success('Endorsement added!');
      onEndorseSuccess?.();
      setSelectedSkill('');
      setMessage('');
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to endorse');
    } finally {
      setEndorsing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a0b2e] rounded-2xl w-full max-w-md overflow-hidden border border-gray-800">
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${level.color}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Reputation Level</p>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>{level.icon}</span>
                {level.name}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Total Score</p>
              <p className="text-3xl font-bold text-white">{reputation?.score || 0}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-800">
          <div className="text-center">
            <Award className="mx-auto text-purple-400 mb-1" size={24} />
            <p className="text-xl font-bold text-white">{reputation?.endorsements || 0}</p>
            <p className="text-xs text-gray-400">Endorsements</p>
          </div>
          <div className="text-center">
            <Star className="mx-auto text-yellow-400 mb-1" size={24} />
            <p className="text-xl font-bold text-white">{reputation?.projects || 0}</p>
            <p className="text-xs text-gray-400">Projects</p>
          </div>
          <div className="text-center">
            <TrendingUp className="mx-auto text-green-400 mb-1" size={24} />
            <p className="text-xl font-bold text-white">{reputation?.contributions || 0}</p>
            <p className="text-xs text-gray-400">Contributions</p>
          </div>
        </div>

        {/* Recent Endorsements */}
        {reputation?.recentEndorsements?.length > 0 && (
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Endorsements</h3>
            <div className="space-y-2">
              {reputation.recentEndorsements.slice(0, 3).map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                  <img
                    src={e.endorser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.endorserId}`}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{e.endorser?.name || 'Someone'}</p>
                    <p className="text-xs text-cyan-400">{e.skill}</p>
                  </div>
                  <ThumbsUp size={14} className="text-green-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Endorse Form */}
        {showEndorse && (
          <div className="p-4 bg-gray-900/50">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              Endorse this user
            </h3>
            <div className="space-y-3">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select a skill...</option>
                {userSkills.map((skill, i) => (
                  <option key={i} value={skill}>{skill}</option>
                ))}
              </select>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleEndorse}
                disabled={endorsing || !selectedSkill}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {endorsing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <ThumbsUp size={18} />
                    Endorse
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReputationBadge;
