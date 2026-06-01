import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String },
  text: { type: String },
  content: { type: String, required: true },
  channel: { type: String, index: true },
  timestamp: { type: Number, default: Date.now },
  isFlagged: { type: Boolean, default: false }
});

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
