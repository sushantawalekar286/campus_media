import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Users, Hash, MessageCircle } from 'lucide-react';

export const MentorshipChat = () => {
  const { currentUser, channels, messages, sendMessage, fetchMessages } = useApp();
  const [activeChannelId, setActiveChannelId] = useState('general');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const channelMessages = messages.filter(m => m.channel === activeChannelId);

  useEffect(() => {
    // Fetch messages when channel changes
    fetchMessages(activeChannelId);
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText, activeChannelId);
      setInputText('');
    }
  };

  const getRoleBadge = (msgSenderId) => {
    if (currentUser?.id === msgSenderId) {
        return <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-2 font-bold">YOU</span>;
    }
    return null;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar Channels */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Users size={20} className="text-indigo-600"/> Mentorship Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">Connect with seniors & peers</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannelId(channel.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChannelId === channel.id 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Hash size={18} className="opacity-50" />
              {channel.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Hash size={20} className="text-slate-400"/> {activeChannel?.name}
             </h3>
             <p className="text-xs text-slate-500">{activeChannel?.description}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {channelMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageCircle size={48} className="mb-2 opacity-20" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            channelMessages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                 <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-700">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-400">
                       {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {getRoleBadge(msg.senderId)}
                 </div>
                 <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                   msg.senderId === currentUser?.id 
                     ? 'bg-indigo-600 text-white rounded-br-none' 
                     : 'bg-slate-100 text-slate-800 rounded-bl-none'
                 }`}>
                   {msg.text}
                 </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Message #${activeChannel?.name}...`}
              className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
