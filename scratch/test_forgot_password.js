import '../server/loadEnv.js';
import mongoose from 'mongoose';
import { authService } from '../server/services/authService.js';

async function run() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/campus-media';
  try {
    await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Testing forgot password with unregistered email...');
    await authService.forgotPassword('nonexistent_email_12345@gmail.com');
    console.log('❌ Error: Expected forgot password to fail but it succeeded!');
  } catch (err) {
    console.log('✅ Succeeded as expected. Threw error:', err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}
run();
