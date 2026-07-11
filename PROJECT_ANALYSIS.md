# Project Analysis & Architecture Review

This document contains a comprehensive review of the Campus Media project, detailing its architecture, code quality, dependency management, dead code, technical debt, and a roadmap for future production readiness.

---

## 📊 Project Scorecard

| Category | Score (0-100) | Assessment |
| :--- | :--- | :--- |
| **Overall Project Score** | **78 / 100** | A feature-rich platform with solid foundations but needing optimization. |
| **Architecture** | **75 / 100** | Clean Express structure, but has duplicate directories and unused typescript sub-folders. |
| **Frontend** | **82 / 100** | Modern dark CSS theme with Zustand and AppContext, but relies on REST polling. |
| **Backend** | **80 / 100** | Effective modular controller-service pattern with double-mode database. |
| **Database** | **85 / 100** | Effective Mongoose schemas and unique indexes. File system fallback is a major plus for dev setups. |
| **Authentication** | **90 / 100** | Robust JWT authentication with rate limits and double OTP verification steps. |
| **WebSockets** | **75 / 100** | Excellent low-latency client-side Gemini Live connection, but lacks server-side Socket.IO. |
| **AI Modules** | **85 / 100** | Clean prompt construction with response schema constraints. |
| **Resume Module** | **88 / 100** | Handles parsing, ATS scoring, and caching. |
| **Interview Module** | **80 / 100** | Excellent live audio feedback loops and post-interview reports. |
| **Security** | **70 / 100** | Helmet and CORS configured, but suffers from key leakage in client configs. |
| **Scalability** | **65 / 100** | Polling requests and lack of caching limit scalability. |
| **Maintainability** | **70 / 100** | Unused backup folders, duplicate scripts, and TS sub-folders clutter the workspace. |
| **Performance** | **72 / 100** | Polling overhead and basic regex search queries impact performance. |
| **Production Readiness** | **60 / 100** | Lacks Docker files, CI/CD templates, structured logging, and unit tests. |

---

## ⚠️ Critical Vulnerabilities & Bugs
1. **API Key Exposure**: The backend returns the raw Google Gemini API key to the client via `/api/config/gemini-key` to support direct WebSockets, exposing it to potential theft.
2. **Missing Input Sanitization**: Inputs are not sanitized, exposing the app to XSS vulnerabilities.
3. **No Active JWT Invalidation**: Blocking a user does not invalidate their active JWT token, letting them use the API until their session expires.

---

## 📦 Dependency Analysis

### Unused Packages
* **`@tanstack/react-query`**: Installed in root package but not imported by any frontend file.
* **`pdfjs-dist`**: Unused in the primary code workspace (pdf-parse is used instead).

### Duplicates & Bloat
* The `server/package.json` file duplicates dependencies that are already declared in the root `package.json` (such as `express`, `mongoose`, `dotenv`, and `cors`), which can cause package mismatch issues.

---

## 🧹 Dead Code & Orphan Files

### Unused Directories
* **`/campus/`**: The original AI Studio code export. It is not loaded or used by the main application, representing a large amount of dead code.
* **`/backup_v1/`**: Contains backup frontend pages that are not imported by active routes.
* **`/server/src/`**: Contains typescript duplicates of the models and services. This code is never run, as the dev script executes the javascript files under `server/server.js` directly.

### Orphan Files
* **Root `server.js`**: An older, duplicate version of `server/server.js` that is not used.
* **`types.js` (Root)** & **`client/src/types.js`**: Simple files declaring unused interface stubs.
* **Dormant Notes Feature**: The backend models, routes, and client Context states for notes are fully implemented, but no page component renders the UI.

---

## 🚀 Production Hosting Roadmap

### 1. Suggested Folder Structure
Clean up the codebase by removing unused backup folders and consolidating typescript directories:
```text
campus_media/
├── client/                 # Clean React SPA directory
├── server/                 # Consolidated JavaScript server directory
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── docs/                   # Complete project documentation
├── package.json            # Single, consolidated root package file
└── tailwind.config.js
```

### 2. Docker & Containerization
Create a `Dockerfile` to build the unified production image:
```dockerfile
# Build React Frontend
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build Unified Backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./dist
EXPOSE 3000
CMD ["node", "server/server.js"]
```

### 3. Monitoring & Structured Logging
* **Logging**: Replace default console logs with **Winston** or **Pino** to log structured JSON data.
* **Monitoring**: Set up **PM2** to manage the server process, and integrate **Prometheus** and **Grafana** to track request volumes and CPU usage.

### 4. CI/CD Deployment Flow
Configure a GitHub Actions workflow to run lint tests and build Docker containers:
```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Run Build
        run: npm run build
      - name: Build Docker Image
        run: docker build -t campus-media:latest .
```

---

## 🛠️ Recommended Feature Build Order
To prepare the platform for production, we recommend implementing features in the following order:
1. **Fix API Key Exposure**: Implement a backend WebSocket proxy to keep the Gemini API key secure on the server.
2. **Build Notes UI**: Create the frontend page for the dormant notes feature.
3. **Clean Codebase**: Delete the unused `/campus/`, `/backup_v1/`, and `/server/src/` directories.
4. **Implement Socket.IO**: Build a real-time server-side messaging system to replace REST polling.
