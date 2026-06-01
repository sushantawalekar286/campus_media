# Campus Media Platform — Enterprise Technical Audit & Modernization Report

---

## 1. Executive Summary

### Context and Objectives
The Campus Media application is a student career development platform designed for resume auditing, live voice interview simulations, interactive roadmaps, and peer communication. This audit provides a comprehensive technical, security, and architectural review of the repository to identify systemic bugs, security exposures, and operational risks, establishing a structured roadmap for migration to a secure production-ready state.

### Key Finding Categories
* **Application Stability**: Client-side crashes caused by undefined context exports (`addNote`, `deleteUser`, etc.) and a browser-side reference to `process.env`.
* **Security Exposure**: Hardcoded database credentials and developer API keys committed in `.env`. Raw keys are transmitted to client browsers to connect with Google Gemini's WebSockets directly, exposing keys to theft.
* **Architecture Duality**: A hybrid of TypeScript files in the server source directory alongside a JavaScript entry script (`server.js`) creates synchronicity issues and build process confusion.
* **Local Fallback DB**: A file-system fallback database implementation (`dbHelper.js`) allows full local functionality if MongoDB Atlas is unavailable, which is useful for offline usage but lacks structured indexes and isolation constraints.

---

## 2. Project Architecture Overview

The application follows a monolithic single-process MERN architecture pattern, integrating Vite's asset compiler directly inside the Express server via dev middlewares:

```mermaid
graph TD
    subgraph Client Space (SPA Browser)
        ViteClient[React Router SPA] --> Context[AppContext.jsx]
        Context --> UI[Tailwind CSS Pages]
        UI --> WebAudio[Web Audio API - Mic]
        WebAudio -->|PCM Audio Binary| GemWS[Gemini Live WebSocket Client]
    end

    subgraph Server Space (Express Monolith)
        Express[Express.js Server] --> Auth[authMiddleware]
        Express --> Router[REST Endpoint Routers]
        Router --> dbProxy[dbHelper - Dual Mode Proxy]
        Router --> GeminiAPI[Gemini 3.5 API - REST Client]
    end

    subgraph Storage & Cloud Space
        dbProxy -->|Primary| Mongo[MongoDB Atlas Cluster]
        dbProxy -->|Secondary/Fallback| LocalJSON[Local JSON Files - data/]
        GemWS -->|WebSocket| GemCloud[Google Gemini Live Gateway]
        GeminiAPI -->|HTTP REST| GemCloud
    end
```

### Architectural Flow Characteristics
1. **Dynamic Dev Proxy**: The server checks if `process.env.NODE_ENV !== "production"`. If so, it starts a Vite development compiler in middleware mode. Client static files are served dynamically.
2. **Dual-Mode Persistence**: The database access layer abstracts queries. If a Mongo database connection cannot be established or times out, all CRUD operations route to localized JSON database tables on the file system (`/data/*.json`).
3. **AI Session Flow**: 
   * **Resume Audits / Roadmaps**: The client submits a REST request to Express, which acts as a secure intermediary executing calls to `gemini-3.5-flash` using structured JSON schemas.
   * **Voice Interviews**: The client initiates an direct browser connection to `gemini-2.5-flash-native-audio-preview` using WebSockets, sending and receiving raw audio binaries.

---

## 3. Folder Structure Analysis

### Repository File Tree
```
d:\New folder (4)
├── .env                          # Local Environment Variables
├── App.jsx                       # Routing Shell & Global Provider mounts
├── index.html                    # Frontend HTML Shell (Tailwind CDN, CDN importmap)
├── index.jsx                     # Client SPA Bootstrapper
├── package.json                  # Root configurations and dependency versions
├── vite.config.js                # Vite Bundler configurations
├── types.js                      # Shared UserRole and UserStatus definitions
├── components/
│   └── Layout.jsx                # Global Responsive App Shell (Navigation & Headers)
├── context/
│   └── AppContext.jsx            # State Engine (Auth, polling, API calls)
├── data/                         # Fallback JSON tables
│   ├── chatmessages.json
│   ├── jobs.json
│   ├── notes.json
│   ├── questions.json
│   ├── resumes.json
│   └── users.json
├── pages/
│   ├── AdminPanel.jsx            # Platform Metrics, Moderation, System Settings
│   ├── Dashboard.jsx             # User stats, Activity Chart, Note Creation
│   ├── JobBoard.jsx              # Opportunity postings list
│   ├── MentorshipChat.jsx        # Group text channel chat rooms
│   ├── MockInterview.jsx         # Live voice interview interface
│   ├── QuestionBank.jsx          # Crowd-sourced interview questions
│   ├── ResumeAnalyzer.jsx        # PDF parser and ATS scoring view
│   └── RoadmapGenerator.jsx      # personalized skill roadmaps
├── server/
│   ├── package.json              # Backend Package Config
│   ├── tsconfig.json             # TypeScript configuration for server
│   └── src/
│       ├── index.ts              # Express server typescript implementation (Out-of-sync)
│       ├── models/               # Mongoose model schemas
│       │   ├── ChatMessage.js
│       │   ├── Job.js
│       │   ├── Note.js
│       │   ├── Question.js
│       │   ├── Resume.js
│       │   ├── SystemConfig.js
│       │   └── User.js
│       └── services/
│           ├── aiService.js      # Backend Gemini REST prompts
│           └── dbHelper.js       # JSON/Mongo dual-mode database driver
├── services/
│   ├── api.js                    # Axios client wrapper with JWT Interceptor
│   └── geminiService.js          # REST Client wrappers for backend AI calls
└── utils/
    └── audioUtils.js             # Client PCM conversion, scaling & encoding
```

### Folder and Core File Explanation Tables

| Directory Path | Architectural Classification | Responsibility Description |
| :--- | :--- | :--- |
| **`components/`** | Presentation Layer | Reusable presentation layouts, headers, nav panels, and responsive widgets. |
| **`context/`** | State Management Layer | Global React Context Provider acting as the application state engine (polling and backend request wrapper). |
| **`data/`** | Local Data Layer | Local JSON file databases used as a runtime data store if Mongoose connection is disconnected. |
| **`pages/`** | View Layer | Direct page routes rendered inside the core application layout shell. |
| **`server/`** | Backend Source | Houses database models, helper services, and the server typescript source. |
| **`services/`** | Communications Layer | Client Axios HTTP requester configurations and backend REST path wrappers. |
| **`utils/`** | Utility Helpers | Specialized audio conversions (PCM sample rates, base64 formatting, array buffers). |

| Core File Path | Purpose Description |
| :--- | :--- |
| **`package.json`** | Defines scripts (dev, build, start), root dependencies (Express, Vite, Mongoose, Google GenAI SDK). |
| **`server.js`** | Root backend orchestrator. Connects Express, loads Mongoose, defines REST endpoints, and boots Vite. |
| **`vite.config.js`** | Bundling configuration. Exposes port 3000, builds HTML to `/dist`. |
| **`dbHelper.js`** | Intercepts Mongoose model methods. If database is offline, executes CRUD on local JSON files. |
| **`aiService.js`** | Contains backend API instructions and JSON schemas for resume analyses, mock reviews, and roadmaps. |
| **`audioUtils.js`** | Converts float32 audio buffers from mic context to int16 PCM array buffers for WebSocket transfer. |

---

## 4. Tech Stack Report

| Classification | Technology / Library | Version | Purpose in Application |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^18.2.0` | Client declarative view layer and component rendering. |
| **Routing** | React Router DOM | `^6.22.1` | Hash routing for client-side navigation. |
| **Aesthetics** | Tailwind CSS | CDN v3 | CSS framework loaded in header for layout styling. |
| **Icons** | Lucide React | `^0.338.0` | Client Vector icons. |
| **Charts** | Recharts | `^2.12.1` | Analytics charts. |
| **Backend Runtime** | Node.js | `>= 18` | JavaScript runtime environment. |
| **HTTP Server** | Express | `^5.0.0-beta.1` | REST API routes and Vite dev server hosting. |
| **Database** | MongoDB / Mongoose | `^8.1.3` | Application database and schemas. |
| **Local Storage** | FileSystem JSON | Native | Local JSON files for offline database mode. |
| **AI Integration** | `@google/genai` | `^0.1.1` (Server) / Latest (Client) | Google Gemini API integration (REST and Live WebSockets). |
| **File Parsing** | `pdf-parse` | `^1.1.1` | Server-side PDF extraction from uploaded files. |

### Version Compatibility & Deprecated Package Warnings
1. **Express Beta Version**: The server package uses `Express 5.0.0-beta.1`. While mostly backward compatible, running a beta runtime in an enterprise system is a risk.
2. **Vite Deprecation**:
   `The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated`
   *Reason*: `server.js` is built as an ES module, but Vite's Node API import triggers a CommonJS loader fallback warning.
3. **Tailwind CDN Performance**: Using `<script src="https://cdn.tailwindcss.com"></script>` forces client-side CSS compilation on every page load. This causes Cumulative Layout Shift (CLS) and blocks early rendering.

---

## 5. Module Analysis

### Architectural Dependency Map

```
  [Pages / Views]
         │
         ▼
  [React Context: AppContext.jsx]
         │
         ▼
  [Axios Interceptor: services/api.js]
         │
         ▼
  [REST Controller Endpoints: server.js]
         │
         ├──────────────────────────┐
         ▼                          ▼
  [aiService.js: Gemini API]   [dbHelper.js: DB Proxy]
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
                 [MongoDB Atlas]          [Local JSON files]
```

### Module Breakdown Table

| Module Name | Involved Code Files | Handled APIs & Endpoints | Used Collections | Key Dependencies | Primary Purpose & Flows |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `App.jsx`, `AppContext.jsx`, `server.js` | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`GET /api/auth/me` | `users` | `bcryptjs`, `jsonwebtoken` | Registration, login, password hashing, and user role validation (Student, Admin). |
| **Resume AI** | `ResumeAnalyzer.jsx`, `server.js`, `aiService.js` | `POST /api/resume/analyze` | `resumes` | `pdf-parse`, `@google/genai` | Uploads PDF resume, extracts text, generates an audit report with an ATS score, and stores it in the DB. |
| **Voice Mock Interview** | `MockInterview.jsx`, `audioUtils.js`, `server.js` | WebSocket: Gemini Live<br>`POST /api/interview/feedback` | `resumes` | `@google/genai` | Streams microphone audio over WebSockets to Gemini, receives audio back, and generates a structured feedback report. |
| **Roadmap Gen** | `RoadmapGenerator.jsx`, `geminiService.js`, `server.js` | `POST /api/roadmap` | None | `@google/genai` | Prompts Gemini to structure a 6-stage development timeline based on current skills and target role. |
| **Mentorship Chat** | `MentorshipChat.jsx`, `server.js` | `GET /api/chat/:channel`<br>`POST /api/chat`<br>`DELETE /api/chat/:id` | `chatmessages` | Axios | Live channels (`#general`, `#interview-prep`, `#jobs`) with messages synchronized via client-side polling. |
| **Admin Control** | `AdminPanel.jsx`, `server.js` | `GET /api/users`<br>`PATCH /api/users/:id/status`<br>`DELETE /api/users/:id`<br>`GET /api/config`<br>`PATCH /api/config`<br>`GET /api/resume/submissions` | `users`, `questions`, `resumes`, `systemconfigs` | `recharts` | Visual metrics charts, user blocking/deletions, moderation of chat logs, question approvals, and global alerts. |

---

## 6. Data Flow Analysis

### Real-Time Voice Interview Audio Stream Flow
1. **Audio Capture**: Browser `navigator.mediaDevices.getUserMedia` captures microphone input.
2. **Buffer Processing**: `audioUtils.js` intercepts samples (Float32 format) inside a ScriptProcessorNode at 16kHz.
3. **PCM Conversion**: Samples are converted to a 16-bit signed integer (Int16) buffer and encoded into a Base64 string.
4. **WebSocket Transmission**: Base64 data is sent to Gemini's WebSocket API:
   ```json
   { "media": { "mimeType": "audio/pcm;rate=16000", "data": "BASE64_PCM_DATA..." } }
   ```
5. **Gemini Live Response**: Gemini returns audio chunks (24kHz format) in base64:
   ```json
   { "serverContent": { "modelTurn": { "parts": [{ "inlineData": { "data": "BASE64_AUDIO_CHUNK..." } }] } } }
   ```
6. **Playback Output**: Browser converts base64 back to Uint8Array, decodes the audio, and plays it back through the audio context destination.

### Client-Server Polling Flow
```
Client Browser (AppContext.jsx)                              Express Server (server.js)
       │                                                                  │
       ├─► (Every 5 seconds) GET /api/jobs ───────────────────────────────┤
       ├─► (Every 5 seconds) GET /api/questions ──────────────────────────┤
       ├─► (Every 5 seconds) GET /api/chat/general ───────────────────────┤
       │                                                                  │
       │                                                                  │
       │  ◄─ Return JSON arrays (jobs, questions, chat) ──────────────────┤
       ▼                                                                  ▼
[State Refresh] ──► Re-renders UI Panels 
```

---

## 7. Database Analysis

### Entity-Relationship (ER) Diagram

```
  ┌──────────────┐             ┌──────────────┐
  │     User     │             │    Resume    │
  ├──────────────┤             ├──────────────┤
  │ _id (PK)     │◄───────────┐│ _id (PK)     │
  │ email        │            ││ userId (FK)  │
  │ password     │            ││ contentHash  │
  │ role         │            ││ rawText      │
  │ status       │            ││ extractedData│
  └──────────────┘            └──────────────┘
         │                           │
         ├───────────────────────────┼──────────────────────────┐
         ▼                           ▼                          ▼
  ┌──────────────┐             ┌──────────────┐           ┌──────────────┐
  │ ChatMessage  │             │   Question   │           │     Note     │
  ├──────────────┤             ├──────────────┤           ├──────────────┤
  │ _id (PK)     │             │ _id (PK)     │           │ _id (PK)     │
  │ senderId(FK) │             │ submittedBy  │           │ authorId(FK) │
  │ senderName   │             │ (FK)         │           │ authorName   │
  │ channel      │             │ company      │           │ title        │
  │ text         │             │ role         │           │ content      │
  └──────────────┘             └──────────────┘           └──────────────┘
```

### Schema Properties

* **User**:
  - `name`: String (Required)
  - `email`: String (Required, Unique, Lowercase)
  - `password`: String (Required)
  - `role`: String (`STUDENT`, `ADMIN`, default: `STUDENT`)
  - `status`: String (`ACTIVE`, `BLOCKED`, default: `ACTIVE`)
  - `joinedDate`: Date (default: `Date.now`)
* **Resume**:
  - `userId`: Schema.Types.ObjectId (Ref: `User`, Required)
  - `userName`: String
  - `contentHash`: String (SHA-256 of extracted text, used for caching audits)
  - `rawText`: String
  - `score`: Number
  - `extractedData`: Object (Parsed JSON matching Gemini's response schema: keySkills, workExperience, strengths, weaknesses)
  - `date`: Date (default: `Date.now`)
* **Note**:
  - `title`: String (Required)
  - `content`: String (Required)
  - `category`: String (default: `'General'`)
  - `authorId`: Schema.Types.ObjectId (Ref: `User`)
  - `authorName`: String
  - `date`: Date (default: `Date.now`)

---

## 8. API Documentation

### REST API Catalog

| Endpoint Route | Method | Authentication | Payload Schema | Success Response | Responsible File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | `{ name, email, password, role }` | `{ token, user: { id, email, role } }` | `server.js` |
| `/api/auth/login` | `POST` | Public | `{ email, password }` | `{ token, user: { id, email, role } }` | `server.js` |
| `/api/auth/me` | `GET` | Bearer Token | None | `{ user: { id, name, email, role } }` | `server.js` |
| `/api/resume/analyze` | `POST` | Bearer Token | `multipart/form-data` (file: PDF) | `{ score, keySkills, suggestions }` | `server.js` |
| `/api/notes` | `GET` | Bearer Token | None | `[{ id, title, content, authorName }]` | `server.js` |
| `/api/notes` | `POST` | Bearer Token | `{ title, content, category }` | `{ id, title, content, authorName }` | `server.js` |
| `/api/notes/:id` | `DELETE`| Bearer Token | None | `{ success: true }` | `server.js` |
| `/api/config/gemini-key` | `GET` | Bearer Token | None | `{ apiKey: "AIzaSy..." }` | `server.js` |
| `/api/config` | `GET` | Public | None | `{ announcement, allowSignups, maintenanceMode }`| `server.js` |
| `/api/config` | `PATCH`| Bearer (Admin) | `{ announcement, allowSignups, maintenanceMode }`| Updated system config object | `server.js` |
| `/api/users/:id` | `DELETE`| Bearer (Admin) | None | `{ success: true }` | `server.js` |

---

## 9. Security Audit

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CRITICAL SECURITY FINDINGS                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. API KEY LEAKAGE ON THE FRONTEND                                     │
│    Vulnerability: The client-side MockInterview.jsx instantiates the   │
│    GoogleGenAI SDK directly in the browser using the raw developer key.│
│    Severity: CRITICAL                                                  │
│    Impact: Users can inspect browser memory or websocket headers to    │
│    extract the developer's key, bypassing budget and rate limit limits.│
│                                                                        │
│ 2. INSECURE SECRETS STORAGE                                            │
│    Vulnerability: Production MongoDB passwords and Gemini API keys are │
│    hardcoded in the git-tracked .env file.                              │
│    Severity: HIGH                                                      │
│    Impact: Anyone with repository access can extract the credentials.  │
│                                                                        │
│ 3. INSECURE JWT FALLBACK SIGNING                                       │
│    Vulnerability: server.js uses 'secret' if process.env.JWT_SECRET    │
│    is empty.                                                           │
│    Severity: MEDIUM                                                    │
│    Impact: Attackers can forge signatures and gain Admin privileges    │
│    if env configuration fails to load.                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Performance Audit

### Bottlenecks and Redundant Operations
1. **State Polling Overload**:
   `AppContext.jsx` executes a global `refreshAllData` polling cycle every 5 seconds. This cycle fires 5 separate network requests simultaneously (`/jobs`, `/questions`, `/notes`, `/config`, and `/chat/general`). This creates substantial server load and forces complete React component re-renders every 5 seconds, even when no database records have changed.
2. **Missing UI Cache Layers**:
   There are no frontend caching mechanisms (such as React Query or SWR). Switching page views triggers a complete re-fetch of all resource collections from port 3000.
3. **Tailwind CDN Loading**:
   Relying on `cdn.tailwindcss.com` blocks layout painting while the Tailwind JS engine parses the DOM to inject styles, which increases rendering latency on mobile browsers.

---

## 11. UI/UX Audit

### Design Evaluation
* **Visual Polish**: The application interface relies on standard slate and indigo panels. Integrating modern visual assets like glassmorphism backdrops, smooth gradient cards, and animated transition frames would provide a more premium feel.
* **Loading and Pending States**: Uploading a PDF resume freezes the user interface with a generic loading text. There are no skeleton screens or interactive progress bars to provide visual feedback during long-running AI API tasks.
* **Error Banner Feedback**: If an API request fails, the application triggers a generic browser `alert()`. These block UI threads and degrade the user experience compared to non-intrusive toast notifications.

---

## 12. Code Quality Report

### Coding Standard Audits
* **SOLID Principles Compliance**:
  - *Single Responsibility (SRP)*: `server.js` violates SRP by handling database setups, CORS configurations, authentication validation, business logic routes, and mounting the Vite bundler middleware in a single file.
  - *Open/Closed (OCP)*: Adding new model helpers requires modifying `dbHelper.js`'s core object rather than implementing plugin providers.
* **TypeScript Transition**:
  - The project contains duplicate, out-of-sync server files (`server.js` and `server/src/index.ts`). The typescript implementation lacks updates made to the javascript file, which can lead to compilation issues.

---

## 13. README.md

*(Note: The updated, production-ready `README.md` has been successfully written to the root directory at [README.md](file:///d:/New%20folder%20%284%29/README.md). It details features, installation instructions, environment setup, and the dual-database model architecture.)*

---

## 14. Modernization Roadmap

```
Phase 1: Security & Stability (Immediate)
  ├── 1. Route client Gemini requests securely or inject keys via build vars
  ├── 2. Clean up server.js require('pdf-parse') and replace with ES import
  └── 3. Implement Note and SystemConfig database schemas and helper endpoints

Phase 2: UI/UX & Performance (Short-Term)
  ├── 1. Replace Tailwind CDN with compiled PostCSS and Tailwind build pipelines
  ├── 2. Implement client-side Toast alerts and visual skeleton loaders
  └── 3. Refactor AppContext polling to query only on view mount or use WebSockets

Phase 3: Database & Code Quality (Mid-Term)
  ├── 1. Consolidate server.js into the TypeScript server/src directory
  ├── 2. Introduce query indexes for Users and Chat collections
  └── 3. Separate routing controllers into a clean MVC structure
```

---

## 15. Final Recommendations

1. **Migrate to TypeScript**: Deprecate `server.js` in favor of a compiled `/server/src/index.ts` setup to enforce type safety.
2. **Exclusion of Secrets**: Rotate the leaked database passwords and the Gemini API key immediately. Update `.env.example` and remove all sensitive credentials from the git log.
3. **Adopt Compiled Tailwind CSS**: Remove the CDN loader script in `index.html`. Add tailwind compilation to the Vite bundler configuration to generate a minified, static CSS bundle.
4. **Implement State Management Library**: Replace the polling-based `AppContext` with a state library like Zustand combined with React Query. This minimizes network traffic and unnecessary component re-renders.
