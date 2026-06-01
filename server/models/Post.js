import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    trim: true,
    default: ''
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video'] },
    public_id: String
  }],
  hashtags: [{
    type: String
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  },
  postType: {
    type: String,
    enum: ['standard', 'achievement', 'roadmap', 'interview', 'pyq'],
    default: 'standard'
  },
  isPYQ: {
    type: Boolean,
    default: false
  },
  companyTags: [{
    type: String
  }],
  roleTags: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  interviewRound: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  },
  recommendationData: {
    score: Number,
    relevanceTags: [String]
  },
  aiData: {
    score: Number,
    role: String,
    feedback: String
  }
}, {
  timestamps: true
});

// Indexing for faster feed queries
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });

export const Post = mongoose.model('Post', postSchema);
