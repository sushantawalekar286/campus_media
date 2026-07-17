import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useSocialStore } from '../store/socialStore';
import apiClient from '../api/apiClient';
import { 
  MapPin, Link as LinkIcon, Calendar, Briefcase, Award, 
  FileText, Plus, Camera, Edit3, X, Lock, Share2, AlertOctagon,
  Shield, Globe, Linkedin, Github, Twitter, 
  BookOpen, Heart, Activity, Bookmark, Users, ChevronRight, UserPlus, Check, Sparkles, Target, Zap, ShieldAlert, Laptop
} from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { ProjectDetailModal } from '../components/ProjectDetailModal';

export const Profile = () => {
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let res;
        if (username) {
          res = await apiClient.get(`/users/${username}`);
        } else {
          res = await apiClient.get('/users/profile');
        }
        setUser(res.data);
        const currentUserId = currentUser?._id || currentUser?.id;
        const profileUserId = res.data?._id || res.data?.id;
        const currentUsername = currentUser?.username;
        const profileUsername = res.data?.username;

        setIsOwner(!!(
          currentUser && (
            !username || 
            (currentUsername && profileUsername && currentUsername === profileUsername) || 
            (currentUserId && profileUserId && currentUserId.toString() === profileUserId.toString())
          )
        ));
        
        // Fetch posts only if the profile is not private and restricted
        if (!res.data?.isPrivateAndRestricted) {
          try {
            const postsRes = await apiClient.get(`/posts/user/${res.data._id || res.data.id}`);
            setUserPosts(postsRes.data || []);
          } catch (postsErr) {
            console.error("Failed to load user posts:", postsErr);
            setUserPosts([]);
          }
        } else {
          setUserPosts([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, currentUser]);

  const handleFollow = async () => {
    const prevStatus = user.connectionStatus;
    setUser(prev => ({
      ...prev,
      connectionStatus: 'pending'
    }));
    try {
      await apiClient.post(`/users/follow/${user._id || user.id}`);
    } catch (err) {
      console.error(err);
      setUser(prev => ({ ...prev, connectionStatus: prevStatus }));
      alert(err.response?.data?.error || err.message || 'Failed to send connection request.');
    }
  };

  const handleUnfollow = async () => {
    if (!window.confirm('Are you sure you want to disconnect or cancel request?')) return;
    const prevStatus = user.connectionStatus;
    setUser(prev => ({
      ...prev,
      connectionStatus: 'none',
      followersCount: Math.max(0, (prev.followersCount || 0) - 1)
    }));
    try {
      await apiClient.delete(`/users/unfollow/${user._id || user.id}`);
    } catch (err) {
      console.error(err);
      setUser(prev => ({
        ...prev,
        connectionStatus: prevStatus,
        followersCount: prevStatus === 'accepted' ? (prev.followersCount || 0) + 1 : prev.followersCount
      }));
      alert(err.response?.data?.error || err.message || 'Failed to disconnect.');
    }
  };

  const handleAcceptRequest = async () => {
    const prevIncoming = user.incomingStatus;
    const prevConn = user.connectionStatus;
    setUser(prev => ({
      ...prev,
      incomingStatus: 'accepted',
      connectionStatus: 'accepted',
      followersCount: (prev.followersCount || 0) + 1
    }));
    try {
      await apiClient.post(`/users/connections/accept/${user._id || user.id}`);
    } catch (err) {
      console.error(err);
      setUser(prev => ({
        ...prev,
        incomingStatus: prevIncoming,
        connectionStatus: prevConn,
        followersCount: Math.max(0, (prev.followersCount || 0) - 1)
      }));
      alert(err.response?.data?.error || err.message || 'Failed to accept request.');
    }
  };

  const handleRejectRequest = async () => {
    const prevIncoming = user.incomingStatus;
    const prevConn = user.connectionStatus;
    setUser(prev => ({
      ...prev,
      incomingStatus: 'none',
      connectionStatus: 'none'
    }));
    try {
      await apiClient.post(`/users/connections/reject/${user._id || user.id}`);
    } catch (err) {
      console.error(err);
      setUser(prev => ({
        ...prev,
        incomingStatus: prevIncoming,
        connectionStatus: prevConn
      }));
      alert(err.response?.data?.error || err.message || 'Failed to reject request.');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Profile link copied to clipboard!");
  };

  const handleReport = () => {
    alert("Thank you. This profile has been reported to the administration for review.");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The student profile you are looking for does not exist or may have been deactivated.</p>
        <button
          onClick={() => navigate('/feed')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm"
        >
          Return to Home Feed
        </button>
      </div>
    );
  }

  const TABS = [
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'about', label: 'About', icon: Globe },
    { id: 'skills', label: 'Skills', icon: Sparkles },
    { id: 'experience', label: 'Experience & Edu', icon: Briefcase },
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'network', label: 'Network', icon: Users },
  ];

  // Dynamic Profile Strength checklist metrics (Task 12)
  const completionItems = user ? [
    { label: 'Profile Photo', done: !!user.profilePicture, weight: 11 },
    { label: 'Bio / Summary', done: !!user.bio, weight: 11 },
    { label: 'Skills Profile', done: !!(user.skills?.length || user.aiProfile?.skills?.length), weight: 11 },
    { label: 'Education History', done: !!(user.education?.length || user.aiProfile?.education?.length), weight: 11 },
    { label: 'Work Experience', done: !!(user.experience?.length || user.aiProfile?.experience?.length), weight: 11 },
    { label: 'Projects Showcase', done: !!(user.projects?.length || user.aiProfile?.projects?.length), weight: 11 },
    { label: 'Achievements List', done: !!(user.achievements?.length || user.aiProfile?.achievements?.length), weight: 11 },
    { label: 'Resume Uploaded', done: !!(user.resumeScore > 0 || user.aiProfile?.resumeScore > 0), weight: 11 },
    { label: 'Social & Coding Links', done: !!(user.github || user.linkedin || user.website || user.socialLinks?.github || user.socialLinks?.linkedin || user.socialLinks?.website), weight: 12 }
  ] : [];
  
  const completionPercentage = completionItems.reduce((acc, curr) => acc + (curr.done ? curr.weight : 0), 0);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 h-full overflow-y-auto custom-scrollbar">
      {/* HEADER SECTION (LinkedIn Style) (Task 1) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 relative">
        {/* Cover Photo */}
        <div className="h-48 md:h-64 bg-slate-200 relative group">
          {user.coverPicture ? (
            <img src={user.coverPicture} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          )}
          {isOwner && (
            <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all shadow-sm">
              <Camera size={18} />
            </button>
          )}
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="absolute -top-20 left-6 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden bg-white shadow-md group">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-indigo-50 text-indigo-600">
                {(user.fullname || user.name || 'U').charAt(0)}
              </div>
            )}
            {isOwner && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="text-white" size={24} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 pb-2 gap-2 h-16">
            {isOwner ? (
              <>
                <Link to="/settings" className="px-4 py-1.5 rounded-full font-semibold text-sm border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors h-fit flex items-center gap-1.5">
                  <Edit3 size={14} /> Profile Settings
                </Link>
              </>
            ) : (
              <>
                {user.incomingStatus === 'pending' ? (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={handleAcceptRequest}
                      className="px-4 py-1.5 rounded-full font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 h-fit shadow-sm"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={handleRejectRequest}
                      className="px-4 py-1.5 rounded-full font-semibold text-sm bg-rose-50 hover:bg-rose-100 text-rose-650 transition-colors flex items-center gap-1.5 h-fit"
                    >
                      Decline
                    </button>
                  </div>
                ) : user.connectionStatus === 'accepted' ? (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => navigate('/messages', { state: { startChatWith: user } })}
                      className="px-4 py-1.5 rounded-full font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 h-fit shadow-sm"
                    >
                      Message
                    </button>
                    <button 
                      onClick={handleUnfollow}
                      className="px-4 py-1.5 rounded-full font-semibold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors h-fit"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : user.connectionStatus === 'pending' ? (
                  <button 
                    onClick={handleUnfollow}
                    className="px-5 py-1.5 rounded-full font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1.5 h-fit"
                  >
                    Request Sent
                  </button>
                ) : (
                  <button 
                    onClick={handleFollow}
                    className="px-5 py-1.5 rounded-full font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 h-fit shadow-sm"
                  >
                    <UserPlus size={16} /> Connect
                  </button>
                )}
                
                <button 
                  onClick={handleShare}
                  className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors h-fit"
                  title="Share Profile"
                >
                  <Share2 size={16} />
                </button>
                
                <button 
                  onClick={handleReport}
                  className="p-2 rounded-full border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-650 transition-colors h-fit"
                  title="Report Profile"
                >
                  <AlertOctagon size={16} />
                </button>
              </>
            )}
          </div>

          {/* User Info Grid */}
          <div className="mt-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              {user.fullname || user.name}
              {user.isVerified && <Check className="w-5 h-5 text-white bg-blue-500 rounded-full p-0.5" />}
              {user.username && <span className="text-sm font-semibold text-slate-400">@{user.username}</span>}
            </h1>
            <p className="text-[17px] text-slate-600 mt-1 font-medium">{user.headline || 'Student'}</p>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs font-semibold text-slate-500">
              {user.college && <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">{user.college}</span>}
              {user.department && <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">{user.department}</span>}
              {user.course && <span className="bg-indigo-50 text-indigo-750 px-2.5 py-1 rounded-md">{user.course} ({user.year || '1st Year'})</span>}
              <span className="flex items-center gap-1"><MapPin size={14} /> {user.location || 'Location not specified'}</span>
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-750 border border-indigo-100 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                <FileText size={14} /> ATS Resume: {user.resumeScore || user.aiProfile?.resumeScore || 0}/100
              </div>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-slate-900 to-slate-800 text-cyan-400 border border-slate-700 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                <Zap size={14} /> Interview: {user.interviewScore || 0}/10
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 mt-4 py-3 border-y border-slate-100 max-w-2xl">
              <div className="text-center md:text-left">
                <span className="block text-xl font-extrabold text-slate-800">{userPosts.length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posts</span>
              </div>
              <div className="text-center md:text-left border-l border-slate-100 pl-6">
                <span className="block text-xl font-extrabold text-slate-800">{user.projects?.length || user.aiProfile?.projects?.length || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects</span>
              </div>
              <div className="text-center md:text-left border-l border-slate-100 pl-6">
                <span className="block text-xl font-extrabold text-slate-800">{user.achievements?.length || user.aiProfile?.achievements?.length || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Achievements</span>
              </div>
              <div className="text-center md:text-left border-l border-slate-100 pl-6">
                <span className="block text-xl font-extrabold text-slate-800">{user.resources?.length || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resources</span>
              </div>
              <div className="text-center md:text-left border-l border-slate-100 pl-6">
                <span className="block text-xl font-extrabold text-slate-800">{user.connectionCount || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connections</span>
              </div>
              <div className="text-center md:text-left border-l border-slate-100 pl-6">
                <span className="block text-xl font-extrabold text-slate-800">{user.followersCount || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Followers</span>
              </div>
              <div className="text-center md:text-left border-l border-slate-100 pl-6">
                <span className="block text-xl font-extrabold text-slate-800">{user.followingCount || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Following</span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="flex items-center gap-3 mt-4">
              <button className="text-sm font-semibold text-indigo-655 bg-indigo-50 px-4 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                Open to work
              </button>
              {(user.website || user.socialLinks?.website) && (
                <a href={user.website || user.socialLinks?.website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1">
                  <LinkIcon size={14} /> Portfolio Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {user.isPrivateAndRestricted ? (
        /* Professional Private Account Lock Screen Overlay */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={36} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">This Account is Private</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Connect with this student to view their projects, achievements, shared study resources, and post updates.
          </p>
          {user.connectionStatus === 'none' && (
            <button
              onClick={handleFollow}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              Send Connection Request
            </button>
          )}
          {user.connectionStatus === 'pending' && (
            <button
              onClick={handleUnfollow}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
            >
              Request Sent (Pending Invite)
            </button>
          )}
          {user.incomingStatus === 'pending' && (
            <div className="flex justify-center gap-3">
              <button
                onClick={handleAcceptRequest}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md"
              >
                Accept Invite
              </button>
              <button
                onClick={handleRejectRequest}
                className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-650 font-bold rounded-xl transition-all"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Full Portfolio Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex overflow-x-auto custom-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-1 justify-center ${
                    activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-750 font-extrabold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-bold'
                  }`}
                >
                  <tab.icon size={14} className={activeTab === tab.id ? 'text-indigo-655' : ''} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                
                {activeTab === 'posts' && (
                  <div className="space-y-4">
                    {userPosts.length > 0 ? (
                      userPosts.map(post => (
                        <PostCard 
                          key={post._id} 
                          post={post} 
                          onDelete={(id) => setUserPosts(prev => prev.filter(p => p._id !== id))}
                          onUpdate={(updated) => setUserPosts(prev => prev.map(p => p._id === updated._id ? updated : p))}
                        />
                      ))
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No posts yet</h3>
                        <p className="text-slate-500 text-sm mt-1">Posts shared on the feed will appear here.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.projects?.length > 0 ? (
                      user.projects.map((proj, i) => (
                        <div 
                          key={proj._id || i} 
                          onClick={() => setSelectedProject(proj)}
                          className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between animate-in fade-in"
                        >
                          <div>
                            <div className="h-40 bg-slate-50 rounded-xl overflow-hidden mb-4 border border-slate-100 relative">
                              {proj.media || proj.mediaUrl ? (
                                <img src={proj.media || proj.mediaUrl} alt={proj.name || proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50 text-indigo-400 font-bold text-sm">
                                  💻 Project Showcase
                                </div>
                              )}
                            </div>
                            <h3 className="font-bold text-slate-800 text-[16px] group-hover:text-indigo-655 transition-colors mb-1">{proj.name || proj.title}</h3>
                            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3">{proj.description}</p>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {proj.techStack?.slice(0, 3).map((tech, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded-md text-[10px] font-semibold">{tech}</span>
                              ))}
                              {proj.techStack?.length > 3 && (
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[10px] font-semibold">+{proj.techStack.length - 3}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-505 font-bold border-t border-slate-100 pt-3">
                            <span className="text-indigo-600 uppercase tracking-wide text-[10px]">{proj.status || 'completed'}</span>
                            <span className="flex items-center gap-1 hover:text-indigo-655">
                              Details <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center col-span-2">
                        <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No projects listed</h3>
                        <p className="text-slate-500 text-sm mt-1">Upload projects to build your portfolio!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'achievements' && (
                  <div className="space-y-4">
                    {user.achievements?.length > 0 ? (
                      user.achievements.map((ach, i) => (
                        <div key={ach._id || i} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-all flex gap-4 animate-in fade-in">
                          <div className="w-14 h-14 bg-emerald-50 rounded-xl flex-shrink-0 flex items-center justify-center text-emerald-600">
                            <Award size={28} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-slate-800 text-[16px]">{ach.title}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{ach.type || 'award'}</p>
                              </div>
                              {ach.isVerified && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-extrabold rounded border border-emerald-100 uppercase">Verified</span>
                              )}
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed mt-2">{ach.description}</p>
                            {(ach.mediaUrl || ach.credentialUrl) && (
                              <a href={ach.mediaUrl || ach.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-650 font-bold hover:underline mt-3">
                                View Certificate <ChevronRight size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                        <Award size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No achievements recorded</h3>
                        <p className="text-slate-500 text-sm mt-1">Add certifications, competitive placements, or awards here.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.resources?.length > 0 ? (
                      user.resources.map((res, i) => (
                        <div key={res._id || i} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between animate-in fade-in">
                          <div>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wide">{res.category || 'note'}</span>
                              <span className="text-[11px] text-slate-400 font-semibold">{res.downloadsCount || 0} downloads</span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-[15px] mb-1">{res.title}</h3>
                            <p className="text-slate-505 text-xs line-clamp-2 leading-relaxed mb-3">{res.description}</p>
                            
                            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium mb-4">
                              {res.subject && <span>Subject: <strong>{res.subject}</strong></span>}
                              {res.semester && <span>Sem: {res.semester}</span>}
                              {res.department && <span>Dept: {res.department}</span>}
                            </div>
                          </div>
                          {res.fileUrl && (
                            <a 
                              href={res.fileUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors mt-2"
                            >
                              Download Resource
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center col-span-2">
                        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No resources shared</h3>
                        <p className="text-slate-500 text-sm mt-1">Shared exam papers, PPTs, or study notes will display here.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Bio Summary Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-indigo-650" /> Professional Summary
                      </h2>
                      <p className="text-slate-650 leading-relaxed text-[15px] whitespace-pre-wrap">
                        {user.bio || 'No summary provided yet. Add a summary or upload your resume to generate one.'}
                      </p>
                    </div>

                    {/* Personal & Contact Grid */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Globe size={18} className="text-indigo-650" /> Personal Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Full Name</span>
                          <span className="text-slate-700 font-bold">{user.fullname || user.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Username</span>
                          <span className="text-slate-700 font-bold">@{user.username || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Email Address</span>
                          <span className="text-indigo-600 font-bold select-all">{user.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Phone Number</span>
                          <span className="text-slate-700 font-bold">{user.phone || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Location</span>
                          <span className="text-slate-700 font-bold flex items-center gap-1"><MapPin size={14} className="text-slate-450" />{user.location || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Website</span>
                          {user.website || user.socialLinks?.website ? (
                            <a href={user.website || user.socialLinks?.website} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline truncate max-w-[200px]">{user.website || user.socialLinks?.website}</a>
                          ) : (
                            <span className="text-slate-400">Not specified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Academic Information Grid */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-indigo-650" /> Academic Details
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">College</span>
                          <span className="text-slate-700 font-bold truncate max-w-[220px]">{user.college || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Department</span>
                          <span className="text-slate-700 font-bold">{user.department || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Course</span>
                          <span className="text-slate-700 font-bold">{user.course || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Academic Year</span>
                          <span className="text-slate-700 font-bold">{user.year || '1st Year'} {user.semester ? `(Sem ${user.semester})` : ''}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Cumulative GPA (CGPA)</span>
                          <span className="text-slate-800 font-black text-sm">{user.cgpa || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-450 font-semibold">Graduation Year</span>
                          <span className="text-slate-700 font-bold">{user.graduationYear || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Career Goals & Intent Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                      <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Target size={18} className="text-indigo-650" /> Career Alignment
                      </h2>
                      
                      {user.careerObjective && (
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Objective</h3>
                          <p className="text-slate-600 text-sm leading-relaxed">{user.careerObjective}</p>
                        </div>
                      )}

                      {user.careerGoal && (
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Long-term Goal</h3>
                          <p className="text-slate-650 text-sm leading-relaxed">{user.careerGoal}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferred Roles</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {user.preferredRoles?.length > 0 ? (
                              user.preferredRoles.map(r => (
                                <span key={r} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">{r}</span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">Not specified</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interested Domains</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {user.interestedDomains?.length > 0 ? (
                              user.interestedDomains.map(d => (
                                <span key={d} className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-100">{d}</span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">Not specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6 animate-in fade-in">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Sparkles size={20} className="text-indigo-650" /> Technical & Soft Skills
                    </h2>
                    
                    {(() => {
                      const categories = [
                        { label: 'Programming Languages', list: user.programmingLanguages || user.aiProfile?.programmingLanguages },
                        { label: 'Frameworks', list: user.frameworks || user.aiProfile?.frameworks },
                        { label: 'Libraries', list: user.libraries || user.aiProfile?.libraries },
                        { label: 'Databases', list: user.databases || user.aiProfile?.databases },
                        { label: 'Cloud Platforms', list: user.cloudPlatforms || user.aiProfile?.cloudPlatforms },
                        { label: 'DevOps & CI/CD', list: user.devopsTools || user.aiProfile?.devopsTools },
                        { label: 'Version Control', list: user.versionControl || user.aiProfile?.versionControl },
                        { label: 'Development Tools', list: user.developmentTools || user.aiProfile?.developmentTools },
                        { label: 'Testing Tools', list: user.testingTools || user.aiProfile?.testingTools },
                        { label: 'AI/ML Technologies', list: user.aiMlTechnologies || user.aiProfile?.aiMlTechnologies },
                        { label: 'Soft Skills', list: user.softSkills || user.aiProfile?.softSkills },
                        { label: 'Other Technical Skills', list: user.skills || user.aiProfile?.skills }
                      ].filter(c => c.list?.length > 0);

                      if (categories.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <Sparkles size={48} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 text-sm">No skills details found. Try running a Resume Analysis first!</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-5">
                          {categories.map((cat, idx) => (
                            <div key={idx} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{cat.label}</h3>
                              <div className="flex flex-wrap gap-2">
                                {cat.list.map((skill, sIdx) => (
                                  <span key={sIdx} className="px-3 py-1 bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-indigo-50/50 hover:text-indigo-700 hover:border-indigo-150 transition-colors">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === 'experience' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Experience Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-650" /> Experience Timeline
                      </h2>
                      
                      <div className="relative border-l-2 border-slate-150 pl-5 ml-2 space-y-6">
                        {user.experience?.length > 0 ? (
                          user.experience.map((exp, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-indigo-600 rounded-full border border-white" />
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <h3 className="font-bold text-slate-850 text-sm">{exp.role}</h3>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-650 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                                  {exp.type || 'work'}
                                </span>
                              </div>
                              <p className="text-indigo-755 text-xs font-bold mb-1">{exp.company}</p>
                              <p className="text-[11px] text-slate-400 font-semibold mb-2">{exp.duration}</p>
                              <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-2 text-center text-slate-400 text-sm">
                            No work experience or internships recorded. Try analyzing a resume to populate this timeline.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Education */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-650" /> Education History
                      </h2>
                      
                      <div className="relative border-l-2 border-slate-150 pl-5 ml-2 space-y-6">
                        {user.education?.length > 0 ? (
                          user.education.map((edu, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-indigo-600 rounded-full border border-white" />
                              <h3 className="font-bold text-slate-800 text-sm">{edu.school}</h3>
                              <p className="text-slate-600 font-bold text-xs mt-1">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                              <p className="text-xs text-slate-450 font-semibold mt-1">{edu.startYear} - {edu.endYear}</p>
                              {edu.cgpa && (
                                <p className="text-xs text-slate-600 font-bold mt-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded w-fit">CGPA: {edu.cgpa}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-2 text-center text-slate-400 text-sm">
                            No educational details recorded.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Centralized AI Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* ATS Resume Score */}
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 rounded-2xl text-white relative overflow-hidden shadow-md">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="relative z-10">
                          <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">ATS Resume Score</p>
                          <div className="text-4xl font-extrabold mb-1">
                            {user.aiProfile?.resumeScore || user.resumeScore || 0}
                            <span className="text-lg font-medium opacity-60">/100</span>
                          </div>
                          <p className="text-indigo-100 text-xs mt-2 truncate">
                            Role: {user.aiProfile?.preferredRoles?.[0] || 'Software Engineer'}
                          </p>
                        </div>
                      </div>

                      {/* AI Mock Interview Score */}
                      <div className="bg-slate-900 p-5 rounded-2xl text-white relative overflow-hidden shadow-md">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="relative z-10">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">AI Interview Score</p>
                          <div className="text-4xl font-extrabold text-cyan-400 mb-1">
                            {user.interviewScore || 0}
                            <span className="text-lg font-medium text-slate-500">/10</span>
                          </div>
                          <p className="text-slate-400 text-xs mt-2">
                            Based on live voice sessions
                          </p>
                        </div>
                      </div>

                      {/* Career Interest & Role */}
                      <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
                        <div className="relative z-10">
                          <p className="text-slate-505 text-xs font-bold uppercase tracking-wider mb-2">Target Career Role</p>
                          <div className="text-lg font-bold text-slate-800 mb-1 truncate">
                            {user.aiProfile?.preferredRoles?.[0] || 'Software Engineer'}
                          </div>
                          <p className="text-slate-400 text-xs mt-2 truncate">
                            Interests: {user.aiProfile?.careerInterests?.slice(0, 2).join(', ') || 'Web, Cloud, Systems'}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Skills & Technologies Breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h2 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles className="text-purple-600" size={18} /> Centralized Skills Profile
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center justify-center">
                          <span className="text-3xl font-extrabold text-slate-800">
                            {user.aiProfile?.skills?.length || user.skills?.length || 0}
                          </span>
                          <span className="block text-xs text-slate-500 font-bold uppercase mt-1">Total Skills</span>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Programming Languages</span>
                            <p className="text-sm font-semibold text-slate-700 mt-1">
                              {user.aiProfile?.programmingLanguages?.join(', ') || user.programmingLanguages?.join(', ') || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frameworks & Technologies</span>
                            <p className="text-sm font-semibold text-slate-700 mt-1">
                              {user.aiProfile?.frameworks?.join(', ') || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Projects & Accomplishments Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h2 className="text-md font-bold text-slate-800 mb-4">
                        Portfolio Stats (Centralized Source)
                      </h2>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-center">
                          <span className="block text-2xl font-black text-indigo-705">
                            {user.projects?.length || user.aiProfile?.projects?.length || 0}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Projects Count</span>
                        </div>

                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
                          <span className="block text-2xl font-black text-emerald-750">
                            {user.achievements?.filter(a => a.type !== 'certification' && a.type !== 'certificate')?.length || user.aiProfile?.achievements?.filter(a => a.type !== 'certificate')?.length || 0}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Achievements</span>
                        </div>

                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 text-center">
                          <span className="block text-2xl font-black text-purple-750">
                            {user.achievements?.filter(a => a.type === 'certification' || a.type === 'certificate')?.length || user.aiProfile?.achievements?.filter(a => a.type === 'certificate')?.length || 0}
                          </span>
                          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Certificates</span>
                        </div>
                      </div>
                    </div>

                    {/* Career Roadmap progress */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="text-indigo-600" size={18} /> Career Roadmap Progress
                      </h2>
                      
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-bold text-slate-700">Roadmap Completion</h3>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {user.roadmapProgress || 0}% Complete
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${user.roadmapProgress || 0}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500">
                          Tracks customized topics and projects assigned by the AI Roadmap Generator.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab === 'saved' || activeTab === 'network') && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in">
                    <h3 className="text-lg font-bold text-slate-800">Coming Soon</h3>
                    <p className="text-slate-505 text-sm mt-1">This section is currently under development.</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Resume Upload / Analyzer */}
            {isOwner && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <FileText className="mb-3 text-white/90" size={28} />
                <h3 className="font-bold text-lg mb-2 relative z-10">Resume Analyzer</h3>
                <p className="text-indigo-100 text-sm mb-4 relative z-10 leading-relaxed">
                  Get instant AI feedback on your resume and match it against top job descriptions.
                </p>
                <Link to="/resume" className="inline-block w-full text-center bg-white text-indigo-600 font-bold py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors relative z-10 shadow-sm">
                  Upload Resume
                </Link>
              </div>
            )}

            {/* Profile Completion Card (Task 12) */}
            {isOwner && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Profile Strength</h3>
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden border border-slate-150">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="space-y-2 text-xs">
                  {completionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}>
                        {item.label}
                      </span>
                      {item.done ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                          <Check size={12} strokeWidth={3} /> Done
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">Missing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social & Coding Links Profile (Task 10) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Contact & Social</h3>
              <div className="space-y-2.5">
                {/* Email (Always shown) */}
                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-650 border border-slate-150">
                    <Globe size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                    <p className="text-xs font-semibold text-slate-700 truncate select-all">{user.email}</p>
                  </div>
                </div>

                {/* Phone (If available) */}
                {user.phone && (
                  <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-650 border border-slate-150">
                      <Globe size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 font-bold uppercase">Phone</p>
                      <p className="text-xs font-semibold text-slate-700 truncate">{user.phone}</p>
                    </div>
                  </div>
                )}

                {/* Professional Links */}
                {[
                  { label: 'LinkedIn', value: user.linkedin || user.socialLinks?.linkedin, icon: Linkedin, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                  { label: 'GitHub', value: user.github || user.socialLinks?.github, icon: Github, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                  { label: 'Website', value: user.website || user.socialLinks?.website, icon: LinkIcon, color: 'bg-indigo-50 text-indigo-650 hover:bg-indigo-100' },
                  { label: 'LeetCode', value: user.codingProfiles?.leetcode, prefix: 'https://leetcode.com/', icon: Target, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
                  { label: 'HackerRank', value: user.codingProfiles?.hackerrank, prefix: 'https://hackerrank.com/', icon: Laptop, color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
                  { label: 'CodeChef', value: user.codingProfiles?.codechef, prefix: 'https://codechef.com/users/', icon: Activity, color: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
                  { label: 'Codeforces', value: user.codingProfiles?.codeforces, prefix: 'https://codeforces.com/profile/', icon: Award, color: 'bg-red-50 text-red-600 hover:bg-red-100' },
                  { label: 'GeeksforGeeks', value: user.codingProfiles?.geeksforgeeks, prefix: 'https://auth.geeksforgeeks.org/user/', icon: Target, color: 'bg-green-50 text-green-600 hover:bg-green-100' }
                ].filter(link => link.value).map((link, lIdx) => {
                  const href = link.value.startsWith('http') ? link.value : `${link.prefix || ''}${link.value}`;
                  return (
                    <a key={lIdx} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors group text-slate-750">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${link.color}`}>
                        <link.icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-750 group-hover:text-indigo-600 transition-colors">{link.label}</p>
                        <p className="text-xs text-slate-450 truncate">{link.value}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Project Detail Modal Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
