import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['note', 'pyq', 'assignment', 'lab_manual', 'ppt', 'book', 'pdf', 'project'],
    default: 'note'
  },
  fileUrl: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  course: {
    type: String,
    default: ''
  },
  semester: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  downloadsCount: {
    type: Number,
    default: 0
  },
  bookmarksCount: {
    type: Number,
    default: 0
  },
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 }
  }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Legacy stubs for Note.js compatibility
  authorId: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  link: { type: String, default: '' }
}, {
  timestamps: true
});

// Sync legacy properties on save
resourceSchema.pre('save', function () {
  if (this.link && !this.fileUrl) {
    this.fileUrl = this.link;
  }
  if (this.fileUrl && !this.link) {
    this.link = this.fileUrl;
  }
  if (this.authorId && !this.uploaderId) {
    this.uploaderId = this.authorId;
  }
  if (this.uploaderId && !this.authorId) {
    this.authorId = this.uploaderId;
  }
});

resourceSchema.index({ department: 1, subject: 1 });
resourceSchema.index({ uploaderId: 1 });
resourceSchema.index({ approvalStatus: 1 });

export const Resource = mongoose.model('Resource', resourceSchema);
export const Note = Resource; // Export legacy alias to prevent any imports from breaking
