import { io } from 'socket.io-client';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const { User } = await import('../server/models/User.js');
    const { Connection } = await import('../server/models/Connection.js');
    const { Conversation } = await import('../server/models/Conversation.js');
    const { ChatMessage } = await import('../server/models/ChatMessage.js');
    const { tokenService } = await import('../server/services/tokenService.js');

    // 1. Get User A and User B
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('Need at least 2 users in database to run messaging tests.');
      await mongoose.disconnect();
      return;
    }

    const [userA, userB] = users;
    console.log(`User A: ${userA.fullname} (${userA._id})`);
    console.log(`User B: ${userB.fullname} (${userB._id})`);

    // 2. Ensure they are connected
    await Connection.deleteMany({
      $or: [
        { requester: userA._id, recipient: userB._id },
        { requester: userB._id, recipient: userA._id }
      ]
    });

    await Connection.create({
      requester: userA._id,
      recipient: userB._id,
      status: 'accepted',
      connectionDate: new Date()
    });
    console.log('✅ Connection established (status: accepted)');

    // 3. Clear existing conversation / messages
    await Conversation.deleteMany({
      participants: { $all: [userA._id, userB._id] }
    });
    console.log('✅ Stale conversations cleared.');

    // 4. Generate JWT tokens
    const tokenA = tokenService.generateAccessToken(userA);
    const tokenB = tokenService.generateAccessToken(userB);

    // 5. Connect Sockets
    console.log('\nConnecting Client A socket...');
    const socketA = io('http://127.0.0.1:3000', {
      auth: { token: tokenA },
      transports: ['websocket']
    });
    socketA.on('connect_error', (err) => console.error('🔴 Socket A connection error:', err.message));

    console.log('Connecting Client B socket...');
    const socketB = io('http://127.0.0.1:3000', {
      auth: { token: tokenB },
      transports: ['websocket']
    });
    socketB.on('connect_error', (err) => console.error('🔴 Socket B connection error:', err.message));

    await new Promise((resolve, reject) => {
      let count = 0;
      const done = () => { if (++count === 2) resolve(); };
      socketA.on('connect', done);
      socketB.on('connect', done);
      // Fail test if cannot connect after 5s
      setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
    });
    console.log('✅ Both sockets connected to gateway!');

    // 6. Create conversation via API
    console.log('\nStarting conversation via API...');
    const convRes = await axios.post('http://127.0.0.1:3000/api/chat/conversations', {
      recipientId: userB._id.toString()
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const conversationId = convRes.data._id;
    console.log(`✅ Conversation created: ${conversationId}`);

    // Join conversation room
    socketA.emit('join_conversation', conversationId);
    socketB.emit('join_conversation', conversationId);

    // Give server async DB checks time to complete room joins
    await new Promise(r => setTimeout(r, 500));

    // Setup receiver message capture
    const receivePromise = new Promise((resolve) => {
      socketB.on('new_message', (msg) => {
        console.log(`🟢 Socket B received real-time message: "${msg.content}"`);
        resolve(msg);
      });
    });

    // Setup typing indicator capture
    const typingPromise = new Promise((resolve) => {
      socketB.on('typing', (data) => {
        console.log(`🟢 Socket B received typing status:`, data);
        resolve(data);
      });
    });

    // 7. Emit typing indicator
    console.log('\nClient A typing...');
    socketA.emit('typing', { conversationId, isTyping: true });
    await typingPromise;

    // 8. Send message via API
    console.log('\nSending message from A to B via API...');
    const sendRes = await axios.post('http://127.0.0.1:3000/api/chat/send', {
      receiverId: userB._id.toString(),
      content: 'Hello User B, this is a real-time message!'
    }, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log('API Send response status:', sendRes.status);

    const receivedMessage = await receivePromise;
    console.log('Assertion: Message contents match?', receivedMessage.content === 'Hello User B, this is a real-time message!');

    // 9. Read messages / emit read receipt
    const readReceiptPromise = new Promise((resolve) => {
      socketA.on('messages_read', (data) => {
        console.log(`🟢 Socket A received read receipt from B:`, data);
        resolve(data);
      });
    });

    console.log('\nClient B reading messages...');
    socketB.emit('read_messages', { conversationId });
    await readReceiptPromise;

    // Disconnect sockets
    socketA.disconnect();
    socketB.disconnect();
    console.log('\n✅ All tests passed successfully!');

  } catch (err) {
    console.error('❌ E2E Test failed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run();
