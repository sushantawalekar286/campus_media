import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateRoadmap } from '../services/geminiService';
import { Map, Clock, Layers, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';

export const RoadmapGenerator = () => {
  const { resumeContext } = useApp();
  const [domain, setDomain] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-fill skills from context if available, otherwise empty
  const [currentSkills, setCurrentSkills] = useState(
    resumeContext.extractedData?.keySkills?.join(', ') || ''
  );

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setRoadmap(null);
    try {
      const skillsArray = currentSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const result = await generateRoadmap(skillsArray, domain);
      setRoadmap(result);
    } catch (error) {
      console.error(error);
      alert("Failed to generate roadmap. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full font-sans">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Map className="text-indigo-600" /> Career Roadmap
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Generate a 6-stage personalized learning path from your current skills to your dream role.
        </p>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Domain / Role</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. AI Engineer, React Developer"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Skills</label>
            <textarea
              className="w-full p-3 border border-slate-200 rounded-lg h-32 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              placeholder="Java, Python, SQL (Comma separated)..."
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              {resumeContext.extractedData 
                ? "Autofilled from your resume." 
                : "Enter skills manually for better results."}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !domain}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
          >
            {loading ? (
                <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating...
                </>
            ) : 'Generate Roadmap'}
          </button>
        </form>
      </div>

      {/* Roadmap Visualization */}
      <div className="lg:col-span-8 overflow-y-auto pr-2 pb-10">
        {roadmap ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Your Path to {roadmap?.targetDomain || domain}</h2>
                <p className="text-slate-500 text-sm">Follow these 6 stages to mastery.</p>
              </div>
            </div>

            <div className="relative border-l-4 border-indigo-100 ml-4 space-y-8 pl-8">
              {(roadmap?.stages || []).map((stage, idx) => (
                <div key={idx} className="relative">
                  {/* Stage Marker */}
                  <div className="absolute -left-[42px] top-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md z-10">
                    {idx + 1}
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-lg font-bold text-indigo-900">{stage.stageName}</h3>
                       <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded uppercase tracking-wide text-slate-500">Stage {idx + 1}</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4 italic">{stage?.description}</p>
                    
                    <div className="space-y-3">
                      {(stage?.items || []).map((item, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                           <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <BookOpen size={14} className="text-indigo-500"/> {item.topic}
                              </h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                item.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{item.difficulty}</span>
                           </div>
                           <p className="text-xs text-slate-600 mt-1">{item.reason}</p>
                           <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                             <span className="flex items-center gap-1"><Clock size={12}/> {item.timeEstimate}</span>
                             {item.resources && item.resources.length > 0 && (
                               <span className="flex items-center gap-1"><ExternalLink size={12}/> {item.resources.length} Resources</span>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-indigo-900 text-white p-6 rounded-xl text-center">
              <h3 className="font-bold text-lg mb-2">Ready to start?</h3>
              <p className="text-indigo-200 text-sm">Complete Stage 1 and return for a mock interview!</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 min-h-[400px]">
             <Layers size={64} className="mb-4 opacity-20" />
             <p className="text-lg font-medium">No Roadmap Generated Yet</p>
             <p className="text-sm">Enter a target domain to see your personalized learning path.</p>
          </div>
        )}
      </div>
    </div>
  );
};
