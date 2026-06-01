import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  channel: { type: String, required: true, index: true },
  timestamp: { type: Number, default: Date.now },
  isFlagged: { type: Boolean, default: false }
});

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
