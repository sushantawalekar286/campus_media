import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, AlertCircle, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

import logo from '../../../logo.png';

export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    try {
      const result = await login(email, password);
      if (result?.requiresVerification) {
        navigate('/verify-otp', { state: { email: result.email, type: 'EMAIL_VERIFICATION' } });
      } else {
        navigate('/');
      }
    } catch (err) {
      // Handled by store error
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse delay-700"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="mb-4 flex justify-center"
        >
          <img src={logo} alt="Campus Media Logo" className="w-16 h-16 object-contain rounded-2xl shadow-lg shadow-indigo-500/20" />
        </motion.div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Campus Media
        </h2>
        <p className="mt-2 text-sm text-indigo-300/80 font-medium">
          Elevate Your Career & Social Journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow-2xl border border-white/10 rounded-3xl sm:px-10"
        >
          {/* Error Message Box */}
          {(error || validationError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="flex-shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Failed</p>
                <p className="opacity-90">{validationError || error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="name@student.edu"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
