import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Lock, GraduationCap, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

import logo from '../../../logo.png';

export const Signup = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [year, setYear] = useState('1st Year');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Password strength state
  const [pwdFeedback, setPwdFeedback] = useState({
    score: 0,
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  useEffect(() => {
    const hasLength = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    let score = 0;
    if (hasLength) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasNumber) score += 1;

    setPwdFeedback({ score, hasLength, hasUpper, hasLower, hasNumber });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!fullname || !email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    if (pwdFeedback.score < 4) {
      setValidationError('Please satisfy all password complexity criteria.');
      return;
    }

    try {
      const result = await register(fullname, email, password, year);
      if (result.requiresVerification) {
        navigate('/verify-otp', { state: { email: result.email, type: 'EMAIL_VERIFICATION' } });
      } else {
        navigate('/');
      }
    } catch (err) {
      // Error handled by store
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
          Create Account
        </h2>
        <p className="mt-2 text-sm text-indigo-300/80 font-medium">
          Join Campus Media and start shaping your future
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow-2xl border border-white/10 rounded-3xl sm:px-10"
        >
          {(error || validationError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="flex-shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Failed</p>
                <p className="opacity-90">{validationError || error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="john@student.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Class Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all sm:text-sm"
              >
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Alumni</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
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

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1 h-1.5 w-full rounded bg-white/15 overflow-hidden">
                    <div className={`h-full transition-all duration-300 rounded ${
                      pwdFeedback.score <= 1 ? 'bg-red-500 w-[25%]' :
                      pwdFeedback.score === 2 ? 'bg-orange-500 w-[50%]' :
                      pwdFeedback.score === 3 ? 'bg-yellow-500 w-[75%]' : 'bg-green-500 w-[100%]'
                    }`} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
                    <span className={pwdFeedback.hasLength ? 'text-green-400 font-bold' : ''}>✓ Min 6 characters</span>
                    <span className={pwdFeedback.hasUpper ? 'text-green-400 font-bold' : ''}>✓ Uppercase letter</span>
                    <span className={pwdFeedback.hasLower ? 'text-green-400 font-bold' : ''}>✓ Lowercase letter</span>
                    <span className={pwdFeedback.hasNumber ? 'text-green-400 font-bold' : ''}>✓ Numerical digit</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
