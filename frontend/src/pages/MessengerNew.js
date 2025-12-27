import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Send, Image, Smile, MoreVertical,
  ArrowLeft, Check, CheckCheck, Circle, Mic, X, Sparkles,
  Play, Pause, Heart, ThumbsUp, Laugh, AlertCircle, Trash2,
  Film, ExternalLink, Inbox, UserPlus
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useWebSocket } from '../context/WebSocketContext';
import CallManager from '../components/CallManager';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Emoji reactions available
const REACTIONS = [
  { emoji: '❤️', name: 'heart' },
  { emoji: '👍', name: 'like' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '🔥', name: 'fire' }
];

const MessengerNew = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useWebSocket();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messageRequests, setMessageRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // New states for enhanced features
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId for reaction picker
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Get current user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('loopync_user') || '{}');
    if (!user.id) {
      navigate('/auth');
      return;
    }
    setCurrentUser(user);
    loadThreads(user.id);
    loadMessageRequests(user.id);
    
    // Check if thread was passed from navigation
    if (location.state?.selectedThread) {
      setSelectedThread(location.state.selectedThread);
      loadMessages(location.state.selectedThread.id);
    }
  }, [navigate, location]);

  // WebSocket listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    // New message
    socket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      
      // Update threads list
      setThreads(prev => {
        const updated = prev.map(t => 
          t.id === data.threadId 
            ? { ...t, lastMessage: data.message, lastMessageAt: data.message.createdAt }
            : t
        );
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      });

      // Add to messages if thread is open
      if (selectedThread?.id === data.threadId) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
        
        // Mark as read
        markMessagesRead(data.threadId, [data.message.id]);
      }
    });

    // Typing indicator
    socket.on('user_typing', (data) => {
      if (selectedThread?.id === data.threadId) {
        setOtherUserTyping(data.typing);
        if (data.typing) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });

    // Message read
    socket.on('message_read', (data) => {
      setMessages(prev => 
        prev.map(m => 
          m.id === data.messageId 
            ? { ...m, read: true, readAt: data.readAt }
            : m
        )
      );
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('message_read');
    };
  }, [socket, currentUser, selectedThread]);

  const loadThreads = async (userId) => {
    try {
      const res = await axios.get(`${API}/messenger/threads?userId=${userId}`);
      const allThreads = res.data.threads || [];
      // Filter out request threads from main list
      setThreads(allThreads.filter(t => !t.isRequest || t.isAccepted || t.requestFromId === userId));
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Failed to load conversations');
    }
  };

  const loadMessageRequests = async (userId) => {
    try {
      const res = await axios.get(`${API}/messenger/requests?userId=${userId}`);
      setMessageRequests(res.data.requests || []);
    } catch (error) {
      console.error('Error loading message requests:', error);
    }
  };

  const acceptMessageRequest = async (threadId) => {
    try {
      await axios.post(`${API}/messenger/requests/${threadId}/accept?userId=${currentUser.id}`);
      toast.success('Message request accepted!');
      // Move from requests to threads
      const request = messageRequests.find(r => r.id === threadId);
      if (request) {
        setMessageRequests(prev => prev.filter(r => r.id !== threadId));
        setThreads(prev => [{ ...request, isRequest: false, isAccepted: true }, ...prev]);
      }
      setShowRequests(false);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const rejectMessageRequest = async (threadId) => {
    try {
      await axios.post(`${API}/messenger/requests/${threadId}/reject?userId=${currentUser.id}`);
      toast.success('Message request declined');
      setMessageRequests(prev => prev.filter(r => r.id !== threadId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to decline request');
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search all users, not just friends
      const res = await axios.get(`${API}/users/search?q=${encodeURIComponent(query)}&limit=15`);
      const users = res.data || [];
      
      // Filter out current user
      const filtered = users.filter(user => user.id !== currentUser.id);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const startChatWithUser = async (user) => {
    try {
      // Check if thread already exists
      const existingThread = threads.find(t => 
        t.otherUser?.id === user.id
      );

      if (existingThread) {
        // Open existing thread
        selectThread(existingThread);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Create new thread - backend will mark as request if not mutual follow
      const res = await axios.post(
        `${API}/messenger/start?userId=${currentUser.id}&friendId=${user.id}`
      );

      if (res.data.success) {
        const newThread = res.data.thread;
        
        // Add to threads list
        setThreads(prev => [newThread, ...prev]);
        
        // Select the new thread
        selectThread(newThread);
        
        // Clear search
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
        
        toast.success(`Started chat with ${user.name}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      // Safely extract error message
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (detail?.msg || detail?.[0]?.msg || 'Failed to start conversation');
      toast.error(errorMsg);
    }
  };

  const loadMessages = async (threadId) => {
    try {
      const res = await axios.get(`${API}/messenger/threads/${threadId}/messages?limit=50`);
      setMessages(res.data.messages || []);
      setTimeout(scrollToBottom, 100);
      
      // Mark as read
      const unreadIds = res.data.messages
        .filter(m => m.recipientId === currentUser.id && !m.read)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        markMessagesRead(threadId, unreadIds);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const selectThread = (thread) => {
    setSelectedThread(thread);
    loadMessages(thread.id);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedThread) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await axios.post(`${API}/messenger/send`, {
        senderId: currentUser.id,
        recipientId: selectedThread.otherUser.id,
        text
      });

      // Stop typing indicator
      emitTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);

    if (!selectedThread) return;

    // Emit typing indicator
    emitTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 2000);
  };

  const emitTyping = (typing) => {
    if (socket && selectedThread) {
      socket.emit('typing', {
        threadId: selectedThread.id,
        typing
      });
    }
  };

  const markMessagesRead = async (threadId, messageIds) => {
    try {
      await axios.post(
        `${API}/messenger/threads/${threadId}/read?userId=${currentUser.id}`,
        { messageIds }
      );
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  // ===== VOICE RECORDING =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Update recording time every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    clearInterval(recordingIntervalRef.current);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !selectedThread) return;

    setUploadingMedia(true);
    try {
      // Upload audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_message.webm');
      
      const uploadRes = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Send message with audio URL
      await axios.post(`${API}/messenger/send`, {
        senderId: currentUser.id,
        recipientId: selectedThread.otherUser.id,
        text: '🎤 Voice message',
        mediaUrl: uploadRes.data.url,
        mediaType: 'voice'
      });

      setAudioBlob(null);
      setRecordingTime(0);
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploadingMedia(false);
    }
  };

  // ===== MEDIA UPLOAD =====
  const handleMediaSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedThread) return;

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      // Send message with media
      await axios.post(`${API}/messenger/send`, {
        senderId: currentUser.id,
        recipientId: selectedThread.otherUser.id,
        text: mediaType === 'video' ? '🎬 Video' : '📷 Photo',
        mediaUrl: uploadRes.data.url,
        mediaType
      });

      toast.success(`${mediaType === 'video' ? 'Video' : 'Photo'} sent!`);
    } catch (error) {
      console.error('Error sending media:', error);
      toast.error('Failed to send media');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ===== MESSAGE REACTIONS =====
  const addReaction = async (messageId, reaction) => {
    try {
      await axios.post(`${API}/messenger/messages/${messageId}/react`, {
        userId: currentUser.id,
        reaction: reaction.emoji
      });

      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, reactions: [...(m.reactions || []), { userId: currentUser.id, emoji: reaction.emoji }] }
          : m
      ));

      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const removeReaction = async (messageId) => {
    try {
      await axios.delete(`${API}/messenger/messages/${messageId}/react?userId=${currentUser.id}`);

      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, reactions: (m.reactions || []).filter(r => r.userId !== currentUser.id) }
          : m
      ));
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  // ===== AUDIO PLAYBACK =====
  const playAudio = (messageId, audioUrl) => {
    if (playingAudio === messageId) {
      audioPlayerRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.play();
      audioPlayerRef.current.onended = () => setPlayingAudio(null);
      setPlayingAudio(messageId);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAISuggestion = async () => {
    if (!messageText.trim()) {
      toast.error('Type a message first');
      return;
    }

    setAiLoading(true);
    try {
      const res = await axios.post(
        `${API}/messenger/ai/suggest?userId=${currentUser.id}`,
        { message: messageText }
      );
      setMessageText(res.data.suggestion);
      toast.success('AI suggestion applied!');
    } catch (error) {
      console.error('AI error:', error);
      toast.error('AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  };

  const initiateCall = async (callType) => {
    if (!selectedThread) {
      toast.error('No conversation selected');
      return;
    }
    
    if (!currentUser?.id) {
      toast.error('Please login to make calls');
      navigate('/auth');
      return;
    }

    try {
      const token = localStorage.getItem('loopync_token');
      const response = await axios.post(`${API}/calls/initiate`, {
        callerId: currentUser.id,
        recipientId: selectedThread.otherUser.id,
        callType
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      // Call initiated successfully
      console.log('✅ Call initiated successfully:', response.data);
      
      // Trigger outgoing call modal by dispatching custom event
      const callData = {
        callId: response.data.callId,
        callType: callType,
        otherUserId: selectedThread.otherUser.id,
        otherUserName: selectedThread.otherUser.name,
        otherUserAvatar: selectedThread.otherUser.avatar,
        isIncoming: false
      };
      
      // Dispatch custom event that CallManager will listen to
      window.dispatchEvent(new CustomEvent('outgoing_call', { detail: callData }));
      
      toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated`);
      
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      
      // Extract error message safely
      let errorMsg = 'Failed to initiate call';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle different error response formats
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
        } else if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.message) {
          errorMsg = data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
      console.error('Call initiation error details:', error.response?.data);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredThreads = threads.filter(t => 
    t.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen" style={{ background: 'linear-gradient(180deg, #0f021e 0%, #1a0b2e 100%)' }}>
      {/* Call Manager */}
      <CallManager currentUser={currentUser} />

      {/* Threads List */}
      <div className={`${
        selectedThread ? 'hidden md:flex' : 'flex'
      } w-full md:w-96 flex-col border-r border-cyan-500/10`} style={{ background: 'rgba(18, 20, 39, 0.5)' }}>
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/')} className="text-white hover:text-cyan-400 transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <button className="text-white hover:text-cyan-400 transition-colors">
              <MoreVertical size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
              style={{ background: 'rgba(18, 20, 39, 0.8)', border: '1px solid rgba(0, 224, 255, 0.15)' }}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results (People) */}
        {isSearching && searchQuery && (
          <div className="border-b border-cyan-500/10" style={{ background: 'rgba(18, 20, 39, 0.7)' }}>
            <div className="p-2">
              <p className="text-xs text-gray-500 px-2 mb-2">
                {searchResults.length > 0 ? 'People' : 'No people found'}
              </p>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => startChatWithUser(user)}
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg transition hover:shadow-lg"
                  style={{ background: 'rgba(0, 224, 255, 0.05)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 224, 255, 0.05)'}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">@{user.handle || 'user'}</p>
                  </div>
                  {user.online && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
              {searchResults.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <p>No people found with &quot;{searchQuery}&quot;</p>
                  <p className="mt-1">Try searching for someone else</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Requests Banner */}
        {messageRequests.length > 0 && !isSearching && (
          <div 
            onClick={() => setShowRequests(true)}
            className="flex items-center gap-3 p-4 cursor-pointer transition hover:opacity-90"
            style={{ background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))', borderBottom: '1px solid rgba(168, 85, 247, 0.3)' }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Inbox size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Message Requests</p>
              <p className="text-sm text-gray-400">{messageRequests.length} pending request{messageRequests.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{messageRequests.length}</span>
            </div>
          </div>
        )}

        {/* Threads */}
        <div className="flex-1 overflow-y-auto">
          {/* Show search results or threads based on search state */}
          {!isSearching && filteredThreads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Search for friends above to start chatting!</p>
            </div>
          ) : !isSearching ? (
            filteredThreads.map(thread => (
              <div
                key={thread.id}
                onClick={() => selectThread(thread)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition ${
                  selectedThread?.id === thread.id ? 'shadow-lg' : ''
                }`}
                style={{ 
                  background: selectedThread?.id === thread.id 
                    ? 'rgba(0, 224, 255, 0.1)' 
                    : 'rgba(18, 20, 39, 0.3)',
                  border: selectedThread?.id === thread.id 
                    ? '1px solid rgba(0, 224, 255, 0.3)' 
                    : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedThread?.id !== thread.id) {
                    e.currentTarget.style.background = 'rgba(0, 224, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedThread?.id !== thread.id) {
                    e.currentTarget.style.background = 'rgba(18, 20, 39, 0.3)';
                  }
                }}
              >
                <div className="relative">
                  <img
                    src={thread.otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.otherUser?.id}`}
                    alt={thread.otherUser?.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {thread.otherUser?.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-white truncate">
                      {thread.otherUser?.name || 'Unknown'}
                    </p>
                    {thread.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {new Date(thread.lastMessage.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">
                      {thread.lastMessage?.text || 'No messages yet'}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="ml-2 bg-cyan-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Messages Area */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-cyan-500/10" style={{ background: 'rgba(18, 20, 39, 0.7)' }}>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedThread(null)} 
                className="md:hidden text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <img
                src={selectedThread.otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedThread.otherUser?.id}`}
                alt={selectedThread.otherUser?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-white">
                  {selectedThread.otherUser?.name}
                </p>
                {otherUserTyping ? (
                  <p className="text-xs text-cyan-400">typing...</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {selectedThread.otherUser?.online ? 'Active now' : 'Offline'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Call buttons removed */}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => {
              const isOwn = message.senderId === currentUser.id;
              const showAvatar = idx === 0 || messages[idx - 1]?.senderId !== message.senderId;
              const hasReactions = message.reactions && message.reactions.length > 0;
              const isVoiceMessage = message.mediaType === 'voice';
              const isVideoMessage = message.mediaType === 'video';
              const isSharedPost = message.isSharedPost || message.contentType === 'post' || message.contentType === 'reel';

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 group ${
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {!isOwn && showAvatar ? (
                    <img
                      src={message.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6" />
                  )}

                  <div className="relative">
                    {/* Shared Post/Reel Card */}
                    {isSharedPost && message.contentId ? (
                      <div
                        className={`max-w-xs lg:max-w-md rounded-2xl overflow-hidden cursor-pointer ${
                          isOwn ? 'shadow-lg shadow-cyan-400/30' : ''
                        }`}
                        style={{ 
                          background: isOwn ? 'linear-gradient(135deg, #00bcd4, #3b82f6)' : 'rgba(18, 20, 39, 0.9)', 
                          border: isOwn ? 'none' : '1px solid rgba(0, 224, 255, 0.2)'
                        }}
                        onClick={() => navigate(message.contentType === 'reel' ? '/vibezone' : `/post/${message.contentId}`)}
                      >
                        {/* Shared Content Header */}
                        <div className={`px-3 py-2 flex items-center gap-2 ${isOwn ? 'bg-black/10' : 'bg-cyan-400/10'}`}>
                          {message.contentType === 'reel' ? (
                            <Film size={14} className={isOwn ? 'text-black' : 'text-cyan-400'} />
                          ) : (
                            <Image size={14} className={isOwn ? 'text-black' : 'text-cyan-400'} />
                          )}
                          <span className={`text-xs font-medium ${isOwn ? 'text-black/80' : 'text-cyan-400'}`}>
                            Shared {message.contentType === 'reel' ? 'Reel' : 'Post'}
                          </span>
                        </div>
                        
                        {/* Shared Content Preview */}
                        {message.sharedContent && (
                          <div className="p-3">
                            {/* Media Preview */}
                            {message.sharedContent.mediaUrl && (
                              <div className="mb-2 rounded-lg overflow-hidden bg-black/20">
                                {message.contentType === 'reel' || message.sharedContent.mediaUrl?.includes('.mp4') ? (
                                  <div className="relative aspect-[9/16] max-h-40 flex items-center justify-center bg-black">
                                    <Play size={32} className="text-white/80" />
                                    <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                                      Video
                                    </span>
                                  </div>
                                ) : (
                                  <img 
                                    src={message.sharedContent.mediaUrl}
                                    alt="Shared content"
                                    className="w-full max-h-32 object-cover"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                              </div>
                            )}
                            
                            {/* Caption Preview */}
                            {message.sharedContent.caption && (
                              <p className={`text-xs line-clamp-2 ${isOwn ? 'text-black/80' : 'text-gray-300'}`}>
                                {message.sharedContent.caption}
                              </p>
                            )}
                            
                            {/* Author */}
                            {message.sharedContent.author && (
                              <div className="flex items-center gap-2 mt-2">
                                <img 
                                  src={message.sharedContent.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sharedContent.author.name}`}
                                  alt=""
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className={`text-xs ${isOwn ? 'text-black/70' : 'text-gray-400'}`}>
                                  @{message.sharedContent.author.handle || message.sharedContent.author.name}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Tap to view indicator */}
                        <div className={`px-3 py-2 flex items-center justify-between ${isOwn ? 'bg-black/10' : 'bg-cyan-400/5'}`}>
                          <span className={`text-xs ${isOwn ? 'text-black/60' : 'text-gray-500'}`}>
                            Tap to view
                          </span>
                          <ExternalLink size={12} className={isOwn ? 'text-black/60' : 'text-gray-500'} />
                        </div>
                        
                        {/* Message text if any */}
                        {message.text && !message.text.includes('shared') && (
                          <div className={`px-3 py-2 border-t ${isOwn ? 'border-black/10' : 'border-gray-700'}`}>
                            <p className={`text-sm ${isOwn ? 'text-black' : 'text-white'}`}>{message.text}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Regular Message bubble */
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl cursor-pointer ${
                          isOwn
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-400/30'
                            : 'text-white'
                        }`}
                        style={!isOwn ? { 
                          background: 'rgba(18, 20, 39, 0.9)', 
                          border: '1px solid rgba(0, 224, 255, 0.2)'
                        } : {}}
                        onDoubleClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                      >
                        {/* Voice message */}
                        {isVoiceMessage && message.mediaUrl ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => playAudio(message.id, message.mediaUrl)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                isOwn ? 'bg-black/20 hover:bg-black/30' : 'bg-cyan-400/20 hover:bg-cyan-400/30'
                              }`}
                            >
                              {playingAudio === message.id ? (
                                <Pause size={18} className={isOwn ? 'text-black' : 'text-cyan-400'} />
                              ) : (
                                <Play size={18} className={isOwn ? 'text-black' : 'text-cyan-400'} />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className={`h-1 rounded-full ${isOwn ? 'bg-black/30' : 'bg-cyan-400/30'}`}>
                                <div className={`h-full w-1/2 rounded-full ${isOwn ? 'bg-black' : 'bg-cyan-400'}`}></div>
                              </div>
                              <p className="text-xs mt-1 opacity-70">Voice message</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.text && !message.text.startsWith('🎤') && !message.text.startsWith('📷') && !message.text.startsWith('🎬') && (
                              <p className="text-sm">{message.text}</p>
                            )}
                          </>
                        )}
                        
                        {/* Image/Video message */}
                        {message.mediaUrl && !isVoiceMessage && (
                          <div className="mt-1">
                            {isVideoMessage ? (
                              <video
                                src={message.mediaUrl}
                                controls
                                className="rounded-lg max-w-full max-h-60"
                              />
                            ) : (
                              <img
                                src={message.mediaUrl}
                                alt=""
                                className="rounded-lg max-w-full max-h-60 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(message.mediaUrl, '_blank')}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reactions display */}
                    {hasReactions && (
                      <div className={`absolute -bottom-3 ${isOwn ? 'right-2' : 'left-2'} flex items-center gap-0.5 bg-gray-800 rounded-full px-1.5 py-0.5 border border-gray-700`}>
                        {[...new Set(message.reactions.map(r => r.emoji))].map((emoji, i) => (
                          <span key={i} className="text-xs">{emoji}</span>
                        ))}
                        {message.reactions.length > 1 && (
                          <span className="text-xs text-gray-400 ml-0.5">{message.reactions.length}</span>
                        )}
                      </div>
                    )}

                    {/* Reaction picker */}
                    {showEmojiPicker === message.id && (
                      <div className={`absolute bottom-full mb-2 ${isOwn ? 'right-0' : 'left-0'} bg-gray-800 rounded-full px-2 py-1 flex items-center gap-1 shadow-lg border border-gray-700 z-10`}>
                        {REACTIONS.map((reaction) => (
                          <button
                            key={reaction.name}
                            onClick={() => addReaction(message.id, reaction)}
                            className="hover:scale-125 transition-transform text-lg"
                          >
                            {reaction.emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Smile button on hover (for adding reactions) */}
                    <button
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                      className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-cyan-400`}
                    >
                      <Smile size={16} />
                    </button>
                  </div>

                  {isOwn && (
                    <div className="text-cyan-400 flex items-center">
                      {message.read ? (
                        <CheckCheck size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recording Preview */}
          {audioBlob && !isRecording && (
            <div className="p-4 border-t border-cyan-500/10 flex items-center gap-3" style={{ background: 'rgba(18, 20, 39, 0.7)' }}>
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setRecordingTime(0);
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={20} />
              </button>
              <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2">
                <Mic size={16} className="text-cyan-400" />
                <span className="text-white text-sm">Voice message ready</span>
              </div>
              <button
                onClick={sendVoiceMessage}
                disabled={uploadingMedia}
                className="bg-cyan-400 text-black p-2 rounded-full hover:bg-cyan-300 disabled:opacity-50"
              >
                {uploadingMedia ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black"></div>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          )}

          {/* Recording UI */}
          {isRecording && (
            <div className="p-4 border-t border-cyan-500/10 flex items-center gap-3" style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
              <button
                onClick={cancelRecording}
                className="text-red-400 hover:text-red-300"
              >
                <X size={24} />
              </button>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-mono">{formatRecordingTime(recordingTime)}</span>
                <div className="flex-1 h-1 bg-red-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 animate-pulse" style={{ width: `${Math.min(recordingTime * 2, 100)}%` }}></div>
                </div>
              </div>
              <button
                onClick={stopRecording}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-400"
              >
                <Check size={20} />
              </button>
            </div>
          )}

          {/* Normal Input */}
          {!isRecording && !audioBlob && (
            <form onSubmit={sendMessage} className="p-4 border-t border-cyan-500/10" style={{ background: 'rgba(18, 20, 39, 0.7)' }}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  {uploadingMedia ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-cyan-400"></div>
                  ) : (
                    <Image size={24} />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={getAISuggestion}
                  disabled={aiLoading}
                  className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                  title="AI Suggest"
                >
                  <Sparkles size={24} className={aiLoading ? 'animate-spin' : ''} />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                />

                <input
                  type="text"
                  placeholder="Message..."
                  value={messageText}
                  onChange={handleTyping}
                  className="flex-1 px-4 py-2 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                  style={{ background: 'rgba(18, 20, 39, 0.8)', border: '1px solid rgba(0, 224, 255, 0.15)' }}
                />

                {messageText.trim() ? (
                  <button
                    type="submit"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Send
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={startRecording}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <Mic size={24} />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" 
                 style={{ background: 'rgba(0, 224, 255, 0.1)', border: '2px solid rgba(0, 224, 255, 0.3)' }}>
              <Send size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Your Messages</h2>
            <p className="text-gray-400">Send private messages to anyone</p>
          </div>
        </div>
      )}

      {/* Message Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[#0f021e] rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border border-purple-500/30">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Inbox className="text-purple-400" size={24} />
                <h2 className="text-lg font-bold text-white">Message Requests</h2>
              </div>
              <button 
                onClick={() => setShowRequests(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {messageRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No message requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messageRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={request.requester?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.requestFromId}`}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-white">{request.requester?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-400">@{request.requester?.handle || 'user'}</p>
                        </div>
                      </div>
                      
                      {request.lastMessage && (
                        <div className="p-3 bg-gray-900/50 rounded-lg mb-3">
                          <p className="text-sm text-gray-300 line-clamp-2">{request.lastMessage.text}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => rejectMessageRequest(request.id)}
                          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => acceptMessageRequest(request.id)}
                          className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold rounded-lg transition"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessengerNew;