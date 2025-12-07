import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, Settings, Image, Video, Send } from "lucide-react";
import { toast } from "sonner";
import PostCard from "../components/PostCard";
import { getMediaUrl } from "../utils/mediaUtils";
import BottomNav from "../components/BottomNav";

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

  useEffect(() => {
    fetchTribeDetails();
  }, [tribeId]);

  const fetchTribeDetails = async () => {
    setLoading(true);
    try {
      const [tribeRes, postsRes] = await Promise.all([
        axios.get(`${API}/tribes/${tribeId}`),
        axios.get(`${API}/tribes/${tribeId}/posts`)
      ]);
      
      setTribe(tribeRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error("Failed to fetch tribe:", error);
      toast.error("Failed to load tribe");
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
    
    try {
      await axios.post(`${API}/api/tribes/${tribeId}/join?userId=${currentUser.id}`);
      toast.success("Joined tribe!");
      setTribe({
        ...tribe,
        members: [...(tribe.members || []), currentUser.id]
      });
    } catch (error) {
      toast.error("Failed to join tribe");
    }
  };

  const leaveTribe = async () => {
    try {
      await axios.post(`${API}/api/tribes/${tribeId}/leave?userId=${currentUser.id}`);
      toast.success("Left tribe");
      setTribe({
        ...tribe,
        members: (tribe.members || []).filter(m => m !== currentUser.id)
      });
    } catch (error) {
      toast.error("Failed to leave tribe");
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
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
        
        const uploadRes = await axios.post(`${API}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('loopync_token')}`
          }
        });
        
        mediaUrl = uploadRes.data.url;
      }

      // Create post in tribe
      const postData = {
        text: newPostText,
        authorId: currentUser.id,
        tribeId: tribeId,
        mediaUrl: mediaUrl
      };

      const postRes = await axios.post(`${API}/api/tribes/${tribeId}/posts`, postData);
      
      // Add to posts list
      setPosts([postRes.data, ...posts]);
      
      // Clear form
      setNewPostText("");
      setNewPostMedia(null);
      
      toast.success("Post created!");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`${API}/api/posts/${postId}/like?userId=${currentUser.id}`);
      setPosts(posts.map(p => p.id === postId ? { ...p, ...res.data } : p));
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const isMember = tribe?.members?.includes(currentUser?.id);

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
          <p className="text-gray-400 mb-4">Tribe not found</p>
          <button onClick={() => navigate('/discover')} className="px-6 py-2 bg-cyan-400 text-black rounded-xl">
            Back to Discover
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
            <button onClick={() => navigate('/discover')} className="p-2 hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={24} className="text-white" />
            </button>
            {tribe.creatorId === currentUser?.id && (
              <button className="p-2 hover:bg-gray-800 rounded-full transition">
                <Settings size={24} className="text-white" />
              </button>
            )}
          </div>

          {/* Tribe Info */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Users size={40} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold neon-text mb-1">{tribe.name}</h1>
              <p className="text-gray-400 mb-3">{tribe.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {tribe.members?.length || 0} members
                </span>
                {tribe.category && (
                  <span className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-xs">
                    {tribe.category}
                  </span>
                )}
              </div>
              
              {currentUser && (
                <div className="flex gap-2">
                  {isMember ? (
                    <button
                      onClick={leaveTribe}
                      className="px-6 py-2 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                    >
                      Leave Tribe
                    </button>
                  ) : (
                    <button
                      onClick={joinTribe}
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition"
                    >
                      <UserPlus size={18} />
                      Join Tribe
                    </button>
                  )}
                </div>
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
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`Share something with ${tribe.name}...`}
                    className="w-full bg-gray-800 text-white rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                    rows="3"
                  />
                  
                  {newPostMedia && (
                    <div className="mb-3 relative">
                      <img
                        src={URL.createObjectURL(newPostMedia)}
                        alt="Preview"
                        className="w-full max-h-64 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => setNewPostMedia(null)}
                        className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded-lg text-sm hover:bg-black transition"
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
                      className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="glass-card p-6 text-center">
              <Users size={48} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 mb-4">Join this tribe to see posts and participate</p>
              <button
                onClick={joinTribe}
                className="px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300"
              >
                Join Tribe
              </button>
            </div>
          )}

          {/* Posts Feed */}
          {isMember && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Tribe Posts</h2>
              
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onLike={handleLike}
                  />
                ))
              ) : (
                <div className="glass-card p-8 text-center">
                  <p className="text-gray-400">No posts yet</p>
                  <p className="text-sm text-gray-500 mt-2">Be the first to post in this tribe!</p>
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
