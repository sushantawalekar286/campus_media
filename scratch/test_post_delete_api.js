import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

async function run() {
  console.log("=== Starting Post Delete API Test ===");

  try {
    // 1. Login
    console.log("Attempting login...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "pruthviraj2005patil@gmail.com",
      password: "password123"
    });
    const token = loginRes.data.accessToken;
    console.log("Login success! Token acquired.");

    // 2. Create Post
    console.log("Creating test post...");
    const createRes = await axios.post(`${BASE_URL}/posts/create`, {
      caption: "Test post for deletion verification via API"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const post = createRes.data;
    console.log("Post created successfully! ID:", post._id);

    // 3. Attempt Delete Post
    console.log(`Deleting post ${post._id}...`);
    const deleteRes = await axios.delete(`${BASE_URL}/posts/${post._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Delete response status:", deleteRes.status);
    console.log("Delete response body:", deleteRes.data);

    console.log("✅ Post delete API test passed successfully!");
  } catch (err) {
    console.error("❌ API Test Failed!");
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

run();
