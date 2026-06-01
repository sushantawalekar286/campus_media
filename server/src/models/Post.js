import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userImage: { type: String, default: '' },
  text: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorImage: { type: String, default: '' },
  content: { type: String, required: true },
  mediaUrl: { type: String, default: '' }, // For Cloudinary images/videos
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  hashtags: [{ type: String }],
  isEdited: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'followers'], default: 'public' }
}, {
  timestamps: true
});

// Indexes for feed optimization and search
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
