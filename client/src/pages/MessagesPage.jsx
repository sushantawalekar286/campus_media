import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, User, Search, Clock, ArrowLeft, ShieldAlert } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

export const MessagesPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const messagesEndRef = useRef(null);

  // Fetch all conversations
  const fetchConversations = async (selectUserAfter = null) => {
    try {
      const res = await apiClient.get('/chat/conversations');
      const convos = res.data || [];
      setConversations(convos);

      if (selectUserAfter) {
        // Find if user already exists in conversations
        const match = convos.find(c => c.user._id === selectUserAfter._id || c.user.id === selectUserAfter.id);
        if (match) {
          setActiveUser(match.user);
        } else {
          // If not in conversations yet, mock add them to the top of the local list
          const mockConvo = {
            user: selectUserAfter,
            lastMessage: 'Starting conversation...',
            timestamp: Date.now()
          };
          setConversations(prev => [mockConvo, ...prev]);
          setActiveUser(selectUserAfter);
        }
      } else if (!activeUser && convos.length > 0) {
        // Default to first conversation
        setActiveUser(convos[0].user);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvos(false);
    }
  };

  // On mount: check navigation state to see if we clicked "Message" from profile/connections
  useEffect(() => {
    const targetUser = location.state?.startChatWith;
    fetchConversations(targetUser);
  }, [location.state]);

  // Fetch messages when active user changes
  useEffect(() => {
    if (!activeUser) return;
    const fetchMessages = async () => {
      setLoadingMsgs(true);
      setErrorMsg(null);
      try {
        const otherId = activeUser._id || activeUser.id;
        const res = await apiClient.get(`/chat/messages/${otherId}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to load message history:', err);
        setErrorMsg(err.response?.data?.error || 'Failed to load message history');
      } finally {
        setLoadingMsgs(false);
      }
    };
    fetchMessages();

    // Setup polling for incoming messages every 4 seconds
    const interval = setInterval(async () => {
      try {
        const otherId = activeUser._id || activeUser.id;
        const res = await apiClient.get(`/chat/messages/${otherId}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed polling messages:', err);
        if (err.response?.status === 403) {
          setErrorMsg(err.response?.data?.error || 'You can only message connections');
          clearInterval(interval);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeUser]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUser) return;

    const body = {
      receiverId: activeUser._id || activeUser.id,
      content: inputText
    };

    setInputText('');

    try {
      const res = await apiClient.post('/chat/send', body);
      setMessages(prev => [...prev, res.data]);
      
      // Update last message in local conversation list
      setConversations(prev => {
        const copy = [...prev];
        const otherId = activeUser._id || activeUser.id;
        const index = copy.findIndex(c => c.user._id === otherId || c.user.id === otherId);
        if (index > -1) {
          copy[index] = {
            ...copy[index],
            lastMessage: res.data.content,
            timestamp: res.data.timestamp
          };
          // Move to top
          const [moved] = copy.splice(index, 1);
          copy.unshift(moved);
        } else {
          // If first message
          copy.unshift({
            user: activeUser,
            lastMessage: res.data.content,
            timestamp: res.data.timestamp
          });
        }
        return copy;
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredConvos = conversations.filter(c => 
    c.user.fullname?.toLowerCase().includes(searchText.toLowerCase()) || 
    c.user.username?.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex h-[80vh] max-w-5xl mx-auto">
      {/* Conversations Left Panel */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col ${activeUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
            <MessageSquare className="text-indigo-600" size={20} />
            <span>Messages</span>
          </h2>
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
          {loadingConvos ? (
            <div className="p-6 text-center text-slate-400 text-xs font-semibold">Loading inbox...</div>
          ) : filteredConvos.length > 0 ? (
            filteredConvos.map((convo) => {
              const isActive = activeUser && (activeUser._id === convo.user._id || activeUser.id === convo.user.id);
              return (
                <div
                  key={convo.user._id || convo.user.id}
                  onClick={() => setActiveUser(convo.user)}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                    isActive ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-50 border border-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-indigo-600">
                    {convo.user.profilePicture ? (
                      <img src={convo.user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (convo.user.fullname || convo.user.username || 'U').charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {convo.user.fullname || convo.user.username}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {formatTime(convo.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{convo.lastMessage}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">No active chats. Search students to start a conversation!</div>
          )}
        </div>
      </div>

      {/* Messages Right Panel */}
      <div className={`flex-1 flex flex-col bg-slate-50 h-full ${!activeUser ? 'hidden md:flex' : 'flex'}`}>
        {activeUser ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveUser(null)}
                  className="md:hidden p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <div 
                  onClick={() => navigate(`/profile/${activeUser.username || activeUser._id || activeUser.id}`)}
                  className="w-10 h-10 rounded-full overflow-hidden bg-indigo-50 border border-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-indigo-600 cursor-pointer"
                >
                  {activeUser.profilePicture ? (
                    <img src={activeUser.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (activeUser.fullname || activeUser.username || 'U').charAt(0)
                  )}
                </div>
                <div>
                  <h4 
                    onClick={() => navigate(`/profile/${activeUser.username || activeUser._id || activeUser.id}`)}
                    className="font-bold text-slate-800 text-sm hover:underline cursor-pointer"
                  >
                    {activeUser.fullname || activeUser.username}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold truncate max-w-xs md:max-w-md">
                    {activeUser.headline || 'Student at University'}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {loadingMsgs ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isSentByMe = msg.senderId === currentUser._id || msg.senderId === currentUser.id;
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
                        <p className="leading-relaxed break-words">{msg.content || msg.text}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right font-semibold ${
                            isSentByMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">No message history</h4>
                  <p className="text-slate-500 text-xs mt-1">Send a message to begin conversation with {activeUser.fullname || activeUser.username}!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            {errorMsg ? (
              <div className="bg-rose-50 border-t border-rose-100 p-4 text-center text-rose-600 text-xs font-semibold flex items-center justify-center gap-2">
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Type a message to ${activeUser.fullname || activeUser.username}...`}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="font-bold text-slate-700 text-base">Select a Conversation</h3>
            <p className="text-slate-500 text-xs mt-1">Choose an existing conversation from the inbox on the left or search students to start a new chat session.</p>
          </div>
        )}
      </div>
    </div>
  );
};
