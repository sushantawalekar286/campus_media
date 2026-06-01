import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rawText: { type: String, required: true }, // For AI Context
  contentHash: { type: String, required: true, index: true }, // Duplicate check
  targetRole: String,
  analysis: {
    score: Number,
    atsCompatibility: Number,
    extractedData: Object, // JSON from AI
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    optimizedPoints: [{ original: String, optimized: String, reason: String }],
    summary: String
  },
  createdAt: { type: Date, default: Date.now }
});

export const Resume = mongoose.model('Resume', resumeSchema);
