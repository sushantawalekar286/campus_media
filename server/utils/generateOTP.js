import crypto from 'crypto';

/**
 * Generates a cryptographically secure numeric OTP of specified length.
 * Uses Node's CSPRNG (crypto.randomInt) to prevent predictability.
 * @param {number} length - Length of the OTP (default 6)
 * @returns {string}
 */
export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
};

export default generateOTP;
