import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

import { User as MongooseUser } from '../models/User.js';
import { Resume as MongooseResume } from '../models/Resume.js';
import { Question as MongooseQuestion } from '../models/Question.js';
import { Job as MongooseJob } from '../models/Job.js';
import { ChatMessage as MongooseChatMessage } from '../models/ChatMessage.js';
import { Note as MongooseNote } from '../models/Note.js';
import { SystemConfig as MongooseSystemConfig } from '../models/SystemConfig.js';
import PostModel from '../models/Post.js'; // The newly created Post model

// Local storage path for fallback filesystem JSON databases
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getCollectionPath(collectionName) {
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function readCollection(collectionName) {
  const filePath = getCollectionPath(collectionName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function writeCollection(collectionName, data) {
  const filePath = getCollectionPath(collectionName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Convert local objects to look like Mongoose documents
function makeMongooseDoc(obj) {
  if (!obj) return obj;
  const doc = { ...obj };
  
  if (doc._id) {
    doc.id = doc._id.toString();
  }

  doc.toObject = function() {
    const cleanObject = { ...this };
    delete cleanObject.toObject;
    return cleanObject;
  };
  
  return doc;
}

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function executeDbQuery(mongooseOp, localOp) {
  if (isMongoConnected()) {
    try {
      return await mongooseOp();
    } catch (err) {
      const name = err.name || '';
      const msg = err.message || '';
      const isConnectionError = 
        name === 'MongoNetworkError' ||
        name === 'MongoTimeoutError' ||
        name === 'MongooseServerSelectionError' ||
        name === 'MongoServerSelectionError' ||
        msg.includes('connection') ||
        msg.includes('connect ECONNREFUSED') ||
        msg.includes('Buffered') ||
        msg.includes('topology');

      if (isConnectionError) {
        console.warn("⚠️ MongoDB connection offline. Falling back to local file DB:", err.message);
        return await localOp();
      } else {
        console.error("❌ Database query/operation failed:", err.stack || err.message);
        throw err;
      }
    }
  } else {
    return await localOp();
  }
}

// Unified Database Helpers for models
export const dbHelper = {
  User: {
    async findOne(query) {
      return executeDbQuery(
        async () => {
          const user = await MongooseUser.findOne(query);
          if (user) {
            return makeMongooseDoc(user.toObject());
          }
          const users = readCollection('users');
          const found = users.find(u => u.email === query.email);
          return found ? makeMongooseDoc(found) : null;
        },
        () => {
          const users = readCollection('users');
          const found = users.find(u => u.email === query.email);
          return found ? makeMongooseDoc(found) : null;
        }
      );
    },

    async findById(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const users = readCollection('users');
            const found = users.find(u => u._id === id);
            return found ? makeMongooseDoc(found) : null;
          }
          const user = await MongooseUser.findById(id);
          if (user) {
            return makeMongooseDoc(user.toObject());
          }
          const users = readCollection('users');
          const found = users.find(u => u._id === id);
          return found ? makeMongooseDoc(found) : null;
        },
        () => {
          const users = readCollection('users');
          const found = users.find(u => u._id === id);
          return found ? makeMongooseDoc(found) : null;
        }
      );
    },

    async find(query = {}, projection) {
      return executeDbQuery(
        async () => {
          const mongoUsers = await MongooseUser.find(query);
          const localUsers = readCollection('users');
          
          const merged = [...mongoUsers.map(u => makeMongooseDoc(u.toObject()))];
          for (const lu of localUsers) {
            if (!merged.some(u => u.email === lu.email)) {
              if (projection === '-password') {
                const { password, ...rest } = lu;
                merged.push(makeMongooseDoc(rest));
              } else {
                merged.push(makeMongooseDoc(lu));
              }
            }
          }
          return merged;
        },
        () => {
          let users = readCollection('users');
          if (projection === '-password') {
            users = users.map(u => {
              const { password, ...rest } = u;
              return rest;
            });
          }
          return users.map(u => makeMongooseDoc(u));
        }
      );
    },

    async create(data) {
      return executeDbQuery(
        async () => {
          const ADMIN_EMAILS = [
            "pruthviraj2005patil@gmail.com",
            "sushantawalekar286@gmail.com"
          ];
          const email = (data.email || '').trim().toLowerCase();
          const determinedRole = ADMIN_EMAILS.includes(email) ? 'ADMIN' : 'USER';
          const mongooseUser = new MongooseUser({ ...data, role: determinedRole });
          await mongooseUser.save();
          return makeMongooseDoc(mongooseUser.toObject());
        },
        () => {
          const users = readCollection('users');
          const ADMIN_EMAILS = [
            "pruthviraj2005patil@gmail.com",
            "sushantawalekar286@gmail.com"
          ];
          const email = (data.email || '').trim().toLowerCase();
          const determinedRole = ADMIN_EMAILS.includes(email) ? 'ADMIN' : 'USER';
          const newUser = {
            ...data,
            _id: data._id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
            joinedDate: data.joinedDate || new Date().toISOString(),
            status: data.status || 'ACTIVE',
            role: determinedRole
          };
          users.push(newUser);
          writeCollection('users', users);
          return makeMongooseDoc(newUser);
        }
      );
    },

    async findByIdAndUpdate(id, update, options = { new: true }) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const users = readCollection('users');
            const idx = users.findIndex(u => u._id === id);
            if (idx >= 0) {
              users[idx] = { ...users[idx], ...update };
              writeCollection('users', users);
              return makeMongooseDoc(users[idx]);
            }
            return null;
          }
          const user = await MongooseUser.findByIdAndUpdate(id, update, options);
          if (user) {
            return makeMongooseDoc(user.toObject());
          }
          const users = readCollection('users');
          const idx = users.findIndex(u => u._id === id);
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...update };
            writeCollection('users', users);
            return makeMongooseDoc(users[idx]);
          }
          return null;
        },
        () => {
          const users = readCollection('users');
          const idx = users.findIndex(u => u._id === id);
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...update };
            writeCollection('users', users);
            return makeMongooseDoc(users[idx]);
          }
          return null;
        }
      );
    },

    async findByIdAndDelete(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const users = readCollection('users');
            const filtered = users.filter(u => u._id !== id);
            writeCollection('users', filtered);
            return { success: true };
          }
          await MongooseUser.findByIdAndDelete(id);
          const users = readCollection('users');
          const filtered = users.filter(u => u._id !== id);
          writeCollection('users', filtered);
          return { success: true };
        },
        () => {
          const users = readCollection('users');
          const filtered = users.filter(u => u._id !== id);
          writeCollection('users', filtered);
          return { success: true };
        }
      );
    }
  },

  Resume: {
    async findOne(query) {
      return executeDbQuery(
        async () => {
          const resume = await MongooseResume.findOne(query);
          return resume ? makeMongooseDoc(resume.toObject()) : null;
        },
        () => {
          const resumes = readCollection('resumes');
          const found = resumes.find(r => r.contentHash === query.contentHash && r.userId === query.userId);
          return found ? makeMongooseDoc(found) : null;
        }
      );
    },

    async create(data) {
      return executeDbQuery(
        async () => {
          const resume = new MongooseResume(data);
          await resume.save();
          return makeMongooseDoc(resume.toObject());
        },
        () => {
          const resumes = readCollection('resumes');
          const newResume = {
            ...data,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString()
          };
          resumes.push(newResume);
          writeCollection('resumes', resumes);
          return makeMongooseDoc(newResume);
        }
      );
    },

    async find() {
      return executeDbQuery(
        async () => {
          const mongoResumes = await MongooseResume.find();
          const localResumes = readCollection('resumes');
          const merged = [...mongoResumes.map(r => makeMongooseDoc(r.toObject()))];
          for (const lr of localResumes) {
            const stringId = lr._id ? lr._id.toString() : '';
            if (!merged.some(r => r._id?.toString() === stringId || r.id === stringId)) {
              merged.push(makeMongooseDoc(lr));
            }
          }
          return merged;
        },
        () => {
          const resumes = readCollection('resumes');
          return resumes.map(r => makeMongooseDoc(r));
        }
      );
    }
  },

  Question: {
    async find() {
      return executeDbQuery(
        async () => {
          const mongoQuestions = await MongooseQuestion.find().sort({ date: -1 });
          const localQuestions = readCollection('questions');
          
          const merged = [...mongoQuestions.map(q => makeMongooseDoc(q.toObject()))];
          for (const lq of localQuestions) {
            const stringId = lq._id ? lq._id.toString() : '';
            if (!merged.some(q => q._id?.toString() === stringId || q.id === stringId)) {
              merged.push(makeMongooseDoc(lq));
            }
          }
          
          merged.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
          return merged;
        },
        () => {
          const questions = readCollection('questions');
          questions.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
          return questions.map(q => makeMongooseDoc(q));
        }
      );
    },

    async create(data) {
      return executeDbQuery(
        async () => {
          const question = new MongooseQuestion(data);
          await question.save();
          return makeMongooseDoc(question.toObject());
        },
        () => {
          const questions = readCollection('questions');
          const newQuestion = {
            ...data,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            date: new Date().toISOString()
          };
          questions.push(newQuestion);
          writeCollection('questions', questions);
          return makeMongooseDoc(newQuestion);
        }
      );
    },

    async findByIdAndUpdate(id, update, options = { new: true }) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const questions = readCollection('questions');
            const idx = questions.findIndex(q => q._id === id);
            if (idx >= 0) {
              questions[idx] = { ...questions[idx], ...update };
              writeCollection('questions', questions);
              return makeMongooseDoc(questions[idx]);
            }
            return null;
          }
          const user = await MongooseQuestion.findByIdAndUpdate(id, update, options);
          if (user) {
            return makeMongooseDoc(user.toObject());
          }
          const questions = readCollection('questions');
          const idx = questions.findIndex(q => q._id === id);
          if (idx >= 0) {
            questions[idx] = { ...questions[idx], ...update };
            writeCollection('questions', questions);
            return makeMongooseDoc(questions[idx]);
          }
          return null;
        },
        () => {
          const questions = readCollection('questions');
          const idx = questions.findIndex(q => q._id === id);
          if (idx >= 0) {
            questions[idx] = { ...questions[idx], ...update };
            writeCollection('questions', questions);
            return makeMongooseDoc(questions[idx]);
          }
          return null;
        }
      );
    },

    async findByIdAndDelete(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const questions = readCollection('questions');
            const filtered = questions.filter(q => q._id !== id);
            writeCollection('questions', filtered);
            return { success: true };
          }
          await MongooseQuestion.findByIdAndDelete(id);
          const questions = readCollection('questions');
          const filtered = questions.filter(q => q._id !== id);
          writeCollection('questions', filtered);
          return { success: true };
        },
        () => {
          const questions = readCollection('questions');
          const filtered = questions.filter(q => q._id !== id);
          writeCollection('questions', filtered);
          return { success: true };
        }
      );
    }
  },

  Job: {
    async find() {
      return executeDbQuery(
        async () => {
          const mongoJobs = await MongooseJob.find().sort({ createdAt: -1 });
          const localJobs = readCollection('jobs');
          
          const merged = [...mongoJobs.map(j => makeMongooseDoc(j.toObject()))];
          for (const lj of localJobs) {
            const stringId = lj._id ? lj._id.toString() : '';
            if (!merged.some(j => j._id?.toString() === stringId || j.id === stringId)) {
              merged.push(makeMongooseDoc(lj));
            }
          }
          
          merged.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          return merged;
        },
        () => {
          const jobs = readCollection('jobs');
          jobs.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          return jobs.map(j => makeMongooseDoc(j));
        }
      );
    },

    async create(data) {
      return executeDbQuery(
        async () => {
          const job = new MongooseJob(data);
          await job.save();
          return makeMongooseDoc(job.toObject());
        },
        () => {
          const jobs = readCollection('jobs');
          const newJob = {
            ...data,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString()
          };
          jobs.push(newJob);
          writeCollection('jobs', jobs);
          return makeMongooseDoc(newJob);
        }
      );
    },

    async findByIdAndDelete(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const jobs = readCollection('jobs');
            const filtered = jobs.filter(j => j._id !== id);
            writeCollection('jobs', filtered);
            return { success: true };
          }
          await MongooseJob.findByIdAndDelete(id);
          const jobs = readCollection('jobs');
          const filtered = jobs.filter(j => j._id !== id);
          writeCollection('jobs', filtered);
          return { success: true };
        },
        () => {
          const jobs = readCollection('jobs');
          const filtered = jobs.filter(j => j._id !== id);
          writeCollection('jobs', filtered);
          return { success: true };
        }
      );
    }
  },

  ChatMessage: {
    async find(query) {
      return executeDbQuery(
        async () => {
          const mongoMsgs = await MongooseChatMessage.find(query).sort({ timestamp: 1 }).limit(100);
          const localMsgs = readCollection('messages').filter(m => m.channel === query.channel);
          
          const merged = [...mongoMsgs.map(m => makeMongooseDoc(m.toObject()))];
          for (const lm of localMsgs) {
            const stringId = lm._id ? lm._id.toString() : '';
            if (!merged.some(m => m._id?.toString() === stringId || m.id === stringId)) {
              merged.push(makeMongooseDoc(lm));
            }
          }
          
          merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          return merged.slice(-100);
        },
        () => {
          const messages = readCollection('messages');
          const filtered = messages.filter(m => m.channel === query.channel);
          filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          return filtered.slice(-100).map(m => makeMongooseDoc(m));
        }
      );
    },

    async create(data) {
      return executeDbQuery(
        async () => {
          const message = new MongooseChatMessage(data);
          await message.save();
          return makeMongooseDoc(message.toObject());
        },
        () => {
          const messages = readCollection('messages');
          const newMessage = {
            ...data,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            timestamp: data.timestamp || Date.now()
          };
          messages.push(newMessage);
          writeCollection('messages', messages);
          return makeMongooseDoc(newMessage);
        }
      );
    },

    async findByIdAndDelete(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const messages = readCollection('messages');
            const filtered = messages.filter(m => m._id !== id);
            writeCollection('messages', filtered);
            return { success: true };
          }
          await MongooseChatMessage.findByIdAndDelete(id);
          const messages = readCollection('messages');
          const filtered = messages.filter(m => m._id !== id);
          writeCollection('messages', filtered);
          return { success: true };
        },
        () => {
          const messages = readCollection('messages');
          const filtered = messages.filter(m => m._id !== id);
          writeCollection('messages', filtered);
          return { success: true };
        }
      );
    }
  },

  Note: {
    async find() {
      return executeDbQuery(
        async () => {
          const mongoNotes = await MongooseNote.find();
          const localNotes = readCollection('notes');
          const merged = [...mongoNotes.map(n => makeMongooseDoc(n.toObject()))];
          for (const ln of localNotes) {
            const stringId = ln._id ? ln._id.toString() : '';
            if (!merged.some(n => n._id?.toString() === stringId || n.id === stringId)) {
              merged.push(makeMongooseDoc(ln));
            }
          }
          merged.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
          return merged;
        },
        () => {
          const notes = readCollection('notes');
          notes.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
          return notes.map(n => makeMongooseDoc(n));
        }
      );
    },

    async create(data) {
      return executeDbQuery(
        async () => {
          const note = new MongooseNote(data);
          await note.save();
          return makeMongooseDoc(note.toObject());
        },
        () => {
          const notes = readCollection('notes');
          const newNote = {
            ...data,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            date: new Date().toISOString()
          };
          notes.push(newNote);
          writeCollection('notes', notes);
          return makeMongooseDoc(newNote);
        }
      );
    },

    async findByIdAndDelete(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const notes = readCollection('notes');
            const filtered = notes.filter(n => n._id !== id);
            writeCollection('notes', filtered);
            return { success: true };
          }
          await MongooseNote.findByIdAndDelete(id);
          const notes = readCollection('notes');
          const filtered = notes.filter(n => n._id !== id);
          writeCollection('notes', filtered);
          return { success: true };
        },
        () => {
          const notes = readCollection('notes');
          const filtered = notes.filter(n => n._id !== id);
          writeCollection('notes', filtered);
          return { success: true };
        }
      );
    }
  },

  SystemConfig: {
    async findOne() {
      return executeDbQuery(
        async () => {
          let config = await MongooseSystemConfig.findOne();
          if (!config) {
            config = await MongooseSystemConfig.create({});
          }
          return makeMongooseDoc(config.toObject());
        },
        () => {
          const configs = readCollection('systemconfigs');
          if (configs.length === 0) {
            const defaultConfig = {
              _id: 'default',
              announcement: 'Welcome to Campus Media v2.0 (Powered by MongoDB)',
              allowSignups: true,
              maintenanceMode: false,
              interviewCategories: []
            };
            configs.push(defaultConfig);
            writeCollection('systemconfigs', configs);
            return makeMongooseDoc(defaultConfig);
          }
          return makeMongooseDoc(configs[0]);
        }
      );
    },

    async findOneAndUpdate(query, update, options = { new: true }) {
      return executeDbQuery(
        async () => {
          let config = await MongooseSystemConfig.findOneAndUpdate(query, update, options);
          if (!config) {
            config = await MongooseSystemConfig.create(update);
          }
          return makeMongooseDoc(config.toObject());
        },
        () => {
          const configs = readCollection('systemconfigs');
          if (configs.length === 0) {
            const newConfig = {
              _id: 'default',
              announcement: 'Welcome to Campus Media v2.0 (Powered by MongoDB)',
              allowSignups: true,
              maintenanceMode: false,
              interviewCategories: [],
              ...update
            };
            configs.push(newConfig);
            writeCollection('systemconfigs', configs);
            return makeMongooseDoc(newConfig);
          } else {
            configs[0] = { ...configs[0], ...update };
            writeCollection('systemconfigs', configs);
            return makeMongooseDoc(configs[0]);
          }
        }
      );
    }
  },

  Post: {
    async find(query = {}) {
      return executeDbQuery(
        async () => {
          const mongoPosts = await PostModel.find(query).sort({ createdAt: -1 });
          const localPosts = readCollection('posts');
          
          const merged = [...mongoPosts.map(p => makeMongooseDoc(p.toObject()))];
          for (const lp of localPosts) {
            const stringId = lp._id ? lp._id.toString() : '';
            if (!merged.some(p => p._id?.toString() === stringId || p.id === stringId)) {
              // Basic query filter for JSON fallback
              if (query.author && lp.author !== query.author) continue;
              merged.push(makeMongooseDoc(lp));
            }
          }
          
          merged.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          return merged;
        },
        () => {
          const posts = readCollection('posts');
          let filtered = posts;
          if (query.author) {
            filtered = posts.filter(p => p.author === query.author);
          }
          filtered.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          return filtered.map(p => makeMongooseDoc(p));
        }
      );
    },

    async findById(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const posts = readCollection('posts');
            const found = posts.find(p => p._id === id);
            return found ? makeMongooseDoc(found) : null;
          }
          const post = await PostModel.findById(id);
          if (post) return makeMongooseDoc(post.toObject());
          const posts = readCollection('posts');
          const found = posts.find(p => p._id === id);
          return found ? makeMongooseDoc(found) : null;
        },
        () => {
          const posts = readCollection('posts');
          const found = posts.find(p => p._id === id);
          return found ? makeMongooseDoc(found) : null;
        }
      );
    },

    async create(data) {
      return executeDbQuery(
        async () => {
          const post = new PostModel(data);
          await post.save();
          return makeMongooseDoc(post.toObject());
        },
        () => {
          const posts = readCollection('posts');
          const newPost = {
            ...data,
            _id: data._id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
            createdAt: new Date().toISOString(),
            likes: [],
            comments: []
          };
          posts.push(newPost);
          writeCollection('posts', posts);
          return makeMongooseDoc(newPost);
        }
      );
    },

    async findByIdAndUpdate(id, update, options = { new: true }) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const posts = readCollection('posts');
            const idx = posts.findIndex(p => p._id === id);
            if (idx >= 0) {
              posts[idx] = { ...posts[idx], ...update };
              writeCollection('posts', posts);
              return makeMongooseDoc(posts[idx]);
            }
            return null;
          }
          const post = await PostModel.findByIdAndUpdate(id, update, options);
          if (post) {
            return makeMongooseDoc(post.toObject());
          }
          const posts = readCollection('posts');
          const idx = posts.findIndex(p => p._id === id);
          if (idx >= 0) {
            posts[idx] = { ...posts[idx], ...update };
            writeCollection('posts', posts);
            return makeMongooseDoc(posts[idx]);
          }
          return null;
        },
        () => {
          const posts = readCollection('posts');
          const idx = posts.findIndex(p => p._id === id);
          if (idx >= 0) {
            posts[idx] = { ...posts[idx], ...update };
            writeCollection('posts', posts);
            return makeMongooseDoc(posts[idx]);
          }
          return null;
        }
      );
    },

    async findByIdAndDelete(id) {
      return executeDbQuery(
        async () => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const posts = readCollection('posts');
            const filtered = posts.filter(p => p._id !== id);
            writeCollection('posts', filtered);
            return { success: true };
          }
          await PostModel.findByIdAndDelete(id);
          const posts = readCollection('posts');
          const filtered = posts.filter(p => p._id !== id);
          writeCollection('posts', filtered);
          return { success: true };
        },
        () => {
          const posts = readCollection('posts');
          const filtered = posts.filter(p => p._id !== id);
          writeCollection('posts', filtered);
          return { success: true };
        }
      );
    }
  }
};
