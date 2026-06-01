import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export const ResumeAnalyzer = () => {
  const { currentUser, updateResumeContext } = useApp();
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('Entry-Level');
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || !role || !currentUser) return;

    setLoading(true);
    try {
      // Create clean file upload payload
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('targetRole', role);
      formData.append('experienceLevel', level);

      // Perform unified server-side PDF extraction + Mongoose storage + Gemini Analysis
      const response = await api.post('/resume/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const result = response.data;
      
      if (result && result.success === false) {
        alert(result.error || "AI analysis unavailable");
        return;
      }
      
      setAnalysis(result);
      if (result.extractedData) {
        updateResumeContext('', result.extractedData);
      }

    } catch (error) {
      console.error("Analysis failed", error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to analyze resume. Make sure it's a valid PDF.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Upload className="text-indigo-600" /> Resume Setup
          </h2>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Role</label>
              <input 
                type="text" placeholder="e.g. Software Engineer"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={role} onChange={(e) => setRole(e.target.value)} required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={level} onChange={(e) => setLevel(e.target.value)}
              >
                <option>Internship</option>
                <option>Entry-Level</option>
                <option>Mid-Senior</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-indigo-100 hover:border-indigo-300 rounded-xl p-8 text-center cursor-pointer relative transition-colors bg-indigo-50/30">
               <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
               <FileText className="mx-auto text-indigo-400 mb-2" size={32} />
               <p className="text-sm font-medium text-indigo-900">{file ? file.name : "Upload Resume (PDF)"}</p>
            </div>

            <button 
              type="submit" disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-bold transition-all shadow-md ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
              }`}
            >
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="lg:col-span-8 overflow-y-auto pb-10">
        {analysis ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-6">
                   <div className="relative w-24 h-24 flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90">
                       <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                       <circle cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * (analysis?.score || 0)) / 100} className="transition-all duration-1000 ease-out" />
                     </svg>
                     <span className="absolute text-2xl font-bold text-slate-800">{analysis?.score || 0}</span>
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold text-slate-800">Resume Score</h2>
                     <p className="text-slate-500">ATS Compatibility: <span className="font-semibold text-indigo-600">{analysis?.atsCompatibility || 0}%</span></p>
                   </div>
                 </div>
                 <div className="flex-1 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                     <p className="text-indigo-900 text-sm leading-relaxed italic">"{analysis?.summary || 'No summary available.'}"</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle className="text-green-500" size={20}/> Key Strengths</h3>
                   <ul className="space-y-3">
                     {(analysis?.strengths || []).map((item, i) => (
                       <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                         <span className="mt-1 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" /> {item}
                       </li>
                     ))}
                   </ul>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle className="text-amber-500" size={20}/> Improvements</h3>
                   <ul className="space-y-3">
                     {(analysis?.weaknesses || []).map((item, i) => (
                       <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                         <span className="mt-1 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" /> {item}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-purple-500" size={20}/> AI Rewrite Suggestions</h3>
                 <div className="space-y-6">
                   {(analysis?.optimizedPoints || []).map((point, i) => (
                     <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                       <div className="bg-red-50 p-4 border-b border-red-100">
                         <p className="text-xs font-bold text-red-600 uppercase mb-1">Original</p>
                         <p className="text-slate-700 text-sm">{point?.original}</p>
                       </div>
                       <div className="bg-green-50 p-4 border-b border-green-100">
                         <p className="text-xs font-bold text-green-600 uppercase mb-1 flex items-center gap-1"><Sparkles size={12}/> Optimized</p>
                         <p className="text-slate-800 text-sm font-medium">{point?.optimized}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
             <FileText size={48} className="text-indigo-200 mb-4" />
             <p className="text-lg font-medium">Ready to Analyze</p>
          </div>
        )}
      </div>
    </div>
  );
};
