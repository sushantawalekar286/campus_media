import { Server } from 'socket.io';
import { tokenService } from './tokenService.js';
import { dbHelper } from './dbHelper.js';

export const initializeSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow development origins
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // 1. Connection Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.['authorization'];
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const jwtToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = tokenService.verifyAccessToken(jwtToken);
      
      if (!decoded) {
        return next(new Error('Authentication error: Session expired or invalid signature'));
      }

      const userId = decoded.userId || decoded.id;
      const user = await dbHelper.User.findById(userId);
      if (!user) {
        return next(new Error('Authentication error: User account not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      next(new Error('Authentication error'));
    }
  });

  // 2. Connection Listener
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Real-time client connected: Socket ${socket.id} (User: ${socket.user.fullname} | ${userId})`);

    // Join personal notification/direct-message room
    socket.join(userId);

    try {
      // Toggle online presence status
      await dbHelper.User.findByIdAndUpdate(userId, { onlineStatus: 'online' });
      socket.broadcast.emit('user_status', { 
        userId: userId, 
        status: 'online' 
      });
    } catch (err) {
      console.error('Error toggling online presence:', err.message);
    }

    // Join conversation room (verifies room ownership)
    socket.on('join_conversation', async (conversationId) => {
      if (!conversationId) return;
      try {
        const { Conversation } = await import('../models/Conversation.js');
        const conv = await Conversation.findById(conversationId);
        
        if (conv && conv.participants.some(p => p.toString() === userId)) {
          socket.join(conversationId);
          console.log(`💬 Socket ${socket.id} joined conversation room: ${conversationId}`);
        } else {
          console.warn(`⚠️ Socket ${socket.id} tried to join unauthorized room: ${conversationId}`);
        }
      } catch (err) {
        console.error('Error joining conversation room:', err.message);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return;
      socket.leave(conversationId);
      console.log(`💬 Socket ${socket.id} left room: ${conversationId}`);
    });

    // Handle typing indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('typing', { 
        conversationId, 
        userId: userId, 
        isTyping 
      });
    });

    // Handle read receipts mapping
    socket.on('read_messages', async ({ conversationId }) => {
      if (!conversationId) return;
      try {
        const { ChatMessage } = await import('../models/ChatMessage.js');
        const { Conversation } = await import('../models/Conversation.js');

        // Mark unread messages received by current user in this convo as read
        await ChatMessage.updateMany(
          { conversationId, receiverId: userId, seenStatus: false },
          { seenStatus: true }
        );

        // Reset unread count for current user
        const conv = await Conversation.findById(conversationId);
        if (conv) {
          const countMap = conv.unreadCount || new Map();
          countMap.set(userId, 0);
          conv.unreadCount = countMap;
          await conv.save();
        }

        // Notify other participants
        socket.to(conversationId).emit('messages_read', { 
          conversationId, 
          userId: userId 
        });
      } catch (err) {
        console.error('Error updating read receipts:', err.message);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Real-time client disconnected: Socket ${socket.id} (User: ${socket.user.fullname})`);
      try {
        const lastSeenDate = new Date();
        await dbHelper.User.findByIdAndUpdate(userId, { 
          onlineStatus: 'offline', 
          lastSeen: lastSeenDate 
        });
        socket.broadcast.emit('user_status', { 
          userId: userId, 
          status: 'offline', 
          lastSeen: lastSeenDate 
        });
      } catch (err) {
        console.error('Error on disconnect:', err.message);
      }
    });
  });

  return io;
};
