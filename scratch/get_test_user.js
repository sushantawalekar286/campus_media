import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function run() {
  await mongoose.connect(MONGO_URI);
  const { User } = await import('../server/models/User.js');
  const user = await User.findOne();
  if (user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    user.password = hashedPassword;
    await user.save();
    console.log(`User found and password reset!`);
    console.log(`Email: ${user.email}`);
    console.log(`Fullname: ${user.fullname}`);
  } else {
    console.log('No user found');
  }
  await mongoose.disconnect();
}

run();
