import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext, API } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Camera, Edit3, Settings, Grid, Film, BarChart3,
  Mail, Phone, MessageCircle, Globe, MapPin,
  MoreHorizontal, UserPlus, UserCheck, UserMinus, Share2, BadgeCheck, Shield
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ImageCropModal from '../components/ImageCropModal';
import VerifiedBadge from '../components/VerifiedBadge';
import PostCard from '../components/PostCard';
import FollowersModal from '../components/FollowersModal';
import { getMediaUrl } from '../utils/mediaUtils';

const InstagramProfile = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { currentUser, refreshUserData } = useContext(AuthContext);
  
  const [profileUser, setProfileUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Content states
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Stats
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    pronouns: '',
    websiteUrl: '',
    contactEmail: '',
    phone: '',
    location: '',
    category: ''
  });
  
  // Image upload/crop
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Followers/Following modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');

  // Fetch fresh user data from server
  const fetchFreshUserData = async (userId) => {
    try {
      const response = await axios.get(`${API}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (username) {
        fetchUserByUsername(username);
      } else {
        if (currentUser) {
          // Always fetch fresh data from server for own profile
          const freshUserData = await fetchFreshUserData(currentUser.id);
          if (freshUserData) {
            setProfileUser(freshUserData);
            setIsOwnProfile(true);
            fetchUserContent(currentUser.id, freshUserData);
          } else {
            // Fallback to currentUser if fetch fails
            setProfileUser(currentUser);
            setIsOwnProfile(true);
            fetchUserContent(currentUser.id, currentUser);
          }
          setLoading(false);
        } else {
          // If no currentUser yet, set loading to false after a delay
          const timer = setTimeout(() => {
            if (!currentUser && !username) {
              setLoading(false);
            }
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    };
    
    loadProfile();
  }, [username, currentUser]);

  useEffect(() => {
    if (profileUser && currentUser && !isOwnProfile) {
      checkFollowStatus();
    }
  }, [profileUser, currentUser, isOwnProfile]);

  const fetchUserByUsername = async (username) => {
    try {
      const cleanUsername = username.replace('@', '');
      const response = await axios.get(`${API}/users/handle/${cleanUsername}`);
      const userData = response.data;
      setProfileUser(userData);
      setIsOwnProfile(currentUser && currentUser.id === userData.id);
      fetchUserContent(userData.id, userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('User not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = () => {
    if (currentUser && profileUser) {
      const following = currentUser.following || [];
      setIsFollowing(following.includes(profileUser.id));
    }
  };

  const fetchUserContent = async (userId, userData = null) => {
    try {
      const postsRes = await axios.get(`${API}/posts`);
      const userPosts = postsRes.data.filter(post => post.authorId === userId);
      setPosts(userPosts);
      
      const reelsRes = await axios.get(`${API}/reels`);
      const userReels = reelsRes.data.filter(reel => reel.authorId === userId);
      setReels(userReels);
      
      // Use passed userData or current profileUser
      const user = userData || profileUser;
      const followers = Array.isArray(user?.followers) ? user.followers.length : 0;
      const following = Array.isArray(user?.following) ? user.following.length : 0;
      
      setStats({
        posts: userPosts.length,
        followers: followers,
        following: following
      });
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.post(
        `${API}/users/${currentUser.id}/follow`,
        { targetUserId: profileUser.id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setIsFollowing(!isFollowing);
      setStats(prev => ({
        ...prev,
        followers: isFollowing ? prev.followers - 1 : prev.followers + 1
      }));
      
      toast.success(isFollowing ? 'Unfollowed' : 'Following');
      await refreshUserData();
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      fileInputRef.current.click();
    } else {
      setShowAvatarModal(true);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageBlob) => {
    setShowImageCrop(false);
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', croppedImageBlob, 'avatar.jpg');

      const token = localStorage.getItem('loopync_token');
      const response = await axios.post(
        `${API}/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const imageUrl = response.data.url;
      
      await axios.put(
        `${API}/users/${currentUser.id}`,
        { avatar: imageUrl },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success('Profile picture updated!');
      await refreshUserData();
      setProfileUser({ ...profileUser, avatar: imageUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      name: profileUser.name || '',
      bio: profileUser.bio || '',
      pronouns: profileUser.pronouns || '',
      websiteUrl: profileUser.websiteUrl || '',
      contactEmail: profileUser.contactEmail || '',
      phone: profileUser.phone || '',
      location: profileUser.location || '',
      category: profileUser.category || ''
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('loopync_token');
      await axios.put(
        `${API}/users/${currentUser.id}`,
        editForm,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success('Profile updated successfully!');
      await refreshUserData();
      setIsEditing(false);
      setProfileUser({ ...profileUser, ...editForm });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
        <div className="text-center">
          <p className="text-white text-lg mb-2">User not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-cyan-400 text-black rounded-lg hover:bg-cyan-500 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isVerifiedPage = profileUser.isVerified && (
    profileUser.accountType === 'public_figure' || 
    profileUser.accountType === 'business'
  );

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg border-b border-purple-800/30" style={{ background: 'rgba(15, 2, 30, 0.95)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            @{profileUser?.handle || 'user'}
            {profileUser?.isVerified && <VerifiedBadge size={20} />}
          </h1>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings size={20} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <button
              onClick={handleAvatarClick}
              className="relative group"
              disabled={uploadingAvatar}
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-2 ring-cyan-400/30 hover:ring-cyan-400 transition-all">
                <img
                  src={getMediaUrl(profileUser.avatar)}
                  alt={profileUser.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.name}`;
                  }}
                />
              </div>
              {isOwnProfile && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Stats & Info */}
          <div className="flex-1">
            {/* Stats Row */}
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{stats.posts}</div>
                <div className="text-sm text-gray-400">posts</div>
              </div>
              <button 
                onClick={() => {
                  setFollowModalType('followers');
                  setShowFollowersModal(true);
                }}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <div className="text-xl font-bold text-white">{stats.followers}</div>
                <div className="text-sm text-gray-400">followers</div>
              </button>
              <button 
                onClick={() => {
                  setFollowModalType('following');
                  setShowFollowersModal(true);
                }}
                className="text-center hover:opacity-80 transition-opacity"
              >
                <div className="text-xl font-bold text-white">{stats.following}</div>
                <div className="text-sm text-gray-400">following</div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={handleEditProfile}
                    className="flex-1 py-2 px-4 bg-gray-800/80 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                  {/* Admin Dashboard Button - Only for loopyncpvt@gmail.com */}
                  {currentUser?.email === 'loopyncpvt@gmail.com' && (
                    <button
                      onClick={() => navigate('/admin/verification')}
                      className="py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                      <Shield size={16} />
                      Admin Dashboard
                    </button>
                  )}
                  {!profileUser.isVerified && currentUser?.email !== 'loopyncpvt@gmail.com' ? (
                    <button
                      onClick={() => navigate('/verification')}
                      className="py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <BadgeCheck size={16} />
                      Get Verified
                    </button>
                  ) : profileUser.isVerified && (
                    <div className="py-2 px-4 bg-green-500/20 text-green-400 font-semibold rounded-lg flex items-center justify-center gap-2 border border-green-500/30">
                      <Shield size={16} />
                      Verified
                    </div>
                  )}
                  <button className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg transition-colors">
                    <Share2 size={20} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleFollow}
                    className={`flex-1 py-2 px-4 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isFollowing 
                        ? 'bg-gray-800/80 hover:bg-gray-700 text-white' 
                        : 'bg-cyan-400 hover:bg-cyan-500 text-black'
                    }`}
                  >
                    {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button 
                    onClick={() => navigate('/messenger')}
                    className="py-2 px-4 bg-gray-800/80 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Message
                  </button>
                  <button className="p-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-1">{profileUser.name}</h2>
          {profileUser.pronouns && (
            <p className="text-gray-400 text-sm mb-2">{profileUser.pronouns}</p>
          )}
          {profileUser.category && (
            <p className="text-cyan-400 text-sm mb-2">{profileUser.category}</p>
          )}
          {profileUser.bio && (
            <p className="text-white text-sm mb-2 whitespace-pre-wrap">{profileUser.bio}</p>
          )}
          {profileUser.websiteUrl && (
            <a
              href={profileUser.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 text-sm hover:underline flex items-center gap-1"
            >
              <Globe size={14} />
              {profileUser.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profileUser.location && (
            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {profileUser.location}
            </p>
          )}
        </div>

        {/* Contact Buttons (for Verified Pages) */}
        {isVerifiedPage && (
          <div className="flex items-center gap-2 mb-6">
            {profileUser.contactEmail && (
              <a
                href={`mailto:${profileUser.contactEmail}`}
                className="flex-1 py-2 px-4 bg-gray-800/80 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Email
              </a>
            )}
            {profileUser.phone && (
              <a
                href={`tel:${profileUser.phone}`}
                className="flex-1 py-2 px-4 bg-gray-800/80 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={16} />
                Call
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-t border-gray-800 flex items-center justify-around mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-t-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Grid size={18} />
            <span className="text-xs font-semibold uppercase">Posts</span>
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-t-2 transition-colors ${
              activeTab === 'reels'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Film size={18} />
            <span className="text-xs font-semibold uppercase">Vibes</span>
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 py-3 flex items-center justify-center gap-2 border-t-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <BarChart3 size={18} />
              <span className="text-xs font-semibold uppercase">Analytics</span>
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  currentUser={currentUser}
                  onLike={async (postId) => {
                    if (!currentUser) return;
                    try {
                      const token = localStorage.getItem('loopync_token');
                      await axios.post(`${API}/posts/${postId}/like?userId=${currentUser.id}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      const res = await axios.get(`${API}/posts/${postId}`);
                      setPosts(prev => prev.map(p => p.id === postId ? res.data : p));
                    } catch (error) {
                      console.error("Like error:", error);
                    }
                  }}
                  onDelete={async (postId) => {
                    if (!isOwnProfile && currentUser?.role !== 'super_admin') return;
                    if (!window.confirm("Are you sure you want to delete this post?")) return;
                    try {
                      const token = localStorage.getItem('loopync_token');
                      await axios.delete(`${API}/posts/${postId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setPosts(posts.filter(p => p.id !== postId));
                      setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
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
              <div className="text-center py-12">
                <p className="text-gray-400">No posts yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="grid grid-cols-3 gap-1">
            {reels.length > 0 ? (
              reels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => navigate(`/vibezone?reel=${reel.id}`)}
                  className="aspect-[9/16] bg-gray-800/50 rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
                >
                  <video
                    src={getMediaUrl(reel.videoUrl)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 text-white text-xs font-semibold">
                    {reel.views || 0} views
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-400">No vibes yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && isOwnProfile && (
          <div className="space-y-4">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Profile Analytics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-cyan-400/10 rounded-xl border border-cyan-400/30">
                  <p className="text-sm text-gray-400 mb-1">Total Posts</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.posts}</p>
                </div>
                <div className="p-4 bg-purple-400/10 rounded-xl border border-purple-400/30">
                  <p className="text-sm text-gray-400 mb-1">Followers</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.followers}</p>
                </div>
                <div className="p-4 bg-green-400/10 rounded-xl border border-green-400/30">
                  <p className="text-sm text-gray-400 mb-1">Following</p>
                  <p className="text-2xl font-bold text-green-400">{stats.following}</p>
                </div>
                <div className="p-4 bg-orange-400/10 rounded-xl border border-orange-400/30">
                  <p className="text-sm text-gray-400 mb-1">Engagement</p>
                  <p className="text-2xl font-bold text-orange-400">--</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/analytics')}
                className="w-full mt-4 py-3 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-lg transition-colors"
              >
                View Full Analytics
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-purple-800/30" style={{ background: '#0f021e' }}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Pronouns</label>
                <input
                  type="text"
                  value={editForm.pronouns}
                  onChange={(e) => setEditForm({ ...editForm, pronouns: e.target.value })}
                  placeholder="e.g., he/him, she/her, they/them"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Website</label>
                <input
                  type="url"
                  value={editForm.websiteUrl}
                  onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {isVerifiedPage && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      placeholder="e.g., Artist, Musician, Business"
                      className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Zoom Modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <img
            src={getMediaUrl(profileUser.avatar)}
            alt={profileUser.name}
            className="max-w-full max-h-full rounded-lg"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.name}`;
            }}
          />
        </div>
      )}

      {/* Image Crop Modal */}
      {showImageCrop && tempImage && (
        <ImageCropModal
          imageSrc={tempImage}
          onClose={() => {
            setShowImageCrop(false);
            setTempImage(null);
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          userId={profileUser.id}
          type={followModalType}
          onClose={() => setShowFollowersModal(false)}
          currentUser={currentUser}
        />
      )}

      <BottomNav active="profile" />
    </div>
  );
};

export default InstagramProfile;
