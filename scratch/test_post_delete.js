import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { postController } from '../server/controllers/postController.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-media';

async function runTest() {
  console.log("=== Starting Post Delete Verification ===");

  await mongoose.connect(MONGO_URI);
  const { User } = await import('../server/models/User.js');
  const { Post } = await import('../server/models/Post.js');
  
  // Find a test user
  const user = await User.findOne();
  if (!user) {
    console.error("No user found in database to run tests!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Create a mock post
  const newPost = await Post.create({
    userId: user._id,
    content: "Mock post for deletion verification",
    title: "Mock Post"
  });
  console.log(`Mock post created: ${newPost._id}`);

  // Mock req and res objects
  const req = {
    params: { id: newPost._id.toString() },
    user: user
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log(`Response (JSON, Status ${this.statusCode}):`, data);
    }
  };

  try {
    await postController.deletePost(req, res);
    console.log("Post controller deletePost executed!");
  } catch (err) {
    console.error("Exception during post deletion:", err);
  }

  // Verify post is deleted
  const checkPost = await Post.findById(newPost._id);
  console.log(`Post exists after deletion check? ${checkPost ? 'YES' : 'NO'}`);

  await mongoose.disconnect();
}

runTest();
