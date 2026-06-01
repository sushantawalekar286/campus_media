import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user cannot follow the same person twice
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const Follow = mongoose.model('Follow', followSchema);
