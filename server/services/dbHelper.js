import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { User as MongooseUser } from '../models/User.js';
import { Session as MongooseSession } from '../models/Session.js';
import MongooseOTP from '../models/OTP.js';
import { Resume as MongooseResume } from '../models/Resume.js';
import { Question as MongooseQuestion } from '../models/Question.js';
import { Job as MongooseJob } from '../models/Job.js';
import { ChatMessage as MongooseChatMessage } from '../models/ChatMessage.js';
import { Resource as MongooseNote } from '../models/Resource.js';
import { SystemConfig as MongooseSystemConfig } from '../models/SystemConfig.js';
import { Media as MongooseMedia } from '../models/Media.js';

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

function makeMongooseOTPDoc(obj) {
  if (!obj) return obj;
  const doc = makeMongooseDoc(obj);
  doc.compareOTP = async function(enteredOTP) {
    return await bcrypt.compare(enteredOTP, this.otp);
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
      console.warn("⚠️ MongoDB offline or operation failed. Falling back to local file DB:", err.message);
      return await localOp();
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
          // If query has id, map it to _id
          let finalQuery = { ...query };
          if (finalQuery.id && !finalQuery._id) {
            finalQuery._id = finalQuery.id;
            delete finalQuery.id;
          }
          const user = await MongooseUser.findOne(finalQuery);
          if (user) {
            return makeMongooseDoc(user.toObject());
          }
          // Fallback check in local JSON
          const users = readCollection('users');
          const found = users.find(u => {
            if (query.email && u.email === query.email) return true;
            if (query.username && u.username === query.username) return true;
            if (query._id && u._id === query._id) return true;
            return false;
          });
          return found ? makeMongooseDoc(found) : null;
        },
        () => {
          const users = readCollection('users');
          const found = users.find(u => {
            if (query.email && u.email === query.email) return true;
            if (query.username && u.username === query.username) return true;
            if (query._id && u._id === query._id) return true;
            return false;
          });
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
          // Sync fullname to name for compatibility
          const ADMIN_EMAILS = [
            "pruthviraj2005patil@gmail.com",
            "sushantawalekar286@gmail.com"
          ];
          const email = (data.email || '').trim().toLowerCase();
          const determinedRole = ADMIN_EMAILS.includes(email) ? 'ADMIN' : 'USER';
          const preparedData = {
            ...data,
            role: determinedRole,
            name: data.fullname || data.name || '',
            fullname: data.fullname || data.name || ''
          };
          const mongooseUser = new MongooseUser(preparedData);
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
          const preparedData = {
            ...data,
            name: data.fullname || data.name || '',
            fullname: data.fullname || data.name || ''
          };
          const newUser = {
            ...preparedData,
            _id: data._id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
            joinedDate: data.joinedDate || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            status: data.status || 'ACTIVE',
            role: determinedRole,
            isVerified: data.isVerified || false,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            skills: data.skills || [],
            education: data.education || [],
            socialLinks: data.socialLinks || { website: '', linkedin: '', github: '', twitter: '' },
            privacySettings: data.privacySettings || { profileVisibility: 'public', showSkills: true, showEducation: true },
            notificationSettings: data.notificationSettings || { emailAlerts: true, pushAlerts: true },
            onlineStatus: 'offline',
            lastSeen: new Date().toISOString()
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
          // If update contains fullname, keep name in sync
          const finalUpdate = { ...update };
          if (finalUpdate.fullname) {
            finalUpdate.name = finalUpdate.fullname;
          } else if (finalUpdate.name) {
            finalUpdate.fullname = finalUpdate.name;
          }
          if (!mongoose.Types.ObjectId.isValid(id)) {
            const users = readCollection('users');
            const idx = users.findIndex(u => u._id === id);
            if (idx >= 0) {
              users[idx] = { ...users[idx], ...finalUpdate };
              writeCollection('users', users);
              return makeMongooseDoc(users[idx]);
            }
            return null;
          }
          const user = await MongooseUser.findByIdAndUpdate(id, finalUpdate, options);
          if (user) {
            return makeMongooseDoc(user.toObject());
          }
          const users = readCollection('users');
          const idx = users.findIndex(u => u._id === id);
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...finalUpdate };
            writeCollection('users', users);
            return makeMongooseDoc(users[idx]);
          }
          return null;
        },
        () => {
          const users = readCollection('users');
          const idx = users.findIndex(u => u._id === id);
          if (idx >= 0) {
            const finalUpdate = { ...update };
            if (finalUpdate.fullname) {
              finalUpdate.name = finalUpdate.fullname;
            } else if (finalUpdate.name) {
              finalUpdate.fullname = finalUpdate.name;
            }
            users[idx] = { ...users[idx], ...finalUpdate };
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

  Session: {
    async create(data) {
      return executeDbQuery(
        async () => {
          const session = new MongooseSession(data);
          await session.save();
          return makeMongooseDoc(session.toObject());
        },
        () => {
          const sessions = readCollection('sessions');
          const newSession = {
            ...data,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          sessions.push(newSession);
          writeCollection('sessions', sessions);
          return makeMongooseDoc(newSession);
        }
      );
    },

    async findOne(query) {
      return executeDbQuery(
        async () => {
          const session = await MongooseSession.findOne(query);
          return session ? makeMongooseDoc(session.toObject()) : null;
        },
        () => {
          const sessions = readCollection('sessions');
          // simple query solver
          const found = sessions.find(s => {
            if (query.refreshToken && s.refreshToken !== query.refreshToken) return false;
            if (query.userId && s.userId !== query.userId) return false;
            if (query._id && s._id !== query._id) return false;
            return true;
          });
          return found ? makeMongooseDoc(found) : null;
        }
      );
    },

    async find(query = {}) {
      return executeDbQuery(
        async () => {
          const mongoSessions = await MongooseSession.find(query);
          const localSessions = readCollection('sessions');
          
          const merged = [...mongoSessions.map(s => makeMongooseDoc(s.toObject()))];
          for (const ls of localSessions) {
            const userIdStr = query.userId ? query.userId.toString() : '';
            if (query.userId && ls.userId.toString() !== userIdStr) continue;
            if (!merged.some(s => s.refreshToken === ls.refreshToken)) {
              merged.push(makeMongooseDoc(ls));
            }
          }
          return merged;
        },
        () => {
          const sessions = readCollection('sessions');
          const userIdStr = query.userId ? query.userId.toString() : '';
          const filtered = sessions.filter(s => {
            if (query.userId && s.userId.toString() !== userIdStr) return false;
            return true;
          });
          return filtered.map(s => makeMongooseDoc(s));
        }
      );
    },

    async deleteOne(query) {
      return executeDbQuery(
        async () => {
          await MongooseSession.deleteOne(query);
          const sessions = readCollection('sessions');
          const filtered = sessions.filter(s => {
            if (query.refreshToken && s.refreshToken === query.refreshToken) return false;
            if (query._id && s._id === query._id) return false;
            return true;
          });
          writeCollection('sessions', filtered);
          return { deletedCount: 1 };
        },
        () => {
          const sessions = readCollection('sessions');
          const filtered = sessions.filter(s => {
            if (query.refreshToken && s.refreshToken === query.refreshToken) return false;
            if (query._id && s._id === query._id) return false;
            return true;
          });
          writeCollection('sessions', filtered);
          return { deletedCount: 1 };
        }
      );
    },

    async deleteMany(query) {
      return executeDbQuery(
        async () => {
          await MongooseSession.deleteMany(query);
          const sessions = readCollection('sessions');
          const userIdStr = query.userId ? query.userId.toString() : '';
          const filtered = sessions.filter(s => {
            if (query.userId && s.userId.toString() === userIdStr) return false;
            return true;
          });
          writeCollection('sessions', filtered);
          return { deletedCount: 1 };
        },
        () => {
          const sessions = readCollection('sessions');
          const userIdStr = query.userId ? query.userId.toString() : '';
          const filtered = sessions.filter(s => {
            if (query.userId && s.userId.toString() === userIdStr) return false;
            return true;
          });
          writeCollection('sessions', filtered);
          return { deletedCount: 1 };
        }
      );
    }
  },

  OTP: {
    async create(data) {
      return executeDbQuery(
        async () => {
          const otp = new MongooseOTP(data);
          await otp.save();
          return makeMongooseOTPDoc(otp.toObject());
        },
        () => {
          const otps = readCollection('otps');
          const salt = bcrypt.genSaltSync(10);
          const hashedOtp = bcrypt.hashSync(data.otp, salt);
          const newOtp = {
            ...data,
            otp: hashedOtp,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString()
          };
          otps.push(newOtp);
          writeCollection('otps', otps);
          return makeMongooseOTPDoc(newOtp);
        }
      );
    },

    async find(query = {}) {
      return executeDbQuery(
        async () => {
          const mongoOtps = await MongooseOTP.find(query);
          const localOtps = readCollection('otps');
          const merged = [...mongoOtps.map(o => makeMongooseOTPDoc(o.toObject()))];
          for (const lo of localOtps) {
            if (query.email && lo.email !== query.email) continue;
            if (query.type && lo.type !== query.type) continue;
            const stringId = lo._id ? lo._id.toString() : '';
            if (!merged.some(o => o._id?.toString() === stringId || o.id === stringId)) {
              merged.push(makeMongooseOTPDoc(lo));
            }
          }
          return merged;
        },
        () => {
          const otps = readCollection('otps');
          const filtered = otps.filter(o => {
            if (query.email && o.email !== query.email) return false;
            if (query.type && o.type !== query.type) return false;
            return true;
          });
          return filtered.map(o => makeMongooseOTPDoc(o));
        }
      );
    },

    async findOne(query) {
      return executeDbQuery(
        async () => {
          const otp = await MongooseOTP.findOne(query);
          return otp ? makeMongooseOTPDoc(otp.toObject()) : null;
        },
        () => {
          const otps = readCollection('otps');
          const found = otps.find(o => {
            if (query.email && o.email !== query.email) return false;
            if (query.otp && o.otp !== query.otp) return false;
            if (query.type && o.type !== query.type) return false;
            return true;
          });
          return found ? makeMongooseOTPDoc(found) : null;
        }
      );
    },

    async deleteOne(query) {
      return executeDbQuery(
        async () => {
          await MongooseOTP.deleteOne(query);
          const otps = readCollection('otps');
          const filtered = otps.filter(o => {
            if (query._id && o._id !== query._id) return true;
            if (query.email && o.email !== query.email) return true;
            return false;
          });
          writeCollection('otps', filtered);
          return { deletedCount: 1 };
        },
        () => {
          const otps = readCollection('otps');
          const filtered = otps.filter(o => {
            if (query._id && o._id !== query._id) return true;
            if (query.email && o.email !== query.email) return true;
            return false;
          });
          writeCollection('otps', filtered);
          return { deletedCount: 1 };
        }
      );
    },

    async deleteMany(query) {
      return executeDbQuery(
        async () => {
          await MongooseOTP.deleteMany(query);
          const otps = readCollection('otps');
          const filtered = otps.filter(o => {
            if (query.email && o.email === query.email) return false;
            return true;
          });
          writeCollection('otps', filtered);
          return { deletedCount: 1 };
        },
        () => {
          const otps = readCollection('otps');
          const filtered = otps.filter(o => {
            if (query.email && o.email === query.email) return false;
            return true;
          });
          writeCollection('otps', filtered);
          return { deletedCount: 1 };
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

  Media: {
    async create(data) {
      return executeDbQuery(
        async () => {
          const media = new MongooseMedia(data);
          await media.save();
          return makeMongooseDoc(media.toObject());
        },
        () => {
          const list = readCollection('media');
          const item = {
            ...data,
            _id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          list.push(item);
          writeCollection('media', list);
          return makeMongooseDoc(item);
        }
      );
    },

    async findById(id) {
      return executeDbQuery(
        async () => {
          const item = await MongooseMedia.findById(id);
          return item ? makeMongooseDoc(item.toObject()) : null;
        },
        () => {
          const list = readCollection('media');
          const found = list.find(item => item._id === id || item.id === id);
          return found ? makeMongooseDoc(found) : null;
        }
      );
    },

    async find(query) {
      return executeDbQuery(
        async () => {
          const items = await MongooseMedia.find(query);
          return items.map(i => makeMongooseDoc(i.toObject()));
        },
        () => {
          const list = readCollection('media');
          const filtered = list.filter(item => {
            for (const key in query) {
              if (item[key] !== query[key]) return false;
            }
            return true;
          });
          return filtered.map(i => makeMongooseDoc(i));
        }
      );
    },

    async deleteOne(query) {
      return executeDbQuery(
        async () => {
          await MongooseMedia.deleteOne(query);
          const list = readCollection('media');
          const index = list.findIndex(item => {
            for (const key in query) {
              if (item[key] !== query[key]) return false;
            }
            return true;
          });
          if (index !== -1) {
            list.splice(index, 1);
            writeCollection('media', list);
          }
          return { deletedCount: 1 };
        },
        () => {
          const list = readCollection('media');
          const index = list.findIndex(item => {
            for (const key in query) {
              if (item[key] !== query[key]) return false;
            }
            return true;
          });
          if (index !== -1) {
            list.splice(index, 1);
            writeCollection('media', list);
          }
          return { deletedCount: 1 };
        }
      );
    }
  }
};
