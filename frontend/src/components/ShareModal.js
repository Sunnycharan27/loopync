import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { X, Users, Send, Link as LinkIcon, Copy, Check, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ShareModal = ({ isOpen, onClose, item, type = "post", contentPreview }) => {
  const { currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  // Map type to contentType for API
  const contentType = type === "video" ? "reel" : type;
  const contentId = item?.id;

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchFriends();
      setSelectedFriends([]);
      setMessage("");
    }
  }, [isOpen, currentUser]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const token = localStorage.getItem('loopync_token');
      // Try to get user's friends first
      const res = await axios.get(`${API}/users/${currentUser.id}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(res.data || []);
    } catch (error) {
      console.error("Failed to load friends from friends endpoint:", error);
      // Fallback: fetch all users except current user
      try {
        const res = await axios.get(`${API}/users`);
        const filtered = res.data.filter(u => u.id !== currentUser?.id);
        setFriends(filtered);
      } catch (e) {
        console.error("Failed to load users:", e);
        setFriends([]);
      }
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleShareToFriends = async () => {
    if (selectedFriends.length === 0) {
      toast.error("Please select at least one friend");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('loopync_token');
      const endpoint = `${API}/share/${contentType}/${contentId}`;
      
      const res = await axios.post(
        endpoint,
        {
          contentType,
          contentId,
          shareType: 'dm',
          toUserIds: selectedFriends,
          message: message || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const label = contentType === 'tribe' ? 'Invited' : 'Shared with';
        toast.success(`${label} ${res.data.sharedToCount || res.data.invitedCount || selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}!`);
        onClose();
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error(error.response?.data?.detail || "Failed to share");
    } finally {
      setLoading(false);
    }
  };

  const handleShareToTimeline = async () => {
    if (contentType !== 'post') {
      toast.error("Only posts can be shared to timeline");
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('loopync_token');
      const res = await axios.post(
        `${API}/share/post/${contentId}`,
        {
          contentType: 'post',
          contentId,
          shareType: 'feed',
          message: message || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        toast.success("Post shared to your timeline!");
        onClose();
      }
    } catch (error) {
      console.error("Share to timeline error:", error);
      toast.error(error.response?.data?.detail || "Failed to share to timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setCopied(true);
    
    try {
      // Get link from API
      const res = await axios.get(`${API}/share/link/${contentType}/${contentId}`);
      const link = res.data.shareLink;
      
      await copyToClipboard(link);
      toast.success("Link copied to clipboard!");
      
      // Record the share
      const token = localStorage.getItem('loopync_token');
      if (token) {
        await axios.post(
          `${API}/share/${contentType}/${contentId}`,
          {
            contentType,
            contentId,
            shareType: 'link',
            toUserIds: [],
            message: ''
          },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => {}); // Silently fail
      }
    } catch (error) {
      // Fallback: construct link manually
      const base = window?.location?.origin || '';
      let link = '';
      switch(contentType) {
        case 'post': link = `${base}/post/${contentId}`; break;
        case 'reel': link = `${base}/reel/${contentId}`; break;
        case 'tribe': link = `${base}/tribes/${contentId}`; break;
        case 'room': link = `${base}/rooms/${contentId}`; break;
        default: link = `${base}/${contentType}/${contentId}`;
      }
      
      await copyToClipboard(link);
      toast.success("Link copied to clipboard!");
    }
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopyText(text);
      }
    } catch (err) {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      toast.info(`Link: ${text}`, { duration: 10000 });
    }
    
    document.body.removeChild(textArea);
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredFriends = friends.filter(f => {
    const name = f.name || f.user?.name || '';
    const handle = f.handle || f.user?.handle || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           handle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getTypeLabel = () => {
    switch(contentType) {
      case 'post': return 'Post';
      case 'reel': return 'Reel';
      case 'tribe': return 'Tribe';
      case 'room': return 'VibeRoom';
      default: return 'Content';
    }
  };

  const getActionLabel = () => {
    if (contentType === 'tribe' || contentType === 'room') return 'Invite';
    return 'Share';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="bg-zinc-900 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col border border-zinc-800">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{getActionLabel()} {getTypeLabel()}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Preview */}
        {(contentPreview || item) && (
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
              {(contentPreview?.image || item?.media || item?.thumb || item?.videoUrl) && (
                <img 
                  src={contentPreview?.image || item?.media || item?.thumb} 
                  alt="" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {contentPreview?.title || item?.text?.substring(0, 50) || item?.caption?.substring(0, 50) || item?.name || getTypeLabel()}
                </p>
                {(contentPreview?.description || item?.description) && (
                  <p className="text-sm text-zinc-400 truncate">
                    {contentPreview?.description || item?.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 px-4 py-3 font-medium transition-all ${
              activeTab === "friends"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Send to Friends
          </button>
          <button
            onClick={() => setActiveTab("options")}
            className={`flex-1 px-4 py-3 font-medium transition-all ${
              activeTab === "options"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Send size={18} className="inline mr-2" />
            More Options
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "friends" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Friends List */}
              <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                {loadingFriends ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    {friends.length === 0 ? "No friends yet" : "No friends found"}
                  </div>
                ) : (
                  filteredFriends.map((friend) => {
                    // Handle both flat user object and nested {user: {...}} format
                    const user = friend.user || friend;
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleFriendSelection(user.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedFriends.includes(user.id)
                            ? "bg-purple-500/20 border border-purple-500/50"
                            : "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent"
                        }`}
                      >
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 text-left">
                          <h3 className="text-white font-semibold">{user.name}</h3>
                          <p className="text-sm text-zinc-400">@{user.handle}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedFriends.includes(user.id)
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-zinc-600'
                        }`}>
                          {selectedFriends.includes(user.id) && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              {selectedFriends.length > 0 && (
                <div className="mt-3">
                  <textarea
                    placeholder={`Add a message (optional)...`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "options" && (
            <div className="space-y-3">
              {/* Share to Timeline - Only for posts */}
              {contentType === 'post' && (
                <button
                  onClick={handleShareToTimeline}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Send size={20} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-semibold">Share to Feed</h3>
                    <p className="text-sm text-zinc-400">Reshare with all your followers</p>
                  </div>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  {copied ? <Check size={20} className="text-white" /> : <Copy size={20} className="text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-semibold">
                    {copied ? "Link Copied!" : "Copy Link"}
                  </h3>
                  <p className="text-sm text-zinc-400">Share via other apps</p>
                </div>
              </button>

              {/* Message input for feed share */}
              {contentType === 'post' && (
                <div className="mt-4">
                  <label className="text-sm text-zinc-400 mb-2 block">Add your thoughts (optional)</label>
                  <textarea
                    placeholder="What do you think about this?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === "friends" && (
          <div className="p-4 border-t border-zinc-800">
            <button
              onClick={handleShareToFriends}
              disabled={loading || selectedFriends.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  {getActionLabel()} to {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
