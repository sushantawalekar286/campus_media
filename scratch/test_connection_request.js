import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const { User } = await import('../server/models/User.js');
    const { Connection } = await import('../server/models/Connection.js');
    const { Notification } = await import('../server/models/Notification.js');

    // Get two different users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('Need at least 2 users in the database to test connections.');
      await mongoose.disconnect();
      return;
    }

    const [userA, userB] = users;
    console.log(`User A: ${userA.fullname} (${userA._id})`);
    console.log(`User B: ${userB.fullname} (${userB._id})`);

    // Clean up any existing connection/notifications between them first
    await Connection.deleteMany({
      $or: [
        { requester: userA._id, recipient: userB._id },
        { requester: userB._id, recipient: userA._id }
      ]
    });
    await Notification.deleteMany({
      $or: [
        { senderId: userA._id, receiverId: userB._id },
        { senderId: userB._id, receiverId: userA._id }
      ]
    });

    const { tokenService } = await import('../server/services/tokenService.js');
    const tokenA = tokenService.generateAccessToken(userA);

    // 1. Send connection request
    console.log('\n--- 1. Sending Connection Request (A -> B) ---');
    const followUrl = `http://localhost:3000/api/users/follow/${userB._id}`;
    let res = await axios.post(followUrl, {}, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.log(`🟢 Status: ${res.status}`);
    console.log('Response:', res.data);

    // Verify DB
    const connInDb = await Connection.findOne({ requester: userA._id, recipient: userB._id });
    console.log('Connection in DB:', connInDb ? {
      _id: connInDb._id,
      requester: connInDb.requester,
      recipient: connInDb.recipient,
      status: connInDb.status
    } : '❌ NOT FOUND');

    const notifInDb = await Notification.findOne({ senderId: userA._id, receiverId: userB._id });
    console.log('Notification in DB:', notifInDb ? {
      _id: notifInDb._id,
      type: notifInDb.type,
      title: notifInDb.title,
      message: notifInDb.message
    } : '❌ NOT FOUND');

    // 2. Attempt duplicate request
    console.log('\n--- 2. Attempting Duplicate Request (A -> B) ---');
    try {
      res = await axios.post(followUrl, {}, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      console.log(`🔴 Duplicate Succeeded? Status: ${res.status}`);
    } catch (e) {
      console.log(`🟢 Duplicate Blocked! Status: ${e.response?.status}`);
      console.log('Response:', e.response?.data);
    }

    // Clean up
    await Connection.deleteOne({ _id: connInDb?._id });
    await Notification.deleteMany({
      $or: [
        { senderId: userA._id, receiverId: userB._id }
      ]
    });
    console.log('\nCleanup finished.');

  } catch (err) {
    console.error('Test failed:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run();
