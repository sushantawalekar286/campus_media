# Security Documentation

This document explains the security configurations, authentication protocols, data validation rules, and current risks of the Campus Media platform.

---

## 🔒 Authentication & Credentials

### 1. JSON Web Tokens (JWT)
* **Encryption**: User sessions are signed on the server using `jsonwebtoken` and a private `JWT_SECRET`.
* **Payload**: Tokens contain the user's ID and role (`USER` or `ADMIN`).
* **Transport**: Handled by passing tokens in `Authorization: Bearer <token>` headers or cookies.

### 2. Password Hashing
* **Library**: `bcryptjs`
* **Strength**: Passwords are run through salt hashing steps before database storage, preventing raw credentials leaks.

---

## 🛡️ Express Server Hardening

### 1. Security Headers (Helmet)
Express uses `helmet` middleware to set HTTP headers, including custom Content Security Policies (CSP) to support Vite:
* **Script Directives**: Allows scripts from `'self'`, Tailwind CDN, Google APIs, and ESDN providers.
* **Connection Directives**: Allows WebSocket connections to `ws://localhost:*` and the Gemini Live API.

### 2. API Rate Limiting
Enforced on critical endpoints to prevent brute-force attacks:
* **Global Rate Limiter**: Limits IP addresses to 500 requests per 15 minutes.
* **OTP Limiter**: Restricts OTP generation requests to 5 requests per 15 minutes.
* **Verification Limiter**: Limits OTP code submissions to 10 validation attempts per 15 minutes.

### 3. Cross-Origin Resource Sharing (CORS)
CORS is configured to support development environments:
* **Rules**: Allows credentials (`credentials: true`) and resolves connections from any origin.

---

## ⚠️ Current Security Risks

> [!CAUTION]
> **Gemini API Key Leak Risk**: The endpoint `GET /api/config/gemini-key` returns the server's raw `GEMINI_API_KEY` to the client. This is done to support direct browser-to-Gemini WebSocket connections, but it exposes the API key to potential theft via browser network inspection.
>
> **Recommended Fix**: Implement a backend WebSocket proxy to route client audio packages to Gemini, keeping the API key secure on the server.
