import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import BottomNav from "../components/BottomNav";
import { Search, X, Sparkles, Video, FileText, Users, UserPlus, MessageCircle, UsersRound, Shield, Plus, Share2 } from "lucide-react";
import VerifiedBadge from "../components/VerifiedBadge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import FindYourParallel from "../components/FindYourParallel";
import PostCard from "../components/PostCard";
import ShareModal from "../components/ShareModal";

const Discover = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [showParallels, setShowParallels] = useState(false);
  
  // Content states
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [people, setPeople] = useState([]);
  const [tribes, setTribes] = useState([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  
  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [shareType, setShareType] = useState('post');

  const handleShare = (item, type) => {
    if (!currentUser) {
      toast.error("Please login to share");
      navigate('/auth');
      return;
    }
    setShareItem(item);
    setShareType(type);
    setShareModalOpen(true);
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === "posts") {
        const res = await axios.get(`${API}/posts`);
        setPosts(res.data);
      } else if (activeTab === "reels") {
        const res = await axios.get(`${API}/reels`);
        setReels(res.data);
      } else if (activeTab === "people") {
        const res = await axios.get(`${API}/users`);
        // Filter out current user only (keep friends to show Message button)
        let filtered = res.data.filter(u => {
          if (!currentUser) return true;
          return u.id !== currentUser.id;
        });
        
        // If logged in, check for pending friend requests, following status, and friend status
        if (currentUser) {
          const following = currentUser.following || [];
          const friends = currentUser.friends || [];
          
          // Mark following and friend status
          filtered = filtered.map(u => ({
            ...u,
            isFollowing: following.includes(u.id),
            isFriend: friends.includes(u.id)
          }));
          
          // Also check for pending friend requests
          try {
            const token = localStorage.getItem('loopync_token');
            const frRes = await axios.get(`${API}/friend-requests?userId=${currentUser.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const sentRequests = frRes.data.filter(fr => fr.fromUserId === currentUser.id && fr.status === 'pending');
            const sentToIds = sentRequests.map(fr => fr.toUserId);
            
            // Mark users with pending friend requests
            filtered = filtered.map(u => ({
              ...u,
              requestSent: sentToIds.includes(u.id)
            }));
          } catch (e) {
            console.log('Could not fetch friend requests');
          }
        }
        
        setPeople(filtered);
      } else if (activeTab === "tribes") {
        const res = await axios.get(`${API}/tribes`);
        setTribes(res.data);
      }
    } catch (error) {
      console.error("Failed to load content:", error);
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`${API}/posts/${postId}/like?userId=${currentUser.id}`);
      setPosts(posts.map(p => p.id === postId ? { ...p, ...res.data } : p));
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const res = await axios.get(`${API}/search?q=${encodeURIComponent(query)}&currentUserId=${currentUser?.id || ''}`);
      setSearchResults(res.data);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (toUserId) => {
    if (!currentUser) {
      toast.error("Please login to add friends");
      navigate('/auth');
      return;
    }
    
    try {
      await axios.post(`${API}/friend-requests?fromUserId=${currentUser.id}&toUserId=${toUserId}`);
      toast.success("Friend request sent!");
      
      // Update people list using functional update to avoid stale closure
      setPeople(prevPeople => prevPeople.map(p => 
        p.id === toUserId ? { ...p, requestSent: true } : p
      ));
      
      // Update search results if active
      if (searchResults?.users) {
        setSearchResults(prevResults => ({
          ...prevResults,
          users: prevResults.users.map(u => u.id === toUserId ? { ...u, requestSent: true } : u)
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send request");
    }
  };

  const handleFollowUser = async (targetUserId) => {
    if (!currentUser) {
      toast.error("Please login to follow");
      navigate('/auth');
      return;
    }
    
    try {
      const token = localStorage.getItem('loopync_token');
      const response = await axios.post(
        `${API}/users/${currentUser.id}/follow`,
        { targetUserId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Get the action from response
      const action = response.data.action;
      toast.success(action === 'followed' ? 'Following!' : 'Unfollowed');
      
      // Refresh current user data
      const userRes = await axios.get(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update people and search results
      const updatedFollowing = userRes.data.following || [];
      setPeople(people.map(p => ({
        ...p,
        isFollowing: updatedFollowing.includes(p.id)
      })));
      
      if (searchResults?.users) {
        setSearchResults({
          ...searchResults,
          users: searchResults.users.map(u => ({
            ...u,
            isFollowing: updatedFollowing.includes(u.id)
          }))
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error("Failed to follow user");
    }
  };

  // Start or open a conversation with a user
  const startConversation = async (user) => {
    if (!currentUser) {
      toast.error("Please login to message");
      navigate('/auth');
      return;
    }
    
    // Don't allow messaging yourself
    if (user.id === currentUser.id) {
      toast.error("You can't message yourself");
      return;
    }
    
    try {
      // Check if they are friends first (required for messaging)
      const isFriend = currentUser.friends?.includes(user.id);
      
      if (!isFriend) {
        toast.error("You need to be friends to message this user");
        return;
      }
      
      // Start conversation via API
      const res = await axios.post(
        `${API}/messenger/start?userId=${currentUser.id}&friendId=${user.id}`
      );
      
      if (res.data.success) {
        // Navigate to messenger with the thread
        navigate('/messenger', { 
          state: { 
            selectedThread: res.data.thread 
          } 
        });
        toast.success(`Started chat with ${user.name}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      // If they're not friends, prompt them to add as friend
      if (error.response?.status === 403) {
        toast.error("Send a friend request first to message this user");
      } else {
        toast.error(error.response?.data?.detail || "Failed to start conversation");
      }
    }
  };

  const joinTribe = async (tribeId) => {
    if (!currentUser) {
      toast.error("Please login to join tribes");
      navigate('/auth');
      return;
    }
    
    try {
      await axios.post(`${API}/tribes/${tribeId}/join?userId=${currentUser.id}`);
      toast.success("Joined tribe successfully!");
      
      // Update tribes list
      setTribes(tribes.map(t => t.id === tribeId ? { 
        ...t, 
        members: [...(t.members || []), currentUser.id],
        isMember: true 
      } : t));
      
      // Update search results if active
      if (searchResults?.tribes) {
        setSearchResults({
          ...searchResults,
          tribes: searchResults.tribes.map(t => t.id === tribeId ? { 
            ...t, 
            members: [...(t.members || []), currentUser.id],
            isMember: true 
          } : t)
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join tribe");
    }
  };

  if (loading && !searchResults) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-surface p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold neon-text">Discover</h1>
              <p className="text-sm text-gray-400">Explore posts and reels</p>
            </div>
            <button
              onClick={() => setShowParallels(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              <Sparkles size={18} />
              Find Parallel
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search posts, reels, hashtags..."
              className="w-full px-4 py-3 pl-12 pr-12 rounded-full bg-gray-800/50 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
            />
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
            {searching && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchResults && searchQuery.length >= 2 ? (
          <div className="px-4 space-y-6">
            {/* Posts Results */}
            {searchResults.posts && searchResults.posts.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <FileText size={20} className="text-cyan-400" />
                  Posts ({searchResults.posts.length})
                </h3>
                <div className="space-y-4">
                  {searchResults.posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUser={currentUser} 
                      onLike={handleLike}
                      onDelete={async (postId) => {
                        if (!window.confirm("Are you sure you want to delete this post?")) return;
                        try {
                          const token = localStorage.getItem('loopync_token');
                          await axios.delete(`${API}/posts/${postId}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setSearchResults({
                            ...searchResults,
                            posts: searchResults.posts.filter(p => p.id !== postId)
                          });
                          toast.success("Post deleted!");
                        } catch (error) {
                          console.error("Delete error:", error);
                          if (error.response?.status === 403) {
                            toast.error("You can only delete your own posts");
                          } else {
                            toast.error(error.response?.data?.detail || "Failed to delete post");
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* People Results */}
            {searchResults.users && searchResults.users.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Users size={20} className="text-cyan-400" />
                  People ({searchResults.users.length})
                </h3>
                <div className="space-y-3">
                  {searchResults.users.map(user => (
                    <div key={user.id} className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                          alt={user.name}
                          className="w-16 h-16 rounded-full cursor-pointer"
                          onClick={() => navigate(`/u/${user.handle}`)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 
                              className="font-semibold text-white cursor-pointer hover:underline"
                              onClick={() => navigate(`/u/${user.handle}`)}
                            >
                              {user.name}
                            </h3>
                            {user.isVerified && <VerifiedBadge size={16} />}
                          </div>
                          <p className="text-sm text-gray-400">@{user.handle}</p>
                          {user.bio && <p className="text-sm text-gray-300 mt-1 line-clamp-2">{user.bio}</p>}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {currentUser && user.id !== currentUser.id && (
                            <>
                              {/* Follow Button */}
                              <button
                                onClick={() => handleFollowUser(user.id)}
                                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-full font-semibold transition-all text-xs ${
                                  user.isFollowing || currentUser.following?.includes(user.id)
                                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                                    : 'bg-cyan-400 text-black hover:bg-cyan-300'
                                }`}
                              >
                                <UserPlus size={14} />
                                {user.isFollowing || currentUser.following?.includes(user.id) ? 'Following' : 'Follow'}
                              </button>
                              
                              {/* Message Button - Show if friends */}
                              {(user.isFriend || currentUser.friends?.includes(user.id)) && (
                                <button
                                  onClick={() => startConversation(user)}
                                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-purple-500 text-white font-semibold hover:bg-purple-400 transition-all text-xs"
                                >
                                  <MessageCircle size={14} />
                                  Message
                                </button>
                              )}
                              
                              {/* Add Friend / Request Sent */}
                              {!user.isFriend && !currentUser.friends?.includes(user.id) && !user.requestSent && (
                                <button
                                  onClick={() => sendFriendRequest(user.id)}
                                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all text-xs"
                                >
                                  <UserPlus size={14} />
                                  Add
                                </button>
                              )}
                              {user.requestSent && (
                                <span className="px-3 py-2 rounded-full bg-gray-700 text-gray-400 text-xs">Requested</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VibeZone Results */}
            {searchResults.reels && searchResults.reels.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Video size={20} className="text-cyan-400" />
                  VibeZone ({searchResults.reels.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.reels.map(reel => (
                    <div
                      key={reel.id}
                      onClick={() => navigate('/vibezone')}
                      className="glass-card overflow-hidden cursor-pointer hover:scale-105 transition-transform aspect-[9/16]"
                    >
                      <div className="relative h-full">
                        <video
                          src={reel.videoUrl}
                          poster={reel.thumb}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-sm font-semibold line-clamp-2">{reel.caption}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-300">
                            <span>👁️ {reel.stats?.views || 0}</span>
                            <span>❤️ {reel.stats?.likes || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tribes Results */}
            {searchResults.tribes && searchResults.tribes.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <UsersRound size={20} className="text-cyan-400" />
                  Tribes ({searchResults.tribes.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.tribes.map(tribe => (
                    <div key={tribe.id} className="glass-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <UsersRound size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1">{tribe.name}</h3>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-1">{tribe.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{tribe.members?.length || 0} members</span>
                            {!tribe.isMember && !tribe.members?.includes(currentUser?.id) && (
                              <button
                                onClick={() => joinTribe(tribe.id)}
                                className="ml-auto px-3 py-1 rounded-full bg-cyan-400 text-black text-xs font-semibold hover:bg-cyan-300"
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {(!searchResults.posts || searchResults.posts.length === 0) && 
             (!searchResults.reels || searchResults.reels.length === 0) &&
             (!searchResults.users || searchResults.users.length === 0) &&
             (!searchResults.tribes || searchResults.tribes.length === 0) && (
              <div className="glass-card p-8 text-center">
                <p className="text-gray-400">No results found for &quot;{searchQuery}&quot;</p>
                <p className="text-sm text-gray-500 mt-2">Try searching with different keywords</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 px-4 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                  activeTab === "posts" ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <FileText size={18} />
                Posts
              </button>
              <button
                onClick={() => setActiveTab("reels")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                  activeTab === "reels" ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Video size={18} />
                VibeZone
              </button>
              <button
                onClick={() => setActiveTab("people")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                  activeTab === "people" ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Users size={18} />
                People
              </button>
              <button
                onClick={() => setActiveTab("tribes")}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold whitespace-nowrap transition-all ${
                  activeTab === "tribes" ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <UsersRound size={18} />
                Tribes
              </button>
            </div>

            {/* Content */}
            <div className="px-4">
              {activeTab === "posts" && (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUser={currentUser} 
                        onLike={handleLike}
                        onRepost={async (postId) => {
                          if (!currentUser) {
                            toast.error("Please login to repost");
                            navigate('/auth');
                            return;
                          }
                          try {
                            const token = localStorage.getItem('loopync_token');
                            await axios.post(
                              `${API}/posts/${postId}/repost?userId=${currentUser.id}`,
                              {},
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            const res = await axios.get(`${API}/posts/${postId}`);
                            setPosts(prev => prev.map(p => p.id === postId ? res.data : p));
                            toast.success("Reposted!");
                          } catch (error) {
                            toast.error("Failed to repost");
                          }
                        }}
                        onDelete={async (postId) => {
                          if (!window.confirm("Are you sure you want to delete this post?")) return;
                          try {
                            const token = localStorage.getItem('loopync_token');
                            await axios.delete(`${API}/posts/${postId}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setPosts(posts.filter(p => p.id !== postId));
                            toast.success("Post deleted!");
                          } catch (error) {
                            console.error("Delete error:", error);
                            if (error.response?.status === 403) {
                              toast.error("You can only delete your own posts");
                            } else {
                              toast.error(error.response?.data?.detail || "Failed to delete post");
                            }
                          }
                        }}
                      />
                    ))
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <FileText size={48} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400">No posts yet</p>
                      <p className="text-sm text-gray-500 mt-2">Be the first to create content!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reels" && (
                <div>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
                    </div>
                  ) : reels.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {reels.map(reel => (
                        <div
                          key={reel.id}
                          className="glass-card overflow-hidden cursor-pointer hover:scale-105 transition-transform aspect-[9/16] relative group"
                        >
                          <div className="relative h-full" onClick={() => navigate('/vibezone')}>
                            <video
                              src={reel.videoUrl}
                              poster={reel.thumb}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                              <p className="text-white text-sm font-semibold line-clamp-2">{reel.caption || 'Untitled'}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-300">
                                <span>👁️ {reel.stats?.views || 0}</span>
                                <span>❤️ {reel.stats?.likes || 0}</span>
                                <span>📤 {reel.stats?.shares || 0}</span>
                              </div>
                            </div>
                          </div>
                          {/* Share Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(reel, 'reel');
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-purple-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <Video size={48} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400">No reels yet</p>
                      <p className="text-sm text-gray-500 mt-2">Check out VibeZone to watch reels!</p>
                      <button
                        onClick={() => navigate('/vibezone')}
                        className="mt-4 px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300"
                      >
                        Go to VibeZone
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "people" && (
                <div>
                  {/* Verified Filter */}
                  <div className="mb-4 flex items-center gap-3 p-3 glass-card rounded-xl">
                    <button
                      onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        showVerifiedOnly 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      <Shield size={16} />
                      Verified Only
                    </button>
                    {showVerifiedOnly && (
                      <span className="text-sm text-gray-400">
                        Showing {people.filter(u => u.isVerified).length} verified accounts
                      </span>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
                    </div>
                  ) : people.filter(u => !showVerifiedOnly || u.isVerified).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {people.filter(u => !showVerifiedOnly || u.isVerified).map(user => (
                        <div key={user.id} className="glass-card p-4 hover:bg-gray-800/50 transition-all">
                          <div className="flex items-start gap-3">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                              alt={user.name}
                              className="w-16 h-16 rounded-full cursor-pointer"
                              onClick={() => navigate(`/u/${user.handle}`)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 
                                  className="font-semibold text-white cursor-pointer hover:underline"
                                  onClick={() => navigate(`/u/${user.handle}`)}
                                >
                                  {user.name}
                                </h3>
                                {user.isVerified && <VerifiedBadge size={16} />}
                              </div>
                              <p className="text-sm text-gray-400">@{user.handle}</p>
                              {user.bio && <p className="text-sm text-gray-300 mt-1 line-clamp-2">{user.bio}</p>}
                              
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {currentUser && user.id !== currentUser.id && (
                                  <>
                                    {/* Follow Button */}
                                    <button
                                      onClick={() => handleFollowUser(user.id)}
                                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all text-sm ${
                                        user.isFollowing || currentUser.following?.includes(user.id)
                                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                                          : 'bg-cyan-400 text-black hover:bg-cyan-300'
                                      }`}
                                    >
                                      <UserPlus size={16} />
                                      {user.isFollowing || currentUser.following?.includes(user.id) ? 'Following' : 'Follow'}
                                    </button>
                                    
                                    {/* Message Button - Show if friends */}
                                    {(user.isFriend || currentUser.friends?.includes(user.id)) && (
                                      <button
                                        onClick={() => startConversation(user)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500 text-white font-semibold hover:bg-purple-400 transition-all text-sm"
                                      >
                                        <MessageCircle size={16} />
                                        Message
                                      </button>
                                    )}
                                    
                                    {/* Add Friend Button - Show if not friends */}
                                    {!user.isFriend && !currentUser.friends?.includes(user.id) && !user.requestSent && (
                                      <button
                                        onClick={() => sendFriendRequest(user.id)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all text-sm"
                                      >
                                        <UserPlus size={16} />
                                        Add Friend
                                      </button>
                                    )}
                                    {user.requestSent && (
                                      <span className="px-4 py-2 rounded-full bg-gray-700 text-gray-400 text-sm">Friend Request Sent</span>
                                    )}
                                  </>
                                )}
                                <button
                                  onClick={() => navigate(`/u/${user.handle}`)}
                                  className="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition text-sm"
                                >
                                  View Profile
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <Users size={48} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400">No people to discover</p>
                      <p className="text-sm text-gray-500 mt-2">Use search to find specific users</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tribes" && (
                <div>
                  {/* Create Tribe Button */}
                  {currentUser && (
                    <div className="mb-4">
                      <button
                        onClick={() => navigate('/tribes/create')}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold hover:from-cyan-300 hover:to-purple-400 transition-all shadow-lg shadow-cyan-500/20"
                      >
                        <Plus size={20} />
                        Create New Tribe
                      </button>
                    </div>
                  )}
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
                    </div>
                  ) : tribes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tribes.map(tribe => (
                        <div key={tribe.id} className="glass-card p-5 hover:bg-gray-800/50 transition-all relative group">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <UsersRound size={32} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-lg mb-1">{tribe.name}</h3>
                              <p className="text-sm text-gray-400 mb-2 line-clamp-2">{tribe.description || 'Join this community'}</p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <Users size={14} />
                                  {tribe.members?.length || 0} members
                                </span>
                                {tribe.shareCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Share2 size={14} />
                                    {tribe.shareCount} invites
                                  </span>
                                )}
                                {tribe.category && (
                                  <span className="px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-400">
                                    {tribe.category}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {currentUser && !tribe.members?.includes(currentUser.id) && !tribe.isMember ? (
                                  <button
                                    onClick={() => joinTribe(tribe.id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-all text-sm"
                                  >
                                    <UserPlus size={16} />
                                    Join Tribe
                                  </button>
                                ) : tribe.isMember || tribe.members?.includes(currentUser?.id) ? (
                                  <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                                    ✓ Joined
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => navigate('/auth')}
                                    className="px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-all text-sm"
                                  >
                                    Login to Join
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/tribes/${tribe.id}`)}
                                  className="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition text-sm"
                                >
                                  View
                                </button>
                                {/* Invite/Share Button */}
                                <button
                                  onClick={() => handleShare(tribe, 'tribe')}
                                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all text-sm"
                                  title="Invite friends"
                                >
                                  <Share2 size={14} />
                                  Invite
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card p-8 text-center">
                      <UsersRound size={48} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-400">No tribes yet</p>
                      <p className="text-sm text-gray-500 mt-2">Be the first to create a community!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav active="discover" />
      
      {/* Find Your Parallel Modal */}
      {showParallels && (
        <FindYourParallel
          currentUser={currentUser}
          onClose={() => setShowParallels(false)}
        />
      )}
      
      {/* Share Modal */}
      {shareModalOpen && shareItem && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareItem(null);
          }}
          item={shareItem}
          type={shareType}
        />
      )}
    </div>
  );
};

export default Discover;
