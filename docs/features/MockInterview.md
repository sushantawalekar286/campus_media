# Feature: Voice AI Mock Interviewer

## Feature Purpose
Provides realistic, voice-to-voice interview simulations powered by Gemini Live, letting students practice technical and behavioral questions and receive detailed performance feedback.

## Current Status
**Fully Functional**. Supports direct WebSockets streaming to Google servers with robust resource cleanups to prevent browser AudioContext leaks.

## Architecture
```text
[Browser Mic Context] ---> (16kHz PCM) ---> [Google GenAI WebSocket SDK]
                                                     |
                                            (Gemini Live API)
                                                     |
[Browser Audio Speaker] <--- (24kHz PCM) <--- [Google GenAI WebSocket SDK]

Then:
[Client MockInterview] ---> (POST Transcript) ---> [Express Server]
                                                          |
                                                  [aiService Feedback]
```

## Frontend Components
* [MockInterview.jsx](file:///d:/campus_media/client/src/pages/MockInterview.jsx): Coordinates AudioContext structures, WebSocket connections, voice playbacks, and score displays.

## Backend Routes
* Enposed directly inside the unified server script [server/server.js](file:///d:/campus_media/server/server.js#L208-L217):
  * `POST /api/interview/feedback`

## Controllers
* Handled inline within the unified backend routing code.

## Services
* [aiService.js](file:///d:/campus_media/server/services/aiService.js): Declares `generateFeedback`.

## Database Collections
* None (feedback reports are displayed to users but not saved to schemas in the database).

## Dependencies
* `@google/genai` - WebSockets model controller
* Web Audio API - browser microphone and speaker interfaces
* [audioUtils.js](file:///d:/campus_media/client/src/utils/audioUtils.js) - PCM converters

## Flow Diagram (Text)
```text
1. User clicks start -> Web application queries for microphone permissions.
2. Opens WebSocket connection to Gemini Live.
3. Transmits microphone audio packets and plays returned audio in real-time.
4. User clicks end -> Client gathers conversation script.
5. Client posts script to /api/interview/feedback.
6. Backend uses Gemini model to score answers and returns a feedback report.
```

## API Endpoints
* `POST /api/interview/feedback` - Evaluates conversation scripts.

## Current Bugs
* Connection dropouts can occur on slow networks, causing silent failures during audio streaming.

## Known Limitations
* Feedback reports are not saved to database schemas, so students cannot view their past performance history.

## Future Improvements
* Add a session database model to save feedback history.
* Build a frontend volume indicator and waveform visualizer to show mic activity.

## Testing Checklist
- [ ] Microphone permission prompts check.
- [ ] WebSocket connection creation verification.
- [ ] Audio playback loops testing.
- [ ] Feedback report formatting checks.

## Performance Notes
* Split input/output contexts to run at native sample rates (16kHz input, 24kHz output) to avoid CPU-heavy resampling tasks.

## Security Notes
* Keep API keys secure. Do not hardcode credentials in page components.
