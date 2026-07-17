import express from 'express';
import mongoose from 'mongoose';
import { ChatMessage } from '../models/ChatMessage.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import { Connection } from '../models/Connection.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: check connection status between two users
async function checkConnection(userA, userB) {
  const conn = await Connection.findOne({
    $or: [
      { requester: userA, recipient: userB },
      { requester: userB, recipient: userA }
    ],
    status: 'accepted'
  });
  return !!conn;
}

// 1. Get list of conversations for current user
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations containing this user
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'fullname username profilePicture headline onlineStatus lastSeen department skills')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    const conversationList = [];

    for (const conv of conversations) {
      // Extract the other participant
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      if (!otherParticipant) continue;

      // Security check: Only include conversations of active connections
      const isConnected = await checkConnection(userId, otherParticipant._id);
      if (!isConnected) continue;

      // Extract unreadCount map value
      const unreadCount = conv.unreadCount instanceof Map 
        ? (conv.unreadCount.get(userId.toString()) || 0)
        : (conv.unreadCount?.[userId.toString()] || 0);

      conversationList.push({
        _id: conv._id,
        user: otherParticipant,
        lastMessage: conv.lastMessage?.content || '',
        messageType: conv.lastMessage?.messageType || 'text',
        timestamp: conv.lastMessage?.createdAt || conv.updatedAt,
        unreadCount
      });
    }

    res.status(200).json(conversationList);
  } catch (err) {
    console.error('Error fetching conversations:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Start or get conversation with a specific recipient user
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId is required' });
    }

    // Security: Validate connection is active
    const isConnected = await checkConnection(userId, recipientId);
    if (!isConnected) {
      return res.status(403).json({ error: 'You can only message connections' });
    }

    // Find or create conversation
    let conv = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [userId, recipientId],
        unreadCount: {
          [userId.toString()]: 0,
          [recipientId.toString()]: 0
        }
      });
    }

    const populatedConv = await Conversation.findById(conv._id)
      .populate('participants', 'fullname username profilePicture headline onlineStatus lastSeen department skills')
      .populate('lastMessage');

    const otherUser = populatedConv.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    const unreadCount = populatedConv.unreadCount instanceof Map 
      ? (populatedConv.unreadCount.get(userId.toString()) || 0)
      : (populatedConv.unreadCount?.[userId.toString()] || 0);

    res.status(200).json({
      _id: populatedConv._id,
      user: otherUser,
      lastMessage: populatedConv.lastMessage?.content || '',
      messageType: populatedConv.lastMessage?.messageType || 'text',
      timestamp: populatedConv.lastMessage?.createdAt || populatedConv.updatedAt,
      unreadCount
    });
  } catch (err) {
    console.error('Error starting conversation:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Get messages for a specific conversation or recipient ID (supports both client-side lookups)
router.get('/messages/:recipientOrConvId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipientOrConvId } = req.params;

    let conv;

    // Check if parameter is conversation ID
    if (mongoose.Types.ObjectId.isValid(recipientOrConvId)) {
      conv = await Conversation.findById(recipientOrConvId);
    }

    // Fallback: Check if parameter is recipient User ID
    if (!conv && mongoose.Types.ObjectId.isValid(recipientOrConvId)) {
      conv = await Conversation.findOne({
        participants: { $all: [userId, recipientOrConvId] }
      });
    }

    if (!conv) {
      return res.status(200).json([]);
    }

    // Security check: Verify membership
    if (!conv.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Load recent message history (sorted ascending for UI timeline)
    const messages = await ChatMessage.find({ conversationId: conv._id })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. Send a message within a conversation
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiverId, content, messageType = 'text', fileUrl = '' } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required' });
    }

    // Security: Check connections model
    const isConnected = await checkConnection(userId, receiverId);
    if (!isConnected) {
      return res.status(403).json({ error: 'You can only message connections' });
    }

    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender user not found' });
    }

    // Find or create conversation
    let conv = await Conversation.findOne({
      participants: { $all: [userId, receiverId] }
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [userId, receiverId],
        unreadCount: {
          [userId.toString()]: 0,
          [receiverId.toString()]: 0
        }
      });
    }

    const channel = [userId.toString(), receiverId.toString()].sort().join('_');

    // Create the message
    const message = await ChatMessage.create({
      conversationId: conv._id,
      senderId: userId,
      receiverId,
      senderName: sender.fullname || sender.username,
      content: content || (messageType !== 'text' ? `Sent an attachment` : ''),
      text: content,
      messageType,
      fileUrl,
      channel,
      timestamp: Date.now()
    });

    // Update conversation lastMessage & increment unreadCount
    conv.lastMessage = message._id;
    const countMap = conv.unreadCount || new Map();
    const receiverStr = receiverId.toString();
    const currentUnread = (countMap.get ? countMap.get(receiverStr) : countMap[receiverStr]) || 0;
    
    if (countMap.set) {
      countMap.set(receiverStr, currentUnread + 1);
    } else {
      countMap[receiverStr] = currentUnread + 1;
    }
    conv.unreadCount = countMap;
    await conv.save();

    // Socket.io Real-Time Dispatching
    const io = req.app.get('io');
    if (io) {
      // Emit to conversation room (for users currently viewing the chat)
      io.to(conv._id.toString()).emit('new_message', message);

      // Emit to receiver's personal user room (for general indicators & badges)
      io.to(receiverStr).emit('message_received', {
        message,
        conversationId: conv._id,
        unreadCount: currentUnread + 1
      });
    }

    // Task 10: Create notification if receiver is not inside the conversation room
    let receiverInRoom = false;
    if (io) {
      const roomSockets = io.sockets.adapter.rooms.get(conv._id.toString());
      if (roomSockets) {
        for (const socketId of roomSockets) {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.user && s.user._id.toString() === receiverStr) {
            receiverInRoom = true;
            break;
          }
        }
      }
    }

    if (!receiverInRoom) {
      try {
        const { Notification } = await import('../models/Notification.js');
        const notifContent = messageType === 'text' 
          ? message.content 
          : `Sent a ${messageType}`;

        await Notification.create({
          type: 'message',
          senderId: userId,
          receiverId: receiverId,
          targetId: conv._id,
          title: 'New Message',
          message: `${sender.fullname || sender.username} sent you a message: "${notifContent.substring(0, 30)}${notifContent.length > 30 ? '...' : ''}"`,
          userId: receiverId,
          isRead: false
        });
      } catch (notifErr) {
        console.error('Failed to create database notification:', notifErr.message);
      }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
