import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Globe, Mail, Phone, MapPin, Calendar, Users, FileText, BarChart3, Edit } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';
import VerifiedBadge from '../components/VerifiedBadge';
import PostCard from '../components/PostCard';
import { toast } from 'sonner';

const PageView = () => {
  const { pageId } = useParams();
  const [page, setPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchPage();
    fetchCurrentUser();
  }, [pageId]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('loopync_token');
      if (!token) return;
      
      const response = await axios.get(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchPage = async () => {
    try {
      const response = await axios.get(`${API}/pages/${pageId}`);
      setPage(response.data);
      setPosts(response.data.recentPosts || []);
      
      // Check if current user owns this page
      const token = localStorage.getItem('token');
      if (token) {
        const userResponse = await axios.get(`${API}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsOwner(userResponse.data.user.id === response.data.userId);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching page:', error);
      toast.error('Failed to load page');
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      celebrity: '⭐',
      influencer: '📱',
      politician: '🏛️',
      company: '🏢',
      brand: '🎯',
      media: '📺',
      organization: '🤝',
      public_figure: '👤'
    };
    return icons[category] || '✨';
  };

  const getCategoryColor = (category) => {
    const colors = {
      celebrity: 'from-purple-500 to-pink-500',
      influencer: 'from-cyan-500 to-blue-500',
      politician: 'from-red-500 to-orange-500',
      company: 'from-blue-500 to-indigo-500',
      brand: 'from-green-500 to-teal-500',
      media: 'from-yellow-500 to-orange-500',
      organization: 'from-gray-500 to-slate-500',
      public_figure: 'from-purple-500 to-blue-500'
    };
    return colors[category] || 'from-cyan-500 to-blue-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
          <p className="text-gray-400">This page doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pb-20">
      <TopHeader />
      
      <div className="pt-16">
        {/* Banner Image */}
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
          {page.bannerImage ? (
            <img 
              src={page.bannerImage} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${getCategoryColor(page.category)}`} />
          )}
          
          {/* Category Badge */}
          <div className="absolute top-4 right-4">
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getCategoryColor(page.category)} backdrop-blur-sm flex items-center gap-2`}>
              <span className="text-2xl">{getCategoryIcon(page.category)}</span>
              <span className="font-bold text-sm uppercase">
                {page.category?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Page Info */}
        <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={page.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={page.pageName}
                className="w-32 h-32 rounded-full border-4 border-gray-900 shadow-2xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{page.pageName}</h1>
                      {page.isVerified && <VerifiedBadge size={28} />}
                    </div>
                    <div className="text-gray-400 mb-3">@{page.handle}</div>
                    {page.bio && (
                      <p className="text-gray-300 mb-4">{page.bio}</p>
                    )}
                  </div>
                  
                  {isOwner && (
                    <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl flex items-center gap-2 transition-colors">
                      <Edit size={18} />
                      Edit Page
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <div className="text-2xl font-bold">{page.postCount || 0}</div>
                    <div className="text-sm text-gray-400">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{page.followerCount || 0}</div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {page.websiteUrl && (
                    <a 
                      href={page.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-cyan-400 hover:underline"
                    >
                      <Globe size={16} />
                      {page.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {page.email && (
                    <a 
                      href={`mailto:${page.email}`}
                      className="flex items-center gap-2 text-gray-300 hover:text-white"
                    >
                      <Mail size={16} />
                      {page.email}
                    </a>
                  )}
                  {page.phone && (
                    <a 
                      href={`tel:${page.phone}`}
                      className="flex items-center gap-2 text-gray-300 hover:text-white"
                    >
                      <Phone size={16} />
                      {page.phone}
                    </a>
                  )}
                  {page.location && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin size={16} />
                      {page.location}
                    </div>
                  )}
                </div>

                {/* Follow/Contact Button */}
                {!isOwner && (
                  <button className="w-full mt-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Users size={18} />
                    Follow
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-2 border-b border-gray-800 mb-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'posts'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  Posts
                </div>
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'about'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} />
                  About
                </div>
              </button>
              {isOwner && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 font-semibold transition-colors ${
                    activeTab === 'analytics'
                      ? 'text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} />
                    Analytics
                  </div>
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="glass-card p-12 rounded-2xl text-center">
                      <FileText size={48} className="text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No posts yet</p>
                    </div>
                  ) : (
                    posts.map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUser={currentUser}
                        onDelete={() => fetchPage()}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xl font-bold mb-4">About</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {page.about || 'No description available.'}
                    </p>
                  </div>
                  
                  {page.socialMediaLinks && Object.keys(page.socialMediaLinks).length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Social Media</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(page.socialMediaLinks).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors"
                          >
                            {platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={16} />
                      Joined {new Date(page.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && isOwner && (
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xl font-bold mb-4">Analytics</h3>
                  <p className="text-gray-400">Analytics dashboard coming soon...</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-sm text-gray-400 mb-1">Total Reach</div>
                      <div className="text-2xl font-bold">-</div>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-sm text-gray-400 mb-1">Engagement Rate</div>
                      <div className="text-2xl font-bold">-</div>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="text-sm text-gray-400 mb-1">Growth</div>
                      <div className="text-2xl font-bold">-</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default PageView;
