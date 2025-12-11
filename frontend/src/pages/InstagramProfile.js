import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Camera, Edit3, Settings, Grid, Film, Tag, Share2,
  Mail, Phone, MessageCircle, Globe, MapPin, Clock,
  MoreHorizontal, UserPlus, UserCheck, CheckCircle
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ImageCropModal from '../components/ImageCropModal';
import VerifiedBadge from '../components/VerifiedBadge';
import { getMediaUrl } from '../utils/mediaUtils';

const API = process.env.REACT_APP_BACKEND_URL || '';

const InstagramProfile = () => {
  const navigate = useNavigate();
  const { username } = useParams(); // For viewing other profiles via @username
  const { currentUser, refreshUserData } = useContext(AuthContext);
  
  const [profileUser, setProfileUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Content states
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [tagged, setTagged] = useState([]);
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
  
  // Profile picture zoom modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    if (username) {
      // Viewing someone else's profile via @username
      fetchUserByUsername(username);
    } else {
      // Viewing own profile
      if (currentUser) {
        setProfileUser(currentUser);
        setIsOwnProfile(true);
        fetchUserContent(currentUser.id);
        setLoading(false);
      }
    }
  }, [username, currentUser]);

  const fetchUserByUsername = async (username) => {
    try {
      const cleanUsername = username.replace('@', '');
      const response = await axios.get(`${API}/api/users/handle/${cleanUsername}`);
      setProfileUser(response.data);
      setIsOwnProfile(currentUser && currentUser.id === response.data.id);
      fetchUserContent(response.data.id);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('User not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContent = async (userId) => {
    try {
      // Fetch posts
      const postsRes = await axios.get(`${API}/api/posts`);
      const userPosts = postsRes.data.filter(post => post.authorId === userId);
      setPosts(userPosts);
      
      // Fetch reels
      const reelsRes = await axios.get(`${API}/api/reels`);
      const userReels = reelsRes.data.filter(reel => reel.authorId === userId);
      setReels(userReels);
      
      // Update stats
      setStats({
        posts: userPosts.length,
        followers: 0, // TODO: Implement followers count
        following: 0  // TODO: Implement following count
      });
    } catch (error) {
      console.error('Error fetching content:', error);
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
        `${API}/api/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const imageUrl = response.data.url;
      
      // Update user avatar
      await axios.put(
        `${API}/api/users/${currentUser.id}`,
        { avatar: imageUrl },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
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
        `${API}/api/users/${currentUser.id}`,
        editForm,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <p className="text-white">User not found</p>
      </div>
    );
  }

  const isVerifiedPage = profileUser.isVerified && (
    profileUser.accountType === 'public_figure' || 
    profileUser.accountType === 'business'
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            {profileUser.handle}
            {profileUser.isVerified && <VerifiedBadge size={20} />}
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
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-gray-700 hover:border-cyan-400 transition-colors">
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
              <button className="text-center hover:opacity-80 transition-opacity">
                <div className="text-xl font-bold text-white">{stats.followers}</div>
                <div className="text-sm text-gray-400">followers</div>
              </button>
              <button className="text-center hover:opacity-80 transition-opacity">
                <div className="text-xl font-bold text-white">{stats.following}</div>
                <div className="text-sm text-gray-400">following</div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={handleEditProfile}
                    className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
                    <Share2 size={20} />
                  </button>
                </>
              ) : (
                <>
                  <button className="flex-1 py-2 px-4 bg-cyan-400 hover:bg-cyan-500 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <UserPlus size={16} />
                    Follow
                  </button>
                  <button className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={16} />
                    Message
                  </button>
                  <button className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
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
            <p className="text-gray-400 text-sm mb-2">{profileUser.category}</p>
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
                className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Email
              </a>
            )}
            {profileUser.phone && (
              <a
                href={`tel:${profileUser.phone}`}
                className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
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
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-t-2 ${
              activeTab === 'posts'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400'
            }`}
          >
            <Grid size={18} />
            <span className="text-xs font-semibold uppercase">Posts</span>
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-t-2 ${
              activeTab === 'reels'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400'
            }`}
          >
            <Film size={18} />
            <span className="text-xs font-semibold uppercase">Vibes</span>
          </button>
          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex-1 py-3 flex items-center justify-center gap-2 border-t-2 ${
              activeTab === 'tagged'
                ? 'border-white text-white'
                : 'border-transparent text-gray-400'
            }`}
          >
            <Tag size={18} />
            <span className="text-xs font-semibold uppercase">Tagged</span>
          </button>
        </div>

        {/* Content Grid */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-1">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="aspect-square bg-gray-800 rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <img
                      src={getMediaUrl(post.mediaUrls[0])}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
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
                  className="aspect-[9/16] bg-gray-800 rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative"
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

        {activeTab === 'tagged' && (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-400">No tagged posts</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
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

      <BottomNav active="profile" />
    </div>
  );
};

export default InstagramProfile;
