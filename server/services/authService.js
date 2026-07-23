import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { dbHelper } from './dbHelper.js';
import { tokenService } from './tokenService.js';
import { emailService } from './emailService.js';
import { generateOTP } from '../utils/generateOTP.js';

// Maximum number of OTP verification attempts before lockout
const MAX_OTP_ATTEMPTS = 5;

export const authService = {
  /**
   * Helper method to generate a unique username (Task 7)
   */
  async generateUniqueUsername(fullname, email) {
    let base = (fullname || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    if (!base || base.length < 3) {
      base = 'student' + Math.floor(1000 + Math.random() * 9000);
    }

    let candidate = base;
    let counter = 1;
    while (await dbHelper.User.findOne({ username: candidate })) {
      if (counter === 1) {
        const rand = Math.floor(100 + Math.random() * 900);
        candidate = `${base}${rand}`;
      } else if (counter === 2) {
        candidate = `${base}_${new Date().getFullYear()}`;
      } else {
        candidate = `${base}_${counter}_${Math.floor(100 + Math.random() * 900)}`;
      }
      counter++;
    }
    return candidate;
  },

  /**
   * Internal Helper: Creates User account, Student Profile, Settings, and JWT session
   * ONLY after OTP verification succeeds (Task 4, Task 5, Task 8)
   */
  async _createAccountFromPending(pendingRecord, req = null) {
    const trimmedEmail = pendingRecord.email.trim().toLowerCase();

    // Double-check if user was already created
    const existingUser = await dbHelper.User.findOne({ email: trimmedEmail });
    if (existingUser) {
      await dbHelper.PendingRegistration.deleteMany({ email: trimmedEmail });
      throw new Error('Email is already registered.');
    }

    const ADMIN_EMAILS = [
      "pruthviraj2005patil@gmail.com",
      "sushantawalekar286@gmail.com"
    ];
    const determinedRole = ADMIN_EMAILS.includes(trimmedEmail) ? 'ADMIN' : 'USER';

    // Task 7: Generate unique username
    const username = await this.generateUniqueUsername(pendingRecord.fullname, trimmedEmail);

    // Task 8 & Task 4: Create User document with complete student profile & default settings
    let user;
    try {
      user = await dbHelper.User.create({
        fullname: pendingRecord.fullname,
        name: pendingRecord.fullname,
        username,
        email: trimmedEmail,
        password: pendingRecord.password, // pre-hashed in PendingRegistration
        role: determinedRole,
        year: pendingRecord.year || '1st Year',
        isVerified: true,
        status: 'ACTIVE',

        // Student Profile Default Data (Task 8 - no dummy data)
        bio: '',
        phone: '',
        profilePicture: '',
        coverPicture: '',
        headline: '',
        location: '',
        website: '',
        skills: [],
        programmingLanguages: [],
        certificates: [],
        followersCount: 0,
        followingCount: 0,
        connectionCount: 0,
        postsCount: 0,
        achievementCount: 0,
        projectCount: 0,

        // Settings (Task 4)
        privacySettings: {
          profileVisibility: 'public',
          hideFollowers: false,
          hideFollowing: false,
          hideAchievements: false,
          hideProjects: false,
          hideResumeScore: false,
          hideInterviewScore: false,
          showSkills: true,
          showEducation: true
        },
        notificationSettings: {
          emailAlerts: true,
          pushAlerts: true
        },
        aiProfile: {
          skills: [],
          programmingLanguages: [],
          projects: [],
          achievements: [],
          experience: []
        }
      });
      console.log(`[DEBUG] Account Creation: User Document Created in DB (ID: ${user.id || user._id}, Username: ${username})`);
      console.log(`[DEBUG] Student Profile Created: Fullname="${user.fullname}", Username="${username}", Email="${trimmedEmail}", Public Account=true`);
    } catch (err) {
      console.error('[DEBUG] Account Creation failed:', err.message);
      throw new Error(`Failed to create user account: ${err.message}`);
    }

    // Task 5: Transaction Safety — generate JWT & session, rollback User if session creation fails
    try {
      const accessToken = tokenService.generateAccessToken(user);
      const refreshToken = tokenService.generateRefreshToken(user);
      await tokenService.createSession(user.id || user._id, refreshToken, req);

      console.log(`[DEBUG] JWT Generated: AccessToken issued, RefreshToken session created for User ID=${user.id || user._id}`);

      // Task 4: Delete pending registration record only AFTER account & tokens succeed
      await dbHelper.PendingRegistration.deleteMany({ email: trimmedEmail });
      console.log(`[DEBUG] Pending Registration Deleted for Email=${trimmedEmail}`);

      // Send welcome email asynchronously
      emailService.sendWelcomeEmail(trimmedEmail, user.fullname || user.name).catch(err => {
        console.error('Failed to send welcome email:', err);
      });

      const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
      delete userObj.password;
      delete userObj.toObject;
      userObj.id = userObj.id || userObj._id?.toString() || '';

      return {
        success: true,
        user: userObj,
        accessToken,
        refreshToken,
        message: 'Account created and email verified successfully!'
      };
    } catch (err) {
      console.error('[DEBUG] Session / Token Generation failed. Rolling back User creation:', err.message);
      await dbHelper.User.findByIdAndDelete(user.id || user._id);
      throw new Error(`Account setup failed during token generation: ${err.message}`);
    }
  },

  /**
   * Registers user details into PendingRegistration collection (Task 1 & Task 2).
   * User document is NOT created at this stage.
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

    console.log(`[DEBUG] Signup Request: Email=${trimmedEmail}, Full Name=${fullname}`);

    // Task 6: Check Duplicate Email in User Collection
    const existingUser = await dbHelper.User.findOne({ email: trimmedEmail });
    if (existingUser) {
      throw new Error('Email is already registered. Please sign in instead.');
    }

    // Task 6: Check PendingRegistration Collection
    const existingPending = await dbHelper.PendingRegistration.findOne({ email: trimmedEmail });
    if (existingPending) {
      if (new Date(existingPending.expiresAt) > new Date()) {
        console.log(`[DEBUG] Registration attempt for pending email=${trimmedEmail}. Verification is pending.`);
        throw new Error('Email verification pending. A code was already sent to your email.');
      } else {
        // Clean up expired pending record
        await dbHelper.PendingRegistration.deleteMany({ email: trimmedEmail });
      }
    }

    // Task 1: Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const otpEnabled = process.env.OTP_ENABLED !== 'false';
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute expiry (Task 10)

    console.log(`[DEBUG] OTP Generated=${otp}, ExpiresAt=${expiresAt.toISOString()}`);

    // Task 1: Store OTP in Temporary Registration Collection (PendingRegistration)
    await dbHelper.PendingRegistration.deleteMany({ email: trimmedEmail });
    const pendingRecord = await dbHelper.PendingRegistration.create({
      fullname: fullname.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      year: year || '1st Year',
      otp, // gets hashed by model pre-save hook or dbHelper
      expiresAt,
      attempts: 0
    });

    console.log(`[DEBUG] Pending Registration Saved: Email=${trimmedEmail}, Collection=PendingRegistration`);

    if (!otpEnabled) {
      console.log("OTP Disabled - Development Mode");
      return await this._createAccountFromPending(pendingRecord, req);
    }

    // Task 2: Dispatch verification email
    try {
      await emailService.sendVerificationOTP(trimmedEmail, otp, req, { fullname });
      console.log(`[DEBUG] Email Sent: Recipient=${trimmedEmail}`);
    } catch (err) {
      console.error(`[DEBUG] Failed to send verification email. Rolling back PendingRegistration for ${trimmedEmail}:`, err.message);
      // Rollback Task 2: Do not leave unverified pending record if email dispatch fails
      await dbHelper.PendingRegistration.deleteMany({ email: trimmedEmail });
      throw new Error(`Registration failed: Could not send verification email. Details: ${err.message}`);
    }

    return {
      email: trimmedEmail,
      requiresVerification: true,
      message: 'Registration initiated! A 6-digit confirmation code was sent to your email.'
    };
  },

  /**
   * Logs in a user. If email is unverified (in PendingRegistration), returns informative error.
   */
  async login(email, password, req) {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Find user in User collection
    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      // Check if email is waiting for OTP verification in PendingRegistration
      const pending = await dbHelper.PendingRegistration.findOne({ email: trimmedEmail });
      if (pending) {
        throw new Error('Email verification pending. Please check your inbox for the OTP code to complete registration.');
      }
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

    // 4. Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);

    // 5. Create Active Session
    await tokenService.createSession(user.id || user._id, refreshToken, req);

    // 6. Update User status
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
   * Verifies account email using OTP (calls verifyOTP)
   */
  async verifyEmail(email, otp, req = null) {
    return this.verifyOTP(email, otp, 'EMAIL_VERIFICATION', req);
  },

  /**
   * Task 3: Verify OTP against PendingRegistration (for EMAIL_VERIFICATION) or OTP model (for PASSWORD_RESET)
   */
  async verifyOTP(email, otp, type = 'EMAIL_VERIFICATION', req = null) {
    const trimmedEmail = email.trim().toLowerCase();
    const otpEnabled = process.env.OTP_ENABLED !== 'false';

    console.log(`[DEBUG] Verification Requested: Email=${trimmedEmail}, Entered OTP=${otp}, Type=${type}`);

    // PASSWORD_RESET verification flow
    if (type === 'PASSWORD_RESET') {
      const user = await dbHelper.User.findOne({ email: trimmedEmail });
      if (!user) {
        throw new Error('User not found');
      }

      if (!otpEnabled) {
        const resetToken = jwt.sign(
          { email: trimmedEmail, purpose: 'password_reset', passwordHash: user.password },
          process.env.JWT_SECRET,
          { expiresIn: '5m' }
        );
        return { success: true, message: 'OTP verified successfully.', resetToken };
      }

      const records = await dbHelper.OTP.find({ email: trimmedEmail, type: 'PASSWORD_RESET' });
      if (!records || records.length === 0) {
        throw new Error('Invalid or expired OTP code.');
      }
      const latestRecord = records[records.length - 1];
      if (latestRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await dbHelper.OTP.deleteMany({ email: trimmedEmail, type: 'PASSWORD_RESET' });
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
      }

      let verifiedRecord = null;
      for (const record of records) {
        const isMatch = await record.compareOTP(otp);
        if (isMatch) {
          if (new Date(record.expiresAt) < new Date()) {
            await dbHelper.OTP.deleteOne({ _id: record._id });
            throw new Error('OTP code has expired.');
          }
          verifiedRecord = record;
          break;
        }
      }

      if (!verifiedRecord) {
        await dbHelper.OTP.findByIdAndUpdate(latestRecord._id, { $inc: { attempts: 1 } });
        throw new Error('Invalid OTP code.');
      }

      const resetToken = jwt.sign(
        { email: trimmedEmail, purpose: 'password_reset', passwordHash: user.password },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      await dbHelper.OTP.deleteMany({ email: trimmedEmail, type: 'PASSWORD_RESET' });
      console.log(`[DEBUG] Verification Result: Password Reset OTP Verified for Email=${trimmedEmail}`);
      return { success: true, message: 'OTP verified successfully.', resetToken };
    }

    if (type !== 'EMAIL_VERIFICATION') {
      throw new Error('Invalid OTP type');
    }

    // EMAIL_VERIFICATION flow using PendingRegistration collection
    const pendingRecord = await dbHelper.PendingRegistration.findOne({ email: trimmedEmail });
    if (!pendingRecord) {
      console.warn(`[DEBUG] Verification Result: No Pending Registration found for Email=${trimmedEmail}`);
      const existingUser = await dbHelper.User.findOne({ email: trimmedEmail });
      if (existingUser) {
        throw new Error('This email is already registered and verified. Please log in.');
      }
      throw new Error('No pending registration found or verification code has expired. Please sign up again.');
    }

    // Task 3 & Task 10: Check attempt limit
    if ((pendingRecord.attempts || 0) >= MAX_OTP_ATTEMPTS) {
      await dbHelper.PendingRegistration.deleteMany({ email: trimmedEmail });
      console.warn(`[DEBUG] Verification Result: Max attempts exceeded for Email=${trimmedEmail}`);
      throw new Error('Maximum verification attempts exceeded. Please sign up again.');
    }

    // Task 3 & Task 10: Check OTP expiry
    if (new Date(pendingRecord.expiresAt) < new Date()) {
      await dbHelper.PendingRegistration.deleteMany({ email: trimmedEmail });
      console.warn(`[DEBUG] Verification Result: OTP expired at ${pendingRecord.expiresAt} for Email=${trimmedEmail}`);
      throw new Error('Verification code has expired. Please request a new code or sign up again.');
    }

    // Task 3: Check OTP match
    const isMatch = await pendingRecord.compareOTP(otp);
    if (!isMatch) {
      await dbHelper.PendingRegistration.findByIdAndUpdate(pendingRecord._id || pendingRecord.id, {
        $inc: { attempts: 1 }
      });
      console.warn(`[DEBUG] Verification Result: Invalid OTP entered for Email=${trimmedEmail}`);
      throw new Error('Invalid verification code. Please check and try again.');
    }

    console.log(`[DEBUG] Verification Result: OTP Match Valid for Email=${trimmedEmail}`);

    // Task 4: Create User, Student Profile, Settings, and JWT session ONLY after OTP is valid
    return await this._createAccountFromPending(pendingRecord, req);
  },

  /**
   * Resends verification or password reset OTP.
   */
  async resendOTP(email, type = 'EMAIL_VERIFICATION') {
    const trimmedEmail = email.trim().toLowerCase();

    if (type === 'PASSWORD_RESET') {
      return this.forgotPassword(trimmedEmail);
    }

    // EMAIL_VERIFICATION
    const pendingRecord = await dbHelper.PendingRegistration.findOne({ email: trimmedEmail });
    if (!pendingRecord) {
      const existingUser = await dbHelper.User.findOne({ email: trimmedEmail });
      if (existingUser) {
        throw new Error('Email is already registered and verified.');
      }
      throw new Error('No pending registration found for this email. Please sign up first.');
    }

    // Rate limit: enforce 30-second cooldown
    if (pendingRecord.updatedAt || pendingRecord.createdAt) {
      const lastTime = new Date(pendingRecord.updatedAt || pendingRecord.createdAt).getTime();
      if (Date.now() - lastTime < 30 * 1000) {
        throw new Error('Please wait at least 30 seconds before requesting another code.');
      }
    }

    const otpEnabled = process.env.OTP_ENABLED !== 'false';
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    await dbHelper.PendingRegistration.findByIdAndUpdate(pendingRecord._id || pendingRecord.id, {
      otp: hashedOtp,
      expiresAt,
      attempts: 0,
      updatedAt: new Date()
    });

    console.log(`[DEBUG] Resend OTP: Email=${trimmedEmail}, New OTP=${otp}`);

    if (otpEnabled) {
      await emailService.sendVerificationOTP(trimmedEmail, otp, null, { fullname: pendingRecord.fullname });
    }

    return { success: true, message: 'A new verification code has been dispatched to your email.' };
  },

  /**
   * Handles forgot password requests
   */
  async forgotPassword(email) {
    const trimmedEmail = email.trim().toLowerCase();

    // Verify account exists
    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      throw new Error('Email address is not registered.');
    }

    const otpEnabled = process.env.OTP_ENABLED !== 'false';
    if (!otpEnabled) {
      return { success: true, message: 'If the email exists, a password reset code has been sent.' };
    }

    // Rate limit: enforce 30-second cooldown
    const records = await dbHelper.OTP.find({ email: trimmedEmail, type: 'PASSWORD_RESET' });
    const latestRecord = records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
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

    await emailService.sendPasswordResetOTP(trimmedEmail, otp, null, user);

    return { success: true, message: 'A password reset code has been sent.' };
  },

  /**
   * Resets password using resetToken
   */
  async resetPassword(email, resetToken, newPassword) {
    const trimmedEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    console.log(`[DEBUG] Reset Password requested: Email=${trimmedEmail}`);

    const otpEnabled = process.env.OTP_ENABLED !== 'false';
    if (!otpEnabled) {
      const user = await dbHelper.User.findOne({ email: trimmedEmail });
      if (!user) {
        throw new Error('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await dbHelper.User.findByIdAndUpdate(user.id || user._id, { password: hashedPassword });
      console.log(`[DEBUG] Password reset success (OTP Disabled) for email=${trimmedEmail}`);
      return { success: true, message: 'Password has been reset successfully.' };
    }

    // Validate resetToken
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      console.warn(`[DEBUG] Password reset failed: Invalid or expired resetToken for email=${trimmedEmail}`);
      throw new Error('Reset token is invalid or expired.');
    }

    if (decoded.email !== trimmedEmail || decoded.purpose !== 'password_reset') {
      console.warn(`[DEBUG] Password reset failed: Token payload mismatch for email=${trimmedEmail}`);
      throw new Error('Reset token is invalid.');
    }

    const user = await dbHelper.User.findOne({ email: trimmedEmail });
    if (!user) {
      throw new Error('User not found');
    }

    if (decoded.passwordHash !== user.password) {
      console.warn(`[DEBUG] Password reset failed: Token already used/invalidated for email=${trimmedEmail}`);
      throw new Error('Reset token has already been used.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbHelper.User.findByIdAndUpdate(user.id || user._id, { password: hashedPassword });

    emailService.sendPasswordResetSuccess(trimmedEmail, user.fullname || user.name).catch(err => {
      console.error('Failed to send password reset success email:', err);
    });

    console.log(`[DEBUG] Password reset success (resetToken verified) for email=${trimmedEmail}`);
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
