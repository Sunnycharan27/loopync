import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { X, Search, Send, Check } from "lucide-react";
import { toast } from "sonner";

const ShareToFriendsModal = ({ currentUser, item, type, onClose }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get followers and following (people the user can share with)
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`${API}/users/${currentUser.id}/followers`),
        axios.get(`${API}/users/${currentUser.id}/following`)
      ]);
      
      // Combine and dedupe users
      const followersData = followersRes.data?.users || [];
      const followingData = followingRes.data?.users || [];
      
      const allUsers = [...followersData, ...followingData];
      const uniqueUsers = allUsers.filter((user, index, self) =>
        index === self.findIndex((u) => u.id === user.id)
      );
      
      setUsers(uniqueUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const getShareMessage = () => {
    switch (type) {
      case 'post':
        return `${currentUser.name} shared a post with you: ${item.caption?.substring(0, 50) || 'Check this out!'}`;
      case 'reel':
        return `${currentUser.name} shared a reel with you: ${item.caption?.substring(0, 50) || 'Watch this!'}`;
      case 'room':
        return `${currentUser.name} invited you to join "${item.name}" - Live audio room!`;
      case 'event':
        return `${currentUser.name} shared an event: ${item.name}`;
      case 'tribe':
        return `${currentUser.name} invited you to join "${item.name}" tribe`;
      case 'venue':
        return `${currentUser.name} wants you to check out ${item.name}`;
      case 'product':
        return `${currentUser.name} shared a product: ${item.name}`;
      default:
        return `${currentUser.name} shared something with you!`;
    }
  };

  const getShareLink = () => {
    const baseUrl = window.location.origin;
    switch (type) {
      case 'post':
        return `${baseUrl}/posts/${item.id}`;
      case 'reel':
        return `${baseUrl}/reels/${item.id}`;
      case 'room':
        return `${baseUrl}/viberooms/${item.id}`;
      case 'event':
        return `${baseUrl}/events/${item.id}`;
      case 'tribe':
        return `${baseUrl}/tribes/${item.id}`;
      case 'venue':
        return `${baseUrl}/venues/${item.id}`;
      case 'product':
        return `${baseUrl}/marketplace/${item.id}`;
      default:
        return baseUrl;
    }
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one person");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('loopync_token');
      
      // Map type to contentType for API
      const contentType = type === 'video' ? 'reel' : type;
      const endpoint = `${API}/share/${contentType}/${item.id}`;
      
      // Use the new comprehensive share API
      const res = await axios.post(
        endpoint,
        {
          contentType,
          contentId: item.id,
          shareType: 'dm',
          toUserIds: selectedUsers,
          message: getShareMessage()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const count = res.data.sharedToCount || res.data.invitedCount || selectedUsers.length;
        const label = (type === 'tribe' || type === 'room') ? 'Invited' : 'Shared with';
        toast.success(`${label} ${count} person${count > 1 ? 's' : ''}!`);
        onClose();
      }
    } catch (error) {
      console.error("Failed to share:", error);
      // Fallback: Send as DMs
      try {
        const message = getShareMessage();
        const link = getShareLink();
        
        // Send DMs to each selected user
        const sendPromises = selectedUsers.map(userId =>
          axios.post(`${API}/messages`, {
            conversationId: `dm_${[currentUser.id, userId].sort().join('_')}`,
            senderId: currentUser.id,
            receiverId: userId,
            text: `${message}\n\n🔗 ${link}`,
            contentType: type,
            contentId: item.id,
            isSharedPost: true
          }).catch(err => {
            console.error(`Failed to send DM to ${userId}:`, err);
            return null;
          })
        );

        await Promise.all(sendPromises);
        toast.success(`Shared with ${selectedUsers.length} person${selectedUsers.length > 1 ? 's' : ''}!`);
        onClose();
      } catch (fallbackError) {
        console.error("Fallback share failed:", fallbackError);
        toast.error("Failed to share");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black w-full max-w-md rounded-3xl border border-gray-800 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Share with Friends</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Selected Count */}
          {selectedFriends.length > 0 && (
            <div className="mt-3 text-center">
              <span className="text-sm text-cyan-400">
                {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} selected
              </span>
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {searchQuery ? "No friends found" : "No friends yet"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {!searchQuery && "Add friends to share content with them!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFriends.map((friend) => {
                const isSelected = selectedFriends.includes(friend.id);
                return (
                  <button
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition ${
                      isSelected
                        ? 'bg-cyan-400/20 border-2 border-cyan-400'
                        : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <img
                      src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold">{friend.name}</p>
                      <p className="text-sm text-gray-400">@{friend.handle}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
                        <Check size={16} className="text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSend}
            disabled={selectedFriends.length === 0 || sending}
            className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={20} />
                Send to {selectedFriends.length || '...'} Friend{selectedFriends.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareToFriendsModal;
