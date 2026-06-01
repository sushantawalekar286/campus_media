import { tokenService } from '../services/tokenService.js';
import { dbHelper } from '../services/dbHelper.js';
import mongoose from 'mongoose';

export const authMiddleware = async (req, res, next) => {
  try {
    let token = '';

    // Check Authorization Header
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }

    // Check Cookie if header not found
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = tokenService.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }

    const userId = decoded.userId || decoded.id; // Fallback for old tokens

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id format' });
    }

    // Load User
    const user = await dbHelper.User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }

    // Attach to request
    req.user = user;
    req.token = token;

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(401).json({ error: 'Authentication failed.' });
  }
};
