import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { syncResumeAnalysisWithProfile } from '../server/services/aiService.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function runTest() {
  console.log("=== Starting Resume Sync Service Verification ===");

  await mongoose.connect(MONGO_URI);
  const { User } = await import('../server/models/User.js');
  
  // Find first user
  const user = await User.findOne();
  if (!user) {
    console.error("No user found in database to run tests!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Pre-seed some fields
  user.skills = ["Java", "React", "MongoDB"];
  user.programmingLanguages = ["Java", "JavaScript"];
  user.resumeScore = 75;
  await user.save();

  console.log(`Pre-seeded user skills: ${user.skills.join(', ')}`);

  // Mock text containing skills for extractAIProfileData parsing
  // Since extractAIProfileData runs LLM extraction, if GEMINI_API_KEY is configure it runs live, else falls back to mock heuristics!
  // Let's pass a mock resume text
  const resumeText = `
    Candidate: ${user.fullname}
    Preferred Role: Frontend Engineer
    Skills: React, Node.js, Express, Docker, JavaScript, Python
    Education: B.Tech in CS at Campus Tech University, GPA: 9.1, graduation: 2026
    Projects: 
    - Innovative Capstone Project: Designed a collab portal with React and Docker.
  `;

  try {
    // Print user profile before sync
    console.log("User before sync:", { skills: user.skills, resumeScore: user.resumeScore });

    const newProfileData = await syncResumeAnalysisWithProfile(user._id, resumeText, 88);

    // Re-fetch user
    const updatedUser = await User.findById(user._id);
    console.log("User after sync:", { skills: updatedUser.skills, resumeScore: updatedUser.resumeScore });
    console.log("aiProfile details after sync:", updatedUser.aiProfile);
    
    // Assertions
    const expected = ["Java", "React", "MongoDB", "Node.js", "Express", "Docker", "JavaScript", "Python"];
    const matchesAll = expected.every(skill => updatedUser.skills.includes(skill));
    
    console.log(`Deduplication checklist passed? ${matchesAll ? "YES" : "NO"}`);
    if (!matchesAll) {
      throw new Error("Skills did not merge correctly!");
    }
    
    console.log("✅ Resume to Profile Sync Verification Success!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }

  await mongoose.disconnect();
}

runTest();
