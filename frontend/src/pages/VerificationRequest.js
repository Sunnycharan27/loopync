import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, API } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft, BadgeCheck, Upload, User, Building2, Star,
  FileText, Camera, Globe, Link2, CheckCircle, AlertCircle
} from 'lucide-react';
import BottomNav from '../components/BottomNav';

const VerificationRequest = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    websiteUrl: '',
    socialMediaLinks: [],
    businessName: '',
    businessRegistrationNumber: '',
    pageCategory: '',
    aboutText: ''
  });
  
  const [documents, setDocuments] = useState({
    aadhaarCard: null,
    selfie: null,
    businessDoc: null
  });
  
  const [uploadingDoc, setUploadingDoc] = useState('');
  const fileInputRef = useRef(null);
  const [currentDocType, setCurrentDocType] = useState('');

  const accountTypes = [
    {
      id: 'public_figure',
      title: 'Public Figure',
      description: 'Celebrities, influencers, politicians, and other notable individuals',
      icon: Star,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'business',
      title: 'Business / Brand',
      description: 'Companies, brands, and organizations',
      icon: Building2,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'creator',
      title: 'Creator',
      description: 'Content creators, artists, and digital professionals',
      icon: User,
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const pageCategories = [
    'Celebrity', 'Influencer', 'Politician', 'Company', 
    'Brand', 'Media', 'Organization', 'Public Figure'
  ];

  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setDocuments(prev => ({
        ...prev,
        [docType]: res.data.url
      }));
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc('');
    }
  };

  const triggerFileInput = (docType) => {
    setCurrentDocType(docType);
    fileInputRef.current?.click();
  };

  const handleSocialMediaLink = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const link = e.target.value.trim();
      if (!formData.socialMediaLinks.includes(link)) {
        setFormData(prev => ({
          ...prev,
          socialMediaLinks: [...prev.socialMediaLinks, link]
        }));
      }
      e.target.value = '';
    }
  };

  const removeSocialLink = (link) => {
    setFormData(prev => ({
      ...prev,
      socialMediaLinks: prev.socialMediaLinks.filter(l => l !== link)
    }));
  };

  const handleSubmit = async () => {
    if (!accountType) {
      toast.error('Please select account type');
      return;
    }
    if (!formData.fullName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!documents.aadhaarCard) {
      toast.error('Please upload your ID document');
      return;
    }
    if (!documents.selfie) {
      toast.error('Please upload a selfie with your ID');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        userId: currentUser.id,
        accountType,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        aadhaarCardUrl: documents.aadhaarCard,
        selfieUrl: documents.selfie,
        websiteUrl: formData.websiteUrl,
        socialMediaLinks: formData.socialMediaLinks,
        businessName: formData.businessName,
        businessRegistrationNumber: formData.businessRegistrationNumber,
        businessRegistrationDocUrl: documents.businessDoc,
        pageCategory: formData.pageCategory,
        aboutText: formData.aboutText
      };

      await axios.post(`${API}/verification/request`, requestData);
      
      toast.success('Verification request submitted successfully!');
      setStep(4); // Success step
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-center">
          <p className="text-white text-lg mb-4">Please login to request verification</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-cyan-400 text-black font-semibold rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-purple-800/30" style={{ background: 'rgba(15, 2, 30, 0.95)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white hover:text-cyan-400 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <BadgeCheck size={24} className="text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Get Verified</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step >= s 
                  ? 'bg-cyan-400 text-black' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-1 rounded ${
                  step > s ? 'bg-cyan-400' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Account Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select Account Type</h2>
              <p className="text-gray-400">Choose the category that best describes you</p>
            </div>

            <div className="space-y-4">
              {accountTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAccountType(type.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    accountType === type.id
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${type.color}`}>
                      <type.icon size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{type.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{type.description}</p>
                    </div>
                    {accountType === type.id && (
                      <CheckCircle size={24} className="text-cyan-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => accountType && setStep(2)}
              disabled={!accountType}
              className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
              <p className="text-gray-400">Provide your details for verification</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Legal Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter your phone number"
                />
              </div>

              {accountType === 'business' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Business Name *</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Registration Number</label>
                    <input
                      type="text"
                      value={formData.businessRegistrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessRegistrationNumber: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="GST/CIN/Registration number"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={formData.pageCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, pageCategory: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="">Select category</option>
                  {pageCategories.map(cat => (
                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Website URL</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Social Media Links</label>
                <div className="relative">
                  <Link2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="url"
                    onKeyDown={handleSocialMediaLink}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Paste link and press Enter"
                  />
                </div>
                {formData.socialMediaLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.socialMediaLinks.map((link, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm flex items-center gap-2"
                      >
                        {new URL(link).hostname}
                        <button onClick={() => removeSocialLink(link)} className="text-red-400 hover:text-red-300">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">About / Bio</label>
                <textarea
                  value={formData.aboutText}
                  onChange={(e) => setFormData(prev => ({ ...prev, aboutText: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[100px]"
                  placeholder="Tell us about yourself or your organization"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Document Upload */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Document Verification</h2>
              <p className="text-gray-400">Upload documents to verify your identity</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => handleDocumentUpload(e, currentDocType)}
            />

            <div className="space-y-4">
              {/* ID Document */}
              <div
                onClick={() => triggerFileInput('aadhaarCard')}
                className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  documents.aadhaarCard
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 hover:border-cyan-400 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${documents.aadhaarCard ? 'bg-green-500' : 'bg-gray-700'}`}>
                    {uploadingDoc === 'aadhaarCard' ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white" />
                    ) : documents.aadhaarCard ? (
                      <CheckCircle size={24} className="text-white" />
                    ) : (
                      <FileText size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Government ID *</h3>
                    <p className="text-gray-400 text-sm">
                      {documents.aadhaarCard ? 'Document uploaded' : 'Aadhaar, PAN, Passport, or Driving License'}
                    </p>
                  </div>
                  <Upload size={20} className="text-gray-400" />
                </div>
              </div>

              {/* Selfie with ID */}
              <div
                onClick={() => triggerFileInput('selfie')}
                className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  documents.selfie
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 hover:border-cyan-400 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${documents.selfie ? 'bg-green-500' : 'bg-gray-700'}`}>
                    {uploadingDoc === 'selfie' ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white" />
                    ) : documents.selfie ? (
                      <CheckCircle size={24} className="text-white" />
                    ) : (
                      <Camera size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Selfie with ID *</h3>
                    <p className="text-gray-400 text-sm">
                      {documents.selfie ? 'Photo uploaded' : 'Clear photo holding your ID document'}
                    </p>
                  </div>
                  <Upload size={20} className="text-gray-400" />
                </div>
              </div>

              {/* Business Document (optional for business accounts) */}
              {accountType === 'business' && (
                <div
                  onClick={() => triggerFileInput('businessDoc')}
                  className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    documents.businessDoc
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 hover:border-cyan-400 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${documents.businessDoc ? 'bg-green-500' : 'bg-gray-700'}`}>
                      {uploadingDoc === 'businessDoc' ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white" />
                      ) : documents.businessDoc ? (
                        <CheckCircle size={24} className="text-white" />
                      ) : (
                        <Building2 size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">Business Registration</h3>
                      <p className="text-gray-400 text-sm">
                        {documents.businessDoc ? 'Document uploaded' : 'GST certificate or registration document'}
                      </p>
                    </div>
                    <Upload size={20} className="text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-yellow-500 font-semibold text-sm">Important</p>
                  <p className="text-gray-400 text-sm">
                    Your documents will be reviewed by our team within 2-5 business days. 
                    We will notify you once your verification is approved.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !documents.aadhaarCard || !documents.selfie}
                className="flex-1 py-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <BadgeCheck size={20} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Your verification request has been submitted successfully. 
              Our team will review your application and notify you within 2-5 business days.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/profile')}
                className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl transition-colors"
              >
                Back to Profile
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="profile" />
    </div>
  );
};

export default VerificationRequest;
