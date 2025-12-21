import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, UserMinus, Settings, Image, Video, Send, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import PostCard from "../components/PostCard";
import { getMediaUrl } from "../utils/mediaUtils";
import BottomNav from "../components/BottomNav";

// Helper to extract error message
const getErrorMsg = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (detail?.msg) return detail.msg;
  return error?.message || "An error occurred";
};

const TribeDetail = () => {
  const { tribeId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tribe, setTribe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (tribeId) {
      fetchTribeDetails();
    }
  }, [tribeId]);

  const fetchTribeDetails = async () => {
    setLoading(true);
    try {
      const tribeRes = await axios.get(`${API}/tribes/${tribeId}`);
      setTribe(tribeRes.data);
      
      // Fetch posts only if user is a member
      const members = tribeRes.data?.members || [];
      if (currentUser && members.includes(currentUser.id)) {
        try {
          const postsRes = await axios.get(`${API}/tribes/${tribeId}/posts`);
          setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        } catch (postError) {
          console.error("Failed to fetch posts:", postError);
          setPosts([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tribe:", error);
      toast.error(getErrorMsg(error) || "Failed to load tribe");
    } finally {
      setLoading(false);
    }
  };

  const joinTribe = async () => {
    if (!currentUser) {
      toast.error("Please login to join");
      navigate('/auth');
      return;
    }
    
    setJoining(true);
    try {
      await axios.post(`${API}/tribes/${tribeId}/join?userId=${currentUser.id}`);
      toast.success("Joined tribe!");
      setTribe({
        ...tribe,
        members: [...(tribe.members || []), currentUser.id],
        memberCount: (tribe.memberCount || 0) + 1
      });
      // Fetch posts after joining
      fetchTribeDetails();
    } catch (error) {
      console.error("Failed to join:", error);
      toast.error(getErrorMsg(error) || "Failed to join tribe");
    } finally {
      setJoining(false);
    }
  };

  const leaveTribe = async () => {
    if (!currentUser) return;
    
    setJoining(true);
    try {
      await axios.post(`${API}/tribes/${tribeId}/leave?userId=${currentUser.id}`);
      toast.success("Left tribe");
      setTribe({
        ...tribe,
        members: (tribe.members || []).filter(m => m !== currentUser.id),
        memberCount: Math.max(0, (tribe.memberCount || 1) - 1)
      });
      setPosts([]);
    } catch (error) {
      console.error("Failed to leave:", error);
      toast.error(getErrorMsg(error) || "Failed to leave tribe");
    } finally {
      setJoining(false);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostMedia(file);
    }
  };

  const createPost = async () => {
    if (!currentUser) {
      toast.error("Please login to post");
      return;
    }

    if (!newPostText.trim() && !newPostMedia) {
      toast.error("Please add text or media");
      return;
    }

    setPosting(true);
    try {
      let mediaUrl = null;
      
      // Upload media if present
      if (newPostMedia) {
        const formData = new FormData();
        formData.append('file', newPostMedia);
        
        const uploadRes = await axios.post(`${API}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        mediaUrl = uploadRes.data.url;
      }

      // Create post in tribe
      const postData = {
        text: newPostText.trim(),
        authorId: currentUser.id,
        tribeId: tribeId,
        mediaUrl: mediaUrl
      };

      const postRes = await axios.post(`${API}/tribes/${tribeId}/posts`, postData);
      
      // Add to posts list
      const newPost = {
        ...postRes.data,
        author: currentUser
      };
      setPosts([newPost, ...posts]);
      
      // Clear form
      setNewPostText("");
      setNewPostMedia(null);
      
      toast.success("Post created!");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error(getErrorMsg(error) || "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) {
      toast.error("Please login to like");
      return;
    }
    try {
      const res = await axios.post(`${API}/posts/${postId}/like?userId=${currentUser.id}`);
      setPosts(posts.map(p => p.id === postId ? { ...p, ...res.data, likeCount: res.data.likeCount } : p));
    } catch (error) {
      toast.error(getErrorMsg(error) || "Failed to like post");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await axios.delete(`${API}/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Post deleted!");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error(getErrorMsg(error) || "Failed to delete post");
    }
  };

  const handleRepost = async (postId) => {
    if (!currentUser) {
      toast.error("Please login to repost");
      return;
    }
    try {
      await axios.post(`${API}/posts/${postId}/repost?userId=${currentUser.id}`);
      toast.success("Reposted!");
    } catch (error) {
      toast.error(getErrorMsg(error) || "Failed to repost");
    }
  };

  const members = tribe?.members || [];
  const isMember = currentUser?.id && members.includes(currentUser.id);
  const isOwner = currentUser?.id === tribe?.ownerId;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="text-center">
          <Users size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">Tribe not found</h2>
          <p className="text-gray-400 mb-4">This tribe may have been deleted or doesn't exist</p>
          <button 
            onClick={() => navigate('/tribes')} 
            className="px-6 py-2 bg-cyan-400 text-black rounded-xl font-semibold"
          >
            Browse Tribes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-surface p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/tribes')} 
              className="p-2 hover:bg-gray-800 rounded-full transition"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              {isOwner && (
                <button className="p-2 hover:bg-gray-800 rounded-full transition">
                  <Settings size={24} className="text-cyan-400" />
                </button>
              )}
              <button className="p-2 hover:bg-gray-800 rounded-full transition">
                <MoreHorizontal size={24} className="text-white" />
              </button>
            </div>
          </div>

          {/* Tribe Info */}
          <div className="flex items-start gap-4">
            <img
              src={tribe.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`}
              alt={tribe.name}
              className="w-20 h-20 rounded-2xl object-cover bg-gray-800 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white mb-1 truncate">{tribe.name}</h1>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{tribe.description || 'No description'}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Users size={16} className="text-cyan-400" />
                  {tribe.memberCount || members.length} members
                </span>
                {tribe.type && (
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    tribe.type === 'private' 
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                      : 'bg-green-500/10 text-green-400 border border-green-500/20'
                  }`}>
                    {tribe.type === 'private' ? '🔒 Private' : '🌐 Public'}
                  </span>
                )}
              </div>
              
              {/* Tags */}
              {Array.isArray(tribe.tags) && tribe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {tribe.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 rounded-full text-xs bg-cyan-400/10 text-cyan-400">
                      #{typeof tag === 'string' ? tag : ''}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Action Buttons */}
              {currentUser && (
                <div className="flex gap-2">
                  {isOwner ? (
                    <span className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 text-sm font-semibold border border-purple-500/30">
                      👑 You own this tribe
                    </span>
                  ) : isMember ? (
                    <button
                      onClick={leaveTribe}
                      disabled={joining}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition disabled:opacity-50"
                    >
                      {joining ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserMinus size={18} />
                      )}
                      Leave Tribe
                    </button>
                  ) : (
                    <button
                      onClick={joinTribe}
                      disabled={joining}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50"
                    >
                      {joining ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus size={18} />
                      )}
                      Join Tribe
                    </button>
                  )}
                </div>
              )}

              {!currentUser && (
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-2 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                >
                  Login to Join
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* Post Creation (Only for members) */}
          {isMember && (
            <div className="glass-card p-4">
              <div className="flex gap-3">
                <img
                  src={getMediaUrl(currentUser?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.handle}`}
                  alt="You"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`Share something with ${tribe.name}...`}
                    className="w-full bg-gray-800 text-white rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none border border-gray-700"
                    rows="3"
                  />
                  
                  {newPostMedia && (
                    <div className="mb-3 relative">
                      {newPostMedia.type.startsWith('video/') ? (
                        <video
                          src={URL.createObjectURL(newPostMedia)}
                          className="w-full max-h-64 object-cover rounded-xl"
                          controls
                        />
                      ) : (
                        <img
                          src={URL.createObjectURL(newPostMedia)}
                          alt="Preview"
                          className="w-full max-h-64 object-cover rounded-xl"
                        />
                      )}
                      <button
                        onClick={() => setNewPostMedia(null)}
                        className="absolute top-2 right-2 px-3 py-1 bg-black/70 text-white rounded-lg text-sm hover:bg-black transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <label className="p-2 hover:bg-gray-800 rounded-full cursor-pointer transition">
                        <Image size={20} className="text-cyan-400" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleMediaSelect}
                        />
                      </label>
                      <label className="p-2 hover:bg-gray-800 rounded-full cursor-pointer transition">
                        <Video size={20} className="text-cyan-400" />
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleMediaSelect}
                        />
                      </label>
                    </div>
                    
                    <button
                      onClick={createPost}
                      disabled={posting || (!newPostText.trim() && !newPostMedia)}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {posting ? (
                        <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></div>
                      ) : (
                        <>
                          <Send size={18} />
                          Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members-only message */}
          {!isMember && currentUser && (
            <div className="glass-card p-8 text-center">
              <Users size={48} className="mx-auto mb-3 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Members Only</h3>
              <p className="text-gray-400 mb-4">Join this tribe to see posts and participate in discussions</p>
              <button
                onClick={joinTribe}
                disabled={joining}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Join Tribe'}
              </button>
            </div>
          )}

          {/* Not logged in message */}
          {!currentUser && (
            <div className="glass-card p-8 text-center">
              <Users size={48} className="mx-auto mb-3 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">Login Required</h3>
              <p className="text-gray-400 mb-4">Login or create an account to join tribes and see posts</p>
              <button
                onClick={() => navigate('/auth')}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition"
              >
                Login / Sign Up
              </button>
            </div>
          )}

          {/* Posts Feed */}
          {isMember && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📝 Tribe Posts
                <span className="text-sm font-normal text-gray-500">({posts.length})</span>
              </h2>
              
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onRepost={handleRepost}
                  />
                ))
              ) : (
                <div className="glass-card p-8 text-center">
                  <p className="text-gray-400 mb-2">No posts yet</p>
                  <p className="text-sm text-gray-500">Be the first to post in this tribe!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <BottomNav active="discover" />
    </div>
  );
};

export default TribeDetail;
