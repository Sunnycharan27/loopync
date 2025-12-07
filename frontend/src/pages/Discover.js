import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import BottomNav from "../components/BottomNav";
import { Search, X, Sparkles, Video, FileText, Users, UserPlus, MessageCircle, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import FindYourParallel from "../components/FindYourParallel";
import PostCard from "../components/PostCard";

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
        // Filter out current user and existing friends
        const filtered = res.data.filter(u => {
          if (!currentUser) return true;
          return u.id !== currentUser.id && !currentUser.friends?.includes(u.id);
        });
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
      
      // Update people list
      setPeople(people.map(p => p.id === toUserId ? { ...p, requestSent: true } : p));
      
      // Update search results if active
      if (searchResults?.users) {
        setSearchResults({
          ...searchResults,
          users: searchResults.users.map(u => u.id === toUserId ? { ...u, requestSent: true } : u)
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send request");
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
                          await axios.delete(`${API}/posts/${postId}`);
                          setSearchResults({
                            ...searchResults,
                            posts: searchResults.posts.filter(p => p.id !== postId)
                          });
                          toast.success("Post deleted!");
                        } catch (error) {
                          toast.error("Failed to delete post");
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
                          onClick={() => navigate(`/profile/${user.id}`)}
                        />
                        <div className="flex-1">
                          <h3 
                            className="font-semibold text-white cursor-pointer hover:underline"
                            onClick={() => navigate(`/profile/${user.id}`)}
                          >
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-400">@{user.handle}</p>
                          {user.bio && <p className="text-sm text-gray-300 mt-1 line-clamp-2">{user.bio}</p>}
                        </div>
                        <div className="flex gap-2">
                          {user.id !== currentUser?.id && !user.isFriend && !user.requestSent && (
                            <button
                              onClick={() => sendFriendRequest(user.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-all"
                            >
                              <UserPlus size={16} />
                              Add
                            </button>
                          )}
                          {user.requestSent && (
                            <span className="px-4 py-2 rounded-full bg-gray-700 text-gray-400 text-sm">Requested</span>
                          )}
                          {user.isFriend && (
                            <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm">Friends</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reels Results */}
            {searchResults.reels && searchResults.reels.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Video size={20} className="text-cyan-400" />
                  Reels ({searchResults.reels.length})
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
                Reels
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
                        onDelete={async (postId) => {
                          if (!window.confirm("Are you sure you want to delete this post?")) return;
                          try {
                            await axios.delete(`${API}/posts/${postId}`);
                            setPosts(posts.filter(p => p.id !== postId));
                            toast.success("Post deleted!");
                          } catch (error) {
                            toast.error("Failed to delete post");
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
                              <p className="text-white text-sm font-semibold line-clamp-2">{reel.caption || 'Untitled'}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-300">
                                <span>👁️ {reel.stats?.views || 0}</span>
                                <span>❤️ {reel.stats?.likes || 0}</span>
                              </div>
                            </div>
                          </div>
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
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
                    </div>
                  ) : people.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {people.map(user => (
                        <div key={user.id} className="glass-card p-4 hover:bg-gray-800/50 transition-all">
                          <div className="flex items-start gap-3">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
                              alt={user.name}
                              className="w-16 h-16 rounded-full cursor-pointer"
                              onClick={() => navigate(`/profile/${user.id}`)}
                            />
                            <div className="flex-1">
                              <h3 
                                className="font-semibold text-white cursor-pointer hover:underline"
                                onClick={() => navigate(`/profile/${user.id}`)}
                              >
                                {user.name}
                              </h3>
                              <p className="text-sm text-gray-400">@{user.handle}</p>
                              {user.bio && <p className="text-sm text-gray-300 mt-1 line-clamp-2">{user.bio}</p>}
                              
                              <div className="flex items-center gap-2 mt-3">
                                {currentUser && user.id !== currentUser.id && !user.requestSent && (
                                  <button
                                    onClick={() => sendFriendRequest(user.id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-all text-sm"
                                  >
                                    <UserPlus size={16} />
                                    Add Friend
                                  </button>
                                )}
                                {user.requestSent && (
                                  <span className="px-4 py-2 rounded-full bg-gray-700 text-gray-400 text-sm">Requested</span>
                                )}
                                <button
                                  onClick={() => navigate(`/profile/${user.id}`)}
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
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
                    </div>
                  ) : tribes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tribes.map(tribe => (
                        <div key={tribe.id} className="glass-card p-5 hover:bg-gray-800/50 transition-all">
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
    </div>
  );
};

export default Discover;
