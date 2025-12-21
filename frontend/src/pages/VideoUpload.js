import React, { useState, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Film, X } from 'lucide-react';
import { toast } from 'sonner';

const VideoUpload = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [video, setVideo] = useState({
    title: '',
    description: '',
    category: 'Education',
    videoUrl: '',
    thumbnailUrl: '',
    visibility: 'public'
  });

  const categories = ['Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'News', 'Tech', 'Lifestyle'];

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      toast.info('Uploading video... This may take a while');
      const res = await axios.post(`${API}/upload`, formData);
      const videoUrl = `${process.env.REACT_APP_BACKEND_URL}${res.data.url}`;
      setVideo({...video, videoUrl});
      toast.success('Video uploaded!');
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/upload`, formData);
      const thumbnailUrl = `${process.env.REACT_APP_BACKEND_URL}${res.data.url}`;
      setVideo({...video, thumbnailUrl});
      toast.success('Thumbnail uploaded!');
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!video.title || !video.videoUrl) {
      toast.error('Please provide title and upload video');
      return;
    }

    try {
      await axios.post(`${API}/videos/upload?userId=${currentUser.id}`, {
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        category: video.category,
        visibility: video.visibility,
        duration: 0,
        tags: []
      });
      
      toast.success('Video published successfully! 🎉');
      navigate('/videos');
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || 'Failed to publish video');
      toast.error(errorMsg);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-center">
          <p className="text-white mb-4">Please login to upload videos</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4 flex items-center justify-between">
        <button onClick={() => navigate('/videos')} className="text-cyan-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Upload Video</h1>
        <div className="w-6" />
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video Upload */}
          <div className="glass-surface rounded-xl p-4">
            <h2 className="text-white font-semibold mb-3">Video File</h2>
            {video.videoUrl ? (
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <video src={video.videoUrl} controls className="w-full h-full" />
                <button
                  type="button"
                  onClick={() => setVideo({...video, videoUrl: ''})}
                  className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="aspect-video border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-3"></div>
                    <p className="text-gray-400">Uploading video...</p>
                  </div>
                ) : (
                  <>
                    <Film className="text-gray-400 mb-3" size={48} />
                    <p className="text-gray-400">Click to upload video</p>
                    <p className="text-gray-500 text-sm">MP4, MOV, AVI up to 500MB</p>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Thumbnail */}
          <div className="glass-surface rounded-xl p-4">
            <h2 className="text-white font-semibold mb-3">Thumbnail</h2>
            {video.thumbnailUrl ? (
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setVideo({...video, thumbnailUrl: ''})}
                  className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="aspect-video border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                <Upload className="text-gray-400 mb-3" size={32} />
                <p className="text-gray-400 text-sm">Upload thumbnail</p>
              </label>
            )}
          </div>

          {/* Details */}
          <div className="glass-surface rounded-xl p-4 space-y-3">
            <div>
              <label className="text-white font-semibold mb-2 block">Title *</label>
              <input
                type="text"
                value={video.title}
                onChange={(e) => setVideo({...video, title: e.target.value})}
                placeholder="Enter video title"
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="text-white font-semibold mb-2 block">Description</label>
              <textarea
                value={video.description}
                onChange={(e) => setVideo({...video, description: e.target.value})}
                placeholder="Tell viewers about your video"
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div>
              <label className="text-white font-semibold mb-2 block">Category</label>
              <select
                value={video.category}
                onChange={(e) => setVideo({...video, category: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-white font-semibold mb-2 block">Visibility</label>
              <select
                value={video.visibility}
                onChange={(e) => setVideo({...video, visibility: e.target.value})}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!video.videoUrl || !video.title}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Publish Video
          </button>
        </form>
      </div>
    </div>
  );
};

export default VideoUpload;
