import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const SimpleAvatarUploadModal = ({ user, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  
  const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload file
      console.log('🔄 Uploading file...');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await axios.post(`${API}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const avatarUrl = uploadRes.data.url;
      console.log('✅ Uploaded:', avatarUrl);

      // Step 2: Update profile
      console.log('💾 Updating profile...');
      await axios.put(`${API}/api/users/${user.id}/profile`, {
        avatar: avatarUrl,
      });

      console.log('✅ Profile updated!');
      toast.success('Profile picture updated!');
      
      // Call success callback
      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('❌ Error:', error);
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border-2 border-cyan-400/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upload Profile Picture</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src={preview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.handle || 'user'}`}
              alt="Preview"
              className="w-32 h-32 rounded-full object-cover border-4 border-cyan-400"
            />
            {selectedFile && (
              <div className="absolute -top-2 -right-2 bg-green-500 w-8 h-8 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <label className="block w-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-full px-4 py-3 rounded-lg bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 transition-colors cursor-pointer text-center font-medium flex items-center justify-center gap-2">
              <Upload size={20} />
              {selectedFile ? 'Change Photo' : 'Select Photo'}
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Max 5MB • JPG, PNG, GIF, WebP
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border-2 border-gray-600 text-gray-300 hover:bg-gray-800/50 transition-colors font-medium"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleAvatarUploadModal;
