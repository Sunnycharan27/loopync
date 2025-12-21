import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { ArrowLeft, MapPin, Calendar, Link as LinkIcon, UserPlus, UserCheck, MessageCircle, UserX } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PostCard from "../components/PostCard";

const UserProfile = () => {
  const { userId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relationshipStatus, setRelationshipStatus] = useState(null); // null, 'friends', 'pending_sent', 'pending_received', 'blocked'
  const [requestId, setRequestId] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/users/${userId}/profile?currentUserId=${currentUser.id}`);
      
      setUser(res.data.user);
      setPosts(res.data.posts.map(p => ({
        ...p,
        media: p.media && p.media.startsWith('/uploads')
          ? `${process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL}${p.media}`
          : p.media
      })));
      setFollowersCount(res.data.followersCount || 0);
      setFollowingCount(res.data.followingCount || 0);
      setRelationshipStatus(res.data.relationshipStatus);
    } catch (error) {
      toast.error("Failed to load profile");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Handle Follow/Unfollow
  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("Please login to follow");
      return;
    }
    
    try {
      const token = localStorage.getItem('loopync_token');
      const response = await axios.post(
        `${API}/users/${currentUser.id}/follow`,
        { targetUserId: userId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast.success(response.data.action === 'followed' ? 'Following!' : 'Unfollowed');
      // Reload profile to update follower count
      fetchUserProfile();
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Failed to follow user");
      toast.error(errorMsg);
    }
  };

  const handleMessage = async () => {
    try {
      const token = localStorage.getItem('loopync_token');
      // Start conversation with the user
      await axios.post(
        `${API}/messenger/conversations`,
        { participantIds: [currentUser.id, userId] },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      navigate('/messenger');
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Cannot message this user");
      toast.error(errorMsg);
    }
  };

  const handleLike = async (postId) => {
      toast.error("Failed to cancel request");
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await axios.post(`${API}/friend-requests/${requestId}/accept`);
      toast.success("Friend request accepted!");
      fetchUserProfile(); // Refetch to update relationship status and counts
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const handleMessage = async () => {
    try {
      // Create or get DM thread
      const res = await axios.post(`${API}/dm/thread?userId=${currentUser.id}&peerUserId=${userId}`);
      navigate(`/messenger/${res.data.threadId}`);
    } catch (error) {
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || "Cannot message this user");
      toast.error(errorMsg);
    }
  };

  const handleUnfriend = async () => {
    if (!window.confirm("Are you sure you want to unfriend this user?")) return;
    
    try {
      await axios.delete(`${API}/friends/${userId}?userId=${currentUser.id}`);
      toast.success("Unfriended");
      fetchUserProfile(); // Refetch to update relationship status and counts
    } catch (error) {
      toast.error("Failed to unfriend");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 glass-surface p-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-cyan-400">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-xs text-gray-400">@{user.handle}</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="glass-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-24 h-24 rounded-full ring-4 ring-cyan-400/20"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                <p className="text-gray-400 mb-2">@{user.handle}</p>
                {user.bio && (
                  <p className="text-gray-300 mb-3">{user.bio}</p>
                )}
              </div>
            </div>

            {/* Action Buttons - Follow/Message */}
            {userId !== currentUser.id && (
              <div className="flex gap-2">
                {/* Follow/Following Button */}
                {currentUser.following?.includes(userId) ? (
                  <button
                    onClick={handleFollow}
                    className="flex-1 py-2 px-4 rounded-full bg-gray-700 text-white font-semibold hover:bg-red-500/20 hover:text-red-400 transition-all"
                  >
                    Following
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className="flex-1 py-2 px-4 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-500 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={18} />
                    Follow
                  </button>
                )}

                {/* Message Button */}
                <button
                  onClick={handleMessage}
                  className="flex-1 py-2 px-4 rounded-full bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Message
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-700">
              <div>
                <div className="text-xl font-bold text-white">{posts.length}</div>
                <div className="text-xs text-gray-400">Posts</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{followersCount}</div>
                <div className="text-xs text-gray-400">Followers</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{followingCount}</div>
                <div className="text-xs text-gray-400">Following</div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-4">Posts</h3>
            {posts.length === 0 ? (
              <div className="text-center py-12 glass-card p-8">
                <p className="text-gray-400">No posts yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onLike={async (postId) => {
                      await axios.post(`${API}/posts/${postId}/like?userId=${currentUser.id}`);
                      fetchUserProfile();
                    }}
                    onRepost={async (postId) => {
                      await axios.post(`${API}/posts/${postId}/repost?userId=${currentUser.id}`);
                      fetchUserProfile();
                    }}
                    onDelete={async (postId) => {
                      await axios.delete(`${API}/posts/${postId}?userId=${currentUser.id}`);
                      fetchUserProfile();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
