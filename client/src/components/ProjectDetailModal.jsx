import React from 'react';
import { X, Github, ExternalLink, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProjectDetailModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative"
      >
        {/* Cover Media */}
        <div className="h-56 bg-slate-100 relative">
          {project.media ? (
            <img
              src={project.media}
              alt={project.name || project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-500">
              <span className="text-sm font-semibold">Project Showcase</span>
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full hover:scale-105 transition-all shadow-md backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-2xl font-bold text-slate-800 leading-snug">
              {project.name || project.title}
            </h2>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-wide">
              {project.status || 'completed'}
            </span>
          </div>

          {/* Role and Date */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6 font-medium">
            {project.role && (
              <span className="flex items-center gap-1.5">
                <Users size={16} className="text-slate-400" />
                Role: <strong className="text-slate-700">{project.role}</strong>
              </span>
            )}
            {project.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-slate-400" />
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-700 mb-2 uppercase tracking-wide text-xs">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
              {project.description || 'No description provided.'}
            </p>
          </div>

          {/* Tech Stack */}
          {project.techStack?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-700 mb-2 uppercase tracking-wide text-xs">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          {project.teamMembers?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-700 mb-2 uppercase tracking-wide text-xs">Team Members</h3>
              <div className="flex flex-wrap gap-3">
                {project.teamMembers.map((member, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
                    <Users size={12} className="text-slate-400" />
                    <span>{member}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Links */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors text-sm"
              >
                <Github size={18} />
                GitHub Repository
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-indigo-600/10 text-sm"
              >
                <ExternalLink size={18} />
                Live Demo
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
