import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { CheckCircle, X, Eye, FileText, User, Mail, Phone, Globe, AlertCircle, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';

const AdminVerificationDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('loopync_token');
      const response = await axios.get(`${API}/admin/verification/requests?skip=0&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setRequests(response.data.requests || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load verification requests');
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedRequest) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.post(
        `${API}/admin/verification/${selectedRequest.id}/review`,
        {
          status: reviewAction,
          rejectionReason: reviewAction === 'rejected' ? rejectionReason : null,
          adminNotes: adminNotes
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      toast.success(reviewAction === 'approved' ? 'Verification approved!' : 'Verification rejected');
      setReviewModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setAdminNotes('');
      fetchPendingRequests();
    } catch (error) {
      console.error('Error reviewing request:', error);
      toast.error('Failed to review request');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (request, action) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewModal(true);
  };

  const getAccountTypeIcon = (type) => {
    switch(type) {
      case 'creator': return '🎨';
      case 'public_figure': return '⭐';
      case 'business': return '🏢';
      default: return '👤';
    }
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      celebrity: 'from-purple-500 to-pink-500',
      influencer: 'from-cyan-500 to-blue-500',
      politician: 'from-red-500 to-orange-500',
      company: 'from-blue-500 to-indigo-500',
      brand: 'from-green-500 to-teal-500',
      media: 'from-yellow-500 to-orange-500',
      organization: 'from-gray-500 to-slate-500',
      public_figure: 'from-purple-500 to-blue-500'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pb-20">
      <TopHeader />
      
      <div className="max-w-7xl mx-auto px-4 pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={32} className="text-cyan-400" />
            <h1 className="text-3xl font-bold">Verification Dashboard</h1>
          </div>
          <p className="text-gray-400">Review and approve verification requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-6 rounded-2xl">
            <div className="text-3xl font-bold text-cyan-400">{requests.length}</div>
            <div className="text-sm text-gray-400 mt-1">Pending Requests</div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <div className="text-3xl font-bold text-green-400">
              {requests.filter(r => r.accountType === 'creator').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Creators</div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <div className="text-3xl font-bold text-purple-400">
              {requests.filter(r => r.accountType === 'public_figure').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Public Figures</div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <div className="text-3xl font-bold text-blue-400">
              {requests.filter(r => r.accountType === 'business').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Businesses</div>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <CheckCircle size={64} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400">No pending verification requests at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => (
              <div key={request.id} className="glass-card p-6 rounded-2xl hover:border-cyan-400/30 transition-all">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <img
                    src={request.userInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={request.fullName}
                    className="w-16 h-16 rounded-full border-2 border-gray-700"
                  />
                  
                  {/* Request Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{request.fullName}</h3>
                          <span className="text-2xl">{getAccountTypeIcon(request.accountType)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>@{request.userInfo?.handle}</span>
                          <span>•</span>
                          <span className="capitalize">{request.accountType.replace('_', ' ')}</span>
                        </div>
                      </div>
                      
                      <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getCategoryBadgeColor(request.pageCategory)} text-white text-sm font-semibold`}>
                        {request.pageCategory?.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-300">{request.email}</span>
                      </div>
                      {request.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-gray-300">{request.phone}</span>
                        </div>
                      )}
                      {request.websiteUrl && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe size={16} className="text-gray-500" />
                          <a href={request.websiteUrl} target="_blank" rel="noopener noreferrer" 
                             className="text-cyan-400 hover:underline">
                            {request.websiteUrl}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-gray-300">
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* About Text */}
                    {request.aboutText && (
                      <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-300 line-clamp-2">{request.aboutText}</p>
                      </div>
                    )}
                    
                    {/* Documents */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {request.aadhaarCardUrl && (
                        <a href={request.aadhaarCardUrl} target="_blank" rel="noopener noreferrer"
                           className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs flex items-center gap-1 hover:bg-blue-500/30 transition-colors">
                          <FileText size={14} />
                          Aadhaar Card
                        </a>
                      )}
                      {request.selfieUrl && (
                        <a href={request.selfieUrl} target="_blank" rel="noopener noreferrer"
                           className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs flex items-center gap-1 hover:bg-purple-500/30 transition-colors">
                          <User size={14} />
                          Selfie
                        </a>
                      )}
                      {request.businessRegistrationDocUrl && (
                        <a href={request.businessRegistrationDocUrl} target="_blank" rel="noopener noreferrer"
                           className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs flex items-center gap-1 hover:bg-green-500/30 transition-colors">
                          <FileText size={14} />
                          Business Doc
                        </a>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => openReviewModal(request, 'approved')}
                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle size={18} />
                        Approve
                      </button>
                      <button
                        onClick={() => openReviewModal(request, 'rejected')}
                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <X size={18} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">
                {reviewAction === 'approved' ? 'Approve' : 'Reject'} Verification
              </h3>
              <button
                onClick={() => setReviewModal(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={selectedRequest.userInfo?.avatar}
                  alt={selectedRequest.fullName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-bold text-lg">{selectedRequest.fullName}</div>
                  <div className="text-sm text-gray-400">@{selectedRequest.userInfo?.handle}</div>
                </div>
              </div>
            </div>
            
            {reviewAction === 'rejected' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white h-24 resize-none"
                  placeholder="Explain why this request is being rejected..."
                  required
                />
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white h-20 resize-none"
                placeholder="Internal notes..."
              />
            </div>
            
            {reviewAction === 'approved' && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-400 mt-0.5" />
                  <div className="text-sm text-green-300">
                    <p className="font-semibold mb-1">Approval will:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Grant verified badge to the user</li>
                      <li>Create a special Page for the account</li>
                      <li>Update account type to {selectedRequest.accountType}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setReviewModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={submitting || (reviewAction === 'rejected' && !rejectionReason)}
                className={`flex-1 py-3 ${
                  reviewAction === 'approved' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? 'Processing...' : `Confirm ${reviewAction === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default AdminVerificationDashboard;
