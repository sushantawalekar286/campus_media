import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Send, MessageSquare, User, Search, ArrowLeft, 
  ShieldAlert, File, Check, CheckCheck, Paperclip, MoreVertical 
} from 'lucide-react';
import { io } from 'socket.io-client';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export const MessagesPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null); // stores conversation object
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Connection and search states
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Loadings
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Socket & Real-Time states
  const socketRef = useRef(null);
  const [onlineStatusMap, setOnlineStatusMap] = useState({}); // { userId: 'online' | 'offline' }
  const [lastSeenMap, setLastSeenMap] = useState({}); // { userId: Date }
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Establish Socket.IO connection
  useEffect(() => {
    if (!accessToken) return;

    const socketUrl = window.location.origin || 'http://localhost:3000';
    const socket = io(socketUrl, {
      auth: {
        token: accessToken
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Socket connected to gateway:', socket.id);
    });

    // Handle online/offline events
    socket.on('user_status', ({ userId, status, lastSeen }) => {
      setOnlineStatusMap(prev => ({ ...prev, [userId]: status }));
      if (lastSeen) {
        setLastSeenMap(prev => ({ ...prev, [userId]: new Date(lastSeen) }));
      }
    });

    // Handle typing states
    socket.on('typing', ({ conversationId, userId: typerId, isTyping: typingState }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setOtherUserTyping(typingState);
      }
    });

    // Handle incoming messages
    socket.on('new_message', (message) => {
      // Add message to active panel if matches active conversation
      if (activeConversation && activeConversation._id === message.conversationId) {
        setMessages(prev => {
          // Avoid duplicate appends
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // Trigger read receipt since we are actively looking at this conversation
        socket.emit('read_messages', { conversationId: activeConversation._id });
      }

      // Update conversations list dynamically (move to top, set last message)
      setConversations(prev => {
        const copy = [...prev];
        const index = copy.findIndex(c => c._id === message.conversationId);
        
        if (index > -1) {
          const isSenderMe = message.senderId === currentUser._id;
          const currentUnread = isSenderMe ? 0 : (copy[index].unreadCount || 0) + 1;
          
          copy[index] = {
            ...copy[index],
            lastMessage: message.content,
            messageType: message.messageType,
            timestamp: message.createdAt,
            unreadCount: (activeConversation && activeConversation._id === message.conversationId) ? 0 : currentUnread
          };
          // Shift to top
          const [moved] = copy.splice(index, 1);
          copy.unshift(moved);
        } else {
          // Fetch inbox list again to dynamically create the record with populated user
          fetchConversations();
        }
        return copy;
      });
    });

    // Handle general indicator of message received when in other tab
    socket.on('message_received', ({ message, conversationId, unreadCount }) => {
      if (activeConversation && activeConversation._id === conversationId) return;

      // Update list unread counts
      setConversations(prev => {
        const copy = [...prev];
        const index = copy.findIndex(c => c._id === conversationId);
        if (index > -1) {
          copy[index] = {
            ...copy[index],
            lastMessage: message.content,
            messageType: message.messageType,
            timestamp: message.createdAt,
            unreadCount: unreadCount
          };
          const [moved] = copy.splice(index, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    });

    // Handle read receipts mapping
    socket.on('messages_read', ({ conversationId }) => {
      if (activeConversation && activeConversation._id === conversationId) {
        setMessages(prev => prev.map(m => m.senderId === currentUser._id ? { ...m, seenStatus: true } : m));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, activeConversation?.id, activeConversation?._id]);

  // 2. Fetch conversations (inbox list)
  const fetchConversations = async (selectUserAfter = null) => {
    try {
      const res = await apiClient.get('/chat/conversations');
      const convos = res.data || [];
      setConversations(convos);

      if (selectUserAfter) {
        // Find if user already exists in conversations
        const match = convos.find(c => c.user._id === selectUserAfter._id);
        if (match) {
          setActiveConversation(match);
        } else {
          // Start conversation via API
          const startRes = await apiClient.post('/chat/conversations', { recipientId: selectUserAfter._id });
          setConversations(prev => [startRes.data, ...prev]);
          setActiveConversation(startRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvos(false);
    }
  };

  // 3. Fetch connections list for the search feature
  const fetchConnectionsList = async () => {
    try {
      const res = await apiClient.get('/users/connections/list');
      setConnections(res.data || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  // On mount: check navigation state, load inbox and connections
  useEffect(() => {
    const targetUser = location.state?.startChatWith;
    fetchConversations(targetUser);
    fetchConnectionsList();
  }, [location.state]);

  // Join or leave conversation room when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      setOtherUserTyping(false);
      return;
    }

    // Fetch messages for active conversation
    const fetchConversationMessages = async () => {
      setLoadingMsgs(true);
      setErrorMsg(null);
      try {
        const res = await apiClient.get(`/chat/messages/${activeConversation._id}`);
        setMessages(res.data || []);
        
        // Reset unread count locally
        setConversations(prev => prev.map(c => c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c));

        // Join room and mark read in DB / emit socket event
        if (socketRef.current) {
          socketRef.current.emit('join_conversation', activeConversation._id);
          socketRef.current.emit('read_messages', { conversationId: activeConversation._id });
        }
      } catch (err) {
        console.error('Failed to load message history:', err);
        setErrorMsg(err.response?.data?.error || 'Failed to load message history');
      } finally {
        setLoadingMsgs(false);
      }
    };

    fetchConversationMessages();

    // Cleanup: leave old room
    return () => {
      if (socketRef.current && activeConversation) {
        socketRef.current.emit('leave_conversation', activeConversation._id);
      }
    };
  }, [activeConversation]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  // 4. Handle Text Typing indicator
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socketRef.current || !activeConversation) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { conversationId: activeConversation._id, isTyping: true });
    }

    // Stop typing timeout handler
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing', { conversationId: activeConversation._id, isTyping: false });
    }, 2000);
  };

  // 5. Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const payload = {
      receiverId: activeConversation.user._id,
      content: inputText,
      messageType: 'text'
    };

    setInputText('');
    
    // Stop typing immediately
    if (isTyping && socketRef.current) {
      setIsTyping(false);
      socketRef.current.emit('typing', { conversationId: activeConversation._id, isTyping: false });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      const res = await apiClient.post('/chat/send', payload);
      setMessages(prev => {
        if (prev.some(m => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });

      // Update conversations lastMessage in list
      setConversations(prev => {
        const copy = [...prev];
        const index = copy.findIndex(c => c._id === activeConversation._id);
        if (index > -1) {
          copy[index] = {
            ...copy[index],
            lastMessage: res.data.content,
            messageType: 'text',
            timestamp: res.data.createdAt,
            unreadCount: 0
          };
          const [moved] = copy.splice(index, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to send message');
    }
  };

  // 6. Handle media uploads to Cloudinary
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    // Determine fileType
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    let fileType = 'document';
    let messageType = 'file';

    const imgExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const videoExts = ['.mp4'];

    if (imgExts.includes(ext)) {
      fileType = 'post_image';
      messageType = 'image';
    } else if (videoExts.includes(ext)) {
      fileType = 'video';
      messageType = 'video';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    setUploadingFile(true);
    setErrorMsg(null);

    try {
      // 1. Post to Media service
      const uploadRes = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const mediaUrl = uploadRes.data.url;

      // 2. Post to Chat Send
      const sendRes = await apiClient.post('/chat/send', {
        receiverId: activeConversation.user._id,
        content: file.name,
        messageType,
        fileUrl: mediaUrl
      });

      setMessages(prev => [...prev, sendRes.data]);

      // Move conversation to top
      setConversations(prev => {
        const copy = [...prev];
        const index = copy.findIndex(c => c._id === activeConversation._id);
        if (index > -1) {
          copy[index] = {
            ...copy[index],
            lastMessage: `Sent a ${messageType}`,
            messageType,
            timestamp: sendRes.data.createdAt
          };
          const [moved] = copy.splice(index, 1);
          copy.unshift(moved);
        }
        return copy;
      });
    } catch (err) {
      console.error('File upload failed:', err);
      setErrorMsg(err.response?.data?.error || 'Attachment upload failed. Please verify format/size constraints.');
    } finally {
      setUploadingFile(false);
    }
  };

  // 7. Start chat with a user selected from connection search list
  const handleSelectSearchedUser = async (user) => {
    setIsSearching(false);
    setSearchQuery('');
    
    // Check if conversation already exists in active list
    const existing = conversations.find(c => c.user._id === user._id);
    if (existing) {
      setActiveConversation(existing);
      return;
    }

    try {
      const res = await apiClient.post('/chat/conversations', { recipientId: user._id });
      setConversations(prev => [res.data, ...prev]);
      setActiveConversation(res.data);
    } catch (err) {
      console.error('Error starting conversation:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to start conversation');
    }
  };

  // 8. Filters/Searches connected users list
  const filteredConnections = connections.filter(conn => 
    conn.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conn.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group messages helper
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt || msg.timestamp);
      const today = new Date().toLocaleDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString();

      const msgDateStr = date.toLocaleDateString();

      let displayDate = msgDateStr;
      if (msgDateStr === today) {
        displayDate = 'Today';
      } else if (msgDateStr === yesterdayStr) {
        displayDate = 'Yesterday';
      } else {
        displayDate = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      }

      if (!groups[displayDate]) {
        groups[displayDate] = [];
      }
      groups[displayDate].push(msg);
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  const formatMessageTime = (dateInput) => {
    const d = new Date(dateInput);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const getOnlineDisplay = (user) => {
    const isOnline = onlineStatusMap[user._id] === 'online' || user.onlineStatus === 'online';
    if (isOnline) return <span className="text-emerald-500 font-semibold flex items-center gap-1">🟢 Online</span>;

    const lastSeen = lastSeenMap[user._id] || (user.lastSeen ? new Date(user.lastSeen) : null);
    if (lastSeen) {
      return (
        <span className="text-slate-400 font-semibold">
          ⚪ Offline (Last seen {lastSeen.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})
        </span>
      );
    }
    return <span className="text-slate-400">⚪ Offline</span>;
  };

  return (
    <div className="bg-slate-50 min-h-[85vh] flex justify-center py-4 px-2 md:px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex w-full max-w-6xl h-[80vh]">
        
        {/* ================= LEFT INBOX PANEL ================= */}
        <div className={`w-full md:w-96 border-r border-slate-200 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header & Connection Search Box */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <MessageSquare className="text-indigo-600" size={24} />
                <span>Inbox</span>
              </h2>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connected students, skills, department..."
                className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              {isSearching && (
                <button 
                  onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold hover:text-slate-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Conversations or Search Results List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            
            {isSearching ? (
              // Connections search panel
              filteredConnections.length > 0 ? (
                filteredConnections.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleSelectSearchedUser(user)}
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-indigo-50 border border-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-indigo-600 relative">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.fullname.charAt(0)
                      )}
                      {(onlineStatusMap[user._id] === 'online' || user.onlineStatus === 'online') && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{user.fullname}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">@{user.username} • {user.department || 'Student'}</p>
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {user.skills.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-600 text-[8px] px-1.5 py-0.5 rounded font-bold">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No connected students match your search criteria.
                </div>
              )
            ) : (
              // Standard conversations list
              loadingConvos ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">Loading inbox...</div>
              ) : conversations.length > 0 ? (
                conversations.map((convo) => {
                  const isActive = activeConversation && activeConversation._id === convo._id;
                  const isOnline = onlineStatusMap[convo.user._id] === 'online' || convo.user.onlineStatus === 'online';
                  
                  return (
                    <div
                      key={convo._id}
                      onClick={() => setActiveConversation(convo)}
                      className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        isActive ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-indigo-50 border border-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-indigo-600 relative">
                        {convo.user.profilePicture ? (
                          <img src={convo.user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          convo.user.fullname.charAt(0)
                        )}
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-extrabold text-slate-800 text-xs truncate">{convo.user.fullname}</h4>
                          <span className="text-[9px] font-bold text-slate-400">
                            {convo.timestamp ? new Date(convo.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-xs truncate ${convo.unreadCount > 0 ? 'text-indigo-600 font-extrabold' : 'text-slate-500'}`}>
                            {convo.lastMessage || 'Open chat window'}
                          </p>
                          {convo.unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-4 min-h-4 shadow-sm animate-pulse">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2 h-64">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <User size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">No connections yet</h4>
                  <p className="text-slate-400 text-xs px-6">Connect with fellow students under the Network Directory to start chatting!</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* ================= RIGHT MESSAGE PANEL ================= */}
        <div className={`flex-1 flex flex-col bg-slate-50 h-full ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div 
                    onClick={() => navigate(`/profile/${activeConversation.user.username}`)}
                    className="w-11 h-11 rounded-full overflow-hidden bg-indigo-50 border border-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-indigo-600 cursor-pointer relative"
                  >
                    {activeConversation.user.profilePicture ? (
                      <img src={activeConversation.user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      activeConversation.user.fullname.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 
                      onClick={() => navigate(`/profile/${activeConversation.user.username}`)}
                      className="font-bold text-slate-800 text-sm hover:underline cursor-pointer flex items-center gap-2"
                    >
                      {activeConversation.user.fullname}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-2">
                      {getOnlineDisplay(activeConversation.user)}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50">
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* Chat Message Timeline Log */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {loadingMsgs ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : Object.keys(groupedMessages).length > 0 ? (
                  Object.keys(groupedMessages).map((dateGroup) => (
                    <div key={dateGroup} className="space-y-4">
                      {/* Date Header Separator */}
                      <div className="flex justify-center my-2">
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {dateGroup}
                        </span>
                      </div>

                      {groupedMessages[dateGroup].map((msg) => {
                        const isSentByMe = msg.senderId === currentUser._id;
                        return (
                          <div
                            key={msg._id}
                            className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                                isSentByMe
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                              }`}
                            >
                              {/* Media / Attachment Rendering */}
                              {msg.messageType === 'image' && msg.fileUrl && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-black/10 max-w-xs">
                                  <img src={msg.fileUrl} alt="attachment" className="w-full h-auto object-cover max-h-60" />
                                </div>
                              )}
                              {msg.messageType === 'video' && msg.fileUrl && (
                                <div className="mb-2 rounded-xl overflow-hidden border border-black/10 max-w-xs">
                                  <video src={msg.fileUrl} controls className="w-full max-h-60 object-cover" />
                                </div>
                              )}
                              {msg.messageType === 'file' && msg.fileUrl && (
                                <a 
                                  href={msg.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 mb-2 p-2.5 rounded-xl border text-xs font-bold ${
                                    isSentByMe 
                                      ? 'bg-indigo-700 border-indigo-500 text-white hover:bg-indigo-800' 
                                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <File size={16} />
                                  <span className="truncate max-w-[150px]">{msg.content || 'Download document'}</span>
                                </a>
                              )}

                              {/* Message Text Content */}
                              <p className="leading-relaxed break-words font-semibold text-xs">{msg.content}</p>

                              {/* Message Footer (Time & Read Check) */}
                              <div className="flex justify-end items-center gap-1 mt-1">
                                <span className={`text-[9px] font-semibold ${isSentByMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                  {formatMessageTime(msg.createdAt || msg.timestamp)}
                                </span>
                                {isSentByMe && (
                                  msg.seenStatus ? (
                                    <CheckCheck size={12} className="text-emerald-300" />
                                  ) : (
                                    <Check size={12} className="text-indigo-200" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <MessageSquare size={26} />
                    </div>
                    <h4 className="font-bold text-slate-700 text-sm">Say hello!</h4>
                    <p className="text-slate-400 text-xs mt-1">Send a message to begin conversation with {activeConversation.user.fullname}!</p>
                  </div>
                )}

                {/* Other user is typing indicator bubble */}
                <AnimatePresence>
                  {otherUserTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white border border-slate-200 text-slate-500 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 text-xs font-semibold">
                        <span className="animate-pulse">{activeConversation.user.fullname} is typing</span>
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom input area */}
              {errorMsg && (
                <div className="bg-rose-50 border-t border-rose-100 p-3 text-center text-rose-600 text-xs font-bold flex items-center justify-center gap-2">
                  <ShieldAlert size={16} />
                  <span>{errorMsg}</span>
                  <button onClick={() => setErrorMsg(null)} className="underline ml-2">Dismiss</button>
                </div>
              )}

              <div className="bg-white border-t border-slate-200 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  
                  {/* Media attachment trigger */}
                  <button
                    type="button"
                    disabled={uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center ${uploadingFile ? 'animate-pulse' : ''}`}
                    title="Send image, video, or PDF document"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.mp4,.pdf,.doc,.docx"
                  />

                  {uploadingFile ? (
                    <div className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-semibold flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading document to secure cloud storage...</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder={`Type a message to ${activeConversation.user.fullname}...`}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={!inputText.trim() || uploadingFile}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Empty State (No conversation selected)
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={32} />
              </div>
              <h3 className="font-extrabold text-slate-700 text-base">Select a connected student</h3>
              <p className="text-slate-500 text-xs mt-1">Select an active conversation from the left or search connected students to begin chatting in real time.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
