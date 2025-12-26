import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, UserMinus, Settings, Image, Video, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import PostCard from "../components/PostCard";
import { getMediaUrl } from "../utils/mediaUtils";
import BottomNav from "../components/BottomNav";
import TribeSettingsModal from "../components/TribeSettingsModal";

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
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState("");
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [posting, setPosting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // posts, members

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
      
      // Fetch members
      try {
        const membersRes = await axios.get(`${API}/tribes/${tribeId}/members`);
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
      
      // Fetch posts only if user is a member
      const membersList = tribeRes.data?.members || [];
      if (currentUser && membersList.includes(currentUser.id)) {
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
      
      if (newPostMedia) {
        const formData = new FormData();
        formData.append('file', newPostMedia);
        
        const uploadRes = await axios.post(`${API}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        mediaUrl = uploadRes.data.url;
      }

      const postData = {
        text: newPostText.trim(),
        authorId: currentUser.id,
        tribeId: tribeId,
        mediaUrl: mediaUrl
      };

      const postRes = await axios.post(`${API}/tribes/${tribeId}/posts`, postData);
      
      const newPost = {
        ...postRes.data,
        author: currentUser
      };
      setPosts([newPost, ...posts]);
      
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

  const handleTribeUpdate = (updatedTribe) => {
    setTribe(updatedTribe);
  };

  const handleTribeDelete = () => {
    navigate('/tribes');
  };

  const tribeMembers = tribe?.members || [];
  const isMember = currentUser?.id && tribeMembers.includes(currentUser.id);
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

  const defaultCover = `https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop`;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 w-full">
        <img
          src={tribe.coverImage || defaultCover}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f021e] via-transparent to-transparent" />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/tribes')} 
          className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>

        {/* Settings & Share Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwner && (
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition"
            >
              <Settings size={20} className="text-white" />
            </button>
          )}
          <button className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition">
            <Share2 size={20} className="text-white" />
          </button>
        </div>

        {/* Tribe Avatar */}
        <div className="absolute -bottom-12 left-6">
          <img
            src={tribe.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${tribe.id}`}
            alt={tribe.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[#0f021e] bg-gray-800"
          />
        </div>
      </div>

      {/* Tribe Info */}
      <div className="max-w-4xl mx-auto px-4 pt-16">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{tribe.name}</h1>
            <p className="text-gray-400 mb-3">{tribe.description || 'No description'}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-gray-400">
                <Users size={16} className="text-cyan-400" />
                {tribe.memberCount || tribeMembers.length} members
              </span>
              <span className={`px-3 py-1 rounded-full text-xs ${
                tribe.type === 'private' 
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                  : 'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>
                {tribe.type === 'private' ? '🔒 Private' : '🌐 Public'}
              </span>
            </div>

            {/* Tags */}
            {Array.isArray(tribe.tags) && tribe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {tribe.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-full text-xs bg-cyan-400/10 text-cyan-400">
                    #{typeof tag === 'string' ? tag : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {currentUser && (
              isOwner ? (
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-6 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30 flex items-center gap-2"
                >
                  <Settings size={18} />
                  Manage
                </button>
              ) : isMember ? (
                <button
                  onClick={leaveTribe}
                  disabled={joining}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition disabled:opacity-50"
                >
                  {joining ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserMinus size={18} />
                  )}
                  Leave
                </button>
              ) : (
                <button
                  onClick={joinTribe}
                  disabled={joining}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50"
                >
                  {joining ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  Join
                </button>
              )
            )}

            {!currentUser && (
              <button
                onClick={() => navigate('/auth')}
                className="px-6 py-2.5 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
              >
                Login to Join
              </button>
            )}
          </div>
        </div>

        {/* Member Avatars Preview */}
        {members.length > 0 && (
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
            <div className="flex -space-x-2">
              {members.slice(0, 8).map((member, idx) => (
                <img
                  key={member.id || idx}
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.handle || idx}`}
                  alt={member.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-900 object-cover cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                  title={member.name}
                  onClick={() => navigate(`/@${member.handle}`)}
                />
              ))}
              {members.length > 8 && (
                <div className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">+{members.length - 8}</span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-400">
              {members.slice(0, 2).map(m => m.name).join(", ")}
              {members.length > 2 && ` and ${members.length - 2} others`}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "posts" 
                ? "bg-cyan-400 text-black" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "members" 
                ? "bg-cyan-400 text-black" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Members ({members.length})
          </button>
        </div>

        {/* Content based on tab */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            {/* Post Creation (Only for members) */}
            {isMember && (
              <div className="rounded-2xl p-4 border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
                <div className="flex gap-3">
                  <img
                    src={getMediaUrl(currentUser?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.handle}`}
                    alt="You"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder={`Share something with ${tribe.name}...`}
                      className="w-full bg-gray-800/50 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none border border-gray-700"
                      rows="2"
                    />
                    
                    {newPostMedia && (
                      <div className="mt-2 relative">
                        {newPostMedia.type.startsWith('video/') ? (
                          <video
                            src={URL.createObjectURL(newPostMedia)}
                            className="w-full max-h-48 object-cover rounded-xl"
                            controls
                          />
                        ) : (
                          <img
                            src={URL.createObjectURL(newPostMedia)}
                            alt="Preview"
                            className="w-full max-h-48 object-cover rounded-xl"
                          />
                        )}
                        <button
                          onClick={() => setNewPostMedia(null)}
                          className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded-lg text-xs hover:bg-black transition"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-1">
                        <label className="p-2 hover:bg-gray-800 rounded-lg cursor-pointer transition">
                          <Image size={18} className="text-cyan-400" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleMediaSelect}
                          />
                        </label>
                        <label className="p-2 hover:bg-gray-800 rounded-lg cursor-pointer transition">
                          <Video size={18} className="text-cyan-400" />
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
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-sm font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {posting ? (
                          <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
                        ) : (
                          <Send size={16} />
                        )}
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Non-member message */}
            {!isMember && currentUser && (
              <div className="rounded-2xl p-8 text-center border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
                <Users size={48} className="mx-auto mb-3 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Members Only</h3>
                <p className="text-gray-400 mb-4">Join this tribe to see posts and participate</p>
                <button
                  onClick={joinTribe}
                  disabled={joining}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join Tribe'}
                </button>
              </div>
            )}

            {/* Not logged in */}
            {!currentUser && (
              <div className="rounded-2xl p-8 text-center border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
                <Users size={48} className="mx-auto mb-3 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Login Required</h3>
                <p className="text-gray-400 mb-4">Login to join tribes and see posts</p>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold hover:shadow-lg hover:shadow-cyan-400/30 transition"
                >
                  Login / Sign Up
                </button>
              </div>
            )}

            {/* Posts Feed */}
            {isMember && (
              posts.length > 0 ? (
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
                <div className="rounded-2xl p-8 text-center border border-gray-800" style={{ background: 'rgba(26, 11, 46, 0.5)' }}>
                  <p className="text-gray-400 mb-2">No posts yet</p>
                  <p className="text-sm text-gray-500">Be the first to post in this tribe!</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-800 hover:border-cyan-400/30 cursor-pointer transition"
                style={{ background: 'rgba(26, 11, 46, 0.5)' }}
                onClick={() => navigate(`/@${member.handle}`)}
              >
                <img
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.handle}`}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white truncate">{member.name}</h4>
                    {member.id === tribe.ownerId && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Owner</span>
                    )}
                    {member.isVerified && (
                      <span className="text-cyan-400">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">@{member.handle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <TribeSettingsModal
          tribe={tribe}
          currentUser={currentUser}
          onClose={() => setShowSettings(false)}
          onUpdate={handleTribeUpdate}
          onDelete={handleTribeDelete}
        />
      )}
      
      <BottomNav active="tribes" />
    </div>
  );
};

export default TribeDetail;
