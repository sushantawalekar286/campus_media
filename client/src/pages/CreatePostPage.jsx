import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import { useApp } from '../context/AppContext';
import api from '../api/apiClient';
import { 
  X, Image, FileText, Tag, Briefcase, Building, ChevronDown, CheckCircle2, 
  AlertCircle, Globe, Users, Trash2, Loader2, Sparkles, Award, 
  BookOpen, Terminal, Code2, Link2, Paperclip, Calendar, MapPin, 
  HelpCircle, Megaphone, CalendarDays, Heart, MessageCircle, Share2, 
  Bookmark, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CreatePostPage = () => {
  const { currentUser } = useApp();
  const { createPost } = usePostStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Core post states
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public', 'connections'
  const [postType, setPostType] = useState('text'); // Must be a valid schema type
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Media queues and progress states
  const [mediaQueue, setMediaQueue] = useState([]); // [{ id, file, type, previewUrl, progress, uploadedUrl, publicId }]
  const fileInputRef = useRef(null);

  // Sub-forms fields
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    techStack: '',
    githubUrl: '',
    demoUrl: '',
    status: 'completed'
  });

  const [achievementForm, setAchievementForm] = useState({
    type: 'award',
    title: '',
    description: '',
    organization: '',
    date: '',
    location: '',
    mediaUrl: ''
  });

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: 'note',
    department: '',
    course: '',
    semester: '',
    subject: '',
    year: '',
    fileUrl: ''
  });

  // Category Configuration
  const categoryCards = [
    { 
      id: 'text', 
      label: 'General', 
      icon: Sparkles, 
      color: 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100/50', 
      accentColor: 'slate',
      description: 'Share text updates, media posts, announcements, or general thoughts.'
    },
    { 
      id: 'project', 
      label: 'Project', 
      icon: Code2, 
      color: 'border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50', 
      accentColor: 'blue',
      description: 'Showcase your code projects, tech stacks, live links, and GitHub repositories.'
    },
    { 
      id: 'achievement', 
      label: 'Achievement', 
      icon: Award, 
      color: 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50', 
      accentColor: 'emerald',
      description: 'Highlight competitive achievements, general awards, or wins.'
    },
    { 
      id: 'internship', 
      label: 'Internship', 
      icon: Briefcase, 
      color: 'border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50', 
      accentColor: 'amber',
      description: 'Share internship placements, applications, and work experience notes.'
    },
    { 
      id: 'placement', 
      label: 'Placement', 
      icon: Building, 
      color: 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50', 
      accentColor: 'rose',
      description: 'Celebrate full-time employment placement highlights and package timelines.'
    },
    { 
      id: 'hackathon', 
      label: 'Hackathon', 
      icon: Award, 
      color: 'border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-50', 
      accentColor: 'purple',
      description: 'Showcase your hackathon accomplishments, submissions, and rank standings.'
    },
    { 
      id: 'certificate', 
      label: 'Certificate', 
      icon: Award, 
      color: 'border-cyan-200 text-cyan-700 bg-cyan-50/50 hover:bg-cyan-50', 
      accentColor: 'cyan',
      description: 'Publish completed training program certifications or credentials.'
    },
    { 
      id: 'research', 
      label: 'Research', 
      icon: FileText, 
      color: 'border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-50', 
      accentColor: 'teal',
      description: 'Publish your research papers, review journals, or technical writeups.'
    },
    { 
      id: 'resource', 
      label: 'Resource', 
      icon: BookOpen, 
      color: 'border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50', 
      accentColor: 'indigo',
      description: 'Upload learning guides, assignments, syllabus manuals, or unit PPT notes.'
    },
    { 
      id: 'question', 
      label: 'Question', 
      icon: HelpCircle, 
      color: 'border-pink-200 text-pink-700 bg-pink-50/50 hover:bg-pink-50', 
      accentColor: 'pink',
      description: 'Ask exam queries, syllabus doubts, or query campus peers for advice.'
    },
    { 
      id: 'event', 
      label: 'Event', 
      icon: CalendarDays, 
      color: 'border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50', 
      accentColor: 'indigo',
      description: 'Broadcast hackathons, workshops, technical club seminars, or guest meets.'
    }
  ];

  // 1. Load Draft from LocalStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('campus_media_create_post_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.caption) setCaption(draft.caption);
        if (draft.visibility) setVisibility(draft.visibility);
        if (draft.postType) setPostType(draft.postType);
        if (draft.projectForm) setProjectForm(draft.projectForm);
        if (draft.achievementForm) setAchievementForm(draft.achievementForm);
        if (draft.resourceForm) setResourceForm(draft.resourceForm);
      }
    } catch (err) {
      console.warn("Failed to load draft from localStorage:", err);
    }

    // Pre-select category based on router state parameter (e.g. redirected from PYQ button)
    if (location.state?.initialType) {
      const type = location.state.initialType;
      // standard maps to 'text' in database
      setPostType(type === 'standard' ? 'text' : type);
    }
  }, [location]);

  // 2. Autosave Draft to LocalStorage on state changes
  useEffect(() => {
    try {
      const draft = {
        caption,
        visibility,
        postType,
        projectForm,
        achievementForm,
        resourceForm
      };
      localStorage.setItem('campus_media_create_post_draft', JSON.stringify(draft));
    } catch (err) {
      console.warn("Failed to autosave draft to localStorage:", err);
    }
  }, [caption, visibility, postType, projectForm, achievementForm, resourceForm]);

  // 3. Keep Achievement sub-form type dropdown value synchronized with selected card category
  useEffect(() => {
    if (postType === 'hackathon') {
      setAchievementForm(prev => ({ ...prev, type: 'hackathon' }));
    } else if (postType === 'research') {
      setAchievementForm(prev => ({ ...prev, type: 'publication' }));
    } else if (postType === 'certificate') {
      setAchievementForm(prev => ({ ...prev, type: 'certification' }));
    } else if (postType === 'placement') {
      setAchievementForm(prev => ({ ...prev, type: 'placement' }));
    } else if (postType === 'internship') {
      setAchievementForm(prev => ({ ...prev, type: 'internship' }));
    } else if (postType === 'achievement') {
      setAchievementForm(prev => ({ ...prev, type: 'award' }));
    }
  }, [postType]);

  const discardDraft = () => {
    if (window.confirm("Are you sure you want to discard your draft? This will clear all fields.")) {
      localStorage.removeItem('campus_media_create_post_draft');
      setCaption('');
      setPostType('text');
      setProjectForm({ name: '', description: '', techStack: '', githubUrl: '', demoUrl: '', status: 'completed' });
      setAchievementForm({ type: 'award', title: '', description: '', organization: '', date: '', location: '', mediaUrl: '' });
      setResourceForm({ title: '', description: '', category: 'note', department: '', course: '', semester: '', subject: '', year: '', fileUrl: '' });
      setMediaQueue([]);
      setErrorMsg('');
      setSuccessMsg('Draft discarded successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Auto-resize caption textarea height
  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [caption]);

  // Handle file selection & upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setErrorMsg('');
    
    // Process files
    const newItems = files.map(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isDoc = file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
      
      let type = 'image';
      if (isVideo) type = 'video';
      else if (isDoc) type = 'document';
      
      return {
        id: Math.random().toString(36).substring(7),
        file,
        type,
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        progress: 0,
        uploadedUrl: '',
        publicId: '',
        status: 'pending' // 'pending', 'uploading', 'success', 'error'
      };
    });

    setMediaQueue(prev => [...prev, ...newItems]);
    e.target.value = ''; // clear input

    // Trigger upload sequentially
    for (const item of newItems) {
      await uploadFile(item);
    }
  };

  const uploadFile = async (item) => {
    setMediaQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));
    
    try {
      const formData = new FormData();
      formData.append('file', item.file);
      
      let fileTypeParam = 'post_image';
      if (item.type === 'video') fileTypeParam = 'video';
      else if (item.type === 'document') fileTypeParam = 'document';
      formData.append('fileType', fileTypeParam);

      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setMediaQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: percent } : q));
        }
      });

      // Update state
      setMediaQueue(prev => prev.map(q => q.id === item.id ? { 
        ...q, 
        status: 'success', 
        uploadedUrl: response.data.url, 
        publicId: response.data.publicId 
      } : q));

      // Auto-attach URL to forms if resource/achievement file
      if (postType === 'achievement') {
        setAchievementForm(prev => ({ ...prev, mediaUrl: response.data.url }));
      } else if (postType === 'resource') {
        setResourceForm(prev => ({ ...prev, fileUrl: response.data.url }));
      }

    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setErrorMsg(err.response?.data?.error || `Upload failed for file "${item.file.name}"`);
      setMediaQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
    }
  };

  const removeFromQueue = (id) => {
    setMediaQueue(prev => {
      const filtered = prev.filter(q => q.id !== id);
      const removed = prev.find(q => q.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return filtered;
    });
  };

  const triggerUploadInput = (acceptType) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // General Validation
    if (!caption.trim() && mediaQueue.length === 0) {
      setErrorMsg("Please write a description/caption or attach media assets.");
      return;
    }

    // Ensure all uploads are completed
    const pendingUploads = mediaQueue.some(q => q.status === 'uploading' || q.status === 'pending');
    if (pendingUploads) {
      setErrorMsg("Please wait for your files to finish uploading to Cloudinary.");
      return;
    }

    // Custom validations per category
    if (postType === 'project') {
      if (!projectForm.name.trim()) {
        setErrorMsg("Project Name is mandatory.");
        return;
      }
    } else if (['achievement', 'internship', 'placement', 'certificate', 'hackathon', 'research'].includes(postType)) {
      if (!achievementForm.title.trim()) {
        setErrorMsg("Milestone Title is mandatory.");
        return;
      }
    } else if (postType === 'resource') {
      if (!resourceForm.title.trim()) {
        setErrorMsg("Resource Title is mandatory.");
        return;
      }
      const hasDoc = mediaQueue.some(q => q.type === 'document') || resourceForm.fileUrl;
      if (!hasDoc) {
        setErrorMsg("Please upload a PDF or note document for the Resource category.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Map media list
      const formattedMedia = mediaQueue
        .filter(q => q.status === 'success')
        .map(q => ({
          url: q.uploadedUrl,
          type: q.type === 'video' ? 'video' : 'image',
          public_id: q.publicId,
          fileName: q.file.name,
          fileSize: q.file.size
        }));

      // Map postType to valid backend schema values
      let finalPostType = postType;
      if (['question', 'announcement'].includes(postType)) {
        finalPostType = 'text';
      } else if (['hackathon', 'research'].includes(postType)) {
        finalPostType = 'achievement';
      }

      const postPayload = {
        caption,
        visibility,
        postType: finalPostType,
        media: formattedMedia,
        projectData: postType === 'project' ? projectForm : undefined,
        achievementData: ['achievement', 'placement', 'internship', 'certificate', 'hackathon', 'research'].includes(postType) ? achievementForm : undefined,
        resourceData: postType === 'resource' ? resourceForm : undefined,
      };

      await createPost(postPayload);

      // Clear local draft cache
      localStorage.removeItem('campus_media_create_post_draft');

      setSuccessMsg("Success! Your post has been published.");
      setTimeout(() => {
        navigate('/feed');
      }, 1000);

    } catch (err) {
      console.error("Publishing exception:", err);
      setErrorMsg(err.message || "Failed to publish post.");
      setIsSubmitting(false);
    }
  };

  // Helper: parse hashtags for rendering in Live Preview
  const renderFormattedCaption = (text) => {
    if (!text) return <p className="text-slate-400 text-xs italic">Write some text in the description block to preview it here.</p>;
    const tokens = text.split(/(\s+)/);
    return (
      <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
        {tokens.map((token, i) => {
          if (token.startsWith('#')) {
            return <span key={i} className="text-indigo-600 font-bold hover:underline cursor-pointer">{token}</span>;
          }
          if (token.startsWith('@')) {
            return <span key={i} className="text-purple-600 font-bold hover:underline cursor-pointer">{token}</span>;
          }
          return token;
        })}
      </p>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4">
      <style dangerouslySetInnerHTML={{ __html: `
        .create-post-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 2rem;
          width: 100%;
        }
        .create-post-form {
          width: 100%;
        }
        .create-post-preview {
          width: 100%;
        }
        @media (min-width: 1024px) {
          .create-post-grid {
            grid-template-columns: repeat(12, minmax(0, 1fr));
          }
          .create-post-form {
            grid-column: span 7 / span 7;
          }
          .create-post-preview {
            grid-column: span 5 / span 5;
          }
        }
        .category-cards-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 1rem;
          width: 100%;
        }
        @media (min-width: 640px) {
          .category-cards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}} />
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Publish New Campus Post
          </h1>
          <p className="text-slate-500 text-sm font-semibold mt-0.5">Share notes, competitive achievements, code bases, and placements.</p>
        </div>
        
        {/* Draft controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={discardDraft}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all"
            title="Discard current draft"
          >
            <RotateCcw size={13} />
            Reset Form
          </button>
        </div>
      </div>

      <div className="create-post-grid items-start">
        
        {/* LEFT COLUMN: Input Form Section */}
        <form onSubmit={handlePostSubmit} className="create-post-form bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
          
          {/* Notification Banners */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-bold flex items-start gap-3 shadow-sm"
            >
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold flex items-start gap-3 shadow-sm"
            >
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* User details and Visibility Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-black text-base border-2 border-indigo-50">
                {currentUser?.profilePicture ? (
                  <img src={currentUser.profilePicture} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  (currentUser?.fullname || currentUser?.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                  {currentUser?.fullname || currentUser?.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5 capitalize">
                  {currentUser?.department || 'General'} • Year {currentUser?.year || 'N/A'}
                </p>
              </div>
            </div>

            {/* Visibility toggle option */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                {visibility === 'public' ? (
                  <>
                    <Globe size={13} className="text-slate-500" /> Public Feed
                  </>
                ) : (
                  <>
                    <Users size={13} className="text-indigo-500" /> Connections Only
                  </>
                )}
                <ChevronDown size={11} />
              </button>

              {showVisibilityDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowVisibilityDropdown(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setVisibility('public'); setShowVisibilityDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2"
                    >
                      <Globe size={14} className="text-slate-400" /> Public (All Campus)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setVisibility('connections'); setShowVisibilityDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-bold flex items-center gap-2"
                    >
                      <Users size={14} className="text-indigo-400" /> Connections Only
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Premium Category Grid Selection cards */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Select Post Category <span className="text-rose-500">*</span>
            </label>
            <div className="category-cards-grid">
              {categoryCards.map(cat => {
                const Icon = cat.icon;
                const isSelected = postType === cat.id || (cat.id === 'text' && postType === 'text');
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setPostType(cat.id);
                      setErrorMsg('');
                    }}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex gap-4 ${
                      isSelected 
                        ? 'border-slate-800 bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.01]' 
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm">{cat.label}</h4>
                      <p className={`text-xs mt-1 leading-snug line-clamp-2 ${
                        isSelected ? 'text-slate-300 font-medium' : 'text-slate-400 font-semibold'
                      }`}>
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Caption Area */}
          <div className="space-y-1.5 relative">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Post Description / Summary
            </label>
            <textarea
              ref={textareaRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                postType === 'project' ? "Write a short summary or features list about your project... 💻" :
                postType === 'achievement' ? "Tell the campus about this award, competition, or hackathon! 🏆" :
                postType === 'resource' ? "Describe the uploaded file content and syllabus reference... 📄" :
                postType === 'internship' ? "Outline your corporate internship notes and apply tips... 💼" :
                postType === 'placement' ? "Detail the corporate placement round, company, and package... 🏢" :
                "Share an update, news, question, or study tip with the campus... Add hashtags (#react) or mention classes (@sushant)"
              }
              rows={4}
              maxLength={1500}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4.5 focus:bg-white focus:border-indigo-500 focus:outline-none text-slate-700 text-sm leading-relaxed placeholder:text-slate-400 min-h-[90px] max-h-[300px]"
            />
            <div className="absolute right-3.5 bottom-2.5 text-[10px] text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded">
              {caption.length}/1500
            </div>
          </div>

          {/* Media Drag & Drop Attachment Area */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Attach Images, Video, or PDF Materials
            </label>
            
            <div 
              onClick={() => triggerUploadInput('image/*,video/*,.pdf,.doc,.docx')}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl py-7 px-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
            >
              <Paperclip className="text-slate-400 group-hover:text-indigo-500 transition-colors mb-2.5" size={24} />
              <p className="text-xs font-bold text-slate-700">Drag & Drop or click to browse files</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Supports Images, Video (MP4 max 50MB), or PDF (max 10MB)</p>
            </div>

            {/* Media Uploads Queue list */}
            {mediaQueue.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {mediaQueue.map((item) => (
                  <div key={item.id} className="relative p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 overflow-hidden shadow-sm">
                    {item.type === 'image' && item.previewUrl ? (
                      <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                        <img src={item.previewUrl || item.uploadedUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                        item.type === 'video' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-orange-50 border-orange-100 text-orange-600'
                      }`}>
                        <FileText size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs font-bold text-slate-700 truncate leading-snug">{item.file.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{(item.file.size / 1024 / 1024).toFixed(1)} MB • {item.type}</p>
                      
                      {item.status === 'uploading' && (
                        <div className="w-full mt-1.5 bg-slate-200 rounded-full h-1">
                          <div className="bg-indigo-600 h-1 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }}></div>
                        </div>
                      )}
                      {item.status === 'success' && (
                        <span className="inline-block text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1">Uploaded to Cloud</span>
                      )}
                      {item.status === 'error' && (
                        <span className="inline-block text-[9px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md mt-1">Upload Failed</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromQueue(item.id)}
                      className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-form Panels base on category */}
          <AnimatePresence mode="wait">
            {postType === 'project' && (
              <motion.div 
                key="project-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 border-b border-blue-100 pb-2">
                  <Code2 size={16} /> Enter Project Portfolios Sync Fields
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Parking Assistant"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tech Stack (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Flutter, Firebase, Python"
                      value={projectForm.techStack}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, techStack: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Terminal size={12} /> GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/.../..."
                        value={projectForm.githubUrl}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Link2 size={12} /> Live Showcase Demo URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={projectForm.demoUrl}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, demoUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Development Status</label>
                    <select
                      value={projectForm.status}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-bold"
                    >
                      <option value="completed">Completed / Deployed</option>
                      <option value="active">Active Development</option>
                      <option value="archived">Archived / Legacy</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {['achievement', 'internship', 'placement', 'certificate', 'hackathon', 'research'].includes(postType) && (
              <motion.div 
                key="achievement-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 border-b border-emerald-100 pb-2">
                  <Award size={16} /> Enter Achievement Sync Fields
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Milestone Title <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AWS Solutions Architect, placement at IBM"
                      value={achievementForm.title}
                      onChange={(e) => setAchievementForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Building size={12} /> Issuing Organization / Employer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Smart India Hackathon, AWS, TCS"
                        value={achievementForm.organization}
                        onChange={(e) => setAchievementForm(prev => ({ ...prev, organization: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar size={12} /> Date Awarded
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. June 2026"
                        value={achievementForm.date}
                        onChange={(e) => setAchievementForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Milestone Category Type</label>
                      <select
                        value={achievementForm.type}
                        onChange={(e) => setAchievementForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                      >
                        <option value="award">Award / Placement Win</option>
                        <option value="certification">Industry Certification</option>
                        <option value="internship">Internship Completion</option>
                        <option value="placement">Full-time Job Placement</option>
                        <option value="hackathon">Hackathon Rank</option>
                        <option value="competition">Contest Placement</option>
                        <option value="publication">Research Publication</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin size={12} /> Venue / Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Remote, On Campus, Bangalore"
                        value={achievementForm.location}
                        onChange={(e) => setAchievementForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {postType === 'resource' && (
              <motion.div 
                key="resource-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700 border-b border-indigo-100 pb-2">
                  <BookOpen size={16} /> Enter Resource Details
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resource Title <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Discrete Mathematics Previous Year Question Papers"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science Engineering"
                        value={resourceForm.department}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                      <input
                        type="text"
                        placeholder="e.g. Discrete Math"
                        value={resourceForm.subject}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Semester</label>
                      <select
                        value={resourceForm.semester}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, semester: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                      >
                        <option value="">Select</option>
                        {['1', '2', '3', '4', '5', '6', '7', '8'].map(sem => (
                          <option key={sem} value={sem}>Sem {sem}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Year</label>
                      <select
                        value={resourceForm.year}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                      >
                        <option value="">Select</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Doc Category</label>
                      <select
                        value={resourceForm.category}
                        onChange={(e) => setResourceForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                      >
                        <option value="note">Study Note PPT</option>
                        <option value="pyq">Question Paper</option>
                        <option value="assignment">Assignment</option>
                        <option value="lab_manual">Lab Manual</option>
                        <option value="ppt">Circular Slides</option>
                        <option value="pdf">Syllabus Guide</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action trigger footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase italic leading-snug">Draft autosave enabled</span>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all text-center"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Post'
                )}
              </button>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            multiple
            className="hidden" 
          />
        </form>

        {/* RIGHT COLUMN: Real-Time Live Feed Card Preview (Sticky on desktop) */}
        <div className="create-post-preview lg:sticky lg:top-6 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Live Feed Card Preview</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase">Instantly Updated</span>
          </div>

          {/* Feed PostCard Mock Replica */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 relative overflow-hidden transition-all duration-300">
            
            {/* Header info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-extrabold text-sm border-2 border-indigo-50">
                  {currentUser?.profilePicture ? (
                    <img src={currentUser.profilePicture} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    (currentUser?.fullname || currentUser?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 text-sm">{currentUser?.fullname || currentUser?.name}</span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold capitalize flex items-center gap-1">
                      {postType === 'text' ? 'General' : postType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                    {currentUser?.department || 'Department'} • Year {currentUser?.year || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Visibility and Menu stub */}
              <div className="flex items-center gap-2">
                {visibility === 'public' ? (
                  <Globe size={14} className="text-slate-400" />
                ) : (
                  <Users size={14} className="text-indigo-400" />
                )}
              </div>
            </div>

            {/* Custom fields indicators in cards preview */}
            {postType === 'project' && projectForm.name && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-1"><Code2 size={14} className="text-blue-600"/> {projectForm.name}</h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold capitalize">{projectForm.status}</span>
                </div>
                {projectForm.techStack && (
                  <div className="flex flex-wrap gap-1.5">
                    {projectForm.techStack.split(',').map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-blue-100 text-blue-700 text-[9px] font-bold rounded-lg">{tech.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2 text-[11px] text-blue-600 font-bold border-t border-blue-100/50">
                  {projectForm.githubUrl && <span className="flex items-center gap-1 cursor-pointer"><Terminal size={11} /> Repo</span>}
                  {projectForm.demoUrl && <span className="flex items-center gap-1 cursor-pointer"><Link2 size={11} /> Live Demo</span>}
                </div>
              </div>
            )}

            {['achievement', 'internship', 'placement', 'certificate', 'hackathon', 'research'].includes(postType) && achievementForm.title && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-1"><Award size={14} className="text-emerald-600" /> {achievementForm.title}</h4>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-semibold">
                  {achievementForm.organization && <span>Issuer: <strong>{achievementForm.organization}</strong></span>}
                  {achievementForm.date && <span>Date: {achievementForm.date}</span>}
                  {achievementForm.location && <span>• {achievementForm.location}</span>}
                </div>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold capitalize">{achievementForm.type}</span>
              </div>
            )}

            {postType === 'resource' && resourceForm.title && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-1"><BookOpen size={14} className="text-indigo-600" /> {resourceForm.title}</h4>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold uppercase tracking-wide">{resourceForm.category}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-semibold pt-1 border-t border-indigo-100/40">
                  {resourceForm.department && <span>Dept: {resourceForm.department}</span>}
                  {resourceForm.subject && <span>Subject: {resourceForm.subject}</span>}
                  {resourceForm.semester && <span>Semester: {resourceForm.semester}</span>}
                  {resourceForm.year && <span>Year: {resourceForm.year}</span>}
                </div>
                <div className="w-full mt-2 py-1.5 bg-indigo-600 text-white rounded-xl text-center text-xs font-bold shadow-sm shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5">
                  <Paperclip size={13} /> Download Note Resource
                </div>
              </div>
            )}

            {/* Caption text */}
            <div className="px-1 text-slate-800">
              {renderFormattedCaption(caption)}
            </div>

            {/* Media Carousel preview */}
            {mediaQueue.filter(q => q.status === 'success' || q.previewUrl).length > 0 && (
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 max-h-[300px]">
                {mediaQueue.filter(q => q.status === 'success' || q.previewUrl).map((item, index) => {
                  if (index === 0) { // Render first successfully uploaded/preview item
                    if (item.type === 'image' && item.previewUrl) {
                      return <img key={item.id} src={item.previewUrl || item.uploadedUrl} alt="Post Content" className="w-full h-full object-cover aspect-video" />;
                    } else if (item.type === 'image' && item.uploadedUrl) {
                      return <img key={item.id} src={item.uploadedUrl} alt="Post Content" className="w-full h-full object-cover aspect-video" />;
                    } else if (item.type === 'video') {
                      return (
                        <div key={item.id} className="aspect-video bg-slate-900 flex items-center justify-center text-white flex-col gap-2 p-4">
                          <FileText size={32} className="text-indigo-400" />
                          <span className="text-xs font-bold text-slate-300">Video Content Attachment</span>
                          <span className="text-[10px] text-slate-500">{item.file.name}</span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={item.id} className="aspect-video bg-slate-50 flex items-center justify-center text-slate-700 flex-col gap-2 p-4 text-center">
                          <FileText size={32} className="text-orange-500" />
                          <span className="text-xs font-extrabold text-slate-700">Document PDF / Notes Attachment</span>
                          <span className="text-[10px] text-slate-500">{item.file.name}</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })}
              </div>
            )}

            {/* Mock actions footer bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-400 px-1">
              <button type="button" className="flex items-center gap-1.5 text-xs font-bold hover:text-rose-500 transition-colors">
                <Heart size={16} /> Likes
              </button>
              <button type="button" className="flex items-center gap-1.5 text-xs font-bold hover:text-indigo-500 transition-colors">
                <MessageCircle size={16} /> Comments
              </button>
              <button type="button" className="flex items-center gap-1.5 text-xs font-bold hover:text-slate-700 transition-colors">
                <Share2 size={16} /> Share
              </button>
              <button type="button" className="flex items-center gap-1.5 text-xs font-bold hover:text-indigo-500 transition-colors">
                <Bookmark size={16} /> Save
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
