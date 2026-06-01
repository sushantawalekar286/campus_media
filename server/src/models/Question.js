import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  company: String,
  role: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  text: { type: String, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedByName: String,
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING' 
  },
  date: { type: Date, default: Date.now }
});

export const Question = mongoose.model('Question', questionSchema);
