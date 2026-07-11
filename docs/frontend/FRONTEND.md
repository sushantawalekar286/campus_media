# Frontend Client Documentation

This document explains the React single-page application (SPA) architecture, state management patterns, routing guards, and client-side performance.

---

## 🏗️ React Structure
The frontend is a React application built with Vite:
* **Entry Point**: [main.jsx](file:///d:/campus_media/client/src/main.jsx) imports React, Tailwind CSS styles, and renders the `<App />` component.
* **Main Router**: [App.jsx](file:///d:/campus_media/client/src/App.jsx) sets up routes, guards, error boundaries, and loading screens.

---

## 🔑 State Management

### 1. Zustand Auth Store (`store/authStore.js`)
Manages authentication state globally:
* **States**: `user`, `accessToken`, `isAuthenticated`, and `isLoading`.
* **Actions**:
  * `initializeAuth()`: Reads token cookies on startup and validates the session.
  * `login(credentials)`: Submits credentials and saves returned JWT tokens.
  * `logout()`: Clears local state and deletes session cookies.

### 2. React Context (`context/AppContext.jsx`)
Shares application states across components:
* **States**: `posts`, `users`, `jobs`, `questions`, `notes`, `channels`, and `resumeContext`.
* **Actions**: Fetches lists of posts, notes, and messages, and updates connection requests.
* **Polling**: Runs background timers to refresh feeds and messages every few seconds.

---

## 🧭 Routing & Guards
The application uses **React Router DOM** with `HashRouter` to prevent client-side routing fallback failures on hosting platforms:
* **`ProtectedRoute`**: Verifies that the user is authenticated. Redirects to `/login` if not.
* **`PublicRoute`**: Prevents authenticated users from opening screens like Login or Signup, redirecting them to the home feed.
* **`ErrorBoundary`**: Catches rendering exceptions and displays a user-friendly error screen with reload buttons.

---

## 🎨 UI Components & Layouts
* **Sidebar Layout (`Layout.jsx`)**: Authenticated shell rendering the sidebar navigation panel and user card headers.
* **Timeline Feed (`PostCard.jsx`)**: Renders post text, media, likes, comments, and post deletion actions.
* **Upload Post (`CreatePostModal.jsx`)**: Dialog coordinating text inputs and file drops for new posts.

---

## 🎙️ Real-time Audio & Web Audio API
Used in the mock interview screen:
* **Input Context**: Microphone capture uses `AudioContext` at 16kHz, converting float sound packages to Int16 PCM base64 streams using [audioUtils.js](file:///d:/campus_media/client/src/utils/audioUtils.js).
* **Output Context**: Playback speaker uses `AudioContext` at 24kHz. Incoming base64 voice packets from Gemini Live are decoded into raw PCM and played sequentially.
* **WebSocket Controller**: Employs `@google/genai` to stream audio packages directly to Gemini Live gateways.

---

## ⚠️ Current Issues
* **Redundant REST Polling**: AppContext uses polling to query the backend for updates, which increases server load.
* **API Key Exposure**: Direct client-side WebSocket connections require the Gemini API key, exposing it in client code if not securely proxied or restricted.
