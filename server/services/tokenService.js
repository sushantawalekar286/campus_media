import jwt from 'jsonwebtoken';
import { dbHelper } from './dbHelper.js';

// Require JWT secrets to be set via environment variables — no hardcoded fallbacks
const JWT_ACCESS_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
  process.exit(1);
}

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '15m'; // Configurable access token expiry
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Long-lived refresh token

export const tokenService = {
  generateAccessToken(user) {
    const payload = {
      userId: user._id,
      role: user.role,
      email: user.email
    };
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  },

  generateRefreshToken(user) {
    const payload = {
      userId: user._id
    };
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` });
  },

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (err) {
      return null;
    }
  },

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      return null;
    }
  },

  async createSession(userId, refreshToken, req) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Simple device parsing from headers
    const userAgent = req?.headers?.['user-agent'] || '';
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    let deviceType = 'Desktop';

    if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
    if (/tablet/i.test(userAgent)) deviceType = 'Tablet';

    if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox|iceweasel/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/msie|trident/i.test(userAgent)) browser = 'Internet Explorer';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';

    return await dbHelper.Session.create({
      userId,
      refreshToken,
      deviceInfo: { browser, os, deviceType },
      ipAddress,
      location: 'Local Network',
      expiresAt
    });
  },

  async removeSession(refreshToken) {
    return await dbHelper.Session.deleteOne({ refreshToken });
  },

  async removeAllUserSessions(userId) {
    return await dbHelper.Session.deleteMany({ userId });
  }
};
