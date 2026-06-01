import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { UserRole, UserStatus } from '../types';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleApiError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: localStorage.getItem('userId'),
      email: localStorage.getItem('userEmail'),
    },
    operationType,
    path
  };
  console.error('API Error: ', JSON.stringify(errInfo));
}

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentChannelId, setCurrentChannelId] = useState('general');
  const [resumeContext, setResumeContext] = useState({ rawText: '', extractedData: null });
  
  const [systemConfig] = useState({
      announcement: "Welcome to Campus Media v2.0 (Powered by MongoDB)",
      allowSignups: true,
      maintenanceMode: false,
      interviewCategories: []
  });
  
  const [channels] = useState([
      { id: 'general', name: 'General', description: 'General Discussion', type: 'PUBLIC' },
      { id: 'interview-prep', name: 'Interview Prep', description: 'Mock interviews & tips', type: 'PUBLIC' },
      { id: 'jobs', name: 'Jobs', description: 'Job openings & referrals', type: 'PUBLIC' }
  ]);

  // Read saved user / auth info on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            const user = res.data.user;
            setCurrentUser(user);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userEmail', user.email);
          } else {
            handleLogoutCleanups();
          }
        } catch (error) {
          console.error("Auto authentication verification failed:", error);
          handleLogoutCleanups();
        }
      } else {
        setIsLoadingAuth(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Set isLoadingAuth to false when currentUser resolves
  useEffect(() => {
    if (currentUser !== null) {
      setIsLoadingAuth(false);
    }
  }, [currentUser]);

  const handleLogoutCleanups = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setCurrentUser(null);
    setUsers([]);
    setJobs([]);
    setQuestions([]);
    setMessages([]);
    setIsLoadingAuth(false);
  };

  // Main list fetch functions
  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data || []);
    } catch (e) {
      handleApiError(e, OperationType.GET, 'jobs');
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/questions');
      setQuestions(res.data || []);
    } catch (e) {
      handleApiError(e, OperationType.GET, 'questions');
    }
  };

  const fetchUsers = async () => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (e) {
      handleApiError(e, OperationType.GET, 'users');
    }
  };

  const fetchMessages = async (channelId) => {
    try {
      setCurrentChannelId(channelId);
      const res = await api.get(`/chat/${channelId}`);
      setMessages(res.data || []);
    } catch (e) {
      handleApiError(e, OperationType.GET, `chat/${channelId}`);
    }
  };

  const refreshAllData = async () => {
    if (!currentUser) return;
    await Promise.all([
      fetchJobs(),
      fetchQuestions(),
      currentUser.role === UserRole.ADMIN ? fetchUsers() : Promise.resolve(),
      fetchMessages(currentChannelId)
    ]);
  };

  // Fetch initial data when user logs in or mounts
  useEffect(() => {
    if (currentUser) {
      refreshAllData();
      
      // Poll every 5 seconds to provide real-time updates for Chat, jobs, and questions!
      const interval = setInterval(() => {
        refreshAllData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [currentUser, currentChannelId]);

  const login = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user.id);
        localStorage.setItem('userEmail', res.data.user.email);
        setCurrentUser(res.data.user);
      }
    } catch (error) {
      setIsLoadingAuth(false);
      const errMsg = error.response?.data?.error || error.message || 'Login failed';
      throw new Error(errMsg);
    }
  };

  const register = async (name, email, password, role, year) => {
    try {
      setIsLoadingAuth(true);
      const res = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role, 
        year: year || "" 
      });
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.user.id);
        localStorage.setItem('userEmail', res.data.user.email);
        setCurrentUser(res.data.user);
      }
    } catch (error) {
      setIsLoadingAuth(false);
      const errMsg = error.response?.data?.error || error.message || 'Registration failed';
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    handleLogoutCleanups();
  };

  const addQuestion = async (qData) => {
    try {
      const res = await api.post('/questions', qData);
      setQuestions(prev => [res.data, ...prev]);
    } catch (error) {
      handleApiError(error, OperationType.CREATE, "questions");
      throw error;
    }
  };

  const updateQuestionStatus = async (id, status) => {
    try {
      const res = await api.patch(`/questions/${id}/status`, { status });
      setQuestions(prev => prev.map(q => q.id === id ? res.data : q));
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `questions/${id}`);
      throw error;
    }
  };

  const addJob = async (job) => {
    try {
      const res = await api.post('/jobs', job);
      setJobs(prev => [res.data, ...prev]);
    } catch (error) {
      handleApiError(error, OperationType.CREATE, "jobs");
      throw error;
    }
  };

  const deleteJob = async (id) => {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (error) {
      handleApiError(error, OperationType.DELETE, `jobs/${id}`);
      throw error;
    }
  };

  const sendMessage = async (text, channelId) => {
    try {
      const res = await api.post('/chat', { text, channel: channelId });
      setMessages(prev => [...prev, res.data]);
    } catch (error) {
      handleApiError(error, OperationType.CREATE, "chat");
      throw error;
    }
  };

  const updateUserStatus = async (id, status) => {
    try {
      const res = await api.patch(`/users/${id}/status`, { status });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: res.data.status } : u));
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, `users/${id}`);
      throw error;
    }
  };

  const updateResumeContext = (text, data) => {
    setResumeContext({ rawText: text, extractedData: data });
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, jobs, questions, notes, messages, channels, resumeContext, systemConfig, isLoadingAuth,
      login, logout, register, 
      addQuestion, updateQuestionStatus, 
      addJob, deleteJob,
      sendMessage, fetchMessages, updateUserStatus, 
      updateResumeContext, refreshAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
