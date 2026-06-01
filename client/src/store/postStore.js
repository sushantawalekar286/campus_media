import { create } from 'zustand';
import api from '../api/apiClient';

export const usePostStore = create((set, get) => ({
  feed: [],
  explore: [],
  trending: [],
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,

  fetchFeed: async (page = 1, reset = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/posts/feed?page=${page}&limit=10`);
      set(state => ({
        feed: reset ? response.data.posts : [...state.feed, ...response.data.posts],
        page: response.data.currentPage,
        hasMore: response.data.currentPage < response.data.totalPages,
        isLoading: false
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  fetchExplore: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/posts/explore');
      set({ explore: response.data, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  createPost: async (postData) => {
    try {
      const response = await api.post('/posts/create', postData);
      set(state => ({ feed: [response.data, ...state.feed] }));
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    }
  },

  toggleLike: async (postId) => {
    try {
      const response = await api.put(`/posts/like/${postId}`);
      set(state => ({
        feed: state.feed.map(p => 
          p._id === postId 
            ? { ...p, likesCount: p.likesCount + (response.data.liked ? 1 : -1) } 
            : p
        )
      }));
      return response.data;
    } catch (err) {
      console.error(err);
    }
  },

  addComment: async (postId, text) => {
    try {
      const response = await api.post(`/posts/comment/${postId}`, { text });
      set(state => ({
        feed: state.feed.map(p => 
          p._id === postId 
            ? { ...p, commentsCount: p.commentsCount + 1 } 
            : p
        )
      }));
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    }
  },

  fetchComments: async (postId) => {
    try {
      const response = await api.get(`/posts/comments/${postId}`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    }
  },

  deletePost: async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      set(state => ({
        feed: state.feed.filter(p => p._id !== postId),
        explore: state.explore.filter(p => p._id !== postId),
        trending: state.trending.filter(p => p._id !== postId)
      }));
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    }
  },

  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/posts/${postId}`, postData);
      set(state => ({
        feed: state.feed.map(p => p._id === postId ? response.data : p),
        explore: state.explore.map(p => p._id === postId ? response.data : p),
        trending: state.trending.map(p => p._id === postId ? response.data : p)
      }));
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    }
  }
}));
