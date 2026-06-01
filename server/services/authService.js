import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { dbHelper } from './dbHelper.js';
import { tokenService } from './tokenService.js';
import { emailService } from './emailService.js';
import { generateOTP } from '../utils/generateOTP.js';

export const authService = {
  /**
   * Registers a user account, hashes password, generates OTP, and dispatches email verification.
   */
  async register(fullname, email, password, year, req = null) {
    // 1. Basic format validations
    const trimmedEmail = email.trim().toLowerCase();
    if (!fullname || !trimmedEmail || !password) {
      throw new Error('All registration fields are required.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error('Invalid email address format.');
    }

    // Password strength check
    if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new Error('Password must be at least 6 characters and contain uppercase, lowercase, and numeric characters.');
    }

    // 2. Check if user already exists
    const existingUser = await dbHelper.User.findOne({ email: trimmedEmail });
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const ADMIN_EMAILS = [
      "pruthviraj2005patil@gmail.com",
      "sushantawalekar286@gmail.com"
    ];
    const determinedRole = ADMIN_EMAILS.includes(trimmedEmail) ? 'ADMIN' : 'USER';

    // Development Mode / Production Mode condition check for auto-verification
    const isOtpEnabled = process.env.OTP_ENABLED !== 'false';

    const user = await dbHelper.User.create({
      fullname,
      email: trimmedEmail,
      password: hashedPassword,
      role: determinedRole,
      year: year || '1st Year',
      isVerified: !isOtpEnabled // Skip verification in Development Mode
    });

    // Serialise user to a plain object (works for both Mongoose docs and local JSON docs)
    const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.toObject;
    userObj.id = userObj.id || userObj._id?.toString() || '';

    // Development Mode: Bypass OTP creation and mail dispatch
    if (!isOtpEnabled) {
      console.log('OTP Disabled - Development Mode');
      
      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = tokenService.generateRefreshToken(user);

      await tokenService.createSession(user.id || user._id, refreshToken, req);
      await dbHelper.User.findByIdAndUpdate(user.id || user._id, {
        onlineStatus: 'online',
        lastSeen: new Date()
      });

      return {
        user: userObj,
        accessToken,
        refreshToken,
        requiresVerification: false,
        message: 'Registration successful. OTP bypassed (Development Mode).'
      };
    }

    // Production Mode: Enable complete OTP flow and send verification email
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minute expiry

    await dbHelper.OTP.deleteMany({ email: trimmedEmail, type: 'EMAIL_VERIFICATION' });
    await dbHelper.OTP.create({
      userId: user.id || user._id,
      email: trimmedEmail,
      otp, // gets hashed by model pre-save hook
      type: 'EMAIL_VERIFICATION',
      expiresAt
    });

    emailService.sendVerificationOTP(trimmedEmail, otp).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    return {
      user: userObj,
      email: trimmedEmail,
      requiresVerification: true,
      message: 'Registration successful. A 6-digit confirmation code was sent to your email.'
    };
  },

  /**
   * Logs in a user. If unverified and OTP is enabled, dispatches a fresh verification code.
   */
  async login(email, password, req) {
    const trimmedEmail = email.trim().toLowerCase();
    
    // 1. Find user
    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Force role alignment based on admin list
    const ADMIN_EMAILS = [
      "pruthviraj2005patil@gmail.com",
      "sushantawalekar286@gmail.com"
    ];
    const determinedRole = ADMIN_EMAILS.includes(trimmedEmail) ? 'ADMIN' : 'USER';
    if (user.role !== determinedRole) {
      await dbHelper.User.findByIdAndUpdate(user.id || user._id, { role: determinedRole });
      user.role = determinedRole;
    }

    // 3. Check status
    if (user.status === 'BLOCKED') {
      throw new Error('This account has been suspended');
    }

    // 4. Check verification status (wrapped for Dev Mode/Prod Mode)
    const isOtpEnabled = process.env.OTP_ENABLED !== 'false';
    if (!user.isVerified) {
      if (!isOtpEnabled) {
        // Development Mode: Automatically verify user if verification system is disabled
        console.log('OTP Disabled - Development Mode');
        await dbHelper.User.findByIdAndUpdate(user.id || user._id, { isVerified: true });
        user.isVerified = true;
      } else {
        // Production Mode: Re-trigger OTP dispatch
        const otp = generateOTP(6);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await dbHelper.OTP.deleteMany({ email: trimmedEmail, type: 'EMAIL_VERIFICATION' });
        await dbHelper.OTP.create({
          userId: user.id || user._id,
          email: trimmedEmail,
          otp,
          type: 'EMAIL_VERIFICATION',
          expiresAt
        });

        emailService.sendVerificationOTP(trimmedEmail, otp).catch(err => console.error(err));
        
        const userObj2 = typeof user.toObject === 'function' ? user.toObject() : { ...user };
        delete userObj2.password;
        delete userObj2.toObject;
        userObj2.id = userObj2.id || userObj2._id?.toString() || '';
        return {
          requiresVerification: true,
          email: trimmedEmail,
          user: userObj2,
          message: 'Account email is not verified. A fresh OTP has been sent.'
        };
      }
    }

    // 5. Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);

    // 6. Create Active Session
    await tokenService.createSession(user.id || user._id, refreshToken, req);

    // 7. Update User status
    await dbHelper.User.findByIdAndUpdate(user.id || user._id, {
      onlineStatus: 'online',
      lastSeen: new Date()
    });

    const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.toObject;
    userObj.id = userObj.id || userObj._id?.toString() || '';

    return {
      user: userObj,
      accessToken,
      refreshToken
    };
  },

  /**
   * Verifies account email using OTP
   */
  async verifyEmail(email, otp) {
    const trimmedEmail = email.trim().toLowerCase();
    const isOtpEnabled = process.env.OTP_ENABLED !== 'false';

    // Development Mode Bypass
    if (!isOtpEnabled) {
      console.log('OTP Disabled - Development Mode');
      const user = await dbHelper.User.findOne({ email: trimmedEmail });
      if (!user) {
        throw new Error('User account not found');
      }
      await dbHelper.User.findByIdAndUpdate(user.id || user._id, { isVerified: true });
      return { success: true, message: 'Email verified successfully (Development Mode bypass).' };
    }

    // Production Mode: Verify OTP correctly and check expiration
    const records = await dbHelper.OTP.find({ email: trimmedEmail, type: 'EMAIL_VERIFICATION' });
    if (!records || records.length === 0) {
      throw new Error('Invalid or expired OTP');
    }

    let verifiedRecord = null;
    for (const record of records) {
      const isMatch = await record.compareOTP(otp);
      if (isMatch) {
        if (new Date(record.expiresAt) < new Date()) {
          await dbHelper.OTP.deleteOne({ _id: record._id });
          throw new Error('OTP has expired');
        }
        verifiedRecord = record;
        break;
      }
    }

    if (!verifiedRecord) {
      throw new Error('Invalid or expired OTP');
    }

    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      throw new Error('User account not found');
    }

    await dbHelper.User.findByIdAndUpdate(user.id || user._id, { isVerified: true });
    await dbHelper.OTP.deleteMany({ email: trimmedEmail, type: 'EMAIL_VERIFICATION' });

    return { success: true, message: 'Email verified successfully.' };
  },

  /**
   * Resends verification or password reset OTP.
   */
  async resendOTP(email, type) {
    const trimmedEmail = email.trim().toLowerCase();
    const isOtpEnabled = process.env.OTP_ENABLED !== 'false';

    // Development Mode Bypass
    if (!isOtpEnabled) {
      console.log('OTP Disabled - Development Mode');
      return { success: true, message: 'OTP bypassed (Development Mode).' };
    }

    // Production Mode: Fetch user and dispatch fresh OTP code
    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      throw new Error('User not found');
    }

    const latestRecord = await dbHelper.OTP.findOne({ email: trimmedEmail, type }).sort({ createdAt: -1 });
    if (latestRecord) {
      const msPassed = Date.now() - new Date(latestRecord.createdAt).getTime();
      if (msPassed < 30 * 1000) {
        throw new Error('Please wait at least 30 seconds before requesting another code.');
      }
    }

    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await dbHelper.OTP.deleteMany({ email: trimmedEmail, type });
    await dbHelper.OTP.create({
      userId: user.id || user._id,
      email: trimmedEmail,
      otp,
      type,
      expiresAt
    });

    if (type === 'EMAIL_VERIFICATION') {
      await emailService.sendVerificationOTP(trimmedEmail, otp);
    } else if (type === 'PASSWORD_RESET') {
      await emailService.sendPasswordResetOTP(trimmedEmail, otp);
    }

    return { success: true, message: 'OTP sent successfully.' };
  },

  /**
   * Handles forgot password requests
   */
  async forgotPassword(email) {
    const trimmedEmail = email.trim().toLowerCase();
    const isOtpEnabled = process.env.OTP_ENABLED !== 'false';

    // Development Mode Bypass
    if (!isOtpEnabled) {
      console.log('OTP Disabled - Development Mode');
      return { success: true, message: 'Password reset OTP bypassed. You can now reset password directly (Development Mode).' };
    }

    // Production Mode: Verify account and dispatch reset code email
    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      console.warn(`Forgot password requested for non-existent email: ${trimmedEmail}`);
      return { success: true, message: 'If the email exists, a password reset code has been sent.' };
    }

    const latestRecord = await dbHelper.OTP.findOne({ email: trimmedEmail, type: 'PASSWORD_RESET' }).sort({ createdAt: -1 });
    if (latestRecord) {
      const msPassed = Date.now() - new Date(latestRecord.createdAt).getTime();
      if (msPassed < 30 * 1000) {
        throw new Error('Please wait at least 30 seconds before requesting another reset code.');
      }
    }

    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await dbHelper.OTP.deleteMany({ email: trimmedEmail, type: 'PASSWORD_RESET' });
    await dbHelper.OTP.create({
      userId: user.id || user._id,
      email: trimmedEmail,
      otp,
      type: 'PASSWORD_RESET',
      expiresAt
    });

    await emailService.sendPasswordResetOTP(trimmedEmail, otp);

    return { success: true, message: 'If the email exists, a password reset code has been sent.' };
  },

  /**
   * Resets password using OTP
   */
  async resetPassword(email, otp, newPassword) {
    const trimmedEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const isOtpEnabled = process.env.OTP_ENABLED !== 'false';

    // Development Mode Bypass
    if (!isOtpEnabled) {
      console.log('OTP Disabled - Development Mode');
      const user = await dbHelper.User.findOne({ email: trimmedEmail });
      if (!user) {
        throw new Error('User not found');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await dbHelper.User.findByIdAndUpdate(user.id || user._id, { password: hashedPassword });
      return { success: true, message: 'Password has been reset successfully (Development Mode bypass).' };
    }

    // Production Mode: Validate OTP credentials and update password
    const records = await dbHelper.OTP.find({ email: trimmedEmail, type: 'PASSWORD_RESET' });
    if (!records || records.length === 0) {
      throw new Error('Invalid or expired OTP');
    }

    let verifiedRecord = null;
    for (const record of records) {
      const isMatch = await record.compareOTP(otp);
      if (isMatch) {
        if (new Date(record.expiresAt) < new Date()) {
          await dbHelper.OTP.deleteOne({ _id: record._id });
          throw new Error('OTP has expired');
        }
        verifiedRecord = record;
        break;
      }
    }

    if (!verifiedRecord) {
      throw new Error('Invalid or expired OTP');
    }

    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbHelper.User.findByIdAndUpdate(user.id || user._id, { password: hashedPassword });
    await dbHelper.OTP.deleteMany({ email: trimmedEmail, type: 'PASSWORD_RESET' });

    return { success: true, message: 'Password has been reset successfully.' };
  },

  /**
   * Refreshes JWT sessions (Access Token Rotation)
   */
  async refresh(refreshToken, req) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const decoded = tokenService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    const session = await dbHelper.Session.findOne({ refreshToken });
    if (!session) {
      throw new Error('Token is revoked or session expired');
    }

    const user = await dbHelper.User.findById(session.userId);
    if (!user || user.status === 'BLOCKED') {
      throw new Error('User account not found or suspended');
    }

    const newAccessToken = tokenService.generateAccessToken(user);
    const newRefreshToken = tokenService.generateRefreshToken(user);

    await tokenService.removeSession(refreshToken);
    await tokenService.createSession(user.id || user._id, newRefreshToken, req);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user
    };
  },

  /**
   * Logs out a session
   */
  async logout(refreshToken) {
    if (refreshToken) {
      const session = await dbHelper.Session.findOne({ refreshToken });
      if (session) {
        await dbHelper.User.findByIdAndUpdate(session.userId, {
          onlineStatus: 'offline',
          lastSeen: new Date()
        });
        await tokenService.removeSession(refreshToken);
      }
    }
    return { success: true, message: 'Logged out successfully' };
  },

  /**
   * Revokes all active logins for a user
   */
  async logoutFromAll(userId) {
    await tokenService.removeAllUserSessions(userId);
    await dbHelper.User.findByIdAndUpdate(userId, {
      onlineStatus: 'offline',
      lastSeen: new Date()
    });
    return { success: true, message: 'Logged out from all devices successfully' };
  }
};
