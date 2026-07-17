import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  console.log("=== Checking Feed Media Array ===");

  try {
    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "pruthviraj2005patil@gmail.com",
      password: "password123"
    });
    const token = loginRes.data.accessToken;

    // 2. Fetch Feed
    const feedRes = await axios.get(`${BASE_URL}/posts/feed?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const posts = feedRes.data.posts;
    if (posts && posts.length > 0) {
      const postsWithMedia = posts.filter(p => p.media && p.media.length > 0);
      console.log(`Found ${postsWithMedia.length} posts with media.`);
      postsWithMedia.forEach((p, idx) => {
        console.log(`Post ${idx + 1} (${p._id}):`, p.media);
      });
    } else {
      console.log("Feed is empty!");
    }
  } catch (err) {
    console.error("Failed to fetch feed:", err.message);
  }
}

run();
