import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['like', 'comment', 'reply', 'mention', 'follow', 'connection', 'message', 'achievement', 'resource_approval', 'system'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  readStatus: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  
  // Legacy support fields
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // legacy alias for receiverId
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // legacy target link
  isRead: { type: Boolean, default: false } // legacy alias for readStatus
}, {
  timestamps: true
});

notificationSchema.index({ receiverId: 1, readStatus: 1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
