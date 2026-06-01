import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Parse PDF content on server
import pdfParse from 'pdf-parse';

async function parsePDF(buffer) {
  try {
    let fn = pdfParse;
    if (fn && fn.PDFParse) {
      console.log("Using PDFParse v2 class to extract text");
      const parser = new fn.PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result;
    }
    
    // v1 fallback if it's a direct function
    if (typeof fn === 'function') {
      console.log("Using pdf-parse v1 function to extract text");
      return await fn(buffer);
    } else if (fn && typeof fn.default === 'function') {
      console.log("Using pdf-parse v1 default function to extract text");
      return await fn.default(buffer);
    }
    
    throw new Error('pdf-parse is not a function or class. Loaded object keys: ' + (fn ? Object.keys(fn).join(', ') : 'null'));
  } catch (err) {
    console.error("Error during PDF parsing fallback:", err);
    throw err;
  }
}

import { dbHelper } from './server/src/services/dbHelper.js';

const User = dbHelper.User;
const Resume = dbHelper.Resume;
const Question = dbHelper.Question;
const Job = dbHelper.Job;
const ChatMessage = dbHelper.ChatMessage;
const Note = dbHelper.Note;
const SystemConfig = dbHelper.SystemConfig;

import { analyzeResumeText, generateFeedback, generateRoadmap } from './server/src/services/aiService.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // MongoDB Connection
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
  console.log('Connecting to MongoDB at:', MONGO_URI);
  
  // Set fail-fast buffering settings so we don't hang if Mongo isn't running
  mongoose.set('bufferCommands', false);

  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 2000, // 2 second timeout
  })
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
      console.warn('⚠️ MongoDB Connection Refused or Timed out. Operating in Local SQL/JSON mode:', err.message);
    });

  const upload = multer({ storage: multer.memoryStorage() });

  // Custom Authentication Middleware
  const authMiddleware = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).send({ error: 'Please authenticate.' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).send({ error: 'Please authenticate.' });
    }
  };

  // --- HEALTH API ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });

  // --- POST ROUTES ---
  const { postRoutes } = await import('./server/routes/postRoutes.js');
  app.use('/api/posts', postRoutes(authMiddleware));

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role, year } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send({ error: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 8);
      const user = await User.create({ 
        name, 
        email, 
        password: hashedPassword, 
        role: role || 'STUDENT', 
        year 
      });
      
      const userObj = user.toObject();
      delete userObj.password;

      // Extract raw user string ID
      const userId = user.id || user._id?.toString() || '';
      const userWithId = { ...userObj, id: userId };

      const token = jwt.sign({ id: userId, role: user.role }, process.env.JWT_SECRET || 'secret');
      res.status(201).send({ user: userWithId, token });
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send({ error: 'User not found' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).send({ error: 'Invalid credentials' });
      }
      
      const userId = user.id || user._id?.toString() || '';
      const token = jwt.sign({ id: userId, role: user.role }, process.env.JWT_SECRET || 'secret');
      
      const userObj = user.toObject();
      delete userObj.password;
      
      const userWithId = { ...userObj, id: userId };

      res.send({ user: userWithId, token });
    } catch (e) {
      res.status(400).send({ error: 'Login failed: ' + e.message });
    }
  });

  app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).send({ error: 'User not found' });
      }
      const userObj = user.toObject();
      delete userObj.password;
      const userId = user.id || user._id?.toString() || '';
      const userWithId = { ...userObj, id: userId };
      res.send({ user: userWithId });
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  app.patch('/api/auth/update-profile', authMiddleware, async (req, res) => {
    try {
      const allowedUpdates = ['name', 'fullname', 'bio', 'profilePicture', 'headline', 'location', 'website', 'skills'];
      const updateData = {};
      
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updateData[key] = req.body[key];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });
      if (!updatedUser) {
        return res.status(404).send({ error: 'User not found' });
      }

      const userObj = updatedUser.toObject();
      delete userObj.password;
      const userId = updatedUser.id || updatedUser._id?.toString() || '';
      res.send({ user: { ...userObj, id: userId } });
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  });

  app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).send({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).send({ error: 'Incorrect current password' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 8);
      await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
      
      res.send({ success: true, message: 'Password changed successfully' });
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  });

  // --- RESUME ROUTES ---
  app.post('/api/resume/analyze', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
      const { targetRole, experienceLevel, text } = req.body;
      let rawText = text || '';

      if (req.file) {
        const data = await parsePDF(req.file.buffer);
        rawText = data.text;
      }

      if (!rawText) {
        return res.status(400).send({ error: 'No resume file uploaded and no text provided' });
      }
      
      const contentHash = crypto.createHash('sha256').update(rawText).digest('hex');
      const existing = await Resume.findOne({ contentHash, userId: req.user.id });
      if (existing) {
        return res.send(existing.analysis);
      }

      const analysis = await analyzeResumeText(rawText, targetRole || 'Developer', experienceLevel || 'Junior');

      const resume = await Resume.create({
        userId: req.user.id,
        rawText,
        contentHash,
        targetRole,
        analysis
      });
      res.send(analysis);
    } catch (e) {
      console.error("Resume Error:", e);
      res.status(500).send({ error: e.message });
    }
  });

  // --- INTERVIEW & ROADMAP ROUTES ---
  app.post('/api/interview/feedback', authMiddleware, async (req, res) => {
    try {
      const { transcript } = req.body;
      const feedback = await generateFeedback(transcript);
      res.send(feedback);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  app.post('/api/roadmap', authMiddleware, async (req, res) => {
    try {
      const { currentSkills, targetDomain } = req.body;
      const roadmap = await generateRoadmap(currentSkills || [], targetDomain);
      res.send(roadmap);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  // --- QUESTION BANK ROUTES ---
  app.get('/api/questions', async (req, res) => {
    try {
      const questions = await Question.find();
      const formatted = (questions || []).map(q => {
        if (!q) return {};
        const plain = (typeof q.toObject === 'function') ? q.toObject() : q;
        return { ...plain, id: plain.id || plain._id?.toString() || '' };
      });
      res.send(formatted);
    } catch (e) { 
      console.error('❌ Error in GET /api/questions:', e);
      res.status(500).send({ error: e.stack || e.message }); 
    }
  });

  app.post('/api/questions', authMiddleware, async (req, res) => {
    try {
      const { text, company, role, difficulty } = req.body;
      const user = await User.findById(req.user.id);
      const question = await Question.create({
        text, 
        company, 
        role, 
        difficulty,
        submittedBy: req.user.id,
        submittedByName: user?.name || 'Anonymous',
        status: req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING'
      });
      res.status(201).send({ ...question.toObject(), id: question._id.toString() });
    } catch (e) { 
      res.status(400).send({ error: e.message }); 
    }
  });

  app.patch('/api/questions/:id/status', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      const question = await Question.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
      if (question) {
        res.send({ ...question.toObject(), id: question._id.toString() });
      } else {
        res.status(404).send({ error: 'Question not found' });
      }
    } catch (e) { 
      res.status(400).send({ error: e.message }); 
    }
  });

  app.delete('/api/questions/:id', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      await Question.findByIdAndDelete(req.params.id);
      res.send({ success: true });
    } catch (e) { 
      res.status(500).send({ error: e.message }); 
    }
  });

  // --- JOB ROUTES ---
  app.get('/api/jobs', async (req, res) => {
    try {
      const jobs = await Job.find();
      const formatted = (jobs || []).map(j => {
        if (!j) return {};
        const plain = (typeof j.toObject === 'function') ? j.toObject() : j;
        return { ...plain, id: plain.id || plain._id?.toString() || '' };
      });
      res.send(formatted);
    } catch (e) { 
      console.error('❌ Error in GET /api/jobs:', e);
      res.status(500).send({ error: e.stack || e.message }); 
    }
  });

  app.post('/api/jobs', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      const job = await Job.create({ ...req.body, postedBy: req.user.id });
      res.status(201).send({ ...job.toObject(), id: job.id || job._id?.toString() || '' });
    } catch (e) { 
      res.status(400).send({ error: e.message }); 
    }
  });

  app.delete('/api/jobs/:id', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      await Job.findByIdAndDelete(req.params.id);
      res.send({ success: true });
    } catch (e) { 
      res.status(500).send({ error: e.message }); 
    }
  });

  // --- CHAT ROUTES ---
  app.get('/api/chat/:channel', async (req, res) => {
    try {
      const messages = await ChatMessage.find({ channel: req.params.channel });
      const formatted = (messages || []).map(m => {
        if (!m) return {};
        const plain = (typeof m.toObject === 'function') ? m.toObject() : m;
        return { ...plain, id: plain.id || plain._id?.toString() || '' };
      });
      res.send(formatted);
    } catch (e) { 
      console.error('❌ Error in GET /api/chat:', e);
      res.status(500).send({ error: e.stack || e.message }); 
    }
  });

  app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
      const { text, channel } = req.body;
      const user = await User.findById(req.user.id);
      const bannedWords = ['badword', 'spam']; 
      const isFlagged = bannedWords.some(word => text.toLowerCase().includes(word));
      
      const message = await ChatMessage.create({
        senderId: req.user.id,
        senderName: user?.name || 'Anonymous',
        text,
        channel,
        isFlagged
      });
      res.status(201).send({ ...message.toObject(), id: message.id || message._id?.toString() || '' });
    } catch (e) { 
      res.status(400).send({ error: e.message }); 
    }
  });

  app.delete('/api/chat/:id', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      await ChatMessage.findByIdAndDelete(req.params.id);
      res.send({ success: true });
    } catch (e) { 
      res.status(500).send({ error: e.message }); 
    }
  });

  // --- USER MANAGEMENT (ADMIN) ---
  app.get('/api/users', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      const users = await User.find({}, '-password'); 
      const formatted = (users || []).map(u => {
        if (!u) return {};
        const plain = (typeof u.toObject === 'function') ? u.toObject() : u;
        return { ...plain, id: plain.id || plain._id?.toString() || '' };
      });
      res.send(formatted);
    } catch (e) { 
      console.error('❌ Error in GET /api/users:', e);
      res.status(500).send({ error: e.stack || e.message }); 
    }
  });

  app.patch('/api/users/:id/status', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
      if (user) {
        res.send({ ...user.toObject(), id: user.id || user._id?.toString() || '' });
      } else {
        res.status(404).send({ error: 'User not found' });
      }
    } catch (e) { 
      res.status(400).send({ error: e.message }); 
    }
  });

  // --- CONFIG / GEMINI KEY ROUTE ---
  app.get('/api/config/gemini-key', authMiddleware, (req, res) => {
    res.send({ apiKey: process.env.GEMINI_API_KEY || '' });
  });

  // --- SYSTEM CONFIG ROUTES ---
  app.get('/api/config', async (req, res) => {
    try {
      const config = await SystemConfig.findOne();
      res.send(config);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  app.patch('/api/config', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      const config = await SystemConfig.findOneAndUpdate({}, req.body, { new: true });
      res.send(config);
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  });

  // --- NOTE ROUTES ---
  app.get('/api/notes', authMiddleware, async (req, res) => {
    try {
      const notes = await Note.find();
      const formatted = (notes || []).map(n => {
        if (!n) return {};
        const plain = (typeof n.toObject === 'function') ? n.toObject() : n;
        return { ...plain, id: plain.id || plain._id?.toString() || '' };
      });
      res.send(formatted);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  app.post('/api/notes', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const note = await Note.create({
        ...req.body,
        authorId: req.user.id,
        authorName: user?.name || 'Anonymous'
      });
      res.status(201).send({ ...note.toObject(), id: note.id || note._id?.toString() || '' });
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  });

  app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) {
        return res.status(404).send({ error: 'Note not found' });
      }
      if (note.authorId?.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      await Note.findByIdAndDelete(req.params.id);
      res.send({ success: true });
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  // --- USER DELETION (ADMIN) ---
  app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      if (req.params.id === req.user.id) {
        return res.status(400).send({ error: 'Cannot delete yourself' });
      }
      await User.findByIdAndDelete(req.params.id);
      res.send({ success: true });
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  // --- RESUME SUBMISSIONS (ADMIN ANALYTICS) ---
  app.get('/api/resume/submissions', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      const submissions = await Resume.find();
      const formatted = (submissions || []).map(s => {
        if (!s) return {};
        const plain = (typeof s.toObject === 'function') ? s.toObject() : s;
        return { ...plain, id: plain.id || plain._id?.toString() || '' };
      });
      res.send(formatted);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  // --- VITE DEV AND BUILD HANDLER (Mount Vite middleware last) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get('/{*splat}', async (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.includes('.')) {
        return next();
      }
      try {
        const fs = await import('fs');
        const indexPath = path.join(process.cwd(), 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Express + Vite Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
