import { create } from 'zustand';
import axios from 'axios';

// Dedicated axios instance for auth endpoints (avoids circular dependency with apiClient)
const authAxios = axios.create({
  baseURL: '/api/auth',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// ─── localStorage key constants ───────────────────────────────────────────────
const LS_ACCESS_TOKEN  = 'accessToken';
const LS_REFRESH_TOKEN = 'refreshToken';
const LS_USER_ID       = 'userId';
const LS_USER_EMAIL    = 'userEmail';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function persistSession(accessToken, refreshToken, user) {
  if (accessToken)  localStorage.setItem(LS_ACCESS_TOKEN,  accessToken);
  if (refreshToken) localStorage.setItem(LS_REFRESH_TOKEN, refreshToken);
  if (user?.id || user?._id) {
    localStorage.setItem(LS_USER_ID,    (user.id || user._id || '').toString());
    localStorage.setItem(LS_USER_EMAIL, user.email || '');
  }
}

function clearPersistedSession() {
  localStorage.removeItem(LS_ACCESS_TOKEN);
  localStorage.removeItem(LS_REFRESH_TOKEN);
  localStorage.removeItem(LS_USER_ID);
  localStorage.removeItem(LS_USER_EMAIL);
  // Legacy key cleanup
  localStorage.removeItem('token');
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:            null,
  accessToken:     localStorage.getItem(LS_ACCESS_TOKEN)  || localStorage.getItem('token') || null,
  refreshToken:    localStorage.getItem(LS_REFRESH_TOKEN) || null,
  isAuthenticated: !!(localStorage.getItem(LS_ACCESS_TOKEN) || localStorage.getItem('token')),
  isLoading:       false,
  error:           null,
  activeSessions:  [],
  onlineStatus:    'offline',

  // ── setSession ──────────────────────────────────────────────────────────────
  setSession(accessToken, refreshToken, user) {
    persistSession(accessToken, refreshToken, user);
    set({
      accessToken,
      refreshToken: refreshToken || get().refreshToken,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  },

  // ── clearSession ────────────────────────────────────────────────────────────
  clearSession() {
    clearPersistedSession();
    set({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      isLoading:       false,
      activeSessions:  [],
      error:           null
    });
  },

  // ── login ───────────────────────────────────────────────────────────────────
  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      console.debug('[Auth] Attempting login for:', email);
      const res = await authAxios.post('/login', { email, password });
      const data = res.data;

      console.debug('[Auth] Login response:', JSON.stringify({
        hasAccessToken:  !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        hasUser:         !!data.user,
        requiresVerification: data.requiresVerification
      }));

      // OTP flow: backend signals user must verify email
      if (data.requiresVerification) {
        set({ isLoading: false });
        return { requiresVerification: true, email: data.email || email };
      }

      // Normal flow: expect { accessToken, refreshToken, user }
      const { accessToken, refreshToken, user } = data;

      if (!accessToken) {
        throw new Error('Server did not return an access token. Check backend response.');
      }

      get().setSession(accessToken, refreshToken, user);
      console.debug('[Auth] Login successful. User:', user?.fullname || user?.name || user?.email);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed. Please try again.';
      console.error('[Auth] Login error:', msg);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  // ── register ─────────────────────────────────────────────────────────────────
  async register(fullname, email, password, year) {
    set({ isLoading: true, error: null });
    try {
      console.debug('[Auth] Attempting registration for:', email);
      const res = await authAxios.post('/register', { fullname, email, password, year });
      const data = res.data;

      console.debug('[Auth] Register response:', JSON.stringify({
        requiresVerification: data.requiresVerification,
        hasAccessToken: !!data.accessToken
      }));

      // OTP disabled: backend returns tokens directly
      if (data.requiresVerification === false) {
        const { accessToken, refreshToken, user } = data;
        if (accessToken) {
          get().setSession(accessToken, refreshToken, user);
        }
        return { requiresVerification: false, email: data.email || email };
      }

      // OTP enabled: user must verify email
      set({ isLoading: false });
      return {
        requiresVerification: true,
        email: data.email || email,
        message: data.message
      };
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed.';
      console.error('[Auth] Register error:', msg);
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  // ── verifyEmail ──────────────────────────────────────────────────────────────
  async verifyEmail(email, otp) {
    set({ isLoading: true, error: null });
    try {
      await authAxios.post('/verify-email', { email, otp });
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  // ── resendOTP ─────────────────────────────────────────────────────────────────
  async resendOTP(email, type = 'EMAIL_VERIFICATION') {
    try {
      await authAxios.post('/resend-otp', { email, type });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to resend code.';
      throw new Error(msg);
    }
  },

  // ── forgotPassword ───────────────────────────────────────────────────────────
  async forgotPassword(email) {
    set({ isLoading: true, error: null });
    try {
      await authAxios.post('/forgot-password', { email });
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Password reset request failed.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  // ── resetPassword ────────────────────────────────────────────────────────────
  async resetPassword(email, otp, newPassword) {
    set({ isLoading: true, error: null });
    try {
      await authAxios.post('/reset-password', { email, otp, newPassword });
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reset password.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  // ── logout ───────────────────────────────────────────────────────────────────
  async logout() {
    try {
      const token = get().refreshToken;
      await authAxios.post('/logout', { refreshToken: token });
    } catch (err) {
      console.warn('[Auth] Backend logout failed (cleaning client session anyway):', err.message);
    } finally {
      get().clearSession();
    }
  },

  // ── initializeAuth ─────────────────────────────────────────────────────────
  // Called once on App mount to restore session from localStorage
  async initializeAuth() {
    const token = get().accessToken;

    // No token stored → not logged in, nothing to restore
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    console.debug('[Auth] Restoring session from stored token...');

    try {
      // Validate token against /me endpoint
      const res = await authAxios.get('/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = res.data?.user;
      if (user) {
        console.debug('[Auth] Session restored for:', user.fullname || user.name || user.email);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        console.warn('[Auth] /me response had no user field. Clearing session.');
        get().clearSession();
      }
    } catch (err) {
      const status = err.response?.status;
      const code   = err.response?.data?.code;

      console.warn('[Auth] /me failed with status:', status, '| code:', code);

      // 401 TOKEN_EXPIRED → attempt refresh
      if (status === 401) {
        const storedRefreshToken = get().refreshToken;
        if (storedRefreshToken) {
          try {
            console.debug('[Auth] Attempting token refresh...');
            const refreshRes = await authAxios.post('/refresh-token', {
              refreshToken: storedRefreshToken
            });
            const { accessToken, refreshToken, user } = refreshRes.data;
            if (accessToken) {
              get().setSession(accessToken, refreshToken, user);
              console.debug('[Auth] Token refreshed successfully.');
              return;
            }
          } catch (refreshErr) {
            console.warn('[Auth] Token refresh failed:', refreshErr.response?.data?.error || refreshErr.message);
          }
        }
        // Refresh failed or no refresh token → clear session
        get().clearSession();
      } else {
        // Network error or other — keep token but mark not loading
        // Don't wipe session on network errors (user may be offline)
        console.warn('[Auth] Network/server error during auth restore. Keeping stored token.');
        set({ isLoading: false });
      }
    }
  }
}));
