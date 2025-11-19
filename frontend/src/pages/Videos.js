import React, { useState, useEffect } from 'react';
import { API } from '../App';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, ThumbsUp, Upload, Radio } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '../components/BottomNav';

const Videos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['All', 'Education', 'Entertainment', 'Music', 'Gaming', 'Sports', 'News', 'Tech'];

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      
      const res = await axios.get(`${API}/videos/feed?${params.toString()}`);
      setVideos(res.data);
    } catch (error) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 glass-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">🎥 Videos</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/livestreams')}
              className="p-2 rounded-full bg-red-500/20 text-red-400"
            >
              <Radio size={20} />
            </button>
            <button
              onClick={() => navigate('/video-upload')}
              className="p-2 rounded-full bg-cyan-400 text-black"
            >
              <Upload size={20} />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                (cat === 'All' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-cyan-400 text-black font-semibold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Feed */}
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <Play size={64} className="text-gray-600 mx-auto mb-4" />
            <p className="mb-4">No videos yet</p>
            <button
              onClick={() => navigate('/video-upload')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold"
            >
              Upload Your First Video
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map(video => (
              <div
                key={video.id}
                onClick={() => navigate(`/videos/watch/${video.id}`)}
                className="glass-surface rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={48} className="text-gray-600" />
                    </div>
                  )}
                  {video.duration > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-semibold">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex gap-3">
                    {video.channel?.avatar && (
                      <img src={video.channel.avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold line-clamp-2 mb-1">{video.title}</h3>
                      <p className="text-gray-400 text-sm">{video.channel?.name}</p>
                      <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {formatViews(video.views)} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} />
                          {formatViews(video.likes)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Videos;