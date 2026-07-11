# Frontend Client Module (`client/`)

This directory contains the client-side single-page application (SPA) built using React 18, Tailwind CSS, and Vite.

## Purpose
Serves as the user interface (UI) portal for students, mentors, and administrators. It manages view layouts, routes, audio streaming capture for voice mock interviews, PDF resume uploads, dashboard charts, and global user settings.

## Responsibilities
* **User Authentication**: Login, sign-up, OTP verification, password resets, and session recovery.
* **Resume Auditor**: PDF upload UI, score rendering, and interactive STAR bullet point reviews.
* **Mock Interview**: Real-time voice exchange, speech visualizers, status indicators, and feedback reports.
* **Social Feed & Community**: Posting projects, liking/commenting, profile exploration, and connection invitations.
* **Mentorship Chat**: Peer-to-peer and group chat channel interfaces.
* **Admin Controls**: Administrative panels for user management, config updates, question bank approvals, and system monitoring.

## Dependencies
* `react` & `react-dom` (v18.2)
* `react-router-dom` (v6.22) - routing
* `zustand` (v5.0) - auth state persistence
* `@google/genai` - direct WebSocket connections to Gemini Live
* `framer-motion` - animations
* `recharts` - admin dashboard charts
* `lucide-react` - icon sets
* `axios` - REST requests

## Important Files
* `src/App.jsx`: Main routing setup with guards and error boundary.
* `src/main.jsx`: Application bootstrap.
* `src/index.css`: Style tokens and styling base.

## Important Classes / Functions
* `ErrorBoundary`: Catches React rendering exceptions.
* `ProtectedRoute` & `PublicRoute`: Authentication guard wrappers.
* `SplashScreen`: Initial page loader while initializing session.

## Used By
* Serves as the primary frontend client. The root unified server mounts this directory dynamically in development or serves its compiled static build (`dist/`) in production.

## Future Improvements
* Migration to TypeScript for full-type checking across components.
* Implementation of local component-level unit testing using Jest/Vitest and React Testing Library.
* Code splitting via `React.lazy` on major pages to optimize initial load bundle sizes.

## Common Errors
* **AudioContext Not Allowed to Start**: Occurs when browser audio APIs are called before the user interacts with the page. Managed by prompting user with button click triggers before starting live session.
* **Asset Loading Failures**: Relative path assets fail if sub-routes are opened. Resolved by configuring Vite base asset pathways to static directories.
