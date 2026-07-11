# Feature: Authentication & Verification

## Feature Purpose
Ensures secure platform access for students, mentors, and administrators. It controls account registration, email verification using OTP codes, password resets, and user roles.

## Current Status
**Fully Functional**. Email dispatch is implemented using Nodemailer, with verification codes validated on the backend.

## Architecture
```text
[React Client] ---> (Axios Requests) ---> [Express Router]
                                                  |
 [Nodemailer SMS/Mail] <--- (Send OTP) <--- [Auth Controller] ---> [Mongoose MongoDB]
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

## Current Bugs
* None identified.

## Known Limitations
* OTP values do not expire automatically unless a database TTL index is configured.

## Future Improvements
* Set up a rate limiter to restrict request volumes.
* Add support for multi-factor authentication (MFA) using authenticator apps.

## Testing Checklist
- [ ] Account creation verification.
- [ ] Incorrect password handling checks.
- [ ] Incorrect OTP code alerts.
- [ ] Password recovery validation.

## Performance Notes
* Hashing passes run on CPU threads. Hashing complexity should be optimized to prevent server slowdowns.

## Security Notes
* Refresh token configurations should be set to `HttpOnly` to protect them from XSS attacks.
