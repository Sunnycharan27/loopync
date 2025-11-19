import React, { useState, useEffect, useContext } from 'react';
import { API, AuthContext } from '../App';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, Share2, Eye, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const params = currentUser ? `?userId=${currentUser.id}` : '';
      const res = await axios.get(`${API}/videos/${videoId}${params}`);
      setVideo(res.data);
    } catch (error) {
      toast.error('Video not found');
      navigate('/videos');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please login to like videos');
      navigate('/auth');
      return;
    }

    try {
      const res = await axios.post(`${API}/videos/${videoId}/like?userId=${currentUser.id}`);
      setVideo({...video, isLiked: res.data.liked, likes: res.data.liked ? video.likes + 1 : video.likes - 1});
    } catch (error) {
      toast.error('Failed to like video');
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser) {
      toast.error('Please login to subscribe');
      navigate('/auth');
      return;
    }

    try {
      await axios.post(`${API}/channels/${video.channelId}/subscribe?userId=${currentUser.id}`);
      toast.success('Subscribed!');
      fetchVideo();
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to comment');
      navigate('/auth');
      return;
    }

    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      await axios.post(`${API}/videos/${videoId}/comments?userId=${currentUser.id}`, {
        text: comment
      });
      setComment('');
      toast.success('Comment added!');
      fetchVideo();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        <video
          src={video.videoUrl}
          controls
          autoPlay
          className="w-full h-full"
          poster={video.thumbnailUrl}
        />
        <button
          onClick={() => navigate('/videos')}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-2">{video.title}</h1>
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {formatViews(video.views)} views
          </span>
          <span>•</span>
          <span>{new Date(video.publishedAt || video.uploadedAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              video.isLiked
                ? 'bg-cyan-400 text-black'
                : 'glass-surface text-white'
            }`}
          >
            <ThumbsUp size={18} />
            {video.likes > 0 && <span className="font-semibold">{formatViews(video.likes)}</span>}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full glass-surface text-white">
            <Share2 size={18} />
            Share
          </button>
        </div>

        {/* Channel Info */}
        {video.channel && (
          <div className="glass-surface rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => navigate(`/channels/${video.channelId}`)}
              >
                <img src={video.channel.avatar} alt="" className="w-12 h-12 rounded-full" />
                <div>
                  <h3 className="text-white font-semibold">{video.channel.name}</h3>
                  <p className="text-gray-400 text-sm">{formatViews(video.channel.subscribers)} subscribers</p>
                </div>
              </div>
              <button
                onClick={handleSubscribe}
                className="px-6 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
              >
                Subscribe
              </button>
            </div>

            {video.description && (
              <p className="text-gray-300 text-sm mt-4 leading-relaxed">{video.description}</p>
            )}
          </div>
        )}

        {/* Comments */}
        <div className="glass-surface rounded-xl p-4">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MessageCircle size={20} />
            Comments ({video.commentCount})
          </h2>

          {/* Add Comment */}
          {currentUser && (
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex gap-3">
                <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setComment('')}
                      className="px-4 py-1 text-sm text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!comment.trim() || submittingComment}
                      className="px-4 py-1 text-sm rounded-full bg-cyan-400 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {video.comments && video.comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <img src={comment.userAvatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-semibold">{comment.userName}</span>
                    <span className="text-gray-500 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;