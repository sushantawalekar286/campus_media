import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, Plus, FileText, Download, 
  ExternalLink, Trash2, X, GraduationCap, Calendar, BookOpenCheck
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

export const ResourcesPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Upload Form Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'note',
    fileUrl: '',
    department: '',
    course: '',
    semester: '',
    subject: '',
    year: '1st Year'
  });

  const DEPARTMENTS = [
    'Computer Science', 'Electronics', 'Mechanical', 'Electrical', 'Civil', 'Information Technology', 'Chemical'
  ];
  const CATEGORIES = [
    { value: 'note', label: 'Lecture Note' },
    { value: 'pyq', label: 'Previous Year Question (PYQ)' },
    { value: 'assignment', label: 'Assignment Answer' },
    { value: 'lab_manual', label: 'Lab Manual' },
    { value: 'ppt', label: 'PPT Slides' },
    { value: 'book', label: 'Textbook PDF' }
  ];

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/notes');
      setResources(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load study resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.fileUrl.trim()) {
      setUploadError('Resource Title and File/Download URL are required.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    try {
      const res = await apiClient.post('/notes', formData);
      setResources(prev => [res.data, ...prev]);
      setShowUploadModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'note',
        fileUrl: '',
        department: '',
        course: '',
        semester: '',
        subject: '',
        year: '1st Year'
      });
      alert('Resource uploaded successfully!');
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.error || 'Failed to publish resource.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await apiClient.delete(`/notes/${id}`);
      setResources(prev => prev.filter(r => r._id !== id && r.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error deleting resource.');
    }
  };

  // Filter logic in memory
  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.course?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || res.category === filterCategory;
    const matchesDept = !filterDept || res.department?.toLowerCase() === filterDept.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesDept;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Academic Resources</h1>
            <p className="text-slate-500 text-sm">Access and download study notes, question papers, and lab files.</p>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} /> Share Resource
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject, or course..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>

        {/* Category */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 px-3 py-2 focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {/* Department */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-655 px-3 py-2 focus:outline-none"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-755 border border-red-100 rounded-xl p-4 text-center text-sm font-semibold max-w-md mx-auto my-12">
            {error}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res) => {
              const resId = res._id || res.id;
              const isOwner = currentUser && (res.authorId === currentUser._id || res.authorId === currentUser.id || res.uploaderId === currentUser._id);
              const isAdmin = currentUser?.role === 'ADMIN';

              return (
                <div 
                  key={resId} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all shadow-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                        {res.category}
                      </span>

                      {(isOwner || isAdmin) && (
                        <button
                          onClick={() => handleDeleteResource(resId)}
                          className="p-1 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete resource"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm mt-3 line-clamp-1 group-hover:text-indigo-650 transition-colors">
                      {res.title}
                    </h3>
                    
                    {res.description && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {res.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      {res.subject && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <BookOpenCheck size={12} className="text-slate-400" />
                          <span>Subject: {res.subject}</span>
                        </div>
                      )}
                      {res.department && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                          <GraduationCap size={12} className="text-slate-400" />
                          <span>Dept: {res.department}</span>
                        </div>
                      )}
                      {res.year && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-650 font-semibold">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Year: {res.year}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">
                      Shared by {res.authorName || 'Anonymous'}
                    </span>

                    {res.fileUrl && (
                      <a
                        href={res.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Download size={12} /> Get File
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
            <BookOpen size={40} className="mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-slate-800 mb-1">No Resources Available</h3>
            <p className="text-slate-500 text-xs">Search or adjust filters to explore shared study documents.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600" /> Share Study Resource
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {uploadError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold p-3 rounded-lg text-center">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. DBMS Unit 3 Handwritten Notes"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the content of notes or details of assignment..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-bold text-slate-655"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-bold text-slate-655"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-bold text-slate-655"
                  >
                    <option value="">Select Dept</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Course</label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="e.g. B.Tech"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. DBMS"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                    placeholder="e.g. 5th Sem"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Drive / Document / File URL *</label>
                <input
                  type="url"
                  required
                  value={formData.fileUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                  placeholder="Paste Google Drive link, Cloudinary link, or raw PDF URL..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {uploadLoading ? 'Uploading...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
