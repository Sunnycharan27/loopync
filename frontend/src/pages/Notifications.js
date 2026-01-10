import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { ArrowLeft, Heart, MessageCircle, Users, ShoppingBag, Ticket, UserPlus, Bell, Image, Play, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BottomNav from "../components/BottomNav";
import { useWebSocket } from "../context/WebSocketContext";

const Notifications = () => {
  const { currentUser } = useContext(AuthContext);
  const { connected, lastMessage } = useWebSocket() || { connected: false, lastMessage: null };
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format time ago helper
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (lastMessage?.type === 'notification' && lastMessage?.data?.userId === currentUser?.id) {
      // Add new notification to the top
      setNotifications(prev => [lastMessage.data, ...prev]);
      toast.success('New notification!');
    }
  }, [lastMessage, currentUser]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications?userId=${currentUser.id}`);
      setNotifications(res.data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read
    if (!notif.read) {
      try {
        await axios.post(`${API}/notifications/${notif.id}/read`);
        setNotifications(prev => 
          prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error('Failed to mark notification as read');
      }
    }

    // Deep link routing based on notification type
    const { type, payload, fromUserId, contentId } = notif;
    switch (type) {
      case 'new_follower':
      case 'follow':
      case 'follow_request':
        // Navigate to the follower's profile
        if (fromUserId || notif.fromUser?.id) {
          navigate(`/user/${fromUserId || notif.fromUser?.id}`);
        }
        break;
      case 'post_like':
      case 'like':
      case 'post_comment':
      case 'comment':
      case 'share':
        // Navigate to the post
        if (contentId || payload?.postId) {
          navigate(`/post/${contentId || payload?.postId}`);
        } else {
          navigate('/');
        }
        break;
      case 'reel_like':
        if (payload?.reelId) {
          navigate(`/reels?id=${payload.reelId}`);
        }
        break;
      case 'tribe_join':
        if (payload?.tribeId) {
          navigate(`/tribes/${payload.tribeId}`);
        }
        break;
      case 'dm':
      case 'message':
        navigate('/messenger');
        break;
      case 'order_placed':
      case 'order_ready':
      case 'ticket_bought':
        navigate('/discover');
        break;
      case 'mention':
        if (payload?.postId) {
          navigate(`/post/${payload.postId}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_follower':
      case 'follow':
        return <UserPlus size={18} className="text-blue-400" />;
      case 'follow_request':
        return <UserPlus size={18} className="text-orange-400" />;
      case 'post_like':
      case 'like':
        return <Heart size={18} className="text-pink-400 fill-pink-400" />;
      case 'post_comment':
      case 'comment':
        return <MessageCircle size={18} className="text-cyan-400" />;
      case 'dm':
      case 'message':
        return <MessageCircle size={18} className="text-green-400 fill-green-400" />;
      case 'tribe_join':
        return <Users size={18} className="text-purple-400" />;
      case 'reel_like':
        return <Play size={18} className="text-pink-400" />;
      case 'share':
        return <Share2 size={18} className="text-orange-400" />;
      case 'mention':
        return <span className="text-cyan-400 font-bold">@</span>;
      case 'order_placed':
      case 'order_ready':
        return <ShoppingBag size={18} className="text-yellow-400" />;
      case 'ticket_bought':
        return <Ticket size={18} className="text-purple-400" />;
      default:
        return <Bell size={18} className="text-gray-400" />;
    }
  };

  const getNotificationText = (notif) => {
    const { type, payload } = notif;
    switch (type) {
      case 'new_follower':
      case 'follow':
        return 'started following you';
      case 'follow_request':
        return 'wants to follow you';
      case 'post_like':
      case 'like':
        return 'liked your post';
      case 'reel_like':
        return 'liked your reel';
      case 'post_comment':
      case 'comment':
        return payload?.text ? `commented: "${payload.text.substring(0, 50)}${payload.text.length > 50 ? '...' : ''}"` : 'commented on your post';
      case 'tribe_join':
        return `joined ${payload?.tribeName || 'your tribe'}`;
      case 'share':
        return 'shared your post';
      case 'mention':
        return 'mentioned you in a post';
      case 'order_placed':
        return `Order placed • ₹${payload?.total || 0}`;
      case 'order_ready':
        return 'Your order is ready!';
      case 'ticket_bought':
        return 'Ticket purchased successfully';
      case 'dm':
      case 'message':
        return payload?.text ? `sent: "${payload.text.substring(0, 40)}${payload.text.length > 40 ? '...' : ''}"` : 'sent you a message';
      default:
        return notif.message || 'New activity';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f021e' }}>
        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-10 glass-surface p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-cyan-400">
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold neon-text">Notifications</h1>
                {connected && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">Stay updated</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* All Notifications */}
          {notifications.length === 0 ? (
            <div className="text-center py-12 glass-card p-8">
              <Bell size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No notifications yet</p>
              <p className="text-gray-500 text-sm mt-2">When someone follows you, likes or comments on your posts, you'll see it here</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`glass-card p-4 cursor-pointer hover:bg-cyan-400/5 transition-all ${
                  !notif.read ? 'border-l-4 border-cyan-400 bg-cyan-400/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* User Avatar or Icon */}
                  <div className="relative flex-shrink-0">
                    {notif.fromUser?.avatar ? (
                      <img 
                        src={notif.fromUser.avatar.startsWith('/api') 
                          ? `${API.replace('/api', '')}${notif.fromUser.avatar}` 
                          : notif.fromUser.avatar}
                        alt={notif.fromUser.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.fromUser?.handle || 'user'}`;
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                        {getNotificationIcon(notif.type)}
                      </div>
                    )}
                    {/* Type indicator badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">
                          <span className="font-bold text-white hover:underline">
                            {notif.fromUser?.name || notif.fromUserName || 'Someone'}
                          </span>
                          {notif.fromUser?.isVerified && (
                            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-cyan-400 rounded-full">
                              <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                              </svg>
                            </span>
                          )}
                          <span className="text-gray-400"> {getNotificationText(notif)}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav active="notifications" />
    </div>
  );
};

export default Notifications;