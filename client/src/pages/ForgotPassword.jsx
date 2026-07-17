import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Mail, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

import logo from '../../../logo.png';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    if (!email) {
      setValidationError('Please enter your email address.');
      return;
    }

    try {
      await forgotPassword(email);
      setSuccessMsg('If the email is registered, a password reset code has been sent.');
      setTimeout(() => {
        navigate('/verify-otp', { state: { email, type: 'PASSWORD_RESET' } });
      }, 2000);
    } catch (err) {
      // Handled by store or display locally
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse delay-700"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 flex justify-center"
        >
          <img src={logo} alt="Campus Media Logo" className="w-16 h-16 object-contain rounded-2xl shadow-lg shadow-indigo-500/20" />
        </motion.div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Forgot Password
        </h2>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          Enter your email to receive a password reset OTP code
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
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-in fade-in">
              <AlertCircle size={20} className="flex-shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold">Request Failed</p>
                <p className="opacity-90">{validationError || error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-200 text-sm animate-in fade-in">
              <p className="font-semibold">Request Sent</p>
              <p className="opacity-90">{successMsg}</p>
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
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                    Sending Request...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
