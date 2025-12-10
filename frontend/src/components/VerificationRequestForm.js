import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import { CheckCircle, Upload, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const VerificationRequestForm = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Account Type, 2: Details, 3: Documents
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    accountType: 'creator',
    fullName: '',
    email: '',
    phone: '',
    websiteUrl: '',
    socialMediaLinks: [],
    businessName: '',
    businessRegistrationNumber: '',
    pageCategory: 'influencer',
    aboutText: ''
  });
  
  const [files, setFiles] = useState({
    aadhaar: null,
    selfie: null,
    businessReg: null
  });
  
  const [uploadedUrls, setUploadedUrls] = useState({
    aadhaar: null,
    selfie: null,
    businessReg: null
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };
  
  const uploadDocument = async (type, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', type);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/verification/upload-document?document_type=${type}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.fileUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
      return null;
    }
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Upload documents first if provided
      if (files.aadhaar) {
        const url = await uploadDocument('aadhaar', files.aadhaar);
        if (url) setUploadedUrls(prev => ({ ...prev, aadhaar: url }));
      }
      
      if (files.selfie) {
        const url = await uploadDocument('selfie', files.selfie);
        if (url) setUploadedUrls(prev => ({ ...prev, selfie: url }));
      }
      
      if (files.businessReg && formData.accountType === 'business') {
        const url = await uploadDocument('business_registration', files.businessReg);
        if (url) setUploadedUrls(prev => ({ ...prev, businessReg: url }));
      }
      
      // Submit verification request
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/verification/request`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast.success('Verification request submitted!');
      onSuccess && onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Verification request error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Select Account Type</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setFormData(prev => ({ ...prev, accountType: 'creator' }))}
          className={`p-6 rounded-2xl border-2 transition-all ${
            formData.accountType === 'creator'
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="text-4xl mb-2">🎨</div>
          <div className="font-bold text-white">Creator</div>
          <div className="text-sm text-gray-400 mt-1">For content creators</div>
        </button>
        
        <button
          onClick={() => setFormData(prev => ({ ...prev, accountType: 'public_figure' }))}
          className={`p-6 rounded-2xl border-2 transition-all ${
            formData.accountType === 'public_figure'
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="text-4xl mb-2">⭐</div>
          <div className="font-bold text-white">Public Figure</div>
          <div className="text-sm text-gray-400 mt-1">Celebrity, Influencer, Politician</div>
        </button>
        
        <button
          onClick={() => setFormData(prev => ({ ...prev, accountType: 'business' }))}
          className={`p-6 rounded-2xl border-2 transition-all ${
            formData.accountType === 'business'
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="text-4xl mb-2">🏢</div>
          <div className="font-bold text-white">Business</div>
          <div className="text-sm text-gray-400 mt-1">Company, Brand, Organization</div>
        </button>
      </div>
      
      <button
        onClick={() => setStep(2)}
        className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors"
      >
        Continue
      </button>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Account Details</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full Name {formData.accountType === 'business' ? '/ Business Name' : ''}
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
          placeholder="Enter your full name"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
          placeholder="your@email.com"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
          placeholder="+91 XXXXX XXXXX"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
        <select
          name="pageCategory"
          value={formData.pageCategory}
          onChange={handleInputChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
        >
          <option value="influencer">Influencer</option>
          <option value="celebrity">Celebrity</option>
          <option value="politician">Politician</option>
          <option value="company">Company</option>
          <option value="brand">Brand</option>
          <option value="media">Media</option>
          <option value="organization">Organization</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Website URL (Optional)</label>
        <input
          type="url"
          name="websiteUrl"
          value={formData.websiteUrl}
          onChange={handleInputChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white"
          placeholder="https://yourwebsite.com"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">About</label>
        <textarea
          name="aboutText"
          value={formData.aboutText}
          onChange={handleInputChange}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white h-24 resize-none"
          placeholder="Tell us about yourself/your business..."
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Upload Documents</h3>
      
      <div className="space-y-4">
        {/* Aadhaar Card */}
        <div className="border border-gray-700 rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Aadhaar Card <span className="text-red-400">*</span>
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange('aadhaar', e.target.files[0])}
            className="w-full text-sm text-gray-400"
          />
          {files.aadhaar && (
            <div className="mt-2 text-sm text-cyan-400">
              ✓ {files.aadhaar.name}
            </div>
          )}
        </div>
        
        {/* Selfie with Aadhaar */}
        <div className="border border-gray-700 rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Selfie with Aadhaar <span className="text-red-400">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange('selfie', e.target.files[0])}
            className="w-full text-sm text-gray-400"
          />
          {files.selfie && (
            <div className="mt-2 text-sm text-cyan-400">
              ✓ {files.selfie.name}
            </div>
          )}
        </div>
        
        {/* Business Registration (if business account) */}
        {formData.accountType === 'business' && (
          <div className="border border-gray-700 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Registration Document
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange('businessReg', e.target.files[0])}
              className="w-full text-sm text-gray-400"
            />
            {files.businessReg && (
              <div className="mt-2 text-sm text-cyan-400">
                ✓ {files.businessReg.name}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex gap-2 items-start">
          <AlertCircle size={20} className="text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Verification Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Clear photo of Aadhaar card (both sides)</li>
              <li>Selfie holding Aadhaar card (face clearly visible)</li>
              <li>All details must match</li>
              <li>Review typically takes 24-48 hours</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => setStep(2)}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !files.aadhaar || !files.selfie}
          className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Request Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-cyan-500' : 'bg-gray-700'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-cyan-500' : 'bg-gray-700'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                3
              </div>
            </div>
          </div>
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default VerificationRequestForm;
