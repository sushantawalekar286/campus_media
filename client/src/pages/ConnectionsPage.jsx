import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserX, MessageSquare, ExternalLink, ShieldAlert } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

export const ConnectionsPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState('connections');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNetworkData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch pending incoming requests
      const pendingRes = await apiClient.get('/users/connections/pending');
      setPendingRequests(pendingRes.data || []);

      // Fetch following (as connections)
      const userId = currentUser._id || currentUser.id;
      const followingRes = await apiClient.get(`/users/following/${userId}`);
      setConnections(followingRes.data || []);
    } catch (err) {
      console.error('Error fetching connections network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, [currentUser]);

  const handleAccept = async (requestId) => {
    try {
      await apiClient.post(`/users/connections/accept/${requestId}`);
      setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
      // Refresh following list
      fetchNetworkData();
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await apiClient.post(`/users/connections/reject/${requestId}`);
      setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your Campus Network</h1>
          <p className="text-slate-500 text-sm">Grow your connections, accept requests, and message classmates.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('connections')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'connections'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all relative ${
            activeTab === 'requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-4 bg-rose-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Panels */}
      {activeTab === 'requests' ? (
        <div className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <div
                key={req.requestId}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-sm transition-all"
              >
                <div 
                  onClick={() => navigate(`/profile/${req.user.username || req.user._id || req.user.id}`)}
                  className="flex items-center gap-4 cursor-pointer group text-center sm:text-left flex-col sm:flex-row"
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-indigo-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                    {req.user.profilePicture ? (
                      <img src={req.user.profilePicture} alt={req.user.fullname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-600 font-bold text-xl">
                        {(req.user.fullname || req.user.username || 'U').charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {req.user.fullname || req.user.username}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">@{req.user.username}</p>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{req.user.headline || 'Student'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAccept(req.requestId)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <UserCheck size={14} /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.requestId)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <UserX size={14} /> Ignore
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700">No pending follow requests</h3>
              <p className="text-slate-500 text-sm mt-1">When classmates request to connect or follow your account, they will show up here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connections.map((user) => (
                <div
                  key={user._id || user.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
                >
                  <div 
                    onClick={() => navigate(`/profile/${user.username || user._id || user.id}`)}
                    className="flex items-center gap-4 cursor-pointer group min-w-0"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-indigo-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.fullname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-indigo-600 font-bold text-xl">
                          {(user.fullname || user.username || 'U').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {user.fullname || user.username}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold truncate">@{user.username}</p>
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">{user.headline || 'Student'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate('/messages', { state: { startChatWith: user } })}
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all"
                      title="Send Message"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/profile/${user.username || user._id || user.id}`)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                      title="View Profile"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700">No connections yet</h3>
              <p className="text-slate-500 text-sm mt-1">Discover classmates and start building your campus connection network today.</p>
              <button
                onClick={() => navigate('/explore')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Find Classmates
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
