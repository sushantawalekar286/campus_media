import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Fix: Use import instead of require to fix 'require' name error in TypeScript environment
import pdfParse from 'pdf-parse';

import { User } from './models/User';
import { Resume } from './models/Resume';
import { Question } from './models/Question';
import { Job } from './models/Job';
import { ChatMessage } from './models/ChatMessage';
import { analyzeResumeText, generateFeedback, generateRoadmap } from './services/aiService';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json() as any);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
  });

// Middleware
const upload = multer({ storage: multer.memoryStorage() });

const auth = async (req: any, res: any, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { name, email, password, role, year } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({ name, email, password: hashedPassword, role, year });
    await user.save();
    
    const userObj = user.toObject();
    // @ts-ignore
    delete userObj.password;

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
    res.status(201).send({ user: userObj, token });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
    
    const userObj = user.toObject();
    // @ts-ignore
    delete userObj.password;
    
    res.send({ user: userObj, token });
  } catch (e) {
    res.status(400).send({ error: 'Login failed' });
  }
});

// --- RESUME ROUTES ---
app.post('/api/resume/analyze', auth, upload.single('resume') as any, async (req: any, res: any) => {
  try {
    const { targetRole, experienceLevel } = req.body;
    if (!req.file) throw new Error('No file uploaded');
    
    const data = await pdfParse(req.file.buffer);
    const rawText = data.text;

    const contentHash = crypto.createHash('sha256').update(rawText).digest('hex');
    const existing = await Resume.findOne({ contentHash, userId: req.user.id });
    if (existing) return res.send(existing.analysis);

    const analysis = await analyzeResumeText(rawText, targetRole, experienceLevel);

    const resume = new Resume({
      userId: req.user.id,
      rawText,
      contentHash,
      targetRole,
      analysis
    });
    await resume.save();
    res.send(analysis);
  } catch (e: any) {
    console.error("Resume Error:", e);
    res.status(500).send({ error: e.message });
  }
});

// --- INTERVIEW & ROADMAP ROUTES ---
app.post('/api/interview/feedback', auth, async (req: any, res: any) => {
  try {
    const { transcript } = req.body;
    const feedback = await generateFeedback(transcript);
    res.send(feedback);
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

app.post('/api/roadmap', auth, async (req: any, res: any) => {
  try {
    const { currentSkills, targetDomain } = req.body;
    const roadmap = await generateRoadmap(currentSkills, targetDomain);
    res.send(roadmap);
  } catch (e: any) {
    res.status(500).send({ error: e.message });
  }
});

// --- QUESTION BANK ROUTES ---
app.get('/api/questions', async (req: any, res: any) => {
  try {
    const questions = await Question.find().sort({ date: -1 });
    const formatted = questions.map(q => ({ ...q.toObject(), id: q._id }));
    res.send(formatted);
  } catch (e) { res.status(500).send(e); }
});

app.post('/api/questions', auth, async (req: any, res: any) => {
  try {
    const { text, company, role, difficulty } = req.body;
    const user = await User.findById(req.user.id);
    const question = new Question({
      text, company, role, difficulty,
      submittedBy: req.user.id,
      submittedByName: user?.name || 'Anonymous',
      status: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING'
    });
    await question.save();
    res.status(201).send({ ...question.toObject(), id: question._id });
  } catch (e) { res.status(400).send(e); }
});

app.patch('/api/questions/:id/status', auth, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Unauthorized');
    const question = await Question.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (question) res.send({ ...question.toObject(), id: question._id });
    else res.status(404).send();
  } catch (e) { res.status(400).send(e); }
});

app.delete('/api/questions/:id', auth, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Unauthorized');
    await Question.findByIdAndDelete(req.params.id);
    res.send({ success: true });
  } catch (e) { res.status(500).send(e); }
});

// --- JOB ROUTES ---
app.get('/api/jobs', async (req: any, res: any) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    const formatted = jobs.map(j => ({ ...j.toObject(), id: j._id }));
    res.send(formatted);
  } catch (e) { res.status(500).send(e); }
});

app.post('/api/jobs', auth, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Unauthorized');
    const job = new Job({ ...req.body, postedBy: req.user.id });
    await job.save();
    res.status(201).send({ ...job.toObject(), id: job._id });
  } catch (e) { res.status(400).send(e); }
});

app.delete('/api/jobs/:id', auth, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Unauthorized');
    await Job.findByIdAndDelete(req.params.id);
    res.send({ success: true });
  } catch (e) { res.status(500).send(e); }
});

// --- CHAT ROUTES ---
app.get('/api/chat/:channel', async (req: any, res: any) => {
  try {
    const messages = await ChatMessage.find({ channel: req.params.channel }).sort({ timestamp: 1 }).limit(100);
    const formatted = messages.map(m => ({ ...m.toObject(), id: m._id }));
    res.send(formatted);
  } catch (e) { res.status(500).send(e); }
});

app.post('/api/chat', auth, async (req: any, res: any) => {
  try {
    const { text, channel } = req.body;
    const user = await User.findById(req.user.id);
    const bannedWords = ['badword', 'spam']; 
    const isFlagged = bannedWords.some(word => text.toLowerCase().includes(word));
    const message = new ChatMessage({
      senderId: req.user.id,
      senderName: user?.name,
      text,
      channel,
      isFlagged
    });
    await message.save();
    res.status(201).send({ ...message.toObject(), id: message._id });
  } catch (e) { res.status(400).send(e); }
});

app.delete('/api/chat/:id', auth, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Unauthorized');
    await ChatMessage.findByIdAndDelete(req.params.id);
    res.send({ success: true });
  } catch (e) { res.status(500).send(e); }
});

// --- USER MANAGEMENT (ADMIN) ---
app.get('/api/users', auth, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Unauthorized');
    const users = await User.find({}, '-password'); 
    const formatted = users.map(u => ({ ...u.toObject(), id: u._id }));
    res.send(formatted);
  } catch (e) { res.status(500).send(e); }
});

app.patch('/api/users/:id/status', auth, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).send('Unauthorized');
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.send(user);
  } catch (e) { res.status(400).send(e); }
});

const PORT = process.env.PORT || 5000;
// Bind to 0.0.0.0 for container compatibility
app.listen(Number(PORT), '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));