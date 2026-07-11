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
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    public_id: { type: String },
    fileName: { type: String },
    fileSize: { type: Number }
  }],
  hashtags: [{
    type: String
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  postType: {
    type: String,
    enum: ['text', 'image', 'video', 'project', 'achievement', 'certificate', 'event', 'placement', 'internship', 'resource', 'poll'],
    default: 'text'
  },
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
  savesCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  reportsCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'reported', 'suspended'],
    default: 'active'
  },
  
  // Legacy support stubs
  isPYQ: { type: Boolean, default: false },
  companyTags: [{ type: String }],
  roleTags: [{ type: String }],
  skills: [{ type: String }],
  interviewRound: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
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

// Indexing for faster queries
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ status: 1 });

export const Post = mongoose.model('Post', postSchema);
