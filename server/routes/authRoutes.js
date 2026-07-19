import express from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { authValidator } from '../validators/authValidator.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiter for OTP code requests (spam prevention)
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { error: 'Too many OTP requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP code submissions (brute-force protection)
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 validation attempts per window
  message: { error: 'Too many verification attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register & Login (includes auto email-sending if unverified)
router.post('/register', authValidator.validateRegister, authController.register);
router.post('/login', authValidator.validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Forgot Password (sends password reset OTP)
router.post('/forgot-password', otpSendLimiter, authValidator.validateForgotPassword, authController.forgotPassword);

// Reset Password (accepts OTP and new password)
router.post('/reset-password', otpVerifyLimiter, authValidator.validateResetPassword, authController.resetPassword);

// Verify Email OTP (registration confirmation)
router.post('/verify-email', otpVerifyLimiter, authValidator.validateVerifyEmail, authController.verifyEmail);

// Resend OTP / Send OTP endpoints
router.post('/resend-otp', otpSendLimiter, authController.resendOTP);
router.post('/send-otp', otpSendLimiter, authController.resendOTP); // alias route
router.post('/verify-otp', otpVerifyLimiter, authValidator.validateVerifyOTP, authController.verifyOTP);

// Token validation check
router.get('/me', authMiddleware, authController.me);

export default router;
