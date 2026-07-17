import { authService } from '../services/authService.js';
import { dbHelper } from '../services/dbHelper.js';

// Helper to set cookie options
const getCookieOptions = (days = 7) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: days * 24 * 60 * 60 * 1000
  };
};

export const authController = {
  async register(req, res, next) {
    try {
      const { fullname, email, password, year } = req.body;
      const result = await authService.register(fullname, email, password, year, req);

      // Normalise user object (Mongoose doc → plain object)
      if (result.user) {
        const rawUser = result.user;
        const userObj = typeof rawUser.toObject === 'function' ? rawUser.toObject() : { ...rawUser };
        delete userObj.password;
        userObj.id = userObj.id || userObj._id?.toString() || '';
        result.user = userObj;
      }

      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req);
      
      if (result.requiresVerification) {
        return res.status(200).json(result);
      }

      // Normalise user object for frontend (handle Mongoose docs and plain objects)
      const rawUser = result.user;
      const userObj = typeof rawUser?.toObject === 'function' ? rawUser.toObject() : { ...(rawUser || {}) };
      delete userObj.password;
      userObj.id = userObj.id || userObj._id?.toString() || '';

      // Store Refresh Token in HttpOnly cookie
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, getCookieOptions(7));
      }

      return res.status(200).json({
        success: true,
        user: userObj,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        message: 'Login successful'
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyEmail(email, otp);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async resendOTP(req, res, next) {
    try {
      const { email, type } = req.body; // type: EMAIL_VERIFICATION or PASSWORD_RESET
      const result = await authService.resendOTP(email, type || 'EMAIL_VERIFICATION');
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await authService.resetPassword(email, otp, newPassword);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async refreshToken(req, res, next) {
    try {
      // Find refresh token in cookies or body
      let token = req.cookies?.refreshToken;
      if (!token && req.body.refreshToken) {
        token = req.body.refreshToken;
      }

      if (!token) {
        return res.status(401).json({ error: 'Refresh token is missing' });
      }

      const result = await authService.refresh(token, req);

      // Rotate cookies
      res.cookie('refreshToken', result.refreshToken, getCookieOptions(7));

      res.status(200).json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  },

  async logout(req, res, next) {
    try {
      let token = req.cookies?.refreshToken;
      if (!token && req.body.refreshToken) {
        token = req.body.refreshToken;
      }

      await authService.logout(token);
      
      // Clear cookie
      res.clearCookie('refreshToken', getCookieOptions(7));
      
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async me(req, res, next) {
    try {
      // req.user is set by authMiddleware (Mongoose doc or plain object)
      const rawUser = req.user;
      // toObject() converts Mongoose doc to a plain JS object; fallback to spread for plain objects
      const userObj = typeof rawUser.toObject === 'function' ? rawUser.toObject() : { ...rawUser };
      delete userObj.password;
      // Normalise id for frontend
      userObj.id = userObj.id || userObj._id?.toString() || '';
      res.status(200).json({ user: userObj });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
