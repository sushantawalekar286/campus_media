# Backend Documentation

This document explains the Express backend server architecture, route decorators, services, and configurations.

---

## 🏛️ Express Architecture
The backend is a Node.js REST API server built using Express:
* **Entry Point**: [server/server.js](file:///d:/campus_media/server/server.js) initializes Express, connects to the database, mounts middleware layers, defines endpoints, and runs Vite.
* **Unified Setup**: In development mode, the Express server mounts a Vite instance as middleware. This serves the client and API on port 3000, avoiding CORS conflicts.
* **Production Bundling**: In production mode, the server serves static files from the compiled `dist/` directory.

---

## 🔒 Middlewares
Middlewares process requests before they reach the controllers:
* **`authMiddleware`**: Decodes and validates JWT tokens passed via cookies or Authorization headers, attaching user credentials to `req.user`.
* **`roleMiddleware`**: Verifies that the user's role matches administrative requirements (e.g. `role === 'ADMIN'`).
* **`errorMiddleware`**: Catches unhandled Express errors, logs them to the console, and returns a clean JSON error response.
* **`rateLimit`**: Enforces request limits on authentication and API routes to prevent spam.

---

## ⚙️ Core Services
* **Database Wrapper (`dbHelper.js`)**: Manages MongoDB Mongoose queries and handles local JSON file storage fallbacks.
* **AI Service (`aiService.js`)**: Formats prompt payloads, validates responses, and connects to Gemini models for resume reviews and career plans.
* **Email Service (`emailService.js`)**: Sends registration alerts and verification codes using Nodemailer.

---

## 🎙️ Socket.IO & WebSocket Integration
* **Socket.IO Status**: The backend does not run a Socket.IO server. Chat messaging uses REST API polling.
* **WebSocket Streams**: Client-to-Gemini WebSocket connections are created directly from the browser during mock interviews, bypassing the backend to minimize audio latency.

---

## 🛡️ Error Handling & Logging
* **Express Error Boundary**: All endpoints wrap database and AI operations in `try-catch` blocks, forwarding exceptions to `next(err)` to prevent server crashes.
* **Logging System**: Express logs output using basic `console.log` statements. It does not employ structured logging libraries like Winston or Pino.
