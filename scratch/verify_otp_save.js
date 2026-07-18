import '../server/loadEnv.js';
import mongoose from 'mongoose';
import OTP from '../server/models/OTP.js';

async function test() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
  try {
    console.log('Connecting to database...');
    // Connect to local database for verification
    const LOCAL_URI = 'mongodb://127.0.0.1:27017/campus-media';
    await mongoose.connect(LOCAL_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('✅ Connected to Database.');

    await OTP.deleteMany({ email: 'test@example.com' });

    console.log('Attempting to create OTP...');
    const otp = await OTP.create({
      email: 'test@example.com',
      otp: '123456',
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 5*60*1000)
    });

    console.log('✅ OTP Created successfully! Hashed OTP:', otp.otp);

    // Clean up
    await OTP.deleteMany({ email: 'test@example.com' });
    console.log('✅ Cleaned up test OTP document.');

  } catch (err) {
    console.error('❌ Error during verification:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}
test();
