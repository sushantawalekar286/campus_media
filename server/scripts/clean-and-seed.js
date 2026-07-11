import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

const ADMIN_EMAILS = [
  "pruthviraj2005patil@gmail.com",
  "sushantawalekar286@gmail.com"
];

// Admin data definition
const ADMINS_TO_SEED = [
  {
    fullname: "Pruthviraj Patil",
    name: "Pruthviraj Patil",
    username: "pruthviraj",
    email: "pruthviraj2005patil@gmail.com",
    passwordRaw: "PruthvirajAdmin#2026!",
    role: "ADMIN",
    status: "ACTIVE",
    isVerified: true,
    bio: "Administrator for Campus Media Platform",
    profilePicture: "",
    coverPicture: "",
    headline: "System Administrator",
    location: "Campus",
    website: "",
    department: "Administration",
    course: "System Engineering",
    semester: "8",
    year: "Alumni",
    education: [],
    github: "",
    linkedin: "",
    portfolio: "",
    codingProfiles: { leetcode: "", hackerrank: "", codechef: "", codeforces: "" },
    skills: [],
    programmingLanguages: [],
    certificates: [],
    followersCount: 0,
    followingCount: 0,
    connectionCount: 0,
    postsCount: 0,
    achievementCount: 0,
    projectCount: 0,
    resumeScore: 0,
    interviewScore: 0,
    roadmapProgress: 0,
    socialLinks: { website: '', linkedin: '', github: '', twitter: '' },
    privacySettings: { 
      profileVisibility: 'public', 
      hideFollowers: false,
      hideFollowing: false,
      hideAchievements: false,
      hideProjects: false,
      hideResumeScore: false,
      hideInterviewScore: false,
      showSkills: true, 
      showEducation: true 
    },
    notificationSettings: { emailAlerts: true, pushAlerts: true },
    onlineStatus: "offline"
  },
  {
    fullname: "Sushant Awalekar",
    name: "Sushant Awalekar",
    username: "sushant",
    email: "sushantawalekar286@gmail.com",
    passwordRaw: "SushantAdmin#2026!",
    role: "ADMIN",
    status: "ACTIVE",
    isVerified: true,
    bio: "Administrator for Campus Media Platform",
    profilePicture: "",
    coverPicture: "",
    headline: "System Administrator",
    location: "Campus",
    website: "",
    department: "Administration",
    course: "Computer Science",
    semester: "8",
    year: "Alumni",
    education: [],
    github: "",
    linkedin: "",
    portfolio: "",
    codingProfiles: { leetcode: "", hackerrank: "", codechef: "", codeforces: "" },
    skills: [],
    programmingLanguages: [],
    certificates: [],
    followersCount: 0,
    followingCount: 0,
    connectionCount: 0,
    postsCount: 0,
    achievementCount: 0,
    projectCount: 0,
    resumeScore: 0,
    interviewScore: 0,
    roadmapProgress: 0,
    socialLinks: { website: '', linkedin: '', github: '', twitter: '' },
    privacySettings: { 
      profileVisibility: 'public', 
      hideFollowers: false,
      hideFollowing: false,
      hideAchievements: false,
      hideProjects: false,
      hideResumeScore: false,
      hideInterviewScore: false,
      showSkills: true, 
      showEducation: true 
    },
    notificationSettings: { emailAlerts: true, pushAlerts: true },
    onlineStatus: "offline"
  }
];

async function seedLocalJSON() {
  console.log('--- Cleaning and Seeding Local JSON Files ---');
  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Clear all databases
  const localTargets = [
    'sessions', 'otps', 'posts', 'comments', 'likes', 'chatmessages', 
    'savedposts', 'connections', 'follows', 'notifications', 'jobs', 
    'resumes', 'projects', 'achievements', 'conversations', 'resources', 'notes'
  ];

  for (const name of localTargets) {
    fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify([], null, 2), 'utf-8');
    console.log(`✅ Local ${name}.json cleared.`);
  }

  // Hash passwords and format admin users for JSON file
  const seededUsers = ADMINS_TO_SEED.map(admin => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(admin.passwordRaw, salt);
    
    const { passwordRaw, ...rest } = admin;
    return {
      ...rest,
      _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      password: hashedPassword,
      joinedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
  });

  fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(seededUsers, null, 2), 'utf-8');
  console.log('✅ Local users.json seeded with secure admin accounts.');
}

async function seedMongoDB() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
  console.log('\n--- Connecting to MongoDB at:', MONGO_URI);
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    const db = mongoose.connection.db;

    // List collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Delete existing records in targeted collections
    const targets = [
      'users', 'sessions', 'otps', 'posts', 'comments', 'likes', 'chatmessages', 
      'savedposts', 'connections', 'follows', 'notifications', 'jobs', 
      'resumes', 'projects', 'achievements', 'conversations', 'resources', 'notes'
    ];

    for (const target of targets) {
      if (collectionNames.includes(target)) {
        await db.collection(target).deleteMany({});
        console.log(`🧹 Cleared all data from collection: "${target}"`);
      }
    }

    // Insert new Admin users
    const usersCollection = db.collection('users');
    for (const admin of ADMINS_TO_SEED) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(admin.passwordRaw, salt);

      const { passwordRaw, ...rest } = admin;
      const userDoc = {
        ...rest,
        password: hashedPassword,
        joinedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeen: new Date()
      };

      await usersCollection.insertOne(userDoc);
      console.log(`👤 Inserted Admin Account: "${admin.email}" (Password: ${admin.passwordRaw})`);
    }

    console.log('✅ MongoDB reset and seed completed successfully.');
  } catch (err) {
    console.error('❌ MongoDB seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

async function main() {
  console.log('==================================================');
  console.log('    CAMPUS MEDIA SECURITY CLEAN & SEED SCRIPT    ');
  console.log('==================================================');

  // Seed local files first
  await seedLocalJSON();

  // Seed remote/local MongoDB Atlas or localhost
  await seedMongoDB();

  console.log('\n==================================================');
  console.log('    SEED COMPLETED - SECURE ADMIN USERS LOGINS:   ');
  console.log('--------------------------------------------------');
  ADMINS_TO_SEED.forEach(admin => {
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${admin.passwordRaw}`);
    console.log(`Role:     ${admin.role}\n`);
  });
  console.log('==================================================');
}

main().catch(err => {
  console.error('Fatal error in seed script:', err);
  process.exit(1);
});
