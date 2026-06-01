import React from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Calendar, ExternalLink, Briefcase } from 'lucide-react';

export const JobBoard = () => {
  const { jobs } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Job Board</h1>
        <p className="text-slate-500">Latest internships and full-time opportunities.</p>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-100 transition-colors">
            <div className="flex items-start gap-4">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase size={24} />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-slate-800">{job.title}</h2>
                 <p className="text-indigo-600 font-medium">{job.company}</p>
                 <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                   <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                   <span className="flex items-center gap-1"><Calendar size={14} /> Posted: {job.postedDate}</span>
                   <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold">{job.type}</span>
                 </div>
                 <p className="text-sm text-slate-600 mt-3 max-w-2xl">{job.description}</p>
               </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 min-w-[140px]">
               <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">Deadline: {job.deadline}</span>
               <a 
                 href={job.applicationLink} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-2"
               >
                 Apply Now <ExternalLink size={16} />
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
