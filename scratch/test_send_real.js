import '../server/loadEnv.js';
import nodemailer from 'nodemailer';

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465', 10);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || `"Campus Media" <${EMAIL_USER}>`;

async function testSend() {
  const recipient = 'friend@gmail.com'; // A generic non-developer email
  console.log('--- Initializing Transporter ---');
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  console.log(`Sending email to ${recipient} via ${EMAIL_HOST}...`);
  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: recipient,
      subject: 'Campus Media SMTP Test',
      text: 'This is a test email sent during SMTP diagnostics.',
      html: '<p>This is a test email sent during SMTP diagnostics.</p>'
    });

    console.log('============== SMTP RESPONSE ==============\n');
    console.log('Full Info:', info);
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Pending:', info.pending);
    console.log('Response:', info.response);
    console.log('===========================================\n');
  } catch (err) {
    console.error('❌ Failed to send test email:', err);
  }
}

testSend();
