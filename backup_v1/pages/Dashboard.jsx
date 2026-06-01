import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Briefcase, CheckCircle, BookOpen, PenTool, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard = () => {
  const { currentUser, jobs, questions, notes, addNote } = useApp();
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { label: 'Active Jobs', value: jobs.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Questions Bank', value: questions.filter(q => q.status === 'APPROVED').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Shared Notes', value: notes.length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const handleAddNote = (e) => {
    e.preventDefault();
    if (newNoteTitle && newNoteContent) {
      addNote({
        title: newNoteTitle,
        content: newNoteContent,
        category: noteCategory
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setNoteCategory('General');
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mock data for chart
  const data = [
    { name: 'Mon', hours: 2 },
    { name: 'Tue', hours: 4 },
    { name: 'Wed', hours: 1.5 },
    { name: 'Thu', hours: 5 },
    { name: 'Fri', hours: 3 },
    { name: 'Sat', hours: 6 },
    { name: 'Sun', hours: 2 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 font-sans tracking-tight">Welcome back, {currentUser?.name}!</h1>
        <p className="text-slate-500 mt-2">Here's what's happening on Campus Media today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`p-4 rounded-lg ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Study Activity (Mock)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366f1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Note Add */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PenTool size={20} className="text-indigo-600"/> Share a Note
          </h2>
          <form onSubmit={handleAddNote} className="space-y-4">
            <input
              type="text"
              placeholder="Topic Title"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              required
            />
            <div className="flex gap-2">
               <select
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
               >
                 <option>General</option>
                 <option>Algorithms</option>
                 <option>System Design</option>
                 <option>Frontend</option>
                 <option>Backend</option>
               </select>
            </div>
            <textarea
              placeholder="Write your note here (Markdown supported)..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Post Note
            </button>
          </form>
        </div>
      </div>

      {/* Recent Notes Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Recent Notes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.length === 0 ? (
            <p className="text-slate-500 italic col-span-3 text-center py-8">No notes found.</p>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">{note.category}</span>
                  <span className="text-slate-400 text-xs">{note.date}</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-2 truncate">{note.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4">{note.content}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-50">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                      {note.authorName?.charAt(0) || 'N'}
                    </div>
                    <span>{note.authorName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
