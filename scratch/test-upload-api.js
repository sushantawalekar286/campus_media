import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
  try {
    console.log("1. Registering test user...");
    let accessToken = '';
    const email = `api-test-${Date.now()}@example.com`;
    const password = 'Password123';
    
    try {
      const regRes = await axios.post(`${BASE_URL}/auth/register`, {
        fullname: 'API Test User',
        email,
        password,
        year: '1st Year'
      });
      console.log("Registration response:", regRes.data);
      accessToken = regRes.data.accessToken;
    } catch (regErr) {
      console.warn("Registration failed (maybe user exists), trying login...", regErr.response?.data || regErr.message);
      // Try login
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password
      });
      accessToken = loginRes.data.accessToken;
    }

    if (!accessToken) {
      throw new Error("No access token obtained");
    }
    console.log("Success! Obtained access token:", accessToken.slice(0, 15) + "...");

    console.log("2. Preparing file upload...");
    const form = new FormData();
    form.append('resume', fs.createReadStream('scratch/dummy.pdf'));
    form.append('targetRole', 'Software Engineer');
    form.append('experienceLevel', 'Entry Level');

    console.log("3. Sending analyze request...");
    const uploadRes = await axios.post(`${BASE_URL}/resume/analyze`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log("Analysis Successful!");
    console.log(JSON.stringify(uploadRes.data, null, 2));

  } catch (error) {
    console.error("Test Failed!");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTest();
