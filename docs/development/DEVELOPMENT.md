# Development Guide

This guide outlines coding standards, naming conventions, directory rules, and workflows for extending the Campus Media platform.

---

## 📏 Coding Standards & Conventions

### 1. Naming Conventions
* **Variables & Functions**: Use camelCase (e.g. `const activeUser = ...`).
* **Database Models**: Use PascalCase (e.g. `User.js`, `ChatMessage.js`).
* **UI Components**: Use PascalCase (e.g. `PostCard.jsx`, `Layout.jsx`).
* **REST Routes**: Use kebab-case for endpoint URLs (e.g. `/api/auth/verify-otp`).

### 2. Project Directory Layout
* Put presentation components in `client/src/components/`.
* Put route pages in `client/src/pages/`.
* Put database models in `server/models/`.
* Put request validators in `server/validators/`.
* Put route endpoints in `server/routes/`.
* Put controllers in `server/controllers/`.

---

## 🔀 Git Workflow & Branch Strategy

### 1. Branch Strategy
* **`main`**: Production-ready branch. Do not push changes directly to `main`.
* **Feature Branches**: Branch off `main` for new features or bug fixes (e.g. `feature/resume-ocr` or `bugfix/audio-underflow`).

### 2. Commit Naming
Use descriptive prefixes:
* `feat`: New features (e.g. `feat: add job application status`).
* `fix`: Bug fixes (e.g. `fix: resolved duplicate likes`).
* `docs`: Documentation updates (e.g. `docs: updated api routes reference`).
* `style`: Styling adjustments (e.g. `style: adjust sidebar spacing`).

---

## 🛠️ Extensibility Guides

### 1. How to Add a New Database Model
1. Create a schema definition file in `server/models/` (e.g. `Event.js`).
2. Define the Mongoose schema, configure needed validation constraints, and export the model.
3. Import the new model in `server/services/dbHelper.js` and add corresponding fallback helper methods.

### 2. How to Add a New API Route
1. Create a route file in `server/routes/` or edit an existing one.
2. Define endpoint paths (e.g. `router.post('/register-event', ...)`).
3. Mount the route file in the server entry point `server/server.js`.

### 3. How to Create a New UI Page
1. Create a React page component in `client/src/pages/` (e.g. `EventCalendar.jsx`).
2. Add routing configurations in `client/src/App.jsx` under the `<AppContent />` route groups.
3. Update navigation links in `client/src/components/Layout.jsx` to expose the new page.

---

## 📋 Pre-Merge Checklist
Before merging changes into `main`, verify the following:
* [ ] The codebase compiles without errors (`npm run build` runs successfully).
* [ ] No raw credentials or API keys are hardcoded in the code.
* [ ] The local JSON database fallback works if MongoDB is offline.
* [ ] Updated documentation files in the `docs/` folder to reflect your changes.
