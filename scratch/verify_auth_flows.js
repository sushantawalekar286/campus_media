import '../server/loadEnv.js';
import mongoose from 'mongoose';
import { authService } from '../server/services/authService.js';
import { dbHelper } from '../server/services/dbHelper.js';
import { emailService } from '../server/services/emailService.js';

async function runTests() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/campus-media';
  try {
    console.log('Connecting to database...');
    await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('✅ Connected to database.');

    const email = 'verification-test@example.com';
    const fullname = 'Test Verification User';
    const password = 'Password@123';

    // Cleanup previous runs
    await dbHelper.User.deleteOne({ email });
    await dbHelper.OTP.deleteMany({ email });

    console.log('\n--- Scenario 1: Normal Registration Flow ---');
    process.env.OTP_ENABLED = 'true';

    console.log('Registering user...');
    const regResult = await authService.register(fullname, email, password, '1st Year');
    console.log('✅ Registration returned:', regResult.message);
    
    // Check if user and OTP were created in DB
    const createdUser = await dbHelper.User.findOne({ email });
    const createdOTP = await dbHelper.OTP.findOne({ email });
    console.log(`User exists in DB: ${!!createdUser} (Expected: true)`);
    console.log(`OTP exists in DB: ${!!createdOTP} (Expected: true)`);

    // Clean up
    await dbHelper.User.deleteOne({ email });
    await dbHelper.OTP.deleteMany({ email });

    console.log('\n--- Scenario 2: SMTP Failure Rollback Flow ---');
    // Mock sendEmail to throw error simulating SMTP authentication failure
    const originalSendEmail = emailService.sendEmail;
    emailService.sendEmail = async () => {
      throw new Error('SMTP authentication failed: Gmail App Password invalid (Simulated for rollback test)');
    };

    try {
      console.log('Attempting to register user with failing SMTP...');
      await authService.register(fullname, email, password, '1st Year');
      console.log('❌ Error: Registration succeeded but should have failed!');
    } catch (err) {
      console.log('✅ Registration failed as expected with error:', err.message);
      
      // Verify database rollback
      const rolledBackUser = await dbHelper.User.findOne({ email });
      const rolledBackOTP = await dbHelper.OTP.findOne({ email });
      console.log(`User exists in DB: ${!!rolledBackUser} (Expected: false)`);
      console.log(`OTP exists in DB: ${!!rolledBackOTP} (Expected: false)`);
    }

    // Restore original sendEmail
    emailService.sendEmail = originalSendEmail;

  } catch (err) {
    console.error('❌ Test execution failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
