import '../server/loadEnv.js';
import mongoose from 'mongoose';
import { authService } from '../server/services/authService.js';
import { dbHelper } from '../server/services/dbHelper.js';

async function run() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/campus-media';
  try {
    console.log('Connecting to database...');
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to Cloud Database.');
    } catch (dbErr) {
      console.log('⚠️ Cloud DB connection failed, falling back to local database...');
      await mongoose.disconnect();
      await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to Local Database.');
    }

    const email = 'student_test@gmail.com';
    const fullname = 'Student Test User';
    const password = 'Password@123';

    // Clean up previous test runs
    const existing = await dbHelper.User.findOne({ email });
    if (existing) {
      await dbHelper.User.findByIdAndDelete(existing.id || existing._id);
    }
    await dbHelper.OTP.deleteMany({ email });

    console.log(`\nRegistering user ${email} with OTP enabled...`);
    process.env.OTP_ENABLED = 'true';

    try {
      const result = await authService.register(fullname, email, password, '1st Year');
      console.log('Registration Result:', result);
      
      // Let's verify OTP in DB
      const otpRecord = await dbHelper.OTP.findOne({ email });
      console.log('OTP Record in DB:', otpRecord);

      // Clean up newly created user
      if (result.user && result.user.id) {
        await dbHelper.User.findByIdAndDelete(result.user.id);
      }
    } catch (err) {
      console.error('❌ Registration failed:', err);
    }

    await dbHelper.OTP.deleteMany({ email });

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('Database disconnected.');
  }
}

run();
