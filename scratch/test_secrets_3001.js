import jwt from 'jsonwebtoken';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
const ENV_SECRET = process.env.JWT_SECRET || 'access_secret_key_12345';
const FALLBACK_SECRET = 'access_secret_key_12345';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const { User } = await import('../server/models/User.js');
    const user = await User.findOne();
    await mongoose.disconnect();

    if (!user) {
      console.log('No user found in DB.');
      return;
    }

    const payload = {
      userId: user._id,
      role: user.role,
      email: user.email
    };

    const tokenEnv = jwt.sign(payload, ENV_SECRET, { expiresIn: '15m' });

    console.log('--- Testing Token with ENV_SECRET on port 3001 ---');
    try {
      const res = await axios.get('http://localhost:3001/api/users/discover', {
        headers: { Authorization: `Bearer ${tokenEnv}` }
      });
      console.log('🟢 ENV_SECRET Succeeded!', res.status);
    } catch (e) {
      console.log('🔴 ENV_SECRET Failed:', e.response?.status, e.response?.data);
    }

  } catch (err) {
    console.error('Execution failed:', err.message);
  }
}

run();
