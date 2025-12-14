import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { CheckCircle, X, Eye, FileText, User, Mail, Phone, Globe, AlertCircle, Clock, Shield, ZoomIn, ZoomOut, Maximize2, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';

const ADMIN_EMAIL = 'loopyncpvt@gmail.com';

// Image Preview Modal Component
const ImagePreviewModal = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [zoom, setZoom] = useState(1);
  
  const currentImage = images[currentIndex];
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };
  
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 0.5));
  
  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex items-center gap-4">
          <span className="text-white font-medium">{currentImage?.label}</span>
          <span className="text-gray-400 text-sm">{currentIndex + 1} / {images.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            disabled={zoom <= 0.5}
          >
            <ZoomOut size={20} className="text-white" />
          </button>
          <span className="text-white text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            disabled={zoom >= 3}
          >
            <ZoomIn size={20} className="text-white" />
          </button>
          <a
            href={currentImage?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-800 rounded-full transition-colors ml-2"
          >
            <Maximize2 size={20} className="text-white" />
          </a>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors ml-2"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>
      
      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}
        
        <div className="max-w-full max-h-full overflow-auto p-4">
          <img
            src={currentImage?.url?.startsWith('/uploads') ? `${API.replace('/api', '')}${currentImage.url}` : currentImage?.url}
            alt={currentImage?.label}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-w-full max-h-[80vh] object-contain transition-transform duration-200 rounded-lg"
          />
        </div>
        
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}
      </div>
      
      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-3 p-4 bg-black/50">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => { setCurrentIndex(index); setZoom(1); }}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-cyan-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.url?.startsWith('/uploads') ? `${API.replace('/api', '')}${img.url}` : img.url}
                alt={img.label}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Document Thumbnail Component
const DocumentThumbnail = ({ url, label, icon: Icon, colorClass, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fullUrl = url?.startsWith('/uploads') ? `${API.replace('/api', '')}${url}` : url;
  
  return (
    <button
      onClick={onClick}
      className={`relative group rounded-xl overflow-hidden border-2 ${colorClass} transition-all hover:scale-105 hover:shadow-lg`}
    >
      {!error ? (
        <>
          <img
            src={fullUrl}
            alt={label}
            className={`w-24 h-24 object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
            </div>
          )}
        </>
      ) : (
        <div className="w-24 h-24 flex items-center justify-center bg-gray-800">
          <Icon size={24} className="text-gray-500" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Eye size={24} className="text-white" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
        <span className="text-[10px] text-white font-medium">{label}</span>
      </div>
    </button>
  );
};

const AdminVerificationDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState({ show: false, images: [], index: 0 });
  
  // Helper to get document images for preview
  const getDocumentImages = (request) => {
    const images = [];
    if (request.aadhaarCardUrl) {
      images.push({ url: request.aadhaarCardUrl, label: 'Aadhaar Card / ID Document' });
    }
    if (request.selfieUrl) {
      images.push({ url: request.selfieUrl, label: 'Selfie with Document' });
    }
    if (request.businessRegistrationDocUrl) {
      images.push({ url: request.businessRegistrationDocUrl, label: 'Business Registration' });
    }
    return images;
  };
  
  const openImagePreview = (request, startIndex = 0) => {
    const images = getDocumentImages(request);
    if (images.length > 0) {
      setImagePreview({ show: true, images, index: startIndex });
    }
  };

  useEffect(() => {
    // Check if user is the admin
    const user = JSON.parse(localStorage.getItem('loopync_user') || '{}');
    if (user.email !== ADMIN_EMAIL) {
      toast.error('Access denied. Admin only.');
      navigate('/profile');
      return;
    }
    fetchPendingRequests();
  }, [navigate]);

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
      
      if (reviewAction === 'approved') {
        toast.success('✅ Verification approved! User will see badge after re-login.', { duration: 5000 });
      } else {
        toast.success('Verification rejected');
      }
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
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
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
                    
                    {/* Documents - Inline Image Previews */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Image size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Verification Documents</span>
                      </div>
                      
                      {(request.aadhaarCardUrl || request.selfieUrl || request.businessRegistrationDocUrl) ? (
                        <div className="flex flex-wrap gap-3">
                          {request.aadhaarCardUrl && (
                            <DocumentThumbnail
                              url={request.aadhaarCardUrl}
                              label="Aadhaar/ID"
                              icon={FileText}
                              colorClass="border-blue-500/50 hover:border-blue-400"
                              onClick={() => openImagePreview(request, 0)}
                            />
                          )}
                          {request.selfieUrl && (
                            <DocumentThumbnail
                              url={request.selfieUrl}
                              label="Selfie"
                              icon={User}
                              colorClass="border-purple-500/50 hover:border-purple-400"
                              onClick={() => openImagePreview(request, request.aadhaarCardUrl ? 1 : 0)}
                            />
                          )}
                          {request.businessRegistrationDocUrl && (
                            <DocumentThumbnail
                              url={request.businessRegistrationDocUrl}
                              label="Business Doc"
                              icon={FileText}
                              colorClass="border-green-500/50 hover:border-green-400"
                              onClick={() => openImagePreview(request, getDocumentImages(request).length - 1)}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No documents uploaded</div>
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
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center gap-3 mb-4">
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
              
              {/* Document Previews in Review Modal */}
              {(selectedRequest.aadhaarCardUrl || selectedRequest.selfieUrl || selectedRequest.businessRegistrationDocUrl) && (
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Image size={16} className="text-cyan-400" />
                    <span className="text-sm font-medium text-gray-300">Submitted Documents</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedRequest.aadhaarCardUrl && (
                      <DocumentThumbnail
                        url={selectedRequest.aadhaarCardUrl}
                        label="Aadhaar/ID"
                        icon={FileText}
                        colorClass="border-blue-500/50 hover:border-blue-400"
                        onClick={() => openImagePreview(selectedRequest, 0)}
                      />
                    )}
                    {selectedRequest.selfieUrl && (
                      <DocumentThumbnail
                        url={selectedRequest.selfieUrl}
                        label="Selfie"
                        icon={User}
                        colorClass="border-purple-500/50 hover:border-purple-400"
                        onClick={() => openImagePreview(selectedRequest, selectedRequest.aadhaarCardUrl ? 1 : 0)}
                      />
                    )}
                    {selectedRequest.businessRegistrationDocUrl && (
                      <DocumentThumbnail
                        url={selectedRequest.businessRegistrationDocUrl}
                        label="Business Doc"
                        icon={FileText}
                        colorClass="border-green-500/50 hover:border-green-400"
                        onClick={() => openImagePreview(selectedRequest, getDocumentImages(selectedRequest).length - 1)}
                      />
                    )}
                  </div>
                </div>
              )}
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
