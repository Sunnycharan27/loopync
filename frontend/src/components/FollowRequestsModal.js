import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { X, UserPlus, Check, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const FollowRequestsModal = ({ isOpen, onClose }) => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchRequests();
    }
  }, [isOpen, currentUser?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/users/${currentUser.id}/follow-requests`);
      setRequests(res.data || []);
    } catch (error) {
      console.error('Failed to fetch follow requests:', error);
      toast.error('Failed to load follow requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'accepting' }));
    try {
      await axios.post(`${API}/follow-requests/${requestId}/accept?userId=${currentUser.id}`);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Follow request accepted!');
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Failed to accept request');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
    try {
      await axios.post(`${API}/follow-requests/${requestId}/reject?userId=${currentUser.id}`);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Follow request declined');
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to decline request');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const goToProfile = (userId) => {
    navigate(`/user/${userId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a0b2e] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <UserPlus size={24} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Follow Requests</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-cyan-400 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No pending follow requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  <img
                    src={request.fromUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.fromUserId}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                    onClick={() => goToProfile(request.fromUserId)}
                  />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-semibold text-white truncate cursor-pointer hover:text-cyan-400 transition"
                      onClick={() => goToProfile(request.fromUserId)}
                    >
                      {request.fromUser?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-400 truncate">@{request.fromUser?.handle || 'unknown'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      disabled={processing[request.id]}
                      className="p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition disabled:opacity-50"
                    >
                      {processing[request.id] === 'accepting' ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processing[request.id]}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                    >
                      {processing[request.id] === 'rejecting' ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <XCircle size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowRequestsModal;
