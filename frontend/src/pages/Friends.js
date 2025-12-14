import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import BottomNav from "../components/BottomNav";
import TopHeader from "../components/TopHeader";
import { Users, UserPlus, UserCheck, UserX, Clock, Check, X, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "../components/VerifiedBadge";

const Friends = () => {
  const { currentUser, refreshUserData } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('loopync_token');
      const headers = { Authorization: `Bearer ${token}` };

      switch (activeTab) {
        case "friends":
          const friendsRes = await axios.get(`${API}/users/${currentUser.id}/friends`, { headers });
          setFriends(friendsRes.data || []);
          break;
        case "followers":
          const followersRes = await axios.get(`${API}/users/${currentUser.id}/followers`, { headers });
          setFollowers(followersRes.data || []);
          break;
        case "following":
          const followingRes = await axios.get(`${API}/users/${currentUser.id}/following`, { headers });
          setFollowing(followingRes.data || []);
          break;
        case "requests":
          const requestsRes = await axios.get(`${API}/friend-requests?userId=${currentUser.id}`, { headers });
          const requests = requestsRes.data || [];
          setPendingRequests(requests.filter(r => r.toUserId === currentUser.id && r.status === "pending"));
          setSentRequests(requests.filter(r => r.fromUserId === currentUser.id && r.status === "pending"));
          break;
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.post(`${API}/friend-requests/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend request accepted!");
      fetchData();
      refreshUserData();
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.post(`${API}/friend-requests/${requestId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend request declined");
      fetchData();
    } catch (error) {
      toast.error("Failed to decline request");
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.delete(`${API}/friend-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend request cancelled");
      fetchData();
    } catch (error) {
      toast.error("Failed to cancel request");
    }
  };

  const handleUnfriend = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.delete(`${API}/friends/${currentUser.id}/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend removed");
      fetchData();
      refreshUserData();
    } catch (error) {
      toast.error("Failed to remove friend");
    }
  };

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.post(
        `${API}/users/${currentUser.id}/follow`,
        { targetUserId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(isFollowing ? "Unfollowed" : "Followed");
      fetchData();
      refreshUserData();
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const startConversation = (user) => {
    navigate('/messenger', { state: { recipient: user } });
  };

  const tabs = [
    { id: "friends", label: "Friends", icon: <Users size={18} />, count: currentUser?.friends?.length || 0 },
    { id: "followers", label: "Followers", icon: <UserPlus size={18} />, count: currentUser?.followers?.length || 0 },
    { id: "following", label: "Following", icon: <UserCheck size={18} />, count: currentUser?.following?.length || 0 },
    { id: "requests", label: "Requests", icon: <Clock size={18} />, count: pendingRequests.length },
  ];

  const filterUsers = (users) => {
    if (!searchQuery) return users;
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderUserCard = (user, type) => {
    const isFollowing = currentUser?.following?.includes(user.id);
    const isFriend = currentUser?.friends?.includes(user.id);

    return (
      <div key={user.id} className="glass-card p-4 hover:bg-gray-800/50 transition-all">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
            alt={user.name}
            className="w-14 h-14 rounded-full cursor-pointer object-cover"
            onClick={() => navigate(`/u/${user.handle}`)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold text-white truncate cursor-pointer hover:underline"
                onClick={() => navigate(`/u/${user.handle}`)}
              >
                {user.name}
              </h3>
              {user.isVerified && <VerifiedBadge size={16} />}
            </div>
            <p className="text-sm text-gray-400">@{user.handle}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {type === "friends" && (
              <>
                <button
                  onClick={() => startConversation(user)}
                  className="p-2 rounded-full bg-purple-500 text-white hover:bg-purple-400 transition-all"
                  title="Message"
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  onClick={() => handleUnfriend(user.id)}
                  className="p-2 rounded-full bg-gray-700 text-red-400 hover:bg-red-500/20 transition-all"
                  title="Remove Friend"
                >
                  <UserX size={18} />
                </button>
              </>
            )}
            
            {type === "followers" && !isFriend && (
              <button
                onClick={() => handleFollowToggle(user.id, isFollowing)}
                className={`px-4 py-2 rounded-full font-semibold text-sm ${
                  isFollowing 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-cyan-400 text-black hover:bg-cyan-300'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow Back'}
              </button>
            )}
            
            {type === "following" && (
              <button
                onClick={() => handleFollowToggle(user.id, true)}
                className="px-4 py-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 font-semibold text-sm"
              >
                Unfollow
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPendingRequest = (request) => {
    const user = request.fromUser;
    if (!user) return null;

    return (
      <div key={request.id} className="glass-card p-4">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
            alt={user.name}
            className="w-14 h-14 rounded-full cursor-pointer object-cover"
            onClick={() => navigate(`/u/${user.handle}`)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">{user.name}</h3>
              {user.isVerified && <VerifiedBadge size={16} />}
            </div>
            <p className="text-sm text-gray-400">@{user.handle}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAcceptRequest(request.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-all text-sm"
            >
              <Check size={16} />
              Accept
            </button>
            <button
              onClick={() => handleDeclineRequest(request.id)}
              className="p-2 rounded-full bg-gray-700 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSentRequest = (request) => {
    const user = request.toUser;
    if (!user) return null;

    return (
      <div key={request.id} className="glass-card p-4 opacity-75">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.handle}`}
            alt={user.name}
            className="w-14 h-14 rounded-full cursor-pointer object-cover"
            onClick={() => navigate(`/u/${user.handle}`)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">{user.name}</h3>
              {user.isVerified && <VerifiedBadge size={16} />}
            </div>
            <p className="text-sm text-gray-400">@{user.handle}</p>
            <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
              <Clock size={12} />
              Request pending
            </p>
          </div>
          
          <button
            onClick={() => handleCancelRequest(request.id)}
            className="px-4 py-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 font-semibold text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please login to view your friends</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 rounded-full bg-cyan-400 text-black font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pb-20">
      <TopHeader title="Friends & Followers" />

      <div className="max-w-3xl mx-auto px-4 pt-20">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-400 text-black font-semibold'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-black/20' : 'bg-cyan-400/20 text-cyan-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {activeTab !== "requests" && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "friends" && (
              filterUsers(friends).length > 0 ? (
                filterUsers(friends).map(user => renderUserCard(user, "friends"))
              ) : (
                <div className="glass-card p-8 text-center">
                  <Users size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">No friends yet</p>
                  <p className="text-sm text-gray-500 mt-2">Discover people and send friend requests!</p>
                  <button
                    onClick={() => navigate('/discover')}
                    className="mt-4 px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold"
                  >
                    Find People
                  </button>
                </div>
              )
            )}

            {activeTab === "followers" && (
              filterUsers(followers).length > 0 ? (
                filterUsers(followers).map(user => renderUserCard(user, "followers"))
              ) : (
                <div className="glass-card p-8 text-center">
                  <UserPlus size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">No followers yet</p>
                  <p className="text-sm text-gray-500 mt-2">Share your profile to get followers!</p>
                </div>
              )
            )}

            {activeTab === "following" && (
              filterUsers(following).length > 0 ? (
                filterUsers(following).map(user => renderUserCard(user, "following"))
              ) : (
                <div className="glass-card p-8 text-center">
                  <UserCheck size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Not following anyone yet</p>
                  <p className="text-sm text-gray-500 mt-2">Discover interesting people to follow!</p>
                  <button
                    onClick={() => navigate('/discover')}
                    className="mt-4 px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold"
                  >
                    Discover People
                  </button>
                </div>
              )
            )}

            {activeTab === "requests" && (
              <>
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <UserPlus size={20} className="text-cyan-400" />
                      Friend Requests ({pendingRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingRequests.map(request => renderPendingRequest(request))}
                    </div>
                  </div>
                )}

                {/* Sent Requests */}
                {sentRequests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Clock size={20} className="text-yellow-400" />
                      Sent Requests ({sentRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {sentRequests.map(request => renderSentRequest(request))}
                    </div>
                  </div>
                )}

                {pendingRequests.length === 0 && sentRequests.length === 0 && (
                  <div className="glass-card p-8 text-center">
                    <Clock size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">No pending requests</p>
                    <p className="text-sm text-gray-500 mt-2">All caught up!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <BottomNav active="discover" />
    </div>
  );
};

export default Friends;
