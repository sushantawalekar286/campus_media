# Feature: Authentication & Verification

## Feature Purpose
Ensures secure platform access for students, mentors, and administrators. It controls account registration, email verification using OTP codes, password resets, and user roles.

## Current Status
**Fully Functional & Production-Ready**. SMTP connections are verified at startup. Outbound emails are dispatched via Nodemailer using Gmail SMTP Server (port 587 with STARTTLS secure upgrade in Render environments).

## Architecture
```text
[React Client] ───(HTTP API)───> [Express API Server]
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
           [dbHelper Engine]                         [Nodemailer Client]
             │           │                                     │
             ▼           ▼                                     ▼
        (Primary)     (Fallback)                        (Gmail SMTP Server)
       [MongoDB]  ───> [JSON DB]                        Port 587 STARTTLS
```

## Frontend Components
* [Login.jsx](file:///d:/campus_media/client/src/pages/Login.jsx): Credentials form.
* [Signup.jsx](file:///d:/campus_media/client/src/pages/Signup.jsx): Account registration form.
* [VerifyOTP.jsx](file:///d:/campus_media/client/src/pages/VerifyOTP.jsx): Verification code input screen.
* [ForgotPassword.jsx](file:///d:/campus_media/client/src/pages/ForgotPassword.jsx) & [ResetPassword.jsx](file:///d:/campus_media/client/src/pages/ResetPassword.jsx): Recovery screens.

## Backend Routes
* [authRoutes.js](file:///d:/campus_media/server/routes/authRoutes.js)

## Controllers
* [authController.js](file:///d:/campus_media/server/controllers/authController.js)

## Services
* [authService.js](file:///d:/campus_media/server/services/authService.js)
* [tokenService.js](file:///d:/campus_media/server/services/tokenService.js)
* [emailService.js](file:///d:/campus_media/server/services/emailService.js)

## Database Collections
* `users`
* `otps`

## Dependencies
* `bcryptjs` - password hashing
* `jsonwebtoken` - token signing
* `nodemailer` - dispatching email alerts

## Flow Diagram (Text)
```text
1. User submits Signup form -> Backend generates 6-digit OTP code.
2. Backend saves OTP code to database and emails it to the user.
3. User enters code in VerifyOTP screen.
4. Backend matches code, updates user status to 'ACTIVE', and returns a JWT token.
```

## API Endpoints
* `POST /api/auth/register` - Registers account details.
* `POST /api/auth/login` - Validates credentials.
* `POST /api/auth/verify-otp` - Matches OTP codes.
* `POST /api/auth/forgot-password` - Dispatches recovery keys.
* `POST /api/auth/reset-password` - Commits new passwords.

## Email Architecture & Troubleshooting Guide

### 1. SMTP Transporter Configuration
Nodemailer is configured to use SMTP with the following environment variables:
* `EMAIL_HOST`: SMTP server hostname (default: `smtp.gmail.com`).
* `EMAIL_PORT`: SMTP port (default: `465`).
* `EMAIL_SECURE`: Explicit SSL/TLS connection indicator (`true` for port 465, `false` for port 587). If omitted, defaults to `true` if port is `465`.
* `EMAIL_USER`: Gmail user address (e.g. your development or company email).
* `EMAIL_PASS`: Gmail App Password (16-character code generated in Google Account settings under 2-Factor Authentication).
* `EMAIL_FROM`: Address signature (e.g. `"Campus Media" <your-email@gmail.com>`).

To prevent hanging connections on cloud services, the transporter is configured with a `10000`ms timeout (for connections, greetings, and sockets) and TLS certificate validation fallbacks.

### 2. Startup & Execution Logging (SMTP Diagnostics)
To ensure the email delivery system works seamlessly, the server outputs the following logs:
* **Startup Checks:** Logs the presence (exist status, not secret values) of `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, and `EMAIL_FROM` on initialization. This confirms whether Render or local environments loaded the environment variables.
* **Pre-Dispatch Logs:** Before sending any email, it logs:
  - `Requested Email` (email address from request body)
  - `Database Email` (email address registered in user record)
  - `Recipient Passed` (email address sent to nodemailer)
  - `Sender` (from address signature)
  - `Subject` (email subject line)
* **Post-Dispatch SMTP Logs:** Once Nodemailer dispatches the mail, it logs the full SMTP response object including `accepted` recipients, `rejected` recipients, and SMTP server code responses.

### 3. Port Outbound Blocks (Render Deployments)
> [!IMPORTANT]
> Render blocks outbound connections on port `465` (SSL) by default, resulting in a connection timeout.
> **Fix**: You MUST configure Render environment variables to use `EMAIL_PORT=587` and `EMAIL_SECURE=false`. This routes SMTP traffic through port 587, which is automatically upgraded to STARTTLS.

### 4. Transaction Rollback on Email Failure
To prevent the creation of unverified/orphaned student profiles, the registration process is tied directly to successful email delivery.
* If Nodemailer fails to dispatch the OTP (due to SMTP blockages, incorrect app passwords, or connection timeout), the transaction catches the error.
* The newly created user document is immediately rolled back using `dbHelper.User.findByIdAndDelete(userId)` and the OTP records are deleted.
* The API returns a descriptive, user-facing error response explaining the SMTP dispatch failure.

### 5. Render Deployment Checklist
When deploying to Render, verify that the following variables are loaded under **Environment**:
- [ ] `EMAIL_HOST` - `smtp.gmail.com`
- [ ] `EMAIL_PORT` - `587` (required to bypass Render port 465 blocks)
- [ ] `EMAIL_SECURE` - `false`
- [ ] `EMAIL_USER` - Your Google email address
- [ ] `EMAIL_PASS` - A 16-character Google App Password (not your account password)
- [ ] `EMAIL_FROM` - `"Campus Media" <your-email@gmail.com>`

### 6. Troubleshooting Checklist
1. **SMTP Connection Timeout**: Ensure `EMAIL_PORT` is set to `587` and `EMAIL_SECURE` is set to `false`. Check that Render's environment matches these settings.
2. **SMTP Authentication Failed**: Verify that `EMAIL_PASS` is a 16-character **App Password** (with 2FA enabled on the Gmail account) and not the standard account password.
3. **transporter.verify() Fails**: Read the boot logs. The error messages will indicate if the host is unreachable (`ECONNREFUSED`) or if credentials were rejected (`EAUTH`).
4. **Self-Only Delivery**: If only the developer receives email and other domains fail, ensure the Gmail account's security controls are not blocking third-party apps, or that you are not hitting Google's daily sending quotas (500/day for trial accounts).

---

## Current Bugs
* None.

## Known Limitations
* OTP records auto-expire from the MongoDB collection using a TTL index set on `expiresAt` (configured at database level). In fallback JSON mode, expired keys are filtered out on read.

## Future Improvements
* Add support for multi-factor authentication (MFA) using authenticator apps.

## Testing Checklist
- [x] Account creation registration verification.
- [x] Incorrect password handling validation.
- [x] Verification OTP dispatch and email receipt.
- [x] Expired or incorrect OTP code handling.
- [x] Forgot password OTP dispatch and recovery flow.
- [x] Database rollback check on SMTP credentials failure.

## Performance Notes
* Bcrypt hashing is CPU intensive. Hashing complexity rounds are set to `10` to balance security and request times.

## Security Notes
* Refresh token configurations are set to `HttpOnly` to protect them from XSS attacks.
