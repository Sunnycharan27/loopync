import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import BottomNav from "../components/BottomNav";
import { 
  Settings, Grid, Users, Edit3, X, Check, Phone, MessageCircle, Camera
} from "lucide-react";
import MediaSelectorModal from "../components/MediaSelectorModal";
import PostCard from "../components/PostCard";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getMediaUrl } from "../utils/mediaUtils";

const ProfileVibe = () => {
  const { currentUser, refreshUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("posts");
  const [userPosts, setUserPosts] = useState([]);
  const [userTribes, setUserTribes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [postsRes, tribesRes] = await Promise.all([
        axios.get(`${API}/posts`),
        axios.get(`${API}/tribes`)
      ]);

      const myPosts = postsRes.data.filter(p => p.authorId === currentUser.id);
      const myTribes = tribesRes.data.filter(t => t.members?.includes(currentUser.id) || t.creatorId === currentUser.id);
      setUserPosts(myPosts);
      setUserTribes(myTribes);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNameEdit = async () => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      const token = localStorage.getItem("loopync_token");
      if (!token) {
        toast.error("Please login again");
        navigate("/auth");
        return;
      }

      await axios.patch(
        `${API}/api/users/${currentUser.id}/profile`, 
        { name: editedName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await refreshUserData();
      setIsEditingName(false);
      toast.success("Name updated!");
    } catch (error) {
      console.error("Failed to update name:", error);
      toast.error(error.response?.data?.detail || "Failed to update name");
    }
  };

  const handleProfilePictureSelect = async (mediaUrl) => {
    try {
      const token = localStorage.getItem("loopync_token");
      if (!token) {
        toast.error("Please login again");
        navigate("/auth");
        return;
      }

      console.log("Updating profile photo with URL:", mediaUrl);
      
      await axios.patch(
        `${API}/api/users/${currentUser.id}/profile`, 
        { avatar: mediaUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await refreshUserData();
      setShowMediaSelector(false);
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Failed to update profile photo:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.detail || "Failed to update profile photo");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="sticky top-0 z-10 glass-surface backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <button onClick={() => navigate("/settings")} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="relative">
          <div className="flex items-center gap-6">
            <div className="relative group w-24 h-24 rounded-full border-4 border-cyan-400/30 overflow-hidden bg-gray-800 shadow-lg shadow-cyan-400/20">
              <img 
                src={currentUser.avatar ? getMediaUrl(currentUser.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                alt={currentUser.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name || currentUser.email}`;
                }}
              />
              <button
                onClick={() => setShowMediaSelector(true)}
                className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <Camera size={20} className="text-white" />
              </button>
            </div>

            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-2xl font-bold text-white bg-transparent border-b-2 border-cyan-400 focus:outline-none" autoFocus />
                  <button onClick={handleNameEdit} className="p-1 rounded bg-green-500/20 hover:bg-green-500/30"><Check size={16} className="text-green-400" /></button>
                  <button onClick={() => setIsEditingName(false)} className="p-1 rounded bg-red-500/20 hover:bg-red-500/30"><X size={16} className="text-red-400" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-white">{currentUser.name}</h2>
                  <button onClick={() => { setEditedName(currentUser.name); setIsEditingName(true); }} className="p-1 hover:bg-cyan-400/10 rounded transition-all">
                    <Edit3 size={16} className="text-cyan-400" />
                  </button>
                </div>
              )}
              <p className="text-cyan-400 text-sm mb-3">@{currentUser.handle}</p>
              <div className="flex items-center gap-6">
                <div className="text-center"><div className="text-lg font-bold text-white">{userPosts.length}</div><div className="text-xs text-gray-500">Posts</div></div>
                <div className="text-center"><div className="text-lg font-bold text-white">{currentUser.friends?.length || 0}</div><div className="text-xs text-gray-500">Friends</div></div>
                <div className="text-center"><div className="text-lg font-bold text-white">{userTribes.length}</div><div className="text-xs text-gray-500">Tribes</div></div>
              </div>
            </div>
          </div>

          {currentUser.bio && <p className="mt-4 text-gray-400 text-sm leading-relaxed">{currentUser.bio}</p>}

          <div className="flex items-center gap-2 mt-6">
            <button onClick={() => navigate("/messenger")} className="flex-1 py-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 font-semibold hover:bg-cyan-400/20 transition-all flex items-center justify-center gap-2">
              <MessageCircle size={18} />Message
            </button>
            <button onClick={() => navigate("/analytics")} className="flex-1 py-2.5 rounded-xl bg-purple-400/10 border border-purple-400/30 text-purple-400 font-semibold hover:bg-purple-400/20 transition-all flex items-center justify-center gap-2">
              <Phone size={18} />Analytics
            </button>
          </div>

        </div>

        <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
          {[
            { id: "posts", label: "Posts", icon: Grid }, 
            { id: "friends", label: "Friends", icon: Users }, 
            { id: "tribes", label: "Tribes", icon: Users }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <tab.icon size={18} />{tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "posts" && (
            <div className="space-y-4">
              {userPosts.length > 0 ? userPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser}
                  onLike={async (postId) => {
                    try {
                      const res = await axios.post(`${API}/posts/${postId}/like?userId=${currentUser.id}`);
                      setUserPosts(userPosts.map(p => p.id === postId ? { ...p, ...res.data } : p));
                    } catch (error) {
                      toast.error("Failed to like post");
                    }
                  }}
                />
              )) : (
                <div className="py-16 text-center glass-card">
                  <Grid size={48} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500 mb-4">No posts yet</p>
                  <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl font-semibold transition-all">Create Post</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "friends" && (
            <div className="space-y-3">
              {currentUser.friends && currentUser.friends.length > 0 ? (
                currentUser.friends.map(friendId => (
                  <FriendListItem key={friendId} friendId={friendId} navigate={navigate} />
                ))
              ) : (
                <div className="py-16 text-center">
                  <Users size={48} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500 mb-4">No friends yet</p>
                  <button onClick={() => navigate('/people')} className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl font-semibold transition-all">Find Friends</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "tribes" && (
            <div className="space-y-3">
              {userTribes.length > 0 ? userTribes.map(tribe => (
                <div key={tribe.id} className="p-4 rounded-xl bg-gray-900/30 border border-gray-800 hover:border-cyan-400/30 transition-all cursor-pointer" onClick={() => navigate(`/tribe/${tribe.id}`)}>
                  <div className="flex items-center justify-between">
                    <div><h3 className="font-semibold text-white mb-1">{tribe.name}</h3><p className="text-sm text-gray-500">{tribe.members?.length || 0} members</p></div>
                    <Users size={20} className="text-cyan-400" />
                  </div>
                </div>
              )) : <div className="py-16 text-center"><Users size={48} className="mx-auto mb-4 text-gray-700" /><p className="text-gray-500">No tribes joined yet</p></div>}
            </div>
          )}

          {activeTab === "tickets" && (
            <div className="space-y-4">
              {userTickets.length > 0 ? userTickets.map(ticket => (
                <div key={ticket.id} className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 backdrop-blur-sm">
                  {/* Event Info Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {ticket.eventName || ticket.event?.name || 'Event'}
                      </h3>
                      <p className="text-sm text-gray-400 mb-1">
                        📅 {ticket.eventDate || ticket.event?.date || 'Date TBD'}
                      </p>
                      <p className="text-sm text-gray-400">
                        📍 {ticket.eventLocation || ticket.event?.location || 'Location TBD'}
                      </p>
                    </div>
                  </div>
                  
                  {/* QR Code - Prominent Display */}
                  {ticket.qrCodeImage && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-white rounded-2xl p-4 shadow-lg">
                        <img 
                          src={ticket.qrCodeImage} 
                          alt="Ticket QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Ticket Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-black/20 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ticket Type</p>
                      <p className="text-sm font-semibold text-cyan-400">{ticket.tier || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <p className="text-sm font-semibold text-green-400">{ticket.status || 'Active'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <p className="text-sm font-semibold text-white">₹{ticket.price || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Ticket ID</p>
                      <p className="text-xs font-mono text-gray-400">{ticket.id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2.5 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 rounded-xl font-semibold text-sm transition-all border border-cyan-400/20">
                      View Event
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-purple-400/10 hover:bg-purple-400/20 text-purple-400 rounded-xl font-semibold text-sm transition-all border border-purple-400/20">
                      Share Ticket
                    </button>
                  </div>
                  
                  {/* Scan Instructions */}
                  <div className="mt-4 p-3 bg-cyan-400/5 border border-cyan-400/20 rounded-xl">
                    <p className="text-xs text-center text-gray-400">
                      📱 Show this QR code at the venue entrance for check-in
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-16 text-center">
                  <Ticket size={48} className="mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500 mb-4">No tickets yet</p>
                  <button onClick={() => navigate('/discover')} className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl font-semibold transition-all">Browse Events</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "marketplace" && (
            <div className="space-y-4">
              {/* New Marketplace Promo */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
                <div className="text-center">
                  <div className="text-5xl mb-4">🛍️</div>
                  <h3 className="text-xl font-bold text-white mb-2">New Marketplace Available!</h3>
                  <p className="text-gray-400 mb-4">Buy & sell products with integrated delivery</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("/products")}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-xl font-bold"
                    >
                      Shop Now
                    </button>
                    <button
                      onClick={() => navigate("/seller-dashboard")}
                      className="flex-1 px-6 py-3 bg-white/5 border border-cyan-400/30 text-cyan-400 rounded-xl font-bold"
                    >
                      Start Selling
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
              {marketplaceItems.length > 0 ? marketplaceItems.map(item => (
                <div key={item.id} className="rounded-xl overflow-hidden bg-gray-900/30 border border-gray-800 hover:border-cyan-400/30 transition-all cursor-pointer" onClick={() => navigate(`/marketplace/${item.id}`)}>
                  <div className="aspect-square bg-gray-800">
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={48} className="text-gray-700" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm mb-1 truncate">{item.name || 'Product'}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-cyan-400 font-bold text-lg">₹{item.price || 0}</p>
                      {item.sold && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">Sold</span>}
                      {!item.sold && item.stock > 0 && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">{item.stock} left</span>}
                    </div>
                  </div>
                </div>
              )) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="profile" />

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelectorModal
          user={currentUser}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleProfilePictureSelect}
        />
      )}
    </div>
  );
};

// Friend List Item Component
const FriendListItem = ({ friendId, navigate }) => {
  const [friend, setFriend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriend = async () => {
      try {
        const res = await axios.get(`${API}/users/${friendId}`);
        setFriend(res.data);
      } catch (error) {
        console.error("Failed to fetch friend:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFriend();
  }, [friendId]);

  if (loading) return <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-800 animate-pulse"><div className="h-12 bg-gray-800 rounded"></div></div>;
  if (!friend) return null;

  return (
    <div 
      className="p-4 rounded-xl bg-gray-900/30 border border-gray-800 hover:border-cyan-400/30 transition-all cursor-pointer flex items-center justify-between"
      onClick={() => navigate(`/profile/${friendId}`)}
    >
      <div className="flex items-center gap-3">
        <img 
          src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} 
          alt={friend.name}
          className="w-12 h-12 rounded-full border-2 border-cyan-400/30"
        />
        <div>
          <h3 className="font-semibold text-white">{friend.name}</h3>
          <p className="text-sm text-cyan-400">@{friend.handle}</p>
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/messenger?userId=${friendId}`);
        }}
        className="px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-400/20 transition-all"
      >
        Message
      </button>
    </div>
  );
};

export default ProfileVibe;