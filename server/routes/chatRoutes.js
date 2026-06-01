import express from 'express';
import mongoose from 'mongoose';
import { ChatMessage } from '../models/ChatMessage.js';
import { User } from '../models/User.js';
import { Follow } from '../models/Follow.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const toObjectId = (val) => mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;

async function checkConnection(userA, userB) {
  const follow = await Follow.findOne({
    $or: [
      { followerId: userA, followingId: userB },
      { followerId: userA.toString(), followingId: userB.toString() },
      { followerId: userA, followingId: userB.toString() },
      { followerId: userA.toString(), followingId: userB },
      
      { followerId: userB, followingId: userA },
      { followerId: userB.toString(), followingId: userA.toString() },
      { followerId: userB, followingId: userA.toString() },
      { followerId: userB.toString(), followingId: userA }
    ],
    status: 'accepted'
  });
  return !!follow;
}

const router = express.Router();

// Get list of conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving the current user
    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ timestamp: -1 });

    const conversationsMap = new Map();
    for (const msg of messages) {
      const otherId = msg.senderId.toString() === userId.toString() ? msg.receiverId.toString() : msg.senderId.toString();
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, msg);
      }
    }

    const conversationList = [];
    for (const [otherId, lastMsg] of conversationsMap.entries()) {
      const isConnected = await checkConnection(userId, otherId);
      if (!isConnected) continue;

      const otherUser = await User.findById(otherId).select('fullname username profilePicture headline');
      if (otherUser) {
        conversationList.push({
          user: otherUser,
          lastMessage: lastMsg.content || lastMsg.text,
          timestamp: lastMsg.timestamp
        });
      }
    }

    // Sort conversations by latest message timestamp
    conversationList.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json(conversationList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a specific conversation
router.get('/messages/:recipientId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipientId } = req.params;

    // Check if connected
    const isConnected = await checkConnection(userId, recipientId);
    if (!isConnected) {
      return res.status(403).json({ error: 'You can only message connections' });
    }

    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId, receiverId: recipientId },
        { senderId: recipientId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a new message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    // Check if connected
    const isConnected = await checkConnection(userId, receiverId);
    if (!isConnected) {
      return res.status(403).json({ error: 'You can only message connections' });
    }

    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender user not found' });
    }

    const channel = [userId.toString(), receiverId.toString()].sort().join('_');

    const message = await ChatMessage.create({
      senderId: userId,
      receiverId,
      senderName: sender.fullname || sender.username,
      content,
      text: content,
      channel,
      timestamp: Date.now()
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
