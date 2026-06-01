import { create } from 'zustand';
import api from '../api/apiClient';

export const useSocialStore = create((set) => ({
  followers: [],
  following: [],
  suggestions: [],
  searchResults: [],
  isLoading: false,

  followUser: async (userId) => {
    try {
      await api.post(`/users/follow/${userId}`);
      set((state) => ({ following: [...state.following, userId] }));
    } catch (err) { console.error(err); }
  },

  unfollowUser: async (userId) => {
    try {
      await api.delete(`/users/unfollow/${userId}`);
      set((state) => ({ following: state.following.filter(id => id !== userId) }));
    } catch (err) { console.error(err); }
  },

  fetchFollowers: async (userId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/users/followers/${userId}`);
      set({ followers: response.data, isLoading: false });
    } catch (err) { set({ isLoading: false }); }
  },

  fetchFollowing: async (userId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/users/following/${userId}`);
      set({ following: response.data, isLoading: false });
    } catch (err) { set({ isLoading: false }); }
  },

  fetchSuggestions: async () => {
    try {
      const response = await api.get('/users/suggestions');
      set({ suggestions: response.data });
    } catch (err) { console.error(err); }
  },

  searchUsers: async (query) => {
    if (!query) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await api.get(`/users/search?query=${query}`);
      set({ searchResults: response.data, isLoading: false });
    } catch (err) { set({ isLoading: false }); }
  }
}));
