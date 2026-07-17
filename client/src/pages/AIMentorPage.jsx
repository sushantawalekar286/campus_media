import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, User, Sparkles, FileText, Code, Briefcase, 
  Zap, Compass, RotateCcw, Square, Copy, Terminal, Database, Cloud 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

// Custom Markdown Renderer helper
const parseBoldText = (str) => {
  const parts = str.split(/\*\*/);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-extrabold text-white">{part}</strong>;
    }
    return part;
  });
};

const MarkdownText = ({ text }) => {
  if (!text) return null;

  const parts = text.split(/```/);
  
  return parts.map((part, index) => {
    // Code Blocks
    if (index % 2 === 1) {
      const lines = part.split('\n');
      const firstLine = lines[0].trim();
      const isLanguage = /^[a-zA-Z0-9+#-]+$/.test(firstLine);
      const code = isLanguage ? lines.slice(1).join('\n') : part;
      const language = isLanguage ? firstLine : 'code';

      return (
        <div key={index} className="my-4 rounded-2xl overflow-hidden border border-white/10 bg-[#0B0F19] text-left font-mono text-xs">
          <div className="flex justify-between items-center bg-[#111827] px-4 py-2 border-b border-white/5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>{language}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code.trim())}
              className="hover:text-white transition-colors flex items-center gap-1 font-bold"
            >
              <Copy size={10} /> Copy Code
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-slate-300 leading-relaxed">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    // Paragraphs & Lists
    const lines = part.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('###')) {
        return (
          <h3 key={`${index}-${lineIdx}`} className="text-sm font-extrabold text-white mt-4 mb-2 text-left">
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h2 key={`${index}-${lineIdx}`} className="text-base font-extrabold text-white mt-5 mb-2 text-left">
            {trimmed.replace(/^##\s*/, '')}
          </h2>
        );
      }
      if (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <ul key={`${index}-${lineIdx}`} className="list-disc list-inside pl-4 text-left my-1.5 text-slate-300 text-sm">
            <li>{parseBoldText(trimmed.replace(/^[*•-\s]+/, ''))}</li>
          </ul>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        return (
          <ol key={`${index}-${lineIdx}`} className="list-decimal list-inside pl-4 text-left my-1.5 text-slate-300 text-sm">
            <li>{parseBoldText(trimmed.replace(/^\d+\.\s*/, ''))}</li>
          </ol>
        );
      }
      
      if (!trimmed) return <div key={`${index}-${lineIdx}`} className="h-2" />;

      return (
        <p key={`${index}-${lineIdx}`} className="text-slate-300 text-sm leading-relaxed text-left my-2">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  });
};

export const AIMentorPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const messagesEndRef = useRef(null);
  
  // Abort generation references
  const abortFlagRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle Mentoring Prompt triggers
  const handleSendPrompt = async (promptText) => {
    if (!promptText.trim()) return;

    abortFlagRef.current = false;
    const userMessage = { id: Date.now(), sender: 'user', text: promptText };
    
    // We update the messages list and typing state
    setMessages(prev => [...prev, userMessage]);
    setLastUserPrompt(promptText);
    setIsTyping(true);

    try {
      // Map prompt history for the server
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await apiClient.post('/ai-mentor/chat', {
        prompt: promptText,
        history: chatHistory
      });

      // If user clicked Stop during generation, ignore response callback
      if (abortFlagRef.current) {
        console.log('Generation aborted.');
        return;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.text
      }]);
    } catch (err) {
      console.error('Failed to get response from AI Mentor:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: `⚠️ Mentoring system encountered an error: ${err.response?.data?.error || err.message || 'Please check your connection and try again.'}`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const text = input;
    setInput('');
    handleSendPrompt(text);
  };

  const handleStopGenerating = () => {
    abortFlagRef.current = true;
    setIsTyping(false);
  };

  const handleRegenerate = () => {
    if (!lastUserPrompt || isTyping) return;
    handleSendPrompt(lastUserPrompt);
  };

  const handleCopyResponse = (text) => {
    navigator.clipboard.writeText(text);
    alert('Mentor advice copied to clipboard!');
  };

  const SUGGESTIONS = [
    { icon: FileText, text: "Improve my resume", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: Zap, text: "Prepare me for placements", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: Code, text: "Explain this programming concept", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: Compass, text: "Recommend my next project", color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: Sparkles, text: "Suggest what to learn next", color: "text-rose-400", bg: "bg-rose-500/10" },
    { icon: Briefcase, text: "Improve my interview performance", color: "text-sky-400", bg: "bg-sky-500/10" },
    { icon: Terminal, text: "Help me become a Full Stack Developer", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { icon: Database, text: "Explain AI/ML concepts", color: "text-teal-400", bg: "bg-teal-500/10" },
    { icon: Cloud, text: "Learn Docker & Kubernetes", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: Sparkles, text: "Help me with career planning", color: "text-pink-400", bg: "bg-pink-500/10" }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-[#0B0F19] overflow-hidden -mx-4 md:-mx-8 -mt-4 md:-mt-8 relative">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Chat Header */}
      <div className="px-6 py-4 flex justify-between items-center z-10 border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/10 border border-white/10">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="font-extrabold text-white text-sm">AI Placement Mentor</h2>
            <p className="text-[9px] text-purple-400 font-extrabold uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Mentorship Active
            </p>
          </div>
        </div>
        {lastUserPrompt && !isTyping && (
          <button 
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 transition-all font-bold"
          >
            <RotateCcw size={12} /> Regenerate
          </button>
        )}
      </div>

      {/* Chat Messages Feed Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {messages.length === 0 ? (
            /* Beautiful Empty State / Welcome Screen */
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-center py-10 max-w-2xl mx-auto"
            >
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-purple-600/10 mb-5 border border-white/10">
                <Bot size={32} />
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome to AI Mentor</h1>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-2.5 px-4">
                I'm your personal career and learning mentor. I can help you with placements, projects, interview preparation, coding guidance, resume improvements, and technology learning paths.
              </p>
              
              <div className="text-xs font-extrabold text-slate-500 uppercase tracking-widest text-left mt-8 mb-4 px-2">
                Suggested Prompts
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
                {SUGGESTIONS.map((sug, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendPrompt(sug.text)}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all text-left group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sug.bg} ${sug.color} group-hover:scale-110 transition-transform`}>
                      <sug.icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate">{sug.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Chat Bubbles List */
            messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/10 border border-white/10 mt-1">
                    <Bot size={18} />
                  </div>
                )}
                
                <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-3xl text-slate-200 shadow-sm ${
                    msg.sender === 'user'
                    ? 'bg-white/10 border border-white/5 rounded-tr-none text-white'
                    : 'bg-white/[0.02] border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.sender === 'user' ? (
                      <p className="text-sm font-semibold whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <MarkdownText text={msg.text} />
                    )}
                  </div>
                  
                  {msg.sender === 'ai' && !msg.text.startsWith('⚠️') && (
                    <div className="flex gap-2 mt-2 ml-2">
                      <button 
                        onClick={() => handleCopyResponse(msg.text)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 font-bold transition-colors"
                        title="Copy text response"
                      >
                        <Copy size={11} /> Copy Answer
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 shadow border border-white/5 mt-1 font-extrabold text-xs">
                    {currentUser?.fullname?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Floating Loader */}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10">
                <Bot size={18} />
              </div>
              <div className="flex items-center gap-1.5 p-4 bg-white/[0.02] border border-white/5 rounded-3xl rounded-tl-none">
                <span className="text-xs text-slate-500 font-bold mr-1 animate-pulse">Mentor is formulating guidance</span>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Area */}
      <div className="p-4 md:px-8 pb-6 bg-[#0B0F19] z-10 shrink-0">
        <div className="max-w-3xl mx-auto">
          
          {isTyping && (
            <div className="flex justify-center mb-3">
              <button
                onClick={handleStopGenerating}
                className="flex items-center gap-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow"
              >
                <Square size={10} className="fill-rose-400" /> Stop Mentoring Draft
              </button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="relative flex items-end bg-[#111827] border border-white/10 rounded-3xl shadow-xl focus-within:border-purple-500/40 focus-within:shadow-purple-500/5 transition-all overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your career mentor (e.g. placements, resume improvements, tech stack)..."
              rows={1}
              className="w-full bg-transparent px-6 py-4.5 text-white placeholder-slate-500 focus:outline-none resize-none min-h-[56px] max-h-[140px] text-xs font-semibold leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 m-1.5 bg-white text-black rounded-2xl hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-white transition-colors shadow-sm shrink-0 flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="text-center mt-3.5">
            <p className="text-[10px] text-slate-500 font-bold">AI Career Mentor session logs are ephemeral. Reloading resets context.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};
