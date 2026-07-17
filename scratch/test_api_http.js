import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { tokenService } from '../server/services/tokenService.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const { User } = await import('../server/models/User.js');
    const user = await User.findOne();

    if (!user) {
      console.log('No user found in database to mock.');
      return;
    }

    const token = tokenService.generateAccessToken(user);
    console.log(`Generated Token for: ${user.fullname} (ID: ${user._id})`);
    
    // Disconnect Mongoose so it doesn't block the script
    await mongoose.disconnect();

    const url = 'http://localhost:3000/api/users/discover';
    console.log(`Sending GET request to: ${url}`);
    
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`🟢 HTTP Response Status: ${res.status}`);
    console.log('Response body keys:', Object.keys(res.data));
    console.log('Number of users returned:', res.data.users?.length);
    console.log('Page info:', {
      total: res.data.total,
      page: res.data.page,
      totalPages: res.data.totalPages
    });

  } catch (err) {
    console.error('🔴 HTTP Request Failed:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

run();
