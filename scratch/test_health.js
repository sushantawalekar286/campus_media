import axios from 'axios';

async function run() {
  try {
    console.log('Hitting health check endpoint...');
    const res = await axios.get('http://localhost:3000/api/health', { timeout: 2000 });
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    console.error('Failed to hit health endpoint:', err.message);
  }
}

run();
