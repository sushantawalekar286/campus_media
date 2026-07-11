# Backend Server Module (`server/`)

This directory contains the Node.js / Express.js REST API server that acts as the data management hub and AI prompt execution engine for Campus Media.

## Purpose
Secures APIs, processes database operations, converts PDF files to text, interacts with Gemini models for structured resume audits, feedback reports, and roadmap paths, and serves static files or mounts the Vite client middleware.

## Responsibilities
* **API Routing**: Groups and exposes endpoints for authentication, posts, social actions, messaging, configurations, notes, and admin management.
* **Database abstraction**: Dual-mode data management supporting MongoDB Mongoose operations, falling back to local JSON file storage (`data/`) if MongoDB is unavailable.
* **AI Orchestration**: Houses system prompt structures and handles backend Gemini validation APIs.
* **Asset Storage**: Serves uploaded images and static content.
* **Security & Verification**: Enforces JWT checks, password hashing, script safety headers, and rate limits.

## Dependencies
* `express` (v5.2 / v4.18) - application routing
* `mongoose` (v9.6 / v8.1) - database connection
* `jsonwebtoken` & `bcryptjs` - authorization and security
* `multer` - multipart file parsing
* `pdf-parse` - PDF string extraction
* `@google/genai` - REST SDK for content generation
* `cors`, `helmet`, `express-rate-limit` - server security
* `cookie-parser` - cookie verification

## Important Files
* `server.js`: Express initialization, security middlewares, route associations, and Vite integration.
* `services/dbHelper.js`: Database wrapper orchestrating dual-mode Mongoose and JSON operations.
* `services/aiService.js`: Prompts, schemas, and API wrappers calling Gemini models.

## Important Classes / Functions
* `startServer()`: Initializes Express server and database connections.
* `dbHelper`: Unified database interface wrapper.
* `analyzeResumeText(text, role, level)`: Extracts and audits resume strings.
* `generateFeedback(transcript)`: Evaluates voice chat scripts.

## Used By
* Entry scripts `dev`, `build`, and `start` run this backend server, which acts as the unified deployment point.

## Future Improvements
* Complete transition from JS to the TypeScript implementation located in `server/src/`.
* Implement a background job queue (e.g. BullMQ) for non-blocking PDF text processing.
* Configure structured logging via Winster/Pino instead of default `console.log`.

## Common Errors
* **Mongoose Connection Refused**: Occurs if the local MongoDB daemon is stopped. Handled by falling back to Local JSON mode.
* **Gemini API Key Missing**: Triggers fallbacks if `GEMINI_API_KEY` is undefined or default value.
