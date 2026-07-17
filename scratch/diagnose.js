import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  console.log('Connecting to:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load models
    const { User } = await import('../server/models/User.js');
    const { Connection } = await import('../server/models/Connection.js');
    const { Notification } = await import('../server/models/Notification.js');

    // 1. Check users count
    const usersCount = await User.countDocuments();
    console.log(`Users count in DB: ${usersCount}`);

    if (usersCount > 0) {
      const sampleUser = await User.findOne();
      console.log('Sample User:', {
        _id: sampleUser._id,
        fullname: sampleUser.fullname,
        username: sampleUser.username,
        email: sampleUser.email
      });

      // 2. Test getDiscoverUsers queries
      const userId = sampleUser._id;
      const queryObj = { _id: { $ne: userId } };
      
      const totalUsers = await User.countDocuments(queryObj);
      console.log(`Discover total users (excluding self): ${totalUsers}`);

      const users = await User.find(queryObj).limit(5);
      console.log(`Discover users fetched: ${users.length}`);

      const connections = await Connection.find({
        $or: [{ requester: userId }, { recipient: userId }]
      });
      console.log(`Connections for user: ${connections.length}`);
    } else {
      console.log('⚠️ No users found in database!');
    }

    // 3. Check connections collections
    const connectionsCount = await Connection.countDocuments();
    console.log(`Connections count: ${connectionsCount}`);

    // 4. Check notifications count
    const notificationsCount = await Notification.countDocuments();
    console.log(`Notifications count: ${notificationsCount}`);

  } catch (err) {
    console.error('❌ Diagnostic error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
