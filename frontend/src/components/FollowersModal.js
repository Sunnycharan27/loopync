import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import VerifiedBadge from './VerifiedBadge';
import { getMediaUrl } from '../utils/mediaUtils';

const API = process.env.REACT_APP_BACKEND_URL || '';

const FollowersModal = ({ userId, type = 'followers', onClose, currentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const fetchUsers = async () => {
    try {
      const endpoint = type === 'followers' 
        ? `/api/users/${userId}/followers`
        : `/api/users/${userId}/following`;
      
      const response = await axios.get(`${API}${endpoint}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    if (!currentUser) {
      toast.error('Please login to follow');
      return;
    }

    try {
      const token = localStorage.getItem('loopync_token');
      await axios.post(
        `${API}/api/users/${currentUser.id}/follow`,
        { targetUserId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const isFollowing = currentUser.following?.includes(targetUserId);
      toast.success(isFollowing ? 'Unfollowed' : 'Following!');
      
      // Update local state
      setUsers(users.map(u => 
        u.id === targetUserId 
          ? { ...u, isFollowing: !isFollowing }
          : u
      ));
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const isFollowing = (targetUserId) => {
    return currentUser?.following?.includes(targetUserId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-purple-800/30"
        style={{ background: '#0f021e' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-purple-800/30 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No {type} yet
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-purple-900/20 hover:bg-purple-900/30 transition-colors"
                >
                  {/* Avatar */}
                  <button
                    onClick={() => {
                      navigate(`/@${user.handle}`);
                      onClose();
                    }}
                    className="flex-shrink-0"
                  >
                    <img
                      src={getMediaUrl(user.avatar)}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-400/30"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
                      }}
                    />
                  </button>

                  {/* User Info */}
                  <button
                    onClick={() => {
                      navigate(`/@${user.handle}`);
                      onClose();
                    }}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-1">
                      <p className="text-white font-semibold">{user.name}</p>
                      {user.isVerified && <VerifiedBadge size={14} />}
                    </div>
                    <p className="text-gray-400 text-sm">@{user.handle}</p>
                  </button>

                  {/* Action Button */}
                  {currentUser && user.id !== currentUser.id && (
                    <button
                      onClick={() => handleFollow(user.id)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        isFollowing(user.id)
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-cyan-400 text-black hover:bg-cyan-500'
                      }`}
                    >
                      {isFollowing(user.id) ? (
                        <>
                          <UserCheck size={16} className="inline mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} className="inline mr-1" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;
