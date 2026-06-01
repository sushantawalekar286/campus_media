import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/apiClient';
import { 
  User, Shield, Laptop, Check, AlertTriangle, 
  Trash2, Loader2, Globe, Linkedin, Github, Twitter,
  Settings, Bell, Power
} from 'lucide-react';

export const ProfileSetup = () => {
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile Inputs
  const [fullname, setFullname] = useState(user?.fullname || user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skillsStr, setSkillsStr] = useState(user?.skills?.join(', ') || '');
  const [socialLinks, setSocialLinks] = useState({
    website: user?.socialLinks?.website || '',
    linkedin: user?.socialLinks?.linkedin || '',
    github: user?.socialLinks?.github || '',
    twitter: user?.socialLinks?.twitter || ''
  });

  // Settings Inputs
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.privacySettings?.profileVisibility || 'public',
    showSkills: user?.privacySettings?.showSkills !== false,
    showEducation: user?.privacySettings?.showEducation !== false
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: user?.notificationSettings?.emailAlerts !== false,
    pushAlerts: user?.notificationSettings?.pushAlerts !== false
  });

  // Session Management State
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Sync state if user updates
  useEffect(() => {
    if (user) {
      setFullname(user.fullname || user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setSkillsStr(user.skills?.join(', ') || '');
      setSocialLinks({
        website: user.socialLinks?.website || '',
        linkedin: user.socialLinks?.linkedin || '',
        github: user.socialLinks?.github || '',
        twitter: user.socialLinks?.twitter || ''
      });
      setPrivacySettings({
        profileVisibility: user.privacySettings?.profileVisibility || 'public',
        showSkills: user.privacySettings?.showSkills !== false,
        showEducation: user.privacySettings?.showEducation !== false
      });
      setNotificationSettings({
        emailAlerts: user.notificationSettings?.emailAlerts !== false,
        pushAlerts: user.notificationSettings?.pushAlerts !== false
      });
    }
  }, [user]);

  // Load Active Sessions
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await apiClient.get('/users/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const parsedSkills = skillsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      const res = await apiClient.put('/users/profile', {
        fullname,
        username,
        bio,
        skills: parsedSkills,
        socialLinks
      });

      // Update Zustand context
      const { accessToken, refreshToken } = useAuthStore.getState();
      setSession(accessToken, refreshToken, res.data);
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiClient.put('/users/settings', {
        privacySettings,
        notificationSettings
      });

      const { accessToken, refreshToken } = useAuthStore.getState();
      setSession(accessToken, refreshToken, res.data);
      setSuccessMsg('Settings updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async (sessionId) => {
    try {
      await apiClient.delete(`/users/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s._id !== sessionId));
      setSuccessMsg('Active login session terminated.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to terminate session');
    }
  };

  const handleCloseAllOtherSessions = async () => {
    if (!confirm('Are you sure you want to log out of all other devices?')) return;
    try {
      await apiClient.delete('/users/sessions');
      // Keep only current session
      setSessions(sessions.filter(s => s.isCurrent));
      setSuccessMsg('All other devices have been logged out.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to revoke other sessions');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-slate-100 z-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Account Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Maintain your profile, verify security sessions, and configure app notification preferences.
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-2 text-green-300 text-sm animate-in fade-in">
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2 text-red-300 text-sm animate-in fade-in">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all whitespace-nowrap lg:whitespace-normal w-full ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white'
                : 'bg-white/5 border border-transparent hover:bg-white/10 text-slate-400'
            }`}
          >
            <User size={18} />
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all whitespace-nowrap lg:whitespace-normal w-full ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white'
                : 'bg-white/5 border border-transparent hover:bg-white/10 text-slate-400'
            }`}
          >
            <Settings size={18} />
            Privacy & Settings
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all whitespace-nowrap lg:whitespace-normal w-full ${
              activeTab === 'sessions'
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white'
                : 'bg-white/5 border border-transparent hover:bg-white/10 text-slate-400'
            }`}
          >
            <Laptop size={18} />
            Active Logins
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          
          {/* PROFILE EDIT TAB */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Personal Details</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. johndoe"
                    className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Bio / Headline</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="3"
                  placeholder="Tell us about yourself..."
                  className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="React, Node.js, Python, Figma"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10 pb-2 mb-4">
                  Social Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                      <Globe size={14} /> Website
                    </label>
                    <input
                      type="url"
                      value={socialLinks.website}
                      onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                      <Linkedin size={14} /> LinkedIn
                    </label>
                    <input
                      type="url"
                      value={socialLinks.linkedin}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                      <Github size={14} /> GitHub
                    </label>
                    <input
                      type="url"
                      value={socialLinks.github}
                      onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                      <Twitter size={14} /> Twitter
                    </label>
                    <input
                      type="url"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                      placeholder="https://twitter.com/username"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="animate-spin" size={16} />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* PRIVACY & SETTINGS TAB */}
          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateSettings} className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Shield size={20} className="text-indigo-400" />
                  Privacy Preferences
                </h2>
                <p className="text-xs text-slate-400 mb-4">Control what info you display across the student timeline.</p>
                
                <div className="space-y-4 bg-slate-900/40 p-4 border border-white/5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold">Profile Visibility</p>
                      <p className="text-xs text-slate-400">Control who can discover your resume score details.</p>
                    </div>
                    <select
                      value={privacySettings.profileVisibility}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="private">Private (Only Me)</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div>
                      <p className="text-sm font-semibold">Show Skill Chips</p>
                      <p className="text-xs text-slate-400 font-normal">Show extracted resume skills on public forums.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.showSkills}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, showSkills: e.target.checked })}
                      className="w-5 h-5 accent-indigo-500"
                    />
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div>
                      <p className="text-sm font-semibold">Show Educational History</p>
                      <p className="text-xs text-slate-400">Expose educational logs to recruiters in career pool.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.showEducation}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, showEducation: e.target.checked })}
                      className="w-5 h-5 accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Bell size={20} className="text-purple-400" />
                  App Notification Preferences
                </h2>
                <p className="text-xs text-slate-400 mb-4">Choose which alerts keep you updated.</p>

                <div className="space-y-4 bg-slate-900/40 p-4 border border-white/5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold">Email Alerts</p>
                      <p className="text-xs text-slate-400">Receive password resets, verification, and critical career notices.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailAlerts: e.target.checked })}
                      className="w-5 h-5 accent-indigo-500"
                    />
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div>
                      <p className="text-sm font-semibold">Push Alerts</p>
                      <p className="text-xs text-slate-400 font-normal">Immediate browser notifications for system updates and messages.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, pushAlerts: e.target.checked })}
                      className="w-5 h-5 accent-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="animate-spin" size={16} />}
                  Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* ACTIVE LOGINS TAB */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Active Device Sessions</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage and audit devices logged into your profile.</p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={handleCloseAllOtherSessions}
                    className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20 transition-all"
                  >
                    <Power size={14} />
                    Sign Out All Other Devices
                  </button>
                )}
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div 
                      key={session._id}
                      className={`p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                        session.isCurrent 
                          ? 'bg-indigo-500/5 border-indigo-500/30' 
                          : 'bg-slate-900/30 border-white/5 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          session.isCurrent ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900 text-slate-400'
                        }`}>
                          <Laptop size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {session.deviceInfo?.browser || 'Unknown Browser'} on {session.deviceInfo?.os || 'Unknown OS'}
                            </span>
                            {session.isCurrent && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                                This Device
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono">
                            <span>IP: {session.ipAddress}</span>
                            <span>•</span>
                            <span>Location: {session.location}</span>
                            <span>•</span>
                            <span>Joined: {new Date(session.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <button
                          onClick={() => handleCloseSession(session._id)}
                          className="flex items-center justify-center p-2.5 rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all w-full sm:w-auto"
                          title="Revoke Session"
                        >
                          <Trash2 size={16} />
                          <span className="inline sm:hidden ml-2 font-semibold text-xs">Close Session</span>
                        </button>
                      )}
                    </div>
                  ))}

                  {sessions.length === 0 && (
                    <p className="text-center text-slate-500 text-sm py-12">No active sessions located.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
