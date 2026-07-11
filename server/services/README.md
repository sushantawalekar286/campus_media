# Services Directory (`server/services/`)

This directory contains the business logic, AI operations, database fallbacks, and utility systems.

## Purpose
Maintains core services, including AI generation, data storage queries, transaction logic, token signing, and email alerts.

## Responsibilities
* **Database Helper (`dbHelper.js`)**: Coordinates dual-mode queries. If MongoDB is offline, it reads/writes local JSON collections in `data/`.
* **AI Engine (`aiService.js`)**: Formats prompt payloads, validates responses, and connects to Gemini models for resume reviews and career plans.
* **Email Service (`emailService.js`)**: Sends registration alerts and verification codes using Nodemailer.
* **Authentication Services (`authService.js` & `tokenService.js`)**: Manages password hashing, token validation, and refresh tokens.

## Dependencies
* `@google/genai` - AI REST connector
* `nodemailer` - mail delivery engine
* `jsonwebtoken` & `bcryptjs` - authorization
* `mongoose` & [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js) - storage

## Important Files
* [aiService.js](file:///d:/campus_media/server/services/aiService.js): Prompts, schemas, and AI functions.
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js): Database fallback engine.

## Important Classes / Functions
* `dbHelper.User`, `dbHelper.Post`: Database model selectors.
* `analyzeResumeText(text, role, level)`: Executes resume audits.
* `generateFeedback(transcript)`: Evaluates voice chats.
* `generateRoadmap(currentSkills, targetDomain)`: Calculates career pathways.

## Used By
* Called across all backend controllers to verify actions and fetch resources.

## Future Improvements
* Set up a memory cache (e.g. Redis) to speed up database queries.
* Transition AI calls to the official Gemini REST endpoints for better performance.

## Common Errors
* **Mismatched IDs**: JSON fallback storage uses raw string IDs instead of Mongoose ObjectIds, which can cause join errors. Resolved by sanitizing IDs inside `dbHelper` helpers.
