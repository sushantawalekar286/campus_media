import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePostStore } from '../store/postStore';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { Edit3, Image, Video, Briefcase, FileText, Sparkles, TrendingUp, Users, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FeedPage = () => {
  const { feed, isLoading, hasMore, fetchFeed, page } = usePostStore();
  const observer = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('for-you'); // for-you, pyq, jobs

  useEffect(() => {
    fetchFeed(1, true);
  }, [fetchFeed]);

  const lastPostElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchFeed(page + 1); 
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, fetchFeed, page]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto py-4 h-full overflow-hidden">
      
      {/* Left Sidebar / Filter Menu (Desktop) */}
      <div className="hidden lg:block lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 px-2">Feeds</h3>
          <nav className="space-y-1">
            {['for-you', 'pyq', 'jobs'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  activeTab === tab 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab === 'for-you' && <Sparkles size={18} className={activeTab === tab ? 'text-indigo-600' : ''} />}
                {tab === 'pyq' && <FileText size={18} className={activeTab === tab ? 'text-indigo-600' : ''} />}
                {tab === 'jobs' && <Briefcase size={18} className={activeTab === tab ? 'text-indigo-600' : ''} />}
                <span className="capitalize">{tab.replace('-', ' ')}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 px-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-rose-500" />
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-2 px-2">
            {['#TCS', '#ReactJS', '#Interview', '#DSA', '#Frontend', '#Amazon'].map(tag => (
              <span key={tag} className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Feed Area */}
      <div className="col-span-1 lg:col-span-2 h-full overflow-y-auto pr-2 pb-20 custom-scrollbar">
        {/* Create Post Input Trigger */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 shadow-inner flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-slate-50 hover:bg-slate-100 transition-colors text-left rounded-full px-5 py-3 text-slate-500 text-sm font-medium border border-slate-200"
            >
              Share an update, PYQ, or achievement...
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 px-2">
            <button className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50">
              <Image size={18} className="text-blue-500" />
              <span className="text-sm font-medium">Media</span>
            </button>
            <button className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50">
              <FileText size={18} className="text-orange-500" />
              <span className="text-sm font-medium">PYQ</span>
            </button>
            <button className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50">
              <Edit3 size={18} className="text-green-500" />
              <span className="text-sm font-medium">Article</span>
            </button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-4">
          <AnimatePresence>
            {feed.map((post, index) => {
              if (feed.length === index + 1) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    ref={lastPostElementRef} 
                    key={post._id}
                  >
                    <PostCard post={post} />
                  </motion.div>
                )
              } else {
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={post._id}
                  >
                    <PostCard post={post} />
                  </motion.div>
                )
              }
            })}
          </AnimatePresence>
          
          {isLoading && (
            <div className="space-y-4">
              {[1, 2].map(n => (
                <div key={n} className="bg-white rounded-2xl p-5 h-48 border border-slate-200 animate-pulse flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-3 w-32 bg-slate-200 rounded" />
                      <div className="h-2 w-24 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-200 rounded" />
                    <div className="h-3 w-5/6 bg-slate-200 rounded" />
                    <div className="h-3 w-4/6 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!hasMore && feed.length > 0 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-2">
                <Sparkles size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">You've reached the end</p>
            </div>
          )}
          
          {!isLoading && feed.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                <Users size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No posts yet</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">Be the first to share something with your network!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar (Desktop) */}
      <div className="hidden lg:block lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4 px-1">Top Companies</h3>
          <div className="space-y-3">
            {['Microsoft', 'Google', 'Amazon', 'Meta'].map((company, i) => (
              <div key={company} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                    ['bg-blue-500', 'bg-red-500', 'bg-orange-500', 'bg-blue-600'][i]
                  }`}>
                    {company[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{company}</p>
                    <p className="text-xs text-slate-500">1.2k open jobs</p>
                  </div>
                </div>
                <button className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition-colors">
                  <TrendingUp size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <Bot className="mb-3 text-white/90" size={28} />
          <h3 className="font-bold text-lg mb-1 relative z-10">AI Mentor Available</h3>
          <p className="text-indigo-100 text-sm mb-4 relative z-10 leading-relaxed">
            Need help with your resume or interview prep? Your AI mentor is ready.
          </p>
          <button className="w-full bg-white text-indigo-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors relative z-10 shadow-sm">
            Chat Now
          </button>
        </div>
      </div>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
