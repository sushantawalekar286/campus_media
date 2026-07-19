import '../server/loadEnv.js';
import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

async function testPort(port, secure) {
  console.log(`\nTesting SMTP Connection to ${EMAIL_HOST}:${port} (secure: ${secure})...`);
  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: port,
      secure: secure,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });

    console.log(`✅ SMTP Connection Verification succeeded on port ${port}!`);
    return true;
  } catch (err) {
    console.error(`❌ SMTP Connection Verification failed on port ${port}:`, err.message);
    return false;
  }
}

async function run() {
  console.log('Starting SMTP tests with USER:', EMAIL_USER);
  const res465 = await testPort(465, true);
  const res587 = await testPort(587, false);
  console.log('\n--- Test Summary ---');
  console.log(`Port 465: ${res465 ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Port 587: ${res587 ? 'SUCCESS' : 'FAILED'}`);
}

run();
