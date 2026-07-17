import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, Loader2, RefreshCw } from 'lucide-react';

import logo from '../../../logo.png';

export const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendOTP = useAuthStore((state) => state.resendOTP);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const email = location.state?.email || '';
  const type = location.state?.type || 'EMAIL_VERIFICATION'; // EMAIL_VERIFICATION or PASSWORD_RESET

  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationError, setVerificationError] = useState('');
  
  const inputRefs = useRef([]);

  // Auto-redirect if email is missing
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Resend code cooldown timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input box
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    // Only process if pasted text looks like a 6-digit OTP
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      // Focus the last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setVerificationError('');
    setSuccessMsg('');
    try {
      await resendOTP(email, type);
      setSuccessMsg('A new verification code has been dispatched.');
      setTimer(59);
      setCanResend(false);
    } catch (err) {
      setVerificationError(err.message || 'Failed to resend code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setSuccessMsg('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setVerificationError('Please enter all 6 digits of the OTP.');
      return;
    }

    try {
      if (type === 'EMAIL_VERIFICATION') {
        await verifyEmail(email, otpCode);
        setSuccessMsg('Account verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else if (type === 'PASSWORD_RESET') {
        // Forward verification details to reset password view
        navigate('/reset-password', { state: { email, otp: otpCode } });
      }
    } catch (err) {
      // Error handled by store or display locally
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
          Verify OTP Code
        </h2>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          A 6-digit confirmation code was sent to <span className="text-indigo-400 font-semibold">{email}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-white/5 backdrop-blur-xl py-8 px-4 shadow-2xl border border-white/10 rounded-3xl sm:px-10"
        >
          {(error || verificationError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 text-sm animate-in fade-in">
              <ShieldAlert size={20} className="flex-shrink-0 text-red-400" />
              <div>
                <p className="font-semibold">Verification Error</p>
                <p className="opacity-90">{verificationError || error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-200 text-sm animate-in fade-in">
              <p className="font-semibold">Success</p>
              <p className="opacity-90">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2 justify-items-center">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  name="otp"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center bg-slate-900 border border-white/15 rounded-xl text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  Verifying Code...
                </>
              ) : (
                'Submit Code'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              Didn't receive the OTP code?
            </p>
            <button
              onClick={handleResend}
              disabled={!canResend}
              className="mt-3 flex items-center justify-center gap-2 mx-auto text-sm font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={!canResend && timer > 0 ? '' : 'animate-spin'} />
              {canResend ? 'Resend New Code' : `Resend OTP Code in (${timer}s)`}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
