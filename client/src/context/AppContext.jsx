import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

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
  // Bridge auth states to Zustand authStore
  const currentUser = useAuthStore(state => state.user);
  const isLoadingAuth = useAuthStore(state => state.isLoading);
  const loginStore = useAuthStore(state => state.login);
  const registerStore = useAuthStore(state => state.register);
  const logoutStore = useAuthStore(state => state.logout);
  const setSession = useAuthStore(state => state.setSession);

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChannelId, setCurrentChannelId] = useState('general');
  const [resumeContext, setResumeContext] = useState({ rawText: '', extractedData: null });
  const [resumeSubmissions, setResumeSubmissions] = useState([]);
  
  const [systemConfig, setSystemConfig] = useState({
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
    if (currentUser?.role !== 'ADMIN') return;
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (e) {
      handleApiError(e, OperationType.GET, 'users');
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data || []);
    } catch (e) {
      handleApiError(e, OperationType.GET, 'notes');
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const res = await api.get('/config');
      if (res.data) {
        setSystemConfig(res.data);
      }
    } catch (e) {
      handleApiError(e, OperationType.GET, 'config');
    }
  };

  const fetchResumeSubmissions = async () => {
    if (currentUser?.role !== 'ADMIN') return;
    try {
      const res = await api.get('/resume/submissions');
      setResumeSubmissions(res.data || []);
    } catch (e) {
      handleApiError(e, OperationType.GET, 'resume/submissions');
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
      fetchNotes(),
      fetchSystemConfig(),
      currentUser.role === 'ADMIN' ? fetchUsers() : Promise.resolve(),
      currentUser.role === 'ADMIN' ? fetchResumeSubmissions() : Promise.resolve(),
      fetchMessages(currentChannelId)
    ]);
  };

  // Fetch initial data when user logs in or mounts
  useEffect(() => {
    fetchSystemConfig();
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
      const interval = setInterval(() => {
        refreshAllData();
      }, 60000); // Poll every 60s (not 5s)
      return () => clearInterval(interval);
    }
  }, [currentUser, currentChannelId]);

  const login = async (email, password) => {
    const result = await loginStore(email, password);
    return result;
  };

  const register = async (fullname, email, password, year) => {
    const result = await registerStore(fullname, email, password, year);
    return result;
  };

  const logout = async () => {
    await logoutStore();
    setUsers([]);
    setJobs([]);
    setQuestions([]);
    setMessages([]);
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

  const deleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      handleApiError(error, OperationType.DELETE, `users/${id}`);
      throw error;
    }
  };

  const deleteQuestion = async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      handleApiError(error, OperationType.DELETE, `questions/${id}`);
      throw error;
    }
  };

  const deleteMessage = async (id) => {
    try {
      await api.delete(`/chat/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      handleApiError(error, OperationType.DELETE, `chat/${id}`);
      throw error;
    }
  };

  const updateSystemConfig = async (configData) => {
    try {
      const res = await api.patch('/config', configData);
      setSystemConfig(res.data);
    } catch (error) {
      handleApiError(error, OperationType.UPDATE, "config");
      throw error;
    }
  };

  const addNote = async (noteData) => {
    try {
      const res = await api.post('/notes', noteData);
      setNotes(prev => [res.data, ...prev]);
    } catch (error) {
      handleApiError(error, OperationType.CREATE, "notes");
      throw error;
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      handleApiError(error, OperationType.DELETE, `notes/${id}`);
      throw error;
    }
  };

  const updateResumeContext = (text, data) => {
    setResumeContext({ rawText: text, extractedData: data });
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, jobs, questions, notes, messages, channels, resumeContext, systemConfig, resumeSubmissions, isLoadingAuth,
      login, logout, register, 
      addQuestion, updateQuestionStatus, deleteQuestion,
      addJob, deleteJob,
      sendMessage, fetchMessages, updateUserStatus, deleteUser,
      deleteMessage, updateSystemConfig, addNote, deleteNote,
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
