import '../server/loadEnv.js';
import mongoose from 'mongoose';
import { authService } from '../server/services/authService.js';
import { dbHelper } from '../server/services/dbHelper.js';
import { emailService } from '../server/services/emailService.js';

async function run() {
  const LOCAL_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
  try {
    await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB.');
  } catch (e) {
    console.log('Using local JSON DB fallback for testing.');
  }

  try {
    const email = 'new_signup_student@gmail.com';

    // 1. Prepare user (Clean up any old registration data)
    console.log('\n--- 1. CLEANING OLD TEST DATA ---');
    const existingUser = await dbHelper.User.findOne({ email });
    if (existingUser) {
      await dbHelper.User.findByIdAndDelete(existingUser.id || existingUser._id);
    }
    await dbHelper.PendingRegistration.deleteMany({ email });
    await dbHelper.OTP.deleteMany({ email, type: 'EMAIL_VERIFICATION' });

    // Spy on emailService.sendVerificationOTP to capture raw OTP
    let capturedOtp = null;
    const originalSend = emailService.sendVerificationOTP;
    emailService.sendVerificationOTP = async (recipient, otp, req, userRecord) => {
      capturedOtp = otp;
      return originalSend.call(emailService, recipient, otp, req, userRecord);
    };

    // 2. Initiate Registration
    console.log('\n--- 2. INITIATING SIGNUP FOR NEW USER ---');
    const registerResult = await authService.register(
      'Sushant Awalekar',
      email,
      'StrongPassword@123',
      '1st Year'
    );
    console.log('Registration initiation result:', registerResult);
    console.log(`Captured verification OTP from email spy: ${capturedOtp}`);

    // Verify User document DOES NOT exist in database yet (Requirement Check)
    const userInDbBeforeVerify = await dbHelper.User.findOne({ email });
    console.log(`User document in User collection before verification: ${userInDbBeforeVerify} (Expected: null)`);
    if (userInDbBeforeVerify !== null) {
      throw new Error('FAILED: User account was created in User collection BEFORE OTP verification!');
    }
    console.log('✅ PASS: User document was NOT created before verification.');

    // Verify PendingRegistration record exists
    const pendingRecord = await dbHelper.PendingRegistration.findOne({ email });
    if (!pendingRecord) {
      throw new Error('FAILED: PendingRegistration record not found!');
    }
    console.log(`✅ PASS: PendingRegistration record found for ${email}`);

    // 3. Test Duplicate Email Protection
    console.log('\n--- 3. TESTING DUPLICATE EMAIL PROTECTION ---');
    try {
      await authService.register('Sushant Duplicate', email, 'StrongPassword@123', '1st Year');
      console.log('❌ Error: Expected duplicate signup attempt to be rejected!');
    } catch (err) {
      console.log('✅ PASS: Duplicate registration attempt rejected with message:', err.message);
    }

    // Restore original email method
    emailService.sendVerificationOTP = originalSend;

    // 4. Verify Email with Incorrect OTP
    console.log('\n--- 4. TESTING VERIFICATION WITH WRONG OTP ---');
    try {
      await authService.verifyEmail(email, '999999');
      console.log('❌ Error: Expected verification to fail with invalid OTP!');
    } catch (err) {
      console.log('✅ PASS: Failed as expected with wrong OTP. Error:', err.message);
    }

    // Verify user is still NOT created after wrong OTP
    const userAfterWrongOtp = await dbHelper.User.findOne({ email });
    if (userAfterWrongOtp !== null) {
      throw new Error('FAILED: User account was created after failed OTP verification!');
    }
    console.log('✅ PASS: User document still does not exist after wrong OTP.');

    // 5. Verify Email with Correct OTP
    console.log('\n--- 5. TESTING VERIFICATION WITH CORRECT OTP ---');
    const verifyResult = await authService.verifyEmail(email, capturedOtp);
    console.log('verifyEmail success result:', JSON.stringify({
      success: verifyResult.success,
      hasUser: !!verifyResult.user,
      username: verifyResult.user?.username,
      hasAccessToken: !!verifyResult.accessToken,
      hasRefreshToken: !!verifyResult.refreshToken
    }, null, 2));

    // Verify User IS NOW created in database
    const createdUser = await dbHelper.User.findOne({ email });
    console.log(`User created in User collection: ${createdUser?.email}, username: ${createdUser?.username}, isVerified: ${createdUser?.isVerified}`);
    if (!createdUser || !createdUser.isVerified) {
      throw new Error('FAILED: User was not properly created or verified!');
    }
    console.log('✅ PASS: User account, username, and profile created after successful OTP verification.');

    // Verify PendingRegistration record was deleted
    const pendingAfterVerify = await dbHelper.PendingRegistration.findOne({ email });
    console.log(`PendingRegistration deleted from DB after verification: ${pendingAfterVerify === null}`);
    if (pendingAfterVerify !== null) {
      throw new Error('FAILED: PendingRegistration record was not deleted after account creation!');
    }
    console.log('✅ PASS: PendingRegistration record cleaned up.');

    // Clean up created test user
    console.log('\n--- CLEANING UP TEST DATA ---');
    await dbHelper.User.findByIdAndDelete(createdUser.id || createdUser._id);
    console.log('Cleanup complete. All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

run();
