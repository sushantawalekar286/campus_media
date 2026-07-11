import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // --- AUTHENTICATION & CORE ---
  fullname: { type: String, required: true },
  name: { type: String, required: true }, // Duplicate for compatibility with legacy systems
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['USER', 'ADMIN'], 
    default: 'USER' 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'BLOCKED'], 
    default: 'PENDING' 
  },
  isVerified: { type: Boolean, default: false },

  // --- PERSONAL INFORMATION ---
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  coverPicture: { type: String, default: '' },
  headline: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },

  // --- ACADEMIC INFORMATION ---
  department: { type: String, default: '' },
  course: { type: String, default: '' },
  semester: { type: String, default: '' },
  year: { type: String, default: '1st Year' },
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    startYear: String,
    endYear: String
  }],

  // --- PROFESSIONAL INFORMATION ---
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  codingProfiles: {
    leetcode: { type: String, default: '' },
    hackerrank: { type: String, default: '' },
    codechef: { type: String, default: '' },
    codeforces: { type: String, default: '' }
  },

  // --- SKILLS, LANGUAGES & CERTIFICATES ---
  skills: [{ type: String }],
  programmingLanguages: [{ type: String }],
  certificates: [{
    title: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: Date },
    credentialUrl: { type: String, default: '' },
    credentialId: { type: String, default: '' }
  }],

  // --- SOCIAL STATISTICS ---
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  connectionCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  achievementCount: { type: Number, default: 0 },
  projectCount: { type: Number, default: 0 },

  // --- AI FEATURE HISTORIES & STATS ---
  resumeScore: { type: Number, default: 0 },
  interviewScore: { type: Number, default: 0 },
  roadmapProgress: { type: Number, default: 0 }, // percentage completion 0-100
  
  // Legacy history fields (kept to prevent any queries or methods from throwing warnings)
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

  // --- SOCIAL LINKS (Legacy support wrapper) ---
  socialLinks: {
    website: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },

  // --- SETTINGS & PRIVACY ---
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
    hideFollowers: { type: Boolean, default: false },
    hideFollowing: { type: Boolean, default: false },
    hideAchievements: { type: Boolean, default: false },
    hideProjects: { type: Boolean, default: false },
    hideResumeScore: { type: Boolean, default: false },
    hideInterviewScore: { type: Boolean, default: false },
    showSkills: { type: Boolean, default: true },
    showEducation: { type: Boolean, default: true }
  },
  notificationSettings: {
    emailAlerts: { type: Boolean, default: true },
    pushAlerts: { type: Boolean, default: true }
  },

  // --- STATUS TRACKING ---
  onlineStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  joinedDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
