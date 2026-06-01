import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.Mixed, 
    ref: 'User', 
    required: true 
  },
  refreshToken: { 
    type: String, 
    required: true,
    unique: true 
  },
  deviceInfo: {
    browser: String,
    os: String,
    deviceType: String
  },
  ipAddress: { type: String, default: '' },
  location: { type: String, default: '' },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

// Automatically clean up expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
