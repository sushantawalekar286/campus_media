import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, ThumbsUp, Filter } from 'lucide-react';

export const QuestionBank = () => {
  const { questions, addQuestion, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    addQuestion({ company, role, text, difficulty });
    setShowModal(false);
    setCompany('');
    setRole('');
    setText('');
  };

  const filteredQuestions = questions.filter(q => 
    q.status === 'APPROVED' && 
    (q.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
     q.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
     q.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Interview Question Bank</h1>
           <p className="text-slate-500">Real questions shared by students.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Contribute Question
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
        <div className="flex-1 relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search by company, role, or keyword..." 
             className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
           <Filter size={20} />
        </button>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.map((q) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold mr-2 uppercase tracking-wide">
                  {q.company}
                </span>
                <span className="text-sm text-slate-500 font-medium">{q.role}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {q.difficulty}
              </span>
            </div>
            <h3 className="text-slate-800 font-medium mb-4 leading-relaxed">{q.text}</h3>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <span className="text-xs text-slate-400">Verified by Admin</span>
               <button className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 text-sm transition-colors">
                  <ThumbsUp size={16} /> Helpful
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">Contribute a Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                 <input 
                   type="text" required 
                   className="w-full p-2 border border-slate-200 rounded-lg"
                   value={company} onChange={(e) => setCompany(e.target.value)}
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                 <input 
                   type="text" required 
                   className="w-full p-2 border border-slate-200 rounded-lg"
                   value={role} onChange={(e) => setRole(e.target.value)}
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                 <select 
                   className="w-full p-2 border border-slate-200 rounded-lg"
                   value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                 >
                   <option>Easy</option>
                   <option>Medium</option>
                   <option>Hard</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
                 <textarea 
                   required 
                   className="w-full p-2 border border-slate-200 rounded-lg h-32 resize-none"
                   value={text} onChange={(e) => setText(e.target.value)}
                 />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
