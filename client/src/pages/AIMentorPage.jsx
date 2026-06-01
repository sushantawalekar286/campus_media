import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Sparkles, FileText, Code, Briefcase, Zap, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export const AIMentorPage = () => {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: `Hi ${currentUser?.fullname || 'there'}! I'm your AI Mentor. I can help you with resume reviews, interview prep, learning roadmaps, or job recommendations. What would you like to focus on today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: "I've analyzed your request. Based on industry standards, here is what I suggest... \n\n1. **First step**: Do this.\n2. **Second step**: Do that.\n\nLet me know if you need more details!" 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const SUGGESTIONS = [
    { icon: FileText, text: "Review my resume", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: Zap, text: "Mock Interview (React)", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Code, text: "Help with DSA", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Briefcase, text: "Job Recommendations", color: "text-purple-400", bg: "bg-purple-500/10" }
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-[#0B0F19] overflow-hidden -mx-4 md:-mx-8 -mt-4 md:-mt-8">
      
      {/* Sidebar - Chat History */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="h-full bg-[#111827] border-r border-white/5 flex flex-col overflow-hidden shrink-0"
      >
        <div className="p-4 w-[280px]">
          <button className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-4 rounded-xl transition-colors border border-white/10">
            <Sparkles size={16} className="text-purple-400" /> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 w-[280px] custom-scrollbar">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent</div>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 text-slate-200 text-left text-sm font-medium border border-white/5">
              <History size={16} className="text-slate-400" /> Resume Review
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 text-left text-sm font-medium transition-colors">
              <History size={16} className="text-slate-500" /> System Design Basics
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 text-left text-sm font-medium transition-colors">
              <History size={16} className="text-slate-500" /> Google SWE Roadmap
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Chat Header */}
        <div className="px-4 py-3 flex justify-between items-center z-10 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Bot size={16} />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">AI Career Mentor</h2>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar z-10">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                  msg.sender === 'user' 
                  ? 'bg-slate-800 text-slate-300 border border-white/10' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-purple-500/20'
                }`}>
                  {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`flex-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 text-[15px] leading-relaxed max-w-[90%] whitespace-pre-wrap ${
                    msg.sender === 'user'
                    ? 'bg-white/10 text-white rounded-2xl rounded-tr-sm border border-white/5'
                    : 'text-slate-300'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                  <Bot size={20} />
                </div>
                <div className="flex items-center gap-2 p-4">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:px-8 pb-8 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19] to-transparent pt-10 z-10">
          <div className="max-w-3xl mx-auto">
            {messages.length === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {SUGGESTIONS.map((sug, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(sug.text)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sug.bg} ${sug.color} group-hover:scale-110 transition-transform`}>
                      <sug.icon size={18} />
                    </div>
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{sug.text}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative flex items-end bg-[#111827] border border-white/10 rounded-3xl shadow-xl focus-within:border-purple-500/50 focus-within:shadow-purple-500/10 transition-all overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI Mentor anything..."
                rows={1}
                className="w-full bg-transparent px-6 py-5 text-white placeholder-slate-500 focus:outline-none resize-none min-h-[60px] max-h-[200px] text-[15px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 m-2 bg-white text-black rounded-2xl hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white transition-colors shadow-sm shrink-0"
              >
                <Send size={20} className={input.trim() ? "fill-black" : ""} />
              </button>
            </form>
            <div className="text-center mt-3">
              <p className="text-[11px] text-slate-500 font-medium">AI Mentor can make mistakes. Verify important information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
