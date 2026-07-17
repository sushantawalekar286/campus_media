import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { FeedPage as SocialFeed } from './pages/FeedPage';
import { JobBoard } from './pages/JobBoard';
import { AdminPanel } from './pages/AdminPanel';
import { ProfileSetup } from './pages/ProfileSetup';
import { Profile } from './pages/Profile';
import { AIMentorPage } from './pages/AIMentorPage';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { MockInterview } from './pages/MockInterview';
import { RoadmapGenerator } from './pages/RoadmapGenerator';
import { NetworkPage } from './pages/NetworkPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyOTP } from './pages/VerifyOTP';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 text-3xl">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-400 text-sm mb-6 max-w-md text-center">
            {this.state.error?.message || 'An unexpected error occurred in the application.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = '/'; }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Reload App
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-6 text-xs text-red-400 bg-red-900/20 p-4 rounded-xl max-w-2xl overflow-auto">
              {this.state.error?.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Route Guards ────────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ─── Splash / Loading Screen ─────────────────────────────────────────────────
const SplashScreen = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
    <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative text-center z-10"
    >
      <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl font-extrabold text-white shadow-xl shadow-indigo-500/25">
        C
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Campus Media</h2>
      <div className="flex items-center justify-center gap-2 text-indigo-400 font-semibold text-sm">
        <Loader2 className="animate-spin" size={16} />
        Synchronizing Secure Session...
      </div>
    </motion.div>
  </div>
);

// ─── App Content ─────────────────────────────────────────────────────────────
const AppContent = () => {
  const initializeAuth  = useAuthStore((state) => state.initializeAuth);
  const isLoading       = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession    = useAuthStore((state) => state.clearSession);

  // Safety flag: once initializeAuth has been called once, never show splash again
  const [authInitDone, setAuthInitDone] = useState(false);

  useEffect(() => {
    let timeout;

    const init = async () => {
      try {
        await initializeAuth();
      } catch (err) {
        console.error('[App] initializeAuth threw unexpectedly:', err);
        clearSession(); // fail-safe: reset to logged-out state
      } finally {
        setAuthInitDone(true);
      }
    };

    init();

    // Hard safety timeout: if loading hasn't finished in 8s something is wrong
    timeout = setTimeout(() => {
      if (!authInitDone) {
        console.warn('[App] Auth init timed out after 8s — forcing resolution.');
        clearSession();
        setAuthInitDone(true);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, []); // run once on mount

  // Show splash only while first init is in progress
  if (!authInitDone) {
    return <SplashScreen />;
  }

  console.log("App Rendered");
  console.log("User:", useAuthStore.getState().user);
  console.log("Token:", useAuthStore.getState().accessToken);

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup"         element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/verify-otp"     element={<PublicRoute><VerifyOTP /></PublicRoute>} />

      {/* Protected Layout & Pages */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index          element={<Navigate to="/feed" replace />} />
        <Route path="feed"    element={<SocialFeed />} />
        <Route path="network" element={<NetworkPage />} />
        <Route path="explore" element={<Navigate to="/network" replace />} />
        <Route path="connections" element={<Navigate to="/network" replace />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="settings" element={<ProfileSetup />} />
        <Route path="jobs"    element={<JobBoard />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="admin"   element={<AdminPanel />} />
        <Route path="profile-setup" element={<ProfileSetup />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:username" element={<Profile />} />
        <Route path="ai-mentor" element={<AIMentorPage />} />
        <Route path="resume" element={<ResumeAnalyzer />} />
        <Route path="interview" element={<MockInterview />} />
        <Route path="roadmap" element={<RoadmapGenerator />} />
        <Route path="create-post" element={<CreatePostPage />} />
        <Route path="*"       element={<Navigate to="/feed" replace />} />
      </Route>
    </Routes>
  );
};

// ─── Root App ────────────────────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  </ErrorBoundary>
);

export default App;
