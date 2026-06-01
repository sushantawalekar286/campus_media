import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { MockInterview } from './pages/MockInterview';
import { QuestionBank } from './pages/QuestionBank';
import { JobBoard } from './pages/JobBoard';
import { AdminPanel } from './pages/AdminPanel';
import { MentorshipChat } from './pages/MentorshipChat';
import { RoadmapGenerator } from './pages/RoadmapGenerator';
import { UserRole } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

const LoginScreen = () => {
  const { login, register } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(UserRole.STUDENT);
  const [year, setYear] = useState('1st Year');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await register(name, email, password, role, role === UserRole.STUDENT ? year : undefined);
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-xl shadow-indigo-200">
            C
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Campus Media</h1>
          <p className="text-slate-500 mt-2 font-medium">Elevate Your Career Journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
             <div className="space-y-4 animate-in fade-in duration-300">
               <input
                 type="text"
                 placeholder="Full Name"
                 className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 required
               />
               <div className="grid grid-cols-2 gap-3">
                  <select 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value={UserRole.STUDENT}>Student</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                  
                  {role === UserRole.STUDENT && (
                    <select 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>Alumni</option>
                    </select>
                  )}
               </div>
             </div>
          )}
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
           <button 
             onClick={() => {
               setIsRegistering(!isRegistering);
               setError(null);
             }}
             className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
           >
             {isRegistering ? 'Already have an account? Sign In' : 'New here? Create your student account'}
           </button>
        </div>
        
        {!isRegistering && (
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">Quick Demo Access</p>
             <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { setEmail('admin@campus.edu'); setPassword('password123'); }}
                  className="text-xs text-indigo-500 hover:bg-indigo-50 py-2 rounded-lg transition-colors border border-indigo-100"
                >
                  Load Admin: admin@campus.edu / password123
                </button>
                <button 
                  onClick={() => { setEmail('john@student.edu'); setPassword('password123'); }}
                  className="text-xs text-slate-500 hover:bg-slate-50 py-2 rounded-lg transition-colors border border-slate-200"
                >
                  Load Student: john@student.edu / password123
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="resume" element={<ResumeAnalyzer />} />
        <Route path="interview" element={<MockInterview />} />
        <Route path="roadmap" element={<RoadmapGenerator />} />
        <Route path="chat" element={<MentorshipChat />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="jobs" element={<JobBoard />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
