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
  phone: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  coverPicture: { type: String, default: '' },
  headline: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },

  // --- ACADEMIC INFORMATION ---
  college: { type: String, default: '' },
  department: { type: String, default: '' },
  course: { type: String, default: '' },
  semester: { type: String, default: '' },
  year: { type: String, default: '1st Year' },
  cgpa: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  education: [{
    school: String,
    degree: String,
    fieldOfStudy: String,
    startYear: String,
    endYear: String
  }],

  // --- PROFESSIONAL INFORMATION ---
  careerObjective: { type: String, default: '' },
  careerGoal: { type: String, default: '' },
  interestedDomains: [{ type: String }],
  preferredRoles: [{ type: String }],
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  codingProfiles: {
    leetcode: { type: String, default: '' },
    hackerrank: { type: String, default: '' },
    codechef: { type: String, default: '' },
    codeforces: { type: String, default: '' },
    geeksforgeeks: { type: String, default: '' }
  },
  experience: [{
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    duration: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: String, enum: ['internship', 'volunteer', 'leadership', 'training', 'freelance', 'opensource', 'work'], default: 'work' }
  }],
  frameworks: [{ type: String }],
  libraries: [{ type: String }],
  databases: [{ type: String }],
  cloudPlatforms: [{ type: String }],
  devopsTools: [{ type: String }],
  versionControl: [{ type: String }],
  developmentTools: [{ type: String }],
  testingTools: [{ type: String }],
  aiMlTechnologies: [{ type: String }],
  softSkills: [{ type: String }],

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

  // --- CENTRALIZED STUDENT AI PROFILE ---
  aiProfile: {
    skills: [{ type: String }],
    programmingLanguages: [{ type: String }],
    frameworks: [{ type: String }],
    libraries: [{ type: String }],
    databases: [{ type: String }],
    cloudPlatforms: [{ type: String }],
    devopsTools: [{ type: String }],
    versionControl: [{ type: String }],
    operatingSystems: [{ type: String }],
    developmentTools: [{ type: String }],
    testingTools: [{ type: String }],
    aiMlTechnologies: [{ type: String }],
    softSkills: [{ type: String }],
    college: { type: String, default: '' },
    department: { type: String, default: '' },
    branch: { type: String, default: '' },
    year: { type: String, default: '' },
    cgpa: { type: String, default: '' },
    education: [{
      school: String,
      degree: String,
      fieldOfStudy: String,
      startYear: String,
      endYear: String,
      cgpa: String
    }],
    projects: [{
      title: String,
      description: String,
      techStack: [{ type: String }],
      role: String,
      duration: String,
      githubLink: String,
      liveLink: String
    }],
    achievements: [{
      type: { type: String }, // hackathon, competition, certificate, award, research, internship, openSource
      title: String,
      description: String,
      date: String
    }],
    experience: [{
      role: String,
      company: String,
      duration: String,
      description: String
    }],
    preferredRoles: [{ type: String }],
    domains: [{ type: String }],
    careerInterests: [{ type: String }],
    resumeScore: { type: Number, default: 0 }
  },

  // --- STATUS TRACKING ---
  onlineStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  joinedDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
