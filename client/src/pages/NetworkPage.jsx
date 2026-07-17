import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, UserCheck, UserX, MessageSquare, 
  ExternalLink, UserMinus, ChevronLeft, ChevronRight, 
  GraduationCap, Sparkles, UserPlus, Clock, Heart, Award
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

export const NetworkPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Discover Tab States
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterRecentlyJoined, setFilterRecentlyJoined] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDiscover, setTotalDiscover] = useState(0);

  // Requests Tab States
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  // My Connections Tab States
  const [connections, setConnections] = useState([]);

  // Suggestions Tab States
  const [suggestions, setSuggestions] = useState([]);

  // Action Loading tracking
  const [actionLoadingIds, setActionLoadingIds] = useState(new Set());

  // Available filter choices
  const DEPARTMENTS = [
    'Computer Science', 'Electronics', 'Mechanical', 'Electrical', 'Civil', 'Information Technology', 'Chemical'
  ];
  const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const POPULAR_SKILLS = ['React', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'UI/UX', 'Cloud', 'Machine Learning'];

  // Track Action Loading
  const toggleActionLoading = (id, loadingState) => {
    setActionLoadingIds(prev => {
      const next = new Set(prev);
      if (loadingState) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // ─── Fetch Handlers ────────────────────────────────────────────────────────
  const fetchDiscover = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        page: pageNum,
        limit: 12,
        search: searchQuery,
        department: filterDept,
        year: filterYear,
        skill: filterSkill,
        recentlyJoined: filterRecentlyJoined ? 'true' : 'false'
      });
      const res = await apiClient.get(`/users/discover?${q.toString()}`);
      setDiscoverUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalDiscover(res.data.total || 0);
      setPage(res.data.page || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to load students directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [incomingRes, sentRes] = await Promise.all([
        apiClient.get('/users/connections/incoming'),
        apiClient.get('/users/connections/sent')
      ]);
      setIncomingRequests(incomingRes.data || []);
      setSentRequests(sentRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load pending connection requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/users/connections/list');
      setConnections(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load your connections network.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/users/suggestions');
      setSuggestions(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load recommended peers.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading based on Active Tab
  useEffect(() => {
    if (activeTab === 'discover') {
      fetchDiscover(1);
    } else if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'connections') {
      fetchConnections();
    } else if (activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [activeTab, filterDept, filterYear, filterSkill, filterRecentlyJoined]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDiscover(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterDept('');
    setFilterYear('');
    setFilterSkill('');
    setFilterRecentlyJoined(false);
    setPage(1);
    if (activeTab === 'discover') {
      fetchDiscover(1);
    }
  };

  // ─── Connection Core Action Service ──────────────────────────────────────────
  const updateLocalState = (userId, newStatus) => {
    // Update Discover
    setDiscoverUsers(prev => prev.map(u => u._id === userId ? { ...u, connectionStatus: newStatus } : u));
    // Update Suggestions
    setSuggestions(prev => prev.map(u => u._id === userId ? { ...u, connectionStatus: newStatus } : u));
  };

  const handleConnect = async (userId) => {
    toggleActionLoading(userId, true);
    // Optimistic UI update
    updateLocalState(userId, 'pending');
    try {
      await apiClient.post(`/users/follow/${userId}`);
    } catch (err) {
      console.error('Failed to send request:', err);
      // Revert status
      updateLocalState(userId, 'none');
      alert(err.response?.data?.error || err.message || 'Error sending connection request. Please try again.');
    } finally {
      toggleActionLoading(userId, false);
    }
  };

  const handleCancelRequest = async (userId, requestId) => {
    toggleActionLoading(userId, true);
    // Optimistic UI update
    updateLocalState(userId, 'none');
    setSentRequests(prev => prev.filter(r => r.requestId !== requestId && r.user?._id !== userId));
    try {
      await apiClient.delete(`/users/unfollow/${userId}`);
    } catch (err) {
      console.error('Failed to cancel request:', err);
      alert(err.response?.data?.error || err.message || 'Error cancelling request.');
      fetchRequests(); // Reload
    } finally {
      toggleActionLoading(userId, false);
    }
  };

  const handleAcceptRequest = async (userId, requestId) => {
    toggleActionLoading(userId, true);
    // Optimistic UI update
    setIncomingRequests(prev => prev.filter(r => r.requestId !== requestId));
    updateLocalState(userId, 'accepted');
    try {
      await apiClient.post(`/users/connections/accept/${requestId}`);
    } catch (err) {
      console.error('Failed to accept connection:', err);
      alert(err.response?.data?.error || err.message || 'Error accepting invite.');
      fetchRequests(); // Reload
    } finally {
      toggleActionLoading(userId, false);
    }
  };

  const handleRejectRequest = async (userId, requestId) => {
    toggleActionLoading(userId, true);
    // Optimistic UI update
    setIncomingRequests(prev => prev.filter(r => r.requestId !== requestId));
    updateLocalState(userId, 'none');
    try {
      await apiClient.post(`/users/connections/reject/${requestId}`);
    } catch (err) {
      console.error('Failed to decline request:', err);
      alert(err.response?.data?.error || err.message || 'Error declining invite.');
      fetchRequests(); // Reload
    } finally {
      toggleActionLoading(userId, false);
    }
  };

  const handleRemoveConnection = async (userId) => {
    if (!window.confirm('Are you sure you want to disconnect?')) return;
    toggleActionLoading(userId, true);
    // Optimistic UI update
    setConnections(prev => prev.filter(u => u._id !== userId));
    updateLocalState(userId, 'none');
    try {
      await apiClient.delete(`/users/unfollow/${userId}`);
    } catch (err) {
      console.error('Failed to remove connection:', err);
      alert(err.response?.data?.error || err.message || 'Error removing connection.');
      fetchConnections(); // Reload
    } finally {
      toggleActionLoading(userId, false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Campus Network</h1>
            <p className="text-slate-500 text-sm">Discover students, request connections, and chat with your peers.</p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'discover'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'requests'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Requests
            {(incomingRequests.length > 0) && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'connections'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            My Connections
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'suggestions'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={12} className={activeTab === 'suggestions' ? 'text-indigo-500' : 'text-slate-400'} />
            Suggestions
          </button>
        </div>
      </div>

      {/* Discover Search & Filters */}
      {activeTab === 'discover' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, department, course, or skills (e.g. Python)..."
              className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <Filter size={14} /> Filters:
              </div>

              {/* Department Selector */}
              <select
                value={filterDept}
                onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>

              {/* Year Selector */}
              <select
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Years</option>
                {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
              </select>

              {/* Skill Selector */}
              <select
                value={filterSkill}
                onChange={(e) => { setFilterSkill(e.target.value); setPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Skills</option>
                {POPULAR_SKILLS.map(sk => <option key={sk} value={sk}>{sk}</option>)}
              </select>

              {/* Recently Joined Checkbox */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterRecentlyJoined}
                  onChange={(e) => { setFilterRecentlyJoined(e.target.checked); setPage(1); }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                Recently Joined
              </label>
            </div>

            {(searchQuery || filterDept || filterYear || filterSkill || filterRecentlyJoined) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-slate-450 hover:text-slate-600 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tab Contents Panel */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-8">
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonLoader key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-semibold text-sm max-w-md mx-auto my-12 border border-red-100">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ─── DISCOVER TAB ─────────────────────────────────────────────── */}
            {activeTab === 'discover' && (
              <>
                {discoverUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discoverUsers.map((user) => (
                      <StudentCard
                        key={user._id || user.id}
                        user={user}
                        onConnect={handleConnect}
                        onCancel={handleCancelRequest}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                        actionLoading={actionLoadingIds.has(user._id)}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No students found matching your search criteria." />
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => { const prev = Math.max(1, page - 1); setPage(prev); fetchDiscover(prev); }}
                      disabled={page === 1}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-500">
                      Page {page} of {totalPages} ({totalDiscover} students)
                    </span>
                    <button
                      onClick={() => { const next = Math.min(totalPages, page + 1); setPage(next); fetchDiscover(next); }}
                      disabled={page === totalPages}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ─── REQUESTS TAB ────────────────────────────────────────────── */}
            {activeTab === 'requests' && (
              <div className="space-y-8">
                {/* Incoming Requests */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                    Incoming Invites ({incomingRequests.length})
                  </h3>
                  {incomingRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {incomingRequests.map((req) => (
                        <div
                          key={req.requestId}
                          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                        >
                          <div 
                            onClick={() => navigate(`/profile/${req.user?.username || req.user?._id}`)}
                            className="flex items-center gap-4 cursor-pointer group min-w-0"
                          >
                            <Avatar user={req.user} size="w-14 h-14" />
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-650 transition-colors">
                                {req.user?.fullname || req.user?.name}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium">@{req.user?.username}</p>
                              <p className="text-xs text-slate-600 truncate mt-0.5">{req.user?.department} • {req.user?.course}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleAcceptRequest(req.user?._id, req.requestId)}
                              disabled={actionLoadingIds.has(req.user?._id)}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              <UserCheck size={14} /> Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.user?._id, req.requestId)}
                              disabled={actionLoadingIds.has(req.user?._id)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                            >
                              Ignore
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200 max-w-md mx-auto text-slate-500 text-xs font-semibold">
                      No incoming connection invites.
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                    Sent Requests ({sentRequests.length})
                  </h3>
                  {sentRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sentRequests.map((req) => (
                        <div
                          key={req.requestId}
                          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                        >
                          <div 
                            onClick={() => navigate(`/profile/${req.user?.username || req.user?._id}`)}
                            className="flex items-center gap-4 cursor-pointer group min-w-0"
                          >
                            <Avatar user={req.user} size="w-14 h-14" />
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-650 transition-colors">
                                {req.user?.fullname || req.user?.name}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium">@{req.user?.username}</p>
                              <p className="text-xs text-slate-600 truncate mt-0.5">{req.user?.department} • {req.user?.course}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                              <Clock size={12} /> Pending
                            </span>
                            <button
                              onClick={() => handleCancelRequest(req.user?._id, req.requestId)}
                              disabled={actionLoadingIds.has(req.user?._id)}
                              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200 max-w-md mx-auto text-slate-500 text-xs font-semibold">
                      No sent connection requests.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── CONNECTIONS TAB ─────────────────────────────────────────── */}
            {activeTab === 'connections' && (
              <>
                {connections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connections.map((user) => (
                      <div
                        key={user._id || user.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                      >
                        <div 
                          onClick={() => navigate(`/profile/${user.username || user._id}`)}
                          className="flex items-center gap-4 cursor-pointer group min-w-0"
                        >
                          <div className="relative">
                            <Avatar user={user} size="w-14 h-14" />
                            {user.onlineStatus === 'online' && (
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-650 transition-colors">
                              {user.fullname || user.name}
                            </h4>
                            <p className="text-xs text-slate-550 font-medium">@{user.username}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{user.department} • {user.year}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 z-10">
                          <button
                            onClick={() => navigate('/messages', { state: { startChatWith: user } })}
                            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-xl transition-all"
                            title="Open Chat"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/profile/${user.username || user._id}`)}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                            title="View Profile"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveConnection(user._id)}
                            disabled={actionLoadingIds.has(user._id)}
                            className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100"
                            title="Disconnect"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="You don't have any active connections yet." />
                )}
              </>
            )}

            {/* ─── SUGGESTIONS TAB ─────────────────────────────────────────── */}
            {activeTab === 'suggestions' && (
              <>
                {suggestions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestions.map((user) => (
                      <StudentCard
                        key={user._id || user.id}
                        user={user}
                        onConnect={handleConnect}
                        onCancel={handleCancelRequest}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                        actionLoading={actionLoadingIds.has(user._id)}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
                    <Sparkles size={40} className="mx-auto text-indigo-300 mb-3 animate-pulse" />
                    <h3 className="font-bold text-slate-800 mb-1">Checking for recommendations...</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Recommendations update dynamically as you add skills, departments, and interests to your profile setup!
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

const Avatar = ({ user, size = 'w-12 h-12' }) => {
  return (
    <div className={`${size} rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-50 to-purple-50 border border-slate-100 flex-shrink-0 flex items-center justify-center shadow-sm text-indigo-600 font-extrabold`}>
      {user?.profilePicture ? (
        <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span>{(user?.fullname || user?.username || 'U').charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};

const StudentCard = ({ user, onConnect, onCancel, onAccept, onReject, actionLoading, navigate }) => {
  const skills = user.skills || [];
  const topSkills = skills.slice(0, 3);
  const profileId = user.username || user._id;

  return (
    <div 
      onClick={() => navigate(`/profile/${profileId}`)}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group h-full relative"
    >
      <div>
        <div className="flex items-start gap-4">
          <Avatar user={user} size="w-14 h-14" />
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-[15px] truncate group-hover:text-indigo-600 transition-colors">
              {user.fullname || user.name}
            </h3>
            <p className="text-xs font-semibold text-slate-400 truncate">
              @{user.username}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-1">
              <GraduationCap size={14} className="text-slate-400" />
              <span className="truncate">{user.department} • {user.year}</span>
            </p>
          </div>
        </div>

        {user.bio && (
          <p className="text-xs text-slate-600 mt-3.5 leading-relaxed line-clamp-2 italic font-medium">
            "{user.bio}"
          </p>
        )}

        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {topSkills.map((sk, idx) => (
              <span key={idx} className="bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {sk}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-[10px] font-extrabold text-indigo-500 px-1 py-0.5">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-1 rounded">
          {user.mutualConnectionCount || 0} mutual connections
        </span>

        {/* Dynamic Context Connection Buttons */}
        <div onClick={e => e.stopPropagation()}>
          {user.connectionStatus === 'none' && (
            <button
              onClick={() => onConnect(user._id)}
              disabled={actionLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <UserPlus size={14} /> Connect
            </button>
          )}

          {user.connectionStatus === 'pending' && (
            <button
              onClick={() => onCancel(user._id)}
              disabled={actionLoading}
              className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all"
            >
              Pending
            </button>
          )}

          {user.connectionStatus === 'incoming_pending' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAccept(user._id)}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(user._id)}
                disabled={actionLoading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1.5 rounded-xl transition-all"
              >
                Ignore
              </button>
            </div>
          )}

          {user.connectionStatus === 'accepted' && (
            <span className="text-emerald-650 bg-emerald-50 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1">
              Connected ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
    <div className="h-8 bg-slate-200 rounded w-full" />
    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-8 bg-slate-200 rounded w-1/4" />
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
    <Users size={40} className="mx-auto text-slate-300 mb-3" />
    <h3 className="font-bold text-slate-800 mb-1">No Results</h3>
    <p className="text-slate-500 text-xs leading-relaxed">{text}</p>
  </div>
);
