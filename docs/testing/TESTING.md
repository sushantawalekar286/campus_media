# Testing Documentation

This document explains the testing strategies, validation scripts, and device testing checklists for Campus Media.

---

## 🔬 API & Endpoint Testing
We recommend using API clients (like Postman or Bruno) to verify backend routes:
* **Auth Tests**: Verify login actions return valid tokens and register endpoints validate password complexity.
* **OTP Code Verification**: Verify that submitting invalid OTP codes blocks access, and entering valid codes activates accounts.
* **Mongoose Fallback Check**: Disconnect the MongoDB service and verify that requests fall back to reading and writing local JSON files.

---

## 🤖 AI Features Verification

### 1. Resume Auditor Tests
* **Text Extraction**: Upload a standard PDF resume and verify that text is extracted successfully.
* **Fail Case Verification**: Upload an image-only or scanned PDF and verify that the system returns a clear error instead of crashing.
* **AI Evaluation Schema**: Verify that the Gemini audit response returns the required JSON keys (score, strengths, STAR rewrites).

### 2. Live Voice Interview Tests
* **Microphone Permissions**: Deny mic access and verify that the app displays a clear permission error banner.
* **WebSocket Streams**: Start an interview and verify that the client connects to the Gemini Live WebSocket endpoint.
* **Audio Playback Loops**: Verify that the client plays model speech buffers clearly without clicks or delay.
* **Feedback Report Creation**: Complete the interview and verify that a POST request containing the transcript generates a detailed evaluation report.

---

## 📱 Browser & Mobile Device Testing
* **Cross-Browser Compatibility**: Test key features (especially microphone access and audio playback) on Chrome, Firefox, and Safari.
* **Mobile Responsiveness**: Test layout rendering on mobile viewports, verifying that sidebars collapse into toggle menus on smaller screens.
* **Network Performance**: Test voice interview stability under slow network conditions, verifying that connection drops are handled gracefully.
