import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reactionType: {
    type: String,
    enum: ['like', 'heart', 'celebrate', 'insightful', 'funny'],
    default: 'like'
  }
}, {
  timestamps: true
});

likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);
