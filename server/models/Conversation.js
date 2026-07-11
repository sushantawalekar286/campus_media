import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  pinned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  archived: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mute: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  typingStatus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
