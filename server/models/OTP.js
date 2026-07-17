import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    email: {
      type: String,
      required: true,
    },

    otp: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["VERIFY_EMAIL", "RESET_PASSWORD", "EMAIL_VERIFICATION", "PASSWORD_RESET"],
      default: "VERIFY_EMAIL",
    },

    verified: {
      type: Boolean,
      default: false,
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


// HASH OTP BEFORE SAVE
otpSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();

  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);

  next();
});


// COMPARE OTP METHOD
otpSchema.methods.compareOTP = async function (enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.otp);
};


// AUTO DELETE EXPIRED OTP
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
