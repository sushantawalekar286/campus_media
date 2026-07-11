import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['hackathon', 'competition', 'internship', 'placement', 'certification', 'publication', 'award'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  mediaUrl: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

achievementSchema.index({ userId: 1 });

export const Achievement = mongoose.model('Achievement', achievementSchema);
