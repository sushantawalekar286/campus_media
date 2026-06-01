import React, { useState, useRef } from 'react';
import { usePostStore } from '../store/postStore';
import { X, Image, FileText, Tag, Briefcase, Building, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import api from '../api/apiClient';

export const CreatePostModal = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState('standard'); // 'standard', 'achievement', 'project', 'resource', 'pyq'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Media selection state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState('image'); // 'image', 'document'
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  
  // Advanced tags
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const { createPost } = usePostStore();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isDoc = file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    
    if (!isImage && !isDoc) {
      setErrorMsg('Invalid file format. Supported formats: Images, PDF, DOC, DOCX');
      return;
    }

    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(`File size exceeds limit. Maximum allowed: ${isImage ? '5MB' : '10MB'}`);
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    setFileType(isImage ? 'image' : 'document');

    if (isImage) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl('');
    }
  };

  const triggerImageSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const triggerDocumentSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.pdf,.doc,.docx';
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !selectedFile) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      let mediaArray = [];
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('fileType', fileType === 'image' ? 'post_image' : 'document');

        const uploadRes = await api.post('/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        mediaArray.push({
          url: uploadRes.data.url,
          type: fileType,
          public_id: uploadRes.data.publicId,
          fileName: uploadRes.data.fileName,
          fileSize: uploadRes.data.fileSize
        });
      }

      await createPost({
        caption,
        visibility: 'public',
        postType: postType,
        isPYQ: postType === 'pyq',
        media: mediaArray,
        companyTags: company ? company.split(',').map(t => t.trim()) : [],
        roleTags: role ? role.split(',').map(t => t.trim()) : [],
        skills: skills ? skills.split(',').map(t => t.trim()) : [],
        difficulty: postType === 'pyq' ? difficulty : undefined
      });
      
      // Reset form
      setCaption('');
      setSelectedFile(null);
      setFilePreviewUrl('');
      setPostType('standard');
      setCompany('');
      setRole('');
      setSkills('');
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      setErrorMsg(error.message || 'Post creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const postTypes = [
    { id: 'standard', label: 'General', color: 'bg-slate-100 text-slate-700' },
    { id: 'achievement', label: 'Achievement', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { id: 'project', label: 'Project', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { id: 'resource', label: 'Resource', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { id: 'pyq', label: 'PYQ', color: 'bg-orange-50 text-orange-700 border-orange-100' }
  ];

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
            className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] sm:max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                Create Post
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                
                {errorMsg && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm font-semibold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errorMsg}
                  </div>
                )}

                <div className="flex space-x-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 shadow-sm flex items-center justify-center text-white font-bold text-base sm:text-lg">
                    {(currentUser?.fullname || currentUser?.name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{currentUser?.fullname || currentUser?.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {postTypes.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setPostType(type.id);
                            setErrorMsg('');
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${
                            postType === type.id 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    postType === 'pyq' ? "What interview question did you encounter? Include company/difficulty..." :
                    postType === 'achievement' ? "Share your awesome achievement with the campus! 🏆" :
                    postType === 'project' ? "Tell everyone about the cool project you built! 💻" :
                    postType === 'resource' ? "Provide details about the learning resource/document you are sharing... 📄" :
                    "What's on your mind? Share an update with the campus..."
                  }
                  className="w-full bg-transparent resize-none min-h-[100px] sm:min-h-[120px] focus:outline-none text-slate-700 text-base sm:text-lg placeholder:text-slate-400"
                  autoFocus
                />

                {/* File Preview */}
                {selectedFile && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl relative flex items-center gap-3">
                    {fileType === 'image' ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                        <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                        <FileText size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedFile(null); setFilePreviewUrl(''); }}
                      className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

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
                          <Building size={14} /> Company Tag
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
                          <Briefcase size={14} /> Role Tag
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

                    {postType === 'pyq' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Interview Difficulty</label>
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
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <button 
                      type="button" 
                      onClick={triggerImageSelect}
                      className="p-2.5 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 rounded-xl transition-colors tooltip" 
                      title="Add Photo"
                    >
                      <Image size={20} />
                    </button>
                    <button 
                      type="button" 
                      onClick={triggerDocumentSelect}
                      className="p-2.5 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 rounded-xl transition-colors tooltip" 
                      title="Add Document (PDF, DOC, DOCX)"
                    >
                      <FileText size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                      {showAdvanced ? 'Hide tags' : 'Add tags'} <ChevronDown size={16} className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      type="submit"
                      disabled={(!caption.trim() && !selectedFile) || isSubmitting}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
                    >
                      {isSubmitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
