import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'voice'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: ''
  },
  seenStatus: {
    type: Boolean,
    default: false
  },
  deliveredStatus: {
    type: Boolean,
    default: false
  },
  edited: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reaction: { type: String }
  }],
  
  // Legacy support fields
  text: { type: String }, // legacy alias for content
  channel: { type: String }, // legacy composite key channel
  timestamp: { type: Number, default: Date.now }
}, {
  timestamps: true
});

chatMessageSchema.index({ conversationId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
