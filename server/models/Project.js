import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  techStack: [{
    type: String
  }],
  githubUrl: {
    type: String,
    default: ''
  },
  demoUrl: {
    type: String,
    default: ''
  },
  media: [{
    type: String
  }],
  teamMembers: [{
    type: mongoose.Schema.Types.Mixed // can be reference to User or custom input string
  }],
  role: {
    type: String,
    default: 'Lead Developer'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'completed'
  }
}, {
  timestamps: true
});

projectSchema.index({ userId: 1 });

export const Project = mongoose.model('Project', projectSchema);
