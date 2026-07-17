import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { userController } from '../server/controllers/userController.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const { User } = await import('../server/models/User.js');
    const user = await User.findOne();

    if (!user) {
      console.log('No user found in DB to mock request.');
      return;
    }

    console.log(`Mocking request for user: ${user.fullname} (${user._id})`);

    const req = {
      user: user,
      query: {
        page: 1,
        limit: 12
      }
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        console.log(`Response Status: ${this.statusCode}`);
        if (data && data.error) {
          console.error('🔴 Error returned from API:', data.error);
        } else {
          console.log('🟢 Success returned from API. Number of discover users:', data.users?.length);
        }
        return this;
      }
    };

    await userController.getDiscoverUsers(req, res, (err) => {
      if (err) console.error('Next middleware called with error:', err);
    });

  } catch (err) {
    console.error('🔴 Diagnostic Execution Crash:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
