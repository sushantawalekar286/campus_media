import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserStatus } from '../types';
import { 
  Check, X, Trash2, PlusCircle, Users, FileText, 
  MessageSquare, Briefcase, Settings, Shield, BarChart2, 
  Search, AlertTriangle, AlertCircle, Ban, Unlock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export const AdminPanel = () => {
  const { 
    currentUser, users, questions, jobs, messages, resumeSubmissions = [], systemConfig,
    updateUserStatus, deleteUser, 
    updateQuestionStatus, deleteQuestion,
    addJob, deleteJob,
    deleteMessage,
    updateSystemConfig
  } = useApp();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab ] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // Job Form State
  const [jobForm, setJobForm] = useState({
    title: '', company: '', location: '', type: 'Full-time',
    deadline: '', description: '', applicationLink: '', category: 'Off-Campus'
  });

  // Protect Route
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
        <Shield size={64} className="text-red-500 mb-4" />
        <h2 className="text-3xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view the Admin Panel.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // --- Analytics Data Prep ---
  const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
  const pendingQuestions = questions.filter(q => q.status === 'PENDING').length;
  const avgResumeScore = Math.round(resumeSubmissions.reduce((acc, curr) => acc + curr.score, 0) / (resumeSubmissions.length || 1));
  
  const activityData = [
    { name: 'Questions', count: questions.length },
    { name: 'Resumes', count: resumeSubmissions.length },
    { name: 'Messages', count: messages.length },
    { name: 'Jobs', count: jobs.length },
  ];

  const roleData = [
    { name: 'Students', value: users.filter(u => u.role === UserRole.STUDENT).length },
    { name: 'Admins', value: users.filter(u => u.role === UserRole.ADMIN).length },
  ];
  const COLORS = ['#6366f1', '#10b981'];

  // --- Duplicate Detection Helper ---
  const isPotentialDuplicate = (text, id) => {
     return questions.some(q => q.id !== id && q.status === 'APPROVED' && q.text.includes(text.slice(0, 20)));
  };

  // --- Render Functions ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Total Users</p>
                   <p className="text-3xl font-bold text-slate-800">{users.length}</p>
                </div>
                <Users className="text-blue-500 bg-blue-50 p-2 rounded-lg" size={40} />
             </div>
             <p className="text-xs text-green-600 mt-2 font-medium">+{activeUsers} Active</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Pending Questions</p>
                   <p className="text-3xl font-bold text-slate-800">{pendingQuestions}</p>
                </div>
                <AlertCircle className="text-amber-500 bg-amber-50 p-2 rounded-lg" size={40} />
             </div>
             <p className="text-xs text-slate-400 mt-2">Requires Review</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Avg Resume Score</p>
                   <p className="text-3xl font-bold text-slate-800">{avgResumeScore}</p>
                </div>
                <FileText className="text-indigo-500 bg-indigo-50 p-2 rounded-lg" size={40} />
             </div>
             <p className="text-xs text-slate-400 mt-2">Based on {resumeSubmissions.length} scans</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Active Jobs</p>
                   <p className="text-3xl font-bold text-slate-800">{jobs.length}</p>
                </div>
                <Briefcase className="text-green-500 bg-green-50 p-2 rounded-lg" size={40} />
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
             <h3 className="font-bold text-slate-700 mb-4">Platform Activity</h3>
             <ResponsiveContainer width="100%" height="90%">
                <BarChart data={activityData}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} />
                   <YAxis hide />
                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                   <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {activityData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][index]} />
                      ))}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
             <h3 className="font-bold text-slate-700 mb-4">User Distribution</h3>
             <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                   <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                   >
                      {roleData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Pie>
                   <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#6366f1] rounded-full"></div> Students</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#10b981] rounded-full"></div> Admins</div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
       <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700">User Management</h3>
          <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
       </div>
       <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                   <th className="px-6 py-3">User</th>
                   <th className="px-6 py-3">Role</th>
                   <th className="px-6 py-3">Status</th>
                   <th className="px-6 py-3">Joined</th>
                   <th className="px-6 py-3">Actions</th>
                </tr>
             </thead>
             <tbody>
                {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                   <tr key={user.id} className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                         <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                            {user.name.charAt(0)}
                         </div>
                         <div>
                            <div>{user.name}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.status}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{user.joinedDate}</td>
                      <td className="px-6 py-4">
                         {user.id !== currentUser?.id && (
                            <div className="flex gap-2">
                               {user.status === 'ACTIVE' ? (
                                  <button onClick={() => updateUserStatus(user.id, UserStatus.BLOCKED)} className="text-slate-400 hover:text-red-500" title="Block User"><Ban size={18} /></button>
                               ) : (
                                  <button onClick={() => updateUserStatus(user.id, UserStatus.ACTIVE)} className="text-slate-400 hover:text-green-500" title="Unblock User"><Unlock size={18} /></button>
                               )}
                               <button onClick={() => deleteUser(user.id)} className="text-slate-400 hover:text-red-600" title="Delete Account"><Trash2 size={18} /></button>
                            </div>
                         )}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderQuestions = () => (
     <div className="space-y-6">
        {/* Pending Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
           <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={20} /> Pending Approvals ({questions.filter(q => q.status === 'PENDING').length})
           </h3>
           <div className="space-y-4">
              {questions.filter(q => q.status === 'PENDING').length === 0 ? (
                 <p className="text-slate-400 text-sm italic">No pending questions.</p>
              ) : (
                 questions.filter(q => q.status === 'PENDING').map(q => {
                    const isDuplicate = isPotentialDuplicate(q.text, q.id);
                    return (
                       <div key={q.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="font-bold text-slate-800">{q.company}</span>
                                   <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{q.role}</span>
                                   <span className="text-xs text-slate-400">By {q.submittedByName}</span>
                                </div>
                                <p className="text-slate-700 text-sm">{q.text}</p>
                                {isDuplicate && (
                                   <div className="mt-2 text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded w-fit">
                                      <AlertTriangle size={12} /> Possible duplicate of an existing question
                                   </div>
                                )}
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => updateQuestionStatus(q.id, 'APPROVED')} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"><Check size={18}/></button>
                                <button onClick={() => updateQuestionStatus(q.id, 'REJECTED')} className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"><X size={18}/></button>
                             </div>
                          </div>
                       </div>
                    );
                 })
              )}
           </div>
        </div>

        {/* All Questions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">All Questions Database</div>
           <div className="max-h-96 overflow-y-auto">
              {questions.filter(q => q.status === 'APPROVED').map(q => (
                 <div key={q.id} className="p-4 border-b border-slate-100 flex justify-between hover:bg-slate-50">
                    <div>
                       <p className="text-sm font-bold text-slate-800">{q.text}</p>
                       <p className="text-xs text-slate-500">{q.company} • {q.role} • {q.difficulty}</p>
                    </div>
                    <button onClick={() => deleteQuestion(q.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                 </div>
              ))}
           </div>
        </div>
     </div>
  );

  const renderJobs = () => (
     <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800"><PlusCircle size={20}/> Post New Opportunity</h2>
           <form onSubmit={(e) => { e.preventDefault(); addJob(jobForm); alert('Job Posted!'); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Job Title" required className="p-2 border rounded-lg w-full text-sm" 
                  value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
                <input type="text" placeholder="Company" required className="p-2 border rounded-lg w-full text-sm"
                  value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input type="text" placeholder="Location" required className="p-2 border rounded-lg w-full text-sm"
                  value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} />
                <select className="p-2 border rounded-lg w-full text-sm"
                  value={jobForm.type} onChange={e => setJobForm({...jobForm, type: e.target.value})}>
                  <option>Full-time</option><option>Internship</option><option>Part-time</option>
                </select>
                <select className="p-2 border rounded-lg w-full text-sm"
                  value={jobForm.category} onChange={e => setJobForm({...jobForm, category: e.target.value})}>
                  <option>Off-Campus</option><option>On-Campus</option><option>Remote</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="p-2 border rounded-lg w-full text-sm"
                  value={jobForm.deadline} onChange={e => setJobForm({...jobForm, deadline: e.target.value})} />
                <input type="url" placeholder="Application URL" required className="p-2 border rounded-lg w-full text-sm"
                  value={jobForm.applicationLink} onChange={e => setJobForm({...jobForm, applicationLink: e.target.value})} />
              </div>
              <textarea placeholder="Job Description" required className="p-2 border rounded-lg w-full h-24 text-sm"
                 value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">Post Job</button>
           </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
           <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Active Listings</div>
           <div className="divide-y divide-slate-100">
              {jobs.map(job => (
                 <div key={job.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                       <h4 className="font-bold text-slate-800 text-sm">{job.title}</h4>
                       <p className="text-xs text-slate-500">{job.company} • {job.postedDate}</p>
                    </div>
                    <button onClick={() => deleteJob(job.id)} className="text-slate-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                 </div>
              ))}
           </div>
        </div>
     </div>
  );

  const renderModeration = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[500px] flex flex-col">
           <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
              <MessageSquare size={18} /> Chat Logs
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && <p className="text-slate-400 text-sm italic">No messages found.</p>}
              {messages.map(msg => (
                 <div key={msg.id} className="text-sm p-3 border border-slate-100 rounded-lg hover:bg-slate-50 group">
                    <div className="flex justify-between">
                       <span className="font-bold text-slate-700">{msg.senderName}</span>
                       <span className="text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{msg.text}</p>
                    <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => deleteMessage(msg.id)} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                          <Trash2 size={12}/> Remove Message
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[500px] flex flex-col">
           <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex items-center gap-2">
              <FileText size={18} /> Recent Resume Scans
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {resumeSubmissions.map(sub => (
                 <div key={sub.id} className="text-sm p-3 border border-slate-100 rounded-lg flex justify-between items-center">
                    <div>
                       <p className="font-bold text-slate-800">{sub.userName}</p>
                       <p className="text-xs text-slate-500">Role: {sub.role} • Score: <span className={sub.score > 75 ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>{sub.score}</span></p>
                    </div>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{sub.date}</span>
                 </div>
              ))}
           </div>
        </div>
     </div>
  );

  const renderSettings = () => (
     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-2xl">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={20}/> System Configuration</h3>
        
        <div className="space-y-6">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Global Announcement Banner</label>
              <textarea 
                 className="w-full p-3 border border-slate-200 rounded-lg text-sm h-24"
                 value={systemConfig.announcement}
                 onChange={(e) => updateSystemConfig({ announcement: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">This message will appear at the top of the student dashboard.</p>
           </div>
           
           <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
              <div>
                 <p className="font-bold text-slate-700 text-sm">Allow New Signups</p>
                 <p className="text-xs text-slate-500">Toggle registration for new students.</p>
              </div>
              <button 
                 onClick={() => updateSystemConfig({ allowSignups: !systemConfig.allowSignups })}
                 className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.allowSignups ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                 <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${systemConfig.allowSignups ? 'left-7' : 'left-1'}`}></div>
              </button>
           </div>

           <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
              <div>
                 <p className="font-bold text-slate-700 text-sm">Maintenance Mode</p>
                 <p className="text-xs text-slate-500">Disable student access temporarily.</p>
              </div>
              <button 
                 onClick={() => updateSystemConfig({ maintenanceMode: !systemConfig.maintenanceMode })}
                 className={`w-12 h-6 rounded-full transition-colors relative ${systemConfig.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
              >
                 <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${systemConfig.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
              </button>
           </div>
        </div>
     </div>
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
       {/* Sidebar Navigation */}
       <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-fit">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
             <h2 className="font-bold text-slate-800">Admin Control</h2>
          </div>
          <nav className="flex-1 p-2 space-y-1">
             {[
               { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
               { id: 'users', label: 'User Management', icon: Users },
               { id: 'questions', label: 'Question Bank', icon: AlertTriangle },
               { id: 'jobs', label: 'Jobs & Internships', icon: Briefcase },
               { id: 'moderation', label: 'Moderation Logs', icon: Shield },
               { id: 'settings', label: 'System Settings', icon: Settings },
             ].map(item => (
                <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                   }`}
                >
                   <item.icon size={18} /> {item.label}
                   {item.id === 'questions' && pendingQuestions > 0 && (
                      <span className="ml-auto bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingQuestions}</span>
                   )}
                </button>
             ))}
          </nav>
       </div>

       {/* Main Content */}
       <div className="flex-1 overflow-y-auto pb-10">
          <div className="mb-6">
             <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h1>
             <p className="text-slate-500 text-sm">Overview and management controls.</p>
          </div>
          
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'questions' && renderQuestions()}
          {activeTab === 'jobs' && renderJobs()}
          {activeTab === 'moderation' && renderModeration()}
          {activeTab === 'settings' && renderSettings()}
       </div>
    </div>
  );
};
