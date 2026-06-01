import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Initialize Transporter
let transporter = null;

try {
  if (EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Prevents local SSL verification issues
      }
    });

    // Verification check on load
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Nodemailer: SMTP Connection Verification Failed:', error.message);
        console.error('👉 Tip: Check if Gmail App Passwords are configured correctly, and EMAIL_USER/EMAIL_PASS are accurate in your .env file.');
      } else {
        console.log('✅ Nodemailer: SMTP Server is configured and ready to dispatch emails.');
      }
    });
  } else {
    console.warn('⚠️ Nodemailer: EMAIL_USER and EMAIL_PASS environment variables are missing! Email service will run in console fallback mode.');
  }
} catch (error) {
  console.error('❌ Nodemailer initialization failed:', error);
}

export const emailService = {
  /**
   * Reusable core sender method
   */
  async sendEmail({ to, subject, html, text }) {
    // Console fallback log (vital for local debugging if SMTP fails/is slow)
    console.log(`\n==================================================`);
    console.log(`📧 OUTBOUND EMAIL LOG`);
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`TEXT:    ${text}`);
    console.log(`==================================================\n`);

    if (!transporter) {
      console.warn('⚠️ Nodemailer: Transporter not configured. Email logged to console only.');
      return { success: true, fallback: true, message: 'Simulated dispatch' };
    }

    try {
      const info = await transporter.sendMail({
        from: `"Campus Media Support" <${EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`✉️ Email successfully dispatched to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Nodemailer: Failed to deliver email to ${to}:`, error.message);
      console.info(`💡 Developer Fallback: Verify using code printed in console log above.`);
      // Return success but indicate fallback to prevent frontend flow interruption if email crashes
      return { success: false, error: error.message };
    }
  },

  /**
   * Dispatches the 6-digit email confirmation code
   */
  async sendVerificationOTP(email, otp) {
    const text = `Verify your Campus Media account using this OTP code: ${otp}. This code expires in 5 minutes.`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email Address</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
          .otp-container { background-color: #f5f3ff; border: 2px dashed #c084fc; border-radius: 16px; padding: 24px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 38px; font-weight: 800; color: #4f46e5; letter-spacing: 6px; font-family: monospace; }
          .expiry-warning { color: #f97316; font-size: 13px; font-weight: 600; margin-top: 10px; }
          .footer { background-color: #f8fafc; padding: 24px; border-t: 1px solid #f1f5f9; font-size: 12px; color: #64748b; text-align: center; }
          .footer a { color: #6366f1; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus Media</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello,</p>
            <p>Welcome to Campus Media! To complete your student account configuration, please verify your email address using the confirmation code below:</p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
              <div class="expiry-warning">This code is active for 5 minutes only.</div>
            </div>

            <p>If you did not initiate this registration request, you can safely ignore this email.</p>
            <p>Best regards,<br><strong>Campus Media Security Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Campus Media Platform. All rights reserved.</p>
            <p>Sent securely to ${email}. If you have concerns, contact <a href="mailto:support@campusmedia.edu">support@campusmedia.edu</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject: 'Campus Media - Account Verification Code', html, text });
  },

  /**
   * Dispatches the 6-digit password reset request code
   */
  async sendPasswordResetOTP(email, otp) {
    const text = `Reset your Campus Media password using this OTP code: ${otp}. This code expires in 5 minutes.`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
          .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
          .otp-container { background-color: #e0f2fe; border: 2px dashed #38bdf8; border-radius: 16px; padding: 24px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 38px; font-weight: 800; color: #0284c7; letter-spacing: 6px; font-family: monospace; }
          .expiry-warning { color: #f97316; font-size: 13px; font-weight: 600; margin-top: 10px; }
          .security-msg { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; font-size: 13px; color: #78350f; margin-bottom: 20px; border-radius: 4px; }
          .footer { background-color: #f8fafc; padding: 24px; border-t: 1px solid #f1f5f9; font-size: 12px; color: #64748b; text-align: center; }
          .footer a { color: #6366f1; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Campus Media</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello,</p>
            <p>We received a request to reset the password for your Campus Media account. To confirm this action, please enter the OTP security code below:</p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
              <div class="expiry-warning">This code is active for 5 minutes only.</div>
            </div>

            <div class="security-msg">
              <strong>Security Notice:</strong> If you did not make this request, someone else may be trying to access your account. Please check your security settings or notify us immediately.
            </div>

            <p>Best regards,<br><strong>Campus Media Security Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Campus Media Platform. All rights reserved.</p>
            <p>Sent securely to ${email}. If you have concerns, contact <a href="mailto:support@campusmedia.edu">support@campusmedia.edu</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject: 'Campus Media - Password Reset OTP Code', html, text });
  }
};
