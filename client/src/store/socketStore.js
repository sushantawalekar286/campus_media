import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './authStore';

export const useSocketStore = create((set, get) => ({
  socket: null,

  connectSocket: () => {
    // If socket is already initialized and connected, return it
    if (get().socket?.connected) {
      return get().socket;
    }

    // Clean up old socket if it exists but is disconnected
    if (get().socket) {
      get().socket.disconnect();
    }

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      console.warn('[SocketStore] Cannot connect: No access token found in authStore.');
      return null;
    }

    // In production, derive socket URL from VITE_API_URL (strip /api suffix); fallback to current origin
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : (window.location.origin || 'http://localhost:3000');
    console.log('[SocketStore] Initializing connection to:', socketUrl);

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ [SocketStore] Socket connected successfully. ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [SocketStore] Socket disconnected. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [SocketStore] Socket connection error:', error.message);
    });

    set({ socket });
    return socket;
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      console.log('[SocketStore] Disconnecting socket...');
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
