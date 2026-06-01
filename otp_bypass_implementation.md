# OTP Bypass System for Development/Testing Mode

This document details the changes implemented to support bypassing OTP verification when in a development or testing environment.

---

## ⚙️ 1. Configuration (`.env`)

Added the following configuration flag to target the environment state:
```env
# OTP Configuration
OTP_ENABLED=false
```

---

## 🔒 2. Backend Conditional Logic (`server/services/authService.js`)

Each OTP operation has been updated with environment check boundaries:

### A. Register (`register`)
* **Development Mode (`OTP_ENABLED=false`)**:
  - Automatically flags user `isVerified: true` at creation.
  - Generates token session payload immediately.
  - Skips OTP token generation and dispatching email.
  - Returns `requiresVerification: false`.
  - Console logs: `"OTP Disabled - Development Mode"`.
* **Production Mode (`OTP_ENABLED=true`)**:
  - Sets user `isVerified: false`.
  - Generates a secure numeric 6-digit code.
  - Dispatches verification email.
  - Returns `requiresVerification: true`.

### B. Login (`login`)
* Automatically upgrades unverified users to `isVerified: true` if `OTP_ENABLED` is `false`, permitting instant login rather than throwing verification blocks.

### C. Verify Email (`verifyEmail`)
* Instantly matches registration parameters and updates status without checking collection stores.

### D. Resend OTP (`resendOTP`)
* Bypasses mailing triggers and returns positive flags immediately.

### E. Forgot & Reset Password (`forgotPassword` & `resetPassword`)
* Bypasses email dispatch and updates passwords directly on database helper queries.

---

## 🎨 3. Frontend Store Integration (`client/src/store/authStore.js` & `Signup.jsx`)

* Modified Zustand `register` handler to examine `requiresVerification` response property.
* Automatically initializes user sessions upon receiving authenticated tokens directly from signup.
* Updates route navigation inside `Signup.jsx` to navigate straight to the `/` dashboard instead of the verification code screen.
