import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API, AuthContext } from '../App';
import { X, Search, Send, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const SharePostModal = ({ isOpen, onClose, post, contentType = 'post' }) => {
  const { currentUser } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [sentTo, setSentTo] = useState([]);

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchFriends();
      setSentTo([]);
    }
  }, [isOpen, currentUser?.id]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/messenger/friends?userId=${currentUser.id}`);
      setFriends(res.data.friends || []);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (friendId) => {
    setSending(prev => ({ ...prev, [friendId]: true }));
    try {
      await axios.post(`${API}/messenger/send`, {
        senderId: currentUser.id,
        recipientId: friendId,
        text: `Shared a ${contentType}`,
        isSharedPost: true,
        contentType: contentType,
        contentId: post.id,
        sharedContent: {
          mediaUrl: post.mediaUrl || post.videoUrl,
          caption: post.caption || post.content,
          author: {
            name: post.author?.name || post.user?.name,
            handle: post.author?.handle || post.user?.handle,
            avatar: post.author?.avatar || post.user?.avatar
          }
        }
      });
      setSentTo(prev => [...prev, friendId]);
      toast.success('Shared successfully!');
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share');
    } finally {
      setSending(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const filteredFriends = searchQuery
    ? friends.filter(f => f.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : friends;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-[#1a0b2e] rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Share to</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/30">
          <div className="flex items-center gap-3">
            {(post.mediaUrl || post.videoUrl) && (
              <img
                src={post.mediaUrl || post.videoUrl}
                alt=""
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm line-clamp-2">{post.caption || post.content || 'Shared post'}</p>
              <p className="text-gray-500 text-xs mt-1">by @{post.author?.handle || post.user?.handle || 'unknown'}</p>
            </div>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-cyan-400 animate-spin" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">{searchQuery ? 'No friends found' : 'Add friends to share with'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
                  <img
                    src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{friend.name}</p>
                    <p className="text-sm text-gray-400 truncate">@{friend.handle || 'user'}</p>
                  </div>
                  {sentTo.includes(friend.id) ? (
                    <span className="text-green-400 text-sm font-medium">Sent ✓</span>
                  ) : (
                    <button
                      onClick={() => handleShare(friend.id)}
                      disabled={sending[friend.id]}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      {sending[friend.id] ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Done Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
