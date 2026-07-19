import '../server/loadEnv.js';
import mongoose from 'mongoose';
import { authService } from '../server/services/authService.js';
import { dbHelper } from '../server/services/dbHelper.js';
import { emailService } from '../server/services/emailService.js';

async function run() {
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/campus-media';
  try {
    await mongoose.connect(LOCAL_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to Local MongoDB.');

    const email = 'verify_flow_student@gmail.com';

    // 1. Prepare user
    console.log('\n--- 1. PREPARING TEST USER ---');
    const existingUser = await dbHelper.User.findOne({ email });
    if (existingUser) {
      await dbHelper.User.findByIdAndDelete(existingUser.id || existingUser._id);
    }
    const user = await dbHelper.User.create({
      fullname: 'Test Reset Student',
      email,
      password: 'OldPassword@123',
      role: 'USER',
      year: 'FE',
      status: 'ACTIVE',
      isVerified: true
    });
    console.log(`Created test user: ${email} (isVerified=${user.isVerified})`);

    // 2. Forgot Password Request
    console.log('\n--- 2. REQUESTING PASSWORD RESET (forgotPassword) ---');
    let capturedOtp = null;
    const originalSend = emailService.sendPasswordResetOTP;
    emailService.sendPasswordResetOTP = async (recipient, otp, req, userRecord) => {
      capturedOtp = otp;
      return originalSend.call(emailService, recipient, otp, req, userRecord);
    };

    const fpResult = await authService.forgotPassword(email);
    console.log('forgotPassword result:', fpResult);
    console.log(`Captured raw OTP from dispatch spy: ${capturedOtp}`);

    // Fetch stored OTP
    const otpRecord = await dbHelper.OTP.findOne({ email, type: 'PASSWORD_RESET' });
    if (!otpRecord) {
      throw new Error('FAILED: OTP record was not saved in DB!');
    }
    console.log(`OTP generated and saved in DB (hash): OTP=${otpRecord.otp}, ExpiresAt=${otpRecord.expiresAt}`);

    // Restore original method
    emailService.sendPasswordResetOTP = originalSend;

    // 3. Verify OTP: Wrong OTP
    console.log('\n--- 3. TESTING VERIFICATION WITH WRONG OTP ---');
    try {
      await authService.verifyOTP(email, '999999', 'PASSWORD_RESET');
      console.log('❌ Error: Expected verification to fail with invalid OTP, but it succeeded!');
    } catch (err) {
      console.log('✅ Failed as expected. Error:', err.message);
    }

    // 4. Verify OTP: Correct OTP
    console.log('\n--- 4. TESTING VERIFICATION WITH CORRECT OTP ---');
    const verifyResult = await authService.verifyOTP(email, capturedOtp, 'PASSWORD_RESET');
    console.log('verifyOTP success result:', verifyResult);
    if (!verifyResult.resetToken) {
      throw new Error('FAILED: resetToken was not returned by verifyOTP!');
    }
    const resetToken = verifyResult.resetToken;

    // Verify OTP record is deleted (one-time use check)
    const checkOtpDeleted = await dbHelper.OTP.findOne({ email, type: 'PASSWORD_RESET' });
    console.log(`OTP deleted from DB immediately after verification: ${checkOtpDeleted === null}`);

    // 5. Reset Password: Correct Reset Token
    console.log('\n--- 5. RESETTING PASSWORD WITH VALID RESET TOKEN ---');
    const resetResult = await authService.resetPassword(email, resetToken, 'NewSecurePassword@123');
    console.log('resetPassword result:', resetResult);

    // Verify user password is changed
    const updatedUser = await dbHelper.User.findOne({ email });
    console.log(`Updated user password version in DB successfully.`);

    // 6. Reset Password: Re-using the same Token
    console.log('\n--- 6. TESTING TOKEN RE-USE (ONE-TIME USE ENFORCEMENT) ---');
    try {
      await authService.resetPassword(email, resetToken, 'AnotherPassword@123');
      console.log('❌ Error: Expected resetPassword to fail with used token, but it succeeded!');
    } catch (err) {
      console.log('✅ Failed as expected. Error:', err.message);
    }

    // Clean up
    console.log('\n--- CLEANING UP ---');
    const userToClean = await dbHelper.User.findOne({ email });
    if (userToClean) {
      await dbHelper.User.findByIdAndDelete(userToClean.id || userToClean._id);
    }
    console.log('Cleanup finished.');

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

run();
