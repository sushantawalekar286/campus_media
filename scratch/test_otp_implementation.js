import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dbHelper } from '../server/services/dbHelper.js';
import generateOTP from '../server/utils/generateOTP.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  console.log('Connecting to:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 1000 });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.log('⚠️ MongoDB connection failed, proceeding with local fallback:', err.message);
  }

  try {
    // 1. Create a test OTP record
    const email = 'test_otp_user@example.com';
    const rawOtp = generateOTP(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    console.log('Creating test OTP record...');
    const record = await dbHelper.OTP.create({
      email,
      otp: rawOtp,
      type: 'EMAIL_VERIFICATION',
      expiresAt
    });

    console.log('Created OTP record:', record);

    // 2. Test findByIdAndUpdate to increment attempts
    console.log('Testing findByIdAndUpdate to increment attempts...');
    const updated = await dbHelper.OTP.findByIdAndUpdate(record.id || record._id, { $inc: { attempts: 1 } });
    console.log('Updated OTP record:', updated);

    if (updated && updated.attempts === 1) {
      console.log('✅ OTP findByIdAndUpdate successfully updated and incremented attempts!');
    } else {
      console.error('❌ Failed: attempts increment did not match expected value of 1. Record:', updated);
    }

    // Clean up
    console.log('Cleaning up...');
    await dbHelper.OTP.deleteMany({ email });
    console.log('Cleanup complete.');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log('Disconnected.');
  }
}

run();
