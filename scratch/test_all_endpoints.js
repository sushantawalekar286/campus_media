import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

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

    const { tokenService } = await import('../server/services/tokenService.js');
    const token = tokenService.generateAccessToken(user);
    console.log(`Testing endpoints for user: ${user.fullname} (${user.username})`);

    const endpoints = [
      '/api/users/profile',
      '/api/users/discover',
      '/api/users/suggestions',
      '/api/users/connections/incoming',
      '/api/users/connections/sent',
      '/api/users/connections/list'
    ];

    for (const ep of endpoints) {
      console.log(`\n--- Hitting ${ep} ---`);
      try {
        const res = await axios.get(`http://localhost:3000${ep}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`🟢 Status: ${res.status}`);
        console.log('Response Keys:', Object.keys(res.data));
        if (Array.isArray(res.data)) {
          console.log(`Length: ${res.data.length}`);
        } else if (res.data.users) {
          console.log(`Users count: ${res.data.users.length}`);
        }
      } catch (e) {
        console.log(`🔴 Failed: ${e.response?.status}`);
        console.log('Response:', e.response?.data);
      }
    }

  } catch (err) {
    console.error('Execution failed:', err.message);
  }
}

run();
