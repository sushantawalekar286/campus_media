import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pendingRegistrationSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      default: '1st Year',
    },
    otp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash OTP before saving
pendingRegistrationSchema.pre('save', async function () {
  if (!this.isModified('otp')) return;
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
});

// Instance method to compare OTP
pendingRegistrationSchema.methods.compareOTP = async function (enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.otp);
};

// Automatic expiration index (TTL)
pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);
export default PendingRegistration;
