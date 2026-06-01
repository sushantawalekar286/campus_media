import React, { useState } from 'react';
import { usePostStore } from '../store/postStore';
import { X, Image, FileText, Tag, Briefcase, Building, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

export const CreatePostModal = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPYQ, setIsPYQ] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced tags
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const { createPost } = usePostStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createPost({
        caption,
        visibility: 'public',
        postType: isPYQ ? 'pyq' : 'standard',
        isPYQ,
        companyTags: company ? company.split(',').map(t => t.trim()) : [],
        roleTags: role ? role.split(',').map(t => t.trim()) : [],
        skills: skills ? skills.split(',').map(t => t.trim()) : [],
        difficulty: isPYQ ? difficulty : undefined
      });
      
      // Reset form
      setCaption('');
      setIsPYQ(false);
      setCompany('');
      setRole('');
      setSkills('');
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {isPYQ ? 'Share Interview Question (PYQ)' : 'Create Post'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="flex space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 shadow-sm flex items-center justify-center text-white font-bold text-lg">
                    {(currentUser?.fullname || currentUser?.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{currentUser?.fullname || currentUser?.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Posting to Anyone</p>
                  </div>
                </div>

                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={isPYQ ? "What was the interview question? Include examples if possible..." : "What do you want to talk about?"}
                  className="w-full bg-transparent resize-none min-h-[120px] focus:outline-none text-slate-700 text-lg placeholder:text-slate-400"
                  autoFocus
                />

                {/* Advanced Fields Toggle */}
                {showAdvanced && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 space-y-4 pt-4 border-t border-slate-100"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Building size={14} /> Company
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Google, Microsoft"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Briefcase size={14} /> Role
                        </label>
                        <input
                          type="text"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g. SDE, Frontend Engineer"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Tag size={14} /> Skills / Topics
                      </label>
                      <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="e.g. React, System Design, DSA (comma separated)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
                      />
                    </div>

                    {isPYQ && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                        <div className="flex gap-2">
                          {['easy', 'medium', 'hard'].map(level => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setDifficulty(level)}
                              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize border ${
                                difficulty === level 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Action Bar */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <button 
                    type="button"
                    onClick={() => setIsPYQ(!isPYQ)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isPYQ ? 'bg-orange-100 text-orange-700' : 'bg-slate-200/50 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FileText size={16} />
                    {isPYQ ? 'PYQ Mode Active' : 'Mark as PYQ'}
                    {isPYQ && <CheckCircle2 size={16} />}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                  >
                    {showAdvanced ? 'Hide tags' : 'Add tags'} <ChevronDown size={16} className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <button type="button" className="p-2.5 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 rounded-xl transition-colors tooltip" title="Add Image">
                      <Image size={20} />
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!caption.trim() || isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
