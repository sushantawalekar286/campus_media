import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Calendar, ExternalLink, Briefcase, Search, Filter, Bookmark, Map } from 'lucide-react';
import { motion } from 'framer-motion';

export const JobBoard = () => {
  const { jobs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [workModel, setWorkModel] = useState('All');

  // We add fallback random logos/salaries since we updated model but old data might lack it
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || job.type === typeFilter;
    const matchesModel = workModel === 'All' || job.category === workModel;
    return matchesSearch && matchesType && matchesModel;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto py-4 h-full">
      
      {/* Left Sidebar Filters */}
      <div className="hidden lg:block lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 sticky top-4">
          <div className="flex items-center gap-2 mb-4 text-slate-800 border-b border-slate-100 pb-2">
            <Filter size={18} className="text-indigo-600" />
            <h3 className="font-bold">Filters</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Job Type</h4>
              <div className="space-y-2">
                {['All', 'Full-time', 'Internship', 'Part-time'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="jobType"
                      checked={typeFilter === type}
                      onChange={() => setTypeFilter(type)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" 
                    />
                    <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Work Model</h4>
              <div className="space-y-2">
                {['All', 'On-Campus', 'Off-Campus', 'Remote', 'Hybrid'].map(model => (
                  <label key={model} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="workModel"
                      checked={workModel === model}
                      onChange={() => setWorkModel(model)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" 
                    />
                    <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors">{model}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {['React', 'Node.js', 'Python', 'Java', 'C++', 'UI/UX'].map(skill => (
                  <span key={skill} className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-1 lg:col-span-3 h-full flex flex-col">
        {/* Search Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by title, company, or skills..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium"
            />
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-4 overflow-y-auto pr-2 pb-10 custom-scrollbar">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No jobs found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredJobs.map((job, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={job.id || job._id} 
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-start justify-between gap-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4 flex-1">
                   <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold text-indigo-600">
                      {job.logoUrl ? (
                        <img src={job.logoUrl} alt={job.company} className="w-10 h-10 object-contain" />
                      ) : (
                        job.company.charAt(0)
                      )}
                   </div>
                   <div className="flex-1">
                     <div className="flex items-center justify-between md:justify-start gap-2 mb-1">
                        <h2 className="text-[17px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{job.title}</h2>
                        {job.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 ml-2 hidden md:inline-block">
                            {job.category}
                          </span>
                        )}
                     </div>
                     <p className="text-sm font-semibold text-slate-600 mb-3">{job.company}</p>
                     
                     <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <MapPin size={14} className="text-indigo-400" />
                          {job.location || 'Remote'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <Briefcase size={14} className="text-orange-400" />
                          {job.type}
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                            {job.salary}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <Calendar size={14} className="text-blue-400" />
                          {job.postedDate}
                        </div>
                     </div>
                     
                     <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3">{job.description}</p>
                     
                     {job.skillsRequired?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.skillsRequired.map(s => (
                            <span key={s} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                     )}
                   </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 min-w-[140px] pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                   <button className="text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 p-2 rounded-lg transition-colors tooltip hidden md:flex" title="Save Job">
                     <Bookmark size={18} />
                   </button>
                   
                   <div className="w-full text-right">
                     {job.deadline && (
                       <p className="text-[11px] font-semibold text-red-500 mb-2">Closes: {job.deadline}</p>
                     )}
                     <a 
                       href={job.applicationLink || '#'} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all hover:shadow-md text-sm"
                     >
                       Apply <ExternalLink size={16} />
                     </a>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
