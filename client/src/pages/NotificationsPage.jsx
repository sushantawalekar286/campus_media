import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, Trash2, UserPlus, UserCheck, MessageSquare, 
  Sparkles, Award, FileText, ChevronRight, Inbox, Clock, UserX
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

export const NotificationsPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const handleMarkAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleAcceptRequest = async (targetId, notificationId) => {
    try {
      await apiClient.post(`/users/connections/accept/${targetId}`);
      // Mark notification as read
      handleMarkAsRead(notificationId);
      // Remove or update the buttons locally
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      alert('Connection accepted!');
    } catch (err) {
      console.error('Failed to accept:', err);
      alert('Error accepting connection invite.');
    }
  };

  const handleRejectRequest = async (targetId, notificationId) => {
    try {
      await apiClient.post(`/users/connections/reject/${targetId}`);
      // Mark notification as read
      handleMarkAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      alert('Connection invitation declined.');
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('Error declining connection invite.');
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'connection':
        return <UserPlus size={18} className="text-indigo-650" />;
      case 'message':
        return <MessageSquare size={18} className="text-blue-500" />;
      case 'like':
        return <Heart size={18} className="text-rose-500 fill-rose-500" />;
      case 'comment':
      case 'reply':
        return <MessageSquare size={18} className="text-emerald-500" />;
      case 'achievement':
        return <Award size={18} className="text-amber-500" />;
      case 'resource_approval':
        return <FileText size={18} className="text-orange-500" />;
      default:
        return <Bell size={18} className="text-slate-400" />;
    }
  };

  const formatNotifTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
            <p className="text-slate-500 text-sm">Stay updated on invites, replies, and community connections.</p>
          </div>
        </div>

        {notifications.some(n => !n.readStatus) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-150 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Check size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-750 p-4 border border-red-100 rounded-xl text-center text-sm font-semibold max-w-md mx-auto my-12">
            {error}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const isUnread = !notif.readStatus && !notif.isRead;
              return (
                <div
                  key={notif._id}
                  onClick={() => {
                    handleMarkAsRead(notif._id);
                    if (notif.senderId?.username) {
                      navigate(`/profile/${notif.senderId.username}`);
                    }
                  }}
                  className={`bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                    isUnread ? 'border-l-4 border-l-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                      {getNotifIcon(notif.type)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm truncate">
                          {notif.title || 'System Notification'}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {formatNotifTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-655 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Connection request actions embedded inside unread notifications */}
                      {notif.type === 'connection' && isUnread && notif.title?.toLowerCase().includes('request') && (
                        <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleAcceptRequest(notif.targetId, notif._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(notif.targetId, notif._id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg"
                          >
                            Ignore
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif._id);
                      }}
                      className="text-[10px] font-bold text-indigo-650 hover:text-indigo-800 border border-indigo-100 bg-indigo-50/50 px-2.5 py-1.5 rounded-xl transition-all self-start sm:self-auto flex-shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
            <Inbox size={40} className="mx-auto text-slate-350 mb-3" />
            <h3 className="font-bold text-slate-800 mb-1">Inbox Empty</h3>
            <p className="text-slate-500 text-xs">You have no new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};
