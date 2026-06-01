import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  type: { type: String, enum: ['Full-time', 'Internship', 'Part-time'] },
  description: String,
  applicationLink: String,
  category: { type: String, enum: ['On-Campus', 'Off-Campus', 'Remote'] },
  deadline: String,
  postedDate: { type: String, default: () => new Date().toLocaleDateString() }, // Store as string for UI simplicity
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export const Job = mongoose.model('Job', jobSchema);
