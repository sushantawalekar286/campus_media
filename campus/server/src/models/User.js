import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['STUDENT', 'ADMIN', 'MODERATOR'], 
    default: 'STUDENT' 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'BLOCKED'], 
    default: 'ACTIVE' 
  },
  year: String,
  joinedDate: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
