import nodemailer from 'nodemailer';

// Configurable SMTP settings — supports Gmail (default) and easy migration to SendGrid/Brevo/SES
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465', 10);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_SECURE = process.env.EMAIL_SECURE !== undefined 
  ? process.env.EMAIL_SECURE === 'true' 
  : EMAIL_PORT === 465;
const EMAIL_FROM = process.env.EMAIL_FROM || `"Campus Media" <${EMAIL_USER}>`;

// Initialize Transporter
let transporter = null;

try {
  console.log('✉️ Email Configuration Loaded:');
  console.log(`  - EMAIL_HOST: ${EMAIL_HOST}`);
  console.log(`  - EMAIL_PORT: ${EMAIL_PORT}`);
  console.log(`  - EMAIL_USER exists: ${!!EMAIL_USER}`);
  console.log(`  - EMAIL_PASS exists: ${!!EMAIL_PASS}`);
  console.log(`  - EMAIL_FROM: ${EMAIL_FROM}`);

  if (EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Prevents local SSL verification issues
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000,
      socketTimeout: 10000
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
  async sendEmail({ to, subject, html, text, req = null, user = null }) {
    // Console fallback log (vital for local debugging if SMTP fails/is slow)
    console.log(`\n==================================================`);
    console.log(`📧 OUTBOUND EMAIL LOG`);
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`TEXT:    ${text}`);
    console.log(`==================================================\n`);

    console.log("============== EMAIL DEBUG ==============");
    console.log("Requested Email:", req?.body?.email || to);
    console.log("Database Email:", user?.email || to);
    console.log("Recipient Passed:", to);
    console.log("Sender:", EMAIL_FROM);
    console.log("Subject:", subject);
    console.log("=========================================");

    if (!transporter) {
      console.warn('⚠️ Nodemailer: Transporter not configured. Email logged to console only.');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Email service unavailable: SMTP transporter is not initialized.');
      }
      return { success: true, fallback: true, message: 'Simulated dispatch' };
    }

    try {
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });

      console.log(`✉️ Email successfully dispatched to ${to}. MessageId: ${info.messageId}`);
      
      console.log("============== SMTP RESPONSE ==============");
      console.log("Message ID:", info.messageId);
      console.log("Accepted:", info.accepted);
      console.log("Rejected:", info.rejected);
      console.log("Pending:", info.pending);
      console.log("Response:", info.response);
      console.log("===========================================");

      return { success: true, message: 'Email successfully sent', messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Nodemailer: Failed to deliver email to ${to}:`, error.message);
      
      let friendlyMessage = 'Email service unavailable';
      const errMsg = error.message || '';
      
      if (error.code === 'EAUTH' || errMsg.includes('Username and Password not accepted') || errMsg.includes('Authentication')) {
        friendlyMessage = 'SMTP authentication failed: Gmail App Password invalid';
      } else if (error.code === 'ETIMEOUT' || errMsg.includes('timeout') || errMsg.includes('timed out')) {
        friendlyMessage = 'SMTP connection timeout';
      } else if (error.code === 'ECONNREFUSED' || errMsg.includes('ECONNREFUSED')) {
        friendlyMessage = 'SMTP connection failed: Host unreachable or port blocked';
      }
      
      throw new Error(`${friendlyMessage}. Underlying error: ${errMsg}`);
    }
  },

  /**
   * Dispatches the 6-digit email confirmation code
   */
  async sendVerificationOTP(email, otp, req = null, user = null) {
    const text = `Verify your Campus Media account using this OTP code: ${otp}. This code expires in 5 minutes.`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email Address</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
          .otp-container { background-color: #faf5ff; border: 2px dashed #d8b4fe; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; color: #7c3aed; letter-spacing: 8px; font-family: monospace; }
          .expiry-warning { color: #d97706; font-size: 13px; font-weight: 600; margin-top: 8px; }
          .footer { background-color: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
          .footer a { color: #4f46e5; text-decoration: none; font-weight: 600; }
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
 
    return this.sendEmail({ to: email, subject: 'Campus Media - Account Verification Code', html, text, req, user });
  },
 
  /**
   * Dispatches the 6-digit password reset request code
   */
  async sendPasswordResetOTP(email, otp, req = null, user = null) {
    const text = `Reset your Campus Media password using this OTP code: ${otp}. This code expires in 5 minutes.`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 35px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
          .otp-container { background-color: #f0f9ff; border: 2px dashed #0ea5e9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; color: #0284c7; letter-spacing: 8px; font-family: monospace; }
          .expiry-warning { color: #d97706; font-size: 13px; font-weight: 600; margin-top: 8px; }
          .security-msg { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; font-size: 13px; color: #78350f; margin-bottom: 24px; border-radius: 6px; line-height: 1.5; }
          .footer { background-color: #f8fafc; padding: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
          .footer a { color: #312e81; text-decoration: none; font-weight: 600; }
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
 
    return this.sendEmail({ to: email, subject: 'Campus Media - Password Reset OTP Code', html, text, req, user });
  },

  /**
   * Sends password reset success confirmation email
   */
  async sendPasswordResetSuccess(email, fullname) {
    const name = fullname || 'User';
    const text = `Hi ${name}, your Campus Media password has been reset successfully. If you did not make this change, please contact support immediately.`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed Successfully</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
          .success-box { background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 16px; padding: 24px; text-align: center; margin: 30px 0; }
          .success-icon { font-size: 48px; margin-bottom: 12px; }
          .success-text { font-size: 16px; font-weight: 700; color: #166534; }
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
            <p class="greeting">Hello ${name},</p>
            
            <div class="success-box">
              <div class="success-icon">✅</div>
              <div class="success-text">Your password has been reset successfully</div>
            </div>

            <p>You can now log in to your Campus Media account using your new password.</p>

            <div class="security-msg">
              <strong>Didn't make this change?</strong> If you did not reset your password, your account may be compromised. Please contact our support team immediately at <a href="mailto:support@campusmedia.edu">support@campusmedia.edu</a>.
            </div>

            <p>Best regards,<br><strong>Campus Media Security Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Campus Media Platform. All rights reserved.</p>
            <p>Sent securely to ${email}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject: 'Campus Media - Password Changed Successfully', html, text });
  },

  /**
   * Sends welcome email after successful email verification
   */
  async sendWelcomeEmail(email, fullname) {
    const name = fullname || 'Student';
    const text = `Welcome to Campus Media, ${name}! Your email has been verified and your account is now active. Start exploring your campus community.`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Campus Media</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; }
          .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .greeting { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #1e1b4b; }
          .features { display: table; width: 100%; margin: 30px 0; }
          .feature { display: table-row; }
          .feature-icon { display: table-cell; padding: 10px; font-size: 24px; vertical-align: top; width: 40px; }
          .feature-text { display: table-cell; padding: 10px; vertical-align: top; }
          .feature-title { font-weight: 700; font-size: 14px; color: #312e81; }
          .feature-desc { font-size: 13px; color: #64748b; margin-top: 2px; }
          .cta-btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 24px 0; }
          .footer { background-color: #f8fafc; padding: 24px; border-t: 1px solid #f1f5f9; font-size: 12px; color: #64748b; text-align: center; }
          .footer a { color: #6366f1; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Campus Media</h1>
            <p>Your academic community awaits</p>
          </div>
          <div class="content">
            <p class="greeting">Welcome aboard, ${name}! 🚀</p>
            <p>Your email has been verified and your Campus Media account is now fully active. Here's what you can do:</p>

            <div class="features">
              <div class="feature">
                <div class="feature-icon">📝</div>
                <div class="feature-text">
                  <div class="feature-title">Share & Connect</div>
                  <div class="feature-desc">Post updates, connect with peers, and build your campus network.</div>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📄</div>
                <div class="feature-text">
                  <div class="feature-title">AI Resume Analyzer</div>
                  <div class="feature-desc">Get AI-powered feedback on your resume to stand out.</div>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🎤</div>
                <div class="feature-text">
                  <div class="feature-title">Mock Interviews</div>
                  <div class="feature-desc">Practice with AI-driven mock interviews tailored to your role.</div>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🗺️</div>
                <div class="feature-text">
                  <div class="feature-title">Career Roadmap</div>
                  <div class="feature-desc">Get a personalized learning roadmap for your dream career.</div>
                </div>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/login" class="cta-btn">Log In to Campus Media</a>
            </p>

            <p>Best regards,<br><strong>Campus Media Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Campus Media Platform. All rights reserved.</p>
            <p>Sent to ${email}. You received this because you registered on Campus Media.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to: email, subject: 'Welcome to Campus Media! 🎓', html, text });
  }
};
