import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  coverPicture: { type: String, default: '' },
  headline: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['USER', 'ADMIN'], 
    default: 'USER' 
  },
  isVerified: { type: Boolean, default: false },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  skills: [{ type: String }],
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    startYear: String,
    endYear: String
  }],
  achievements: [{ type: String }],
  projects: [{
    title: String,
    description: String,
    link: String
  }],
  resumeHistory: [{
    score: Number,
    analyzedAt: { type: Date, default: Date.now },
    feedback: String
  }],
  aiInterviewHistory: [{
    role: String,
    score: Number,
    feedback: String,
    takenAt: { type: Date, default: Date.now }
  }],
  roadmapHistory: [{
    role: String,
    generatedAt: { type: Date, default: Date.now }
  }],
  socialLinks: {
    website: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
    showSkills: { type: Boolean, default: true },
    showEducation: { type: Boolean, default: true }
  },
  notificationSettings: {
    emailAlerts: { type: Boolean, default: true },
    pushAlerts: { type: Boolean, default: true }
  },
  onlineStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'BLOCKED'], 
    default: 'ACTIVE' 
  },
  year: { type: String, default: '1st Year' },
  joinedDate: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
