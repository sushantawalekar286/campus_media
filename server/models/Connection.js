import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  // New Consolidated Fields
  requester: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'blocked', 'cancelled'], 
    default: 'pending' 
  },
  mutualConnectionCount: {
    type: Number,
    default: 0
  },
  connectionDate: {
    type: Date
  },

  // Legacy Follow Fields (Dual mapped for zero breaks with follow controllers)
  followerId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User'
  },
  followingId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Sync legacy properties on save
connectionSchema.pre('save', function (next) {
  if (this.requester && !this.followerId) {
    this.followerId = this.requester;
  }
  if (this.recipient && !this.followingId) {
    this.followingId = this.recipient;
  }
  next();
});

// Ensure a single connection relationship record exists between two users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
connectionSchema.index({ recipient: 1, status: 1 });

export const Connection = mongoose.model('Connection', connectionSchema);
