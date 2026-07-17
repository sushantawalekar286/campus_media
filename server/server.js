import './loadEnv.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import pdfParse from 'pdf-parse';
import { createServer } from 'http';
import { initializeSockets } from './services/socketService.js';

// Load services, routes and middlewares
import { dbHelper } from './services/dbHelper.js';
import { analyzeResumeText, generateFeedback, generateRoadmap, syncResumeAnalysisWithProfile } from './services/aiService.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';


// PDF Parsing Helper
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

const User = dbHelper.User;
const Resume = dbHelper.Resume;
const Job = dbHelper.Job;
const Note = dbHelper.Note;
const SystemConfig = dbHelper.SystemConfig;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. SECURITY MIDDLEWARES
  // Set security HTTP headers (Helmet) with customized scriptsrc for Vite and CDN compatibility
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://aistudiocdn.com", "https://www.gstatic.com", "https://cdn.jsdelivr.net", "https://esm.sh"],
        connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*", "https://aistudiocdn.com", "https://generativelanguage.googleapis.com", "wss://generativelanguage.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
        mediaSrc: ["'self'", "data:", "https:", "http:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'self'"]
      }
    }
  }));

  // CORS Configuration
  app.use(cors({
    origin: true, // Allow all origins for dev simplicity, or specify client domain
    credentials: true // Allow session cookies
  }));

  // Body and cookie parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Global Rate Limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // MongoDB Connection
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';
  const LOCAL_URI = 'mongodb://127.0.0.1:27017/campus-media';
  console.log('Connecting to MongoDB at:', MONGO_URI);
  
  mongoose.set('bufferCommands', false);
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000, // 2 second timeout
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.warn('⚠️ MongoDB Connection Refused or Timed out. Attempting fallback to local MongoDB:', err.message);
    try {
      await mongoose.disconnect();
      await mongoose.connect(LOCAL_URI, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log('✅ Connected to Local MongoDB Fallback');
    } catch (localErr) {
      console.warn('⚠️ Local MongoDB fallback failed. Operating in Local SQL/JSON mode:', localErr.message);
    }
  }

  const upload = multer({ storage: multer.memoryStorage() });

  // --- HEALTH API ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });

  // --- 2. MODULAR AUTHS & USERS ROUTERS ---
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationRoutes);

  // --- 3. DOMAIN ROUTES (RESUME, ROADMAP, INTERVIEW, CHAT, JOBS, QUESTIONS, NOTES) ---

  // RESUME ANALYSIS
  app.post('/api/resume/analyze', authMiddleware, upload.single('resume'), async (req, res) => {
    try {
      const { targetRole, experienceLevel, text } = req.body;
      let rawText = text || '';

      if (req.file) {
        // Step 1: Log file details
        console.log(`[Resume Upload Debug] Filename: ${req.file.originalname}`);
        console.log(`[Resume Upload Debug] File Size: ${req.file.size} bytes`);
        console.log(`[Resume Upload Debug] MIME Type: ${req.file.mimetype}`);

        // Step 1: MIME type validation
        if (req.file.mimetype !== 'application/pdf') {
          return res.status(400).send({ error: 'MIME type invalid. Make sure it\'s a valid PDF.' });
        }

        // Step 1: File size validation (limit to 5MB)
        if (req.file.size > 5 * 1024 * 1024) {
          return res.status(400).send({ error: 'File size exceeds the 5MB limit. Please upload a smaller file.' });
        }

        // Extract PDF text
        const data = await parsePDF(req.file.buffer);
        rawText = data?.text || '';

        // Step 2: Log extraction details
        const textLength = rawText ? rawText.length : 0;
        console.log(`[PDF Extraction Debug] Extracted text length: ${textLength} characters`);
        if (textLength > 0) {
          console.log(`[PDF Extraction Debug] First 500 characters: ${rawText.slice(0, 500)}`);
        }
      }

      // Step 2: Check if extracted text is empty
      if (!rawText || rawText.trim().length === 0) {
        return res.status(400).send({ 
          error: 'PDF extraction returned empty text. The file might be scanned, image-only, or corrupted. Please upload a valid text-based PDF.' 
        });
      }
      
      const contentHash = crypto.createHash('sha256').update(rawText).digest('hex');
      const existing = await Resume.findOne({ contentHash, userId: req.user.id || req.user._id });
      if (existing) {
        await syncResumeAnalysisWithProfile(req.user.id || req.user._id, rawText, existing.analysis?.score);
        return res.send(existing.analysis);
      }

      const analysis = await analyzeResumeText(rawText, targetRole || 'Developer', experienceLevel || 'Junior');

      // Step 7: Handle fallback response if Gemini analysis failed
      if (analysis && analysis.success === false) {
        return res.status(503).send(analysis);
      }

      const resume = await Resume.create({
        userId: req.user.id || req.user._id,
        rawText,
        contentHash,
        targetRole,
        analysis
      });

      await syncResumeAnalysisWithProfile(req.user.id || req.user._id, rawText, analysis.score);

      res.send(analysis);
    } catch (e) {
      console.error("Resume Error:", e);
      res.status(500).send({ error: e.message });
    }
  });

  // VOICE INTERVIEW FEEDBACK
  app.post('/api/interview/feedback', authMiddleware, async (req, res) => {
    try {
      const { transcript } = req.body;
      const feedback = await generateFeedback(transcript);
      res.send(feedback);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  // LEARNING ROADMAP GENERATOR
  app.post('/api/roadmap', authMiddleware, async (req, res) => {
    try {
      const { currentSkills, targetDomain } = req.body;
      const roadmap = await generateRoadmap(currentSkills || [], targetDomain);
      res.send(roadmap);
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  // AI MENTOR CHAT
  app.post('/api/ai-mentor/chat', authMiddleware, async (req, res) => {
    try {
      const { prompt, history = [] } = req.body;
      if (!prompt) {
        return res.status(400).send({ error: 'Prompt is required' });
      }

      const userId = req.user.id || req.user._id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({ error: 'User not found' });
      }

      // Construct student profile context
      const context = {
        fullname: user.fullname,
        department: user.department || user.aiProfile?.department || '',
        year: user.year || user.aiProfile?.year || '',
        college: user.college || user.aiProfile?.college || '',
        careerGoal: user.careerObjective || user.careerGoal || '',
        preferredRoles: user.preferredRoles?.length ? user.preferredRoles : user.aiProfile?.preferredRoles || [],
        skills: user.skills?.length ? user.skills : user.aiProfile?.skills || [],
        programmingLanguages: user.programmingLanguages?.length ? user.programmingLanguages : user.aiProfile?.programmingLanguages || [],
        frameworks: user.frameworks?.length ? user.frameworks : user.aiProfile?.frameworks || [],
        projects: user.aiProfile?.projects || [],
        achievements: user.aiProfile?.achievements || [],
        resumeScore: user.resumeScore || user.aiProfile?.resumeScore || 0,
        interviewScore: user.interviewScore || 0
      };

      const { generateMentorResponse } = await import('./services/aiService.js');
      const response = await generateMentorResponse(prompt, history, context);

      res.status(200).send(response);
    } catch (e) {
      console.error("AI Mentor Error:", e);
      res.status(500).send({ error: e.message });
    }
  });

  // JOB BOARD
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
      const job = await Job.create({ ...req.body, postedBy: req.user.id || req.user._id });
      res.status(201).send({ ...job, id: job.id || job._id?.toString() || '' });
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

  // SYSTEM CONFIGS
  app.get('/api/config/gemini-key', authMiddleware, (req, res) => {
    const key = process.env.GEMINI_API_KEY || '';
    if (key.startsWith('YOUR_')) {
      res.send({ apiKey: '' });
    } else {
      res.send({ apiKey: key });
    }
  });

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

  // NOTES / POSTS
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
      const user = await User.findById(req.user.id || req.user._id);
      const note = await Note.create({
        ...req.body,
        authorId: req.user.id || req.user._id,
        authorName: user?.fullname || user?.name || 'Anonymous'
      });
      res.status(201).send({ ...note, id: note.id || note._id?.toString() || '' });
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
      if (note.authorId?.toString() !== (req.user.id || req.user._id?.toString()) && req.user.role !== 'ADMIN') {
        return res.status(403).send({ error: 'Unauthorized' });
      }
      await Note.findByIdAndDelete(req.params.id);
      res.send({ success: true });
    } catch (e) {
      res.status(500).send({ error: e.message });
    }
  });

  // ADMIN ANALYTICS SUBMISSIONS
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

  // --- 4. GLOBAL ERROR MIDDLEWARE ---
  app.use(errorMiddleware);

  // Serve uploads folder statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

  // --- 5. VITE / STATIC FILE SERVING ---
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

  const server = createServer(app);
  const io = initializeSockets(server);
  app.set('io', io);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Modernized Campus Media Backend running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
