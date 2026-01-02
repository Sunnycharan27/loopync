import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import BottomNav from "../components/BottomNav";
import TopHeader from "../components/TopHeader";
import { TrendingUp, Users, Activity, Shield, Heart, MessageCircle, Eye, Share2, Award, BarChart3, Bug, Lightbulb, CheckCircle, Clock, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";

const Analytics = () => {
  const { currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("user");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState("all");

  // Check if current user is admin (loopyncpvt@gmail.com)
  const isAdmin = currentUser?.email === 'loopyncpvt@gmail.com';

  const tabs = [
    { id: "user", name: "My Analytics", icon: <Activity size={16} /> },
    { id: "creator", name: "Creator", icon: <TrendingUp size={16} /> },
    // Only show Platform and Feedback tabs for admin
    ...(isAdmin ? [
      { id: "admin", name: "Platform", icon: <Shield size={16} /> },
      { id: "feedback", name: "Feedback", icon: <MessageCircle size={16} /> }
    ] : []),
  ];

  useEffect(() => {
    fetchAnalytics();
    if (activeTab === "feedback" && isAdmin) {
      fetchFeedback();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      switch (activeTab) {
        case "user":
          endpoint = `/analytics/${currentUser.id}`;
          break;
        case "creator":
          endpoint = `/analytics/creator/${currentUser.id}`;
          break;
        case "admin":
          endpoint = `/analytics/admin?adminUserId=${currentUser.id}`;
          break;
        case "feedback":
          // No analytics endpoint for feedback
          setLoading(false);
          return;
        default:
          endpoint = `/analytics/${currentUser.id}`;
      }
      const res = await axios.get(`${API}${endpoint}`);
      setAnalytics(res.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await axios.get(`${API}/feedback`);
      setFeedback(res.data || []);
    } catch (error) {
      console.error("Failed to load feedback");
    }
  };

  const updateFeedbackStatus = async (feedbackId, status) => {
    try {
      await axios.put(`${API}/feedback/${feedbackId}/status?status=${status}`);
      toast.success(`Marked as ${status}`);
      fetchFeedback();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredFeedback = feedback.filter(f => {
    if (feedbackFilter === "all") return true;
    if (feedbackFilter === "problems") return f.type === "problem";
    if (feedbackFilter === "suggestions") return f.type === "suggestion";
    if (feedbackFilter === "new") return f.status === "new";
    if (feedbackFilter === "resolved") return f.status === "resolved";
    return true;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <TopHeader title="Analytics" subtitle="Track your performance" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white'
                  : 'glass-card text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <>
            {activeTab === "user" && <UserAnalytics data={analytics} />}
            {activeTab === "creator" && <CreatorDashboard data={analytics} />}
            {activeTab === "admin" && <AdminDashboard data={analytics} />}
            {activeTab === "feedback" && (
              <FeedbackDashboard 
                feedback={filteredFeedback} 
                filter={feedbackFilter}
                setFilter={setFeedbackFilter}
                onUpdateStatus={updateFeedbackStatus}
                totalCount={feedback.length}
                problemsCount={feedback.filter(f => f.type === "problem").length}
                suggestionsCount={feedback.filter(f => f.type === "suggestion").length}
              />
            )}
          </>
        )}
      </div>

      <BottomNav active="profile" />
    </div>
  );
};

const UserAnalytics = ({ data }) => (
  <div className="space-y-4">
    {/* Overview Stats */}
    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={<Activity />} label="Total Posts" value={data.totalPosts || 0} color="cyan" />
      <StatCard icon={<Eye />} label="Total VibeZone" value={data.totalReels || 0} color="purple" />
      <StatCard icon={<Heart />} label="Total Likes" value={data.totalLikes || 0} color="red" />
      <StatCard icon={<MessageCircle />} label="Total Comments" value={data.totalComments || 0} color="blue" />
    </div>

    {/* Engagement */}
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-cyan-400" />
        Engagement Overview
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Followers</span>
          <span className="text-white font-bold">{data.followersCount || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Following</span>
          <span className="text-white font-bold">{data.followingCount || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Engagement Rate</span>
          <span className="text-cyan-400 font-bold">{data.engagementRate || 0}%</span>
        </div>
      </div>
    </div>

    {/* Weekly Activity */}
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">Weekly Activity</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-cyan-400/10 border border-cyan-400/30">
          <p className="text-gray-400 text-sm mb-1">Posts This Week</p>
          <p className="text-2xl font-bold text-cyan-400">{data.weeklyEngagement?.posts || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-400/10 border border-purple-400/30">
          <p className="text-gray-400 text-sm mb-1">VibeZone This Week</p>
          <p className="text-2xl font-bold text-purple-400">{data.weeklyEngagement?.reels || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-green-400/10 border border-green-400/30">
          <p className="text-gray-400 text-sm mb-1">Likes This Week</p>
          <p className="text-2xl font-bold text-green-400">{data.weeklyEngagement?.likes || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-400/10 border border-orange-400/30">
          <p className="text-gray-400 text-sm mb-1">Comments This Week</p>
          <p className="text-2xl font-bold text-orange-400">{data.weeklyEngagement?.comments || 0}</p>
        </div>
      </div>
    </div>
  </div>
);

const CreatorDashboard = ({ data }) => (
  <div className="space-y-4">
    {/* Reach Stats */}
    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={<Users />} label="Followers" value={data.followersCount || 0} color="cyan" trend={data.followersGrowth} />
      <StatCard icon={<Eye />} label="Total Reach" value={data.totalReach || 0} color="purple" />
    </div>

    {/* Content Performance */}
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">Content Breakdown</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Posts</span>
          <span className="text-white font-bold">{data.contentBreakdown?.posts || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">VibeZone</span>
          <span className="text-white font-bold">{data.contentBreakdown?.reels || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total Engagement</span>
          <span className="text-cyan-400 font-bold">{data.contentBreakdown?.totalEngagement || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Avg Engagement Rate</span>
          <span className="text-cyan-400 font-bold">{data.avgEngagementRate || "0%"}</span>
        </div>
      </div>
    </div>

    {/* Top Content */}
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">Top Performing Posts</h3>
      {data.topPosts && data.topPosts.length > 0 ? (
        <div className="space-y-2">
          {data.topPosts.slice(0, 3).map((post, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-gray-800/50 flex items-center justify-between">
              <p className="text-gray-300 text-sm truncate flex-1">{post.content?.substring(0, 50)}...</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-400 flex items-center gap-1">
                  <Heart size={12} />
                  {post.likes?.length || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-4">No posts yet</p>
      )}
    </div>
  </div>
);

const AdminDashboard = ({ data }) => (
  <div className="space-y-4">
    {/* Platform Stats */}
    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={<Users />} label="Total Users" value={data.totalUsers || 0} color="cyan" />
      <StatCard icon={<Activity />} label="Active Users" value={data.activeUsers || 0} color="green" />
      <StatCard icon={<MessageCircle />} label="Total Posts" value={data.totalPosts || 0} color="purple" />
      <StatCard icon={<Eye />} label="Total VibeZone" value={data.totalReels || 0} color="orange" />
    </div>

    {/* Verified Users Section */}
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="text-cyan-400" />
          Verified Users ({data.verifiedUsersCount || 0})
        </h3>
        {data.pendingVerifications > 0 && (
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
            {data.pendingVerifications} Pending
          </span>
        )}
      </div>
      
      {data.verifiedUsers && data.verifiedUsers.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.verifiedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{user.name}</p>
                  <span className="w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  </span>
                </div>
                <p className="text-sm text-gray-400">@{user.handle || 'user'}</p>
              </div>
              <span className="text-xs text-gray-500">
                {user.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString() : 'Verified'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-4">No verified users yet</p>
      )}
    </div>

    {/* Engagement Overview */}
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">Platform Engagement</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total Likes</span>
          <span className="text-white font-bold">{data.totalLikes || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Total Comments</span>
          <span className="text-white font-bold">{data.totalComments || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Engagement Rate</span>
          <span className="text-cyan-400 font-bold">{data.platformEngagementRate || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Growth Rate</span>
          <span className="text-green-400 font-bold">{data.growthRate || "0%"}</span>
        </div>
      </div>
    </div>

    {/* Community Stats */}
    <div className="grid grid-cols-2 gap-4">
      <StatCard icon={<Users />} label="Total Tribes" value={data.totalTribes || 0} color="purple" />
      <StatCard icon={<Activity />} label="Total Rooms" value={data.totalRooms || 0} color="cyan" />
    </div>
  </div>
);

// Feedback Dashboard Component for Admin
const FeedbackDashboard = ({ feedback, filter, setFilter, onUpdateStatus, totalCount, problemsCount, suggestionsCount }) => (
  <div className="space-y-4">
    {/* Stats Cards */}
    <div className="grid grid-cols-3 gap-3">
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-400/10 to-cyan-400/5 border border-cyan-400/30">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle size={16} className="text-cyan-400" />
          <span className="text-gray-400 text-xs">Total</span>
        </div>
        <p className="text-2xl font-bold text-white">{totalCount}</p>
      </div>
      <div className="p-4 rounded-xl bg-gradient-to-br from-red-400/10 to-red-400/5 border border-red-400/30">
        <div className="flex items-center gap-2 mb-1">
          <Bug size={16} className="text-red-400" />
          <span className="text-gray-400 text-xs">Problems</span>
        </div>
        <p className="text-2xl font-bold text-white">{problemsCount}</p>
      </div>
      <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-400/10 to-yellow-400/5 border border-yellow-400/30">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={16} className="text-yellow-400" />
          <span className="text-gray-400 text-xs">Ideas</span>
        </div>
        <p className="text-2xl font-bold text-white">{suggestionsCount}</p>
      </div>
    </div>

    {/* Filter Tabs */}
    <div className="flex gap-2 overflow-x-auto pb-2">
      {[
        { id: "all", label: "All" },
        { id: "problems", label: "Problems" },
        { id: "suggestions", label: "Suggestions" },
        { id: "new", label: "New" },
        { id: "resolved", label: "Resolved" }
      ].map(f => (
        <button
          key={f.id}
          onClick={() => setFilter(f.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            filter === f.id 
              ? 'bg-cyan-500 text-black' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>

    {/* Feedback List */}
    <div className="space-y-3">
      {feedback.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No feedback yet</p>
        </div>
      ) : (
        feedback.map(item => (
          <div 
            key={item.id} 
            className={`p-4 rounded-xl border ${
              item.type === 'problem' 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-yellow-500/5 border-yellow-500/20'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {item.type === 'problem' ? (
                  <Bug size={18} className="text-red-400" />
                ) : (
                  <Lightbulb size={18} className="text-yellow-400" />
                )}
                <span className={`text-sm font-semibold ${
                  item.type === 'problem' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {item.type === 'problem' ? 'Problem Report' : 'Suggestion'}
                </span>
                {item.category && (
                  <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                    {item.category}
                  </span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                item.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                item.status === 'in_progress' ? 'bg-orange-500/20 text-orange-400' :
                item.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {item.status || 'new'}
              </span>
            </div>
            
            {item.title && (
              <h4 className="text-white font-semibold mb-1">{item.title}</h4>
            )}
            
            <p className="text-gray-300 text-sm mb-3">{item.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {item.email && (
                  <a href={`mailto:${item.email}`} className="flex items-center gap-1 text-cyan-400 hover:underline">
                    <Mail size={12} />
                    {item.email}
                  </a>
                )}
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {item.status !== 'in_progress' && (
                  <button
                    onClick={() => onUpdateStatus(item.id, 'in_progress')}
                    className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition"
                    title="Mark In Progress"
                  >
                    <Clock size={14} />
                  </button>
                )}
                {item.status !== 'resolved' && (
                  <button
                    onClick={() => onUpdateStatus(item.id, 'resolved')}
                    className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition"
                    title="Mark Resolved"
                  >
                    <CheckCircle size={14} />
                  </button>
                )}
                {item.email && (
                  <a
                    href={`mailto:${item.email}?subject=Re: Your ${item.type} report on Loopync&body=Hi,%0D%0A%0D%0AThank you for your feedback regarding:%0D%0A"${item.description?.substring(0, 100)}..."%0D%0A%0D%0A`}
                    className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition"
                    title="Reply via Email"
                  >
                    <Mail size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const StatCard = ({ icon, label, value, color, trend }) => {
  const colors = {
    cyan: "from-cyan-400/10 to-cyan-400/5 border-cyan-400/30 text-cyan-400",
    purple: "from-purple-400/10 to-purple-400/5 border-purple-400/30 text-purple-400",
    red: "from-red-400/10 to-red-400/5 border-red-400/30 text-red-400",
    blue: "from-blue-400/10 to-blue-400/5 border-blue-400/30 text-blue-400",
    green: "from-green-400/10 to-green-400/5 border-green-400/30 text-green-400",
    orange: "from-orange-400/10 to-orange-400/5 border-orange-400/30 text-orange-400",
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${colors[color] || colors.cyan}`}>
      <div className="flex items-center gap-2 mb-2">
        {React.cloneElement(icon, { size: 16 })}
        <p className="text-gray-400 text-xs">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend && <p className="text-xs text-green-400 mt-1">{trend}</p>}
    </div>
  );
};

export default Analytics;
