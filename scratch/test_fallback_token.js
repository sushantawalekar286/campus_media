import jwt from 'jsonwebtoken';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
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

    const token = jwt.sign(payload, FALLBACK_SECRET, { expiresIn: '15m' });
    console.log(`Sending profile request with fallback secret token for: ${user.fullname}`);

    const res = await axios.get('http://localhost:3000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`🟢 Success! Status: ${res.status}`);
    console.log('Profile data:', res.data);

  } catch (err) {
    console.error('🔴 Failed:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

run();
