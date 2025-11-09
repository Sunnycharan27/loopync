import React, { useState, useEffect, useRef } from 'react';
import { X, Image, Video, Film, Upload, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const MediaSelectorModal = ({ user, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'upload'
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserMedia();
  }, [user.id]);

  const fetchUserMedia = async () => {
    try {
      setLoading(true);
      
      // Fetch posts, reels, and vibe capsules with media
      const [postsRes, reelsRes, capsulesRes] = await Promise.all([
        axios.get(`${API}/posts`).catch(() => ({ data: [] })),
        axios.get(`${API}/reels`).catch(() => ({ data: [] })),
        axios.get(`${API}/vibe-capsules/${user.id}`).catch(() => ({ data: [] }))
      ]);

      // Filter and format media
      const allMedia = [];

      // Posts with media
      if (postsRes.data) {
        const postsWithMedia = postsRes.data
          .filter(p => p.authorId === user.id && p.mediaUrl)
          .map(p => ({
            id: p.id,
            url: p.mediaUrl,
            type: p.mediaUrl.includes('.mp4') || p.mediaUrl.includes('video') ? 'video' : 'image',
            source: 'post',
            timestamp: p.createdAt
          }));
        allMedia.push(...postsWithMedia);
      }

      // Reels
      if (reelsRes.data) {
        const userReels = reelsRes.data
          .filter(r => r.authorId === user.id && r.videoUrl)
          .map(r => ({
            id: r.id,
            url: r.videoUrl,
            type: 'video',
            source: 'reel',
            timestamp: r.createdAt
          }));
        allMedia.push(...userReels);
      }

      // Vibe Capsules
      if (capsulesRes.data) {
        const userCapsules = capsulesRes.data
          .filter(c => c.mediaUrl)
          .map(c => ({
            id: c.id,
            url: c.mediaUrl,
            type: c.mediaUrl.includes('.mp4') || c.mediaUrl.includes('video') ? 'video' : 'image',
            source: 'capsule',
            timestamp: c.createdAt
          }));
        allMedia.push(...userCapsules);
      }

      // Sort by timestamp (most recent first)
      allMedia.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setMedia(allMedia);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia.url);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (150MB limit)
    if (file.size > 150 * 1024 * 1024) {
      toast.error('File size must be less than 150MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const mediaUrl = uploadRes.data.url;
      toast.success('Image uploaded successfully!');
      onSelect(mediaUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/')) return `${API}${url}`;
    return url;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-cyan-400/20 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Profile Picture</h2>
              <p className="text-gray-400 text-sm mt-1">Upload new or choose existing</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Upload New
            </button>
            <button
              onClick={() => setActiveTab('existing')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'existing'
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Image size={16} className="inline mr-2" />
              Your Media
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' ? (
            // Upload Tab
            <div className="flex flex-col items-center justify-center h-full py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {uploadPreview ? (
                <div className="w-full max-w-md">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 border-2 border-cyan-400">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 rounded-xl border-2 border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-all"
                  >
                    Choose Different Image
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full max-w-md aspect-square rounded-2xl border-2 border-dashed border-gray-600 hover:border-cyan-400 transition-all cursor-pointer group"
                >
                  <Plus size={64} className="text-gray-600 group-hover:text-cyan-400 transition-colors mb-4" />
                  <p className="text-lg font-semibold text-gray-300 group-hover:text-white transition-colors">
                    Upload New Image
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG, GIF or WebP • Max 150MB
                  </p>
                </button>
              )}
            </div>
          ) : (
            // Existing Media Tab
            <>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
                </div>
              ) : media.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Image size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">No media found</p>
                  <p className="text-sm mt-2">Upload a post, reel, or story with media first</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {media.map((item) => (
                    <button
                      key={`${item.source}-${item.id}`}
                      onClick={() => setSelectedMedia(item)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                        selectedMedia?.id === item.id && selectedMedia?.source === item.source
                          ? 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-400/50'
                          : 'ring-2 ring-gray-700 hover:ring-cyan-400/50'
                      }`}
                    >
                      {item.type === 'video' ? (
                        <>
                          <video
                            src={getMediaUrl(item.url)}
                            className="w-full h-full object-cover"
                            muted
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Film size={32} className="text-white opacity-80" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={getMediaUrl(item.url)}
                          alt="Media"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`;
                          }}
                        />
                      )}
                      
                      {/* Source badge */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-semibold text-white">
                        {item.source === 'post' && '📝'}
                        {item.source === 'reel' && '🎬'}
                        {item.source === 'capsule' && '⚡'}
                      </div>
                      
                      {/* Selection indicator */}
                      {selectedMedia?.id === item.id && selectedMedia?.source === item.source && (
                        <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center">
                            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedMedia}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/20"
          >
            Set as Profile Picture
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaSelectorModal;
