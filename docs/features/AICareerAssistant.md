# Feature: AI Career Assistant (AI Mentor)

## Feature Purpose
Provides students with an interactive chatbot to ask career advice, seek interview preparation tips, and request study materials.

## Current Status
**Mock Simulation (Frontend-Only)**. The user interface is implemented, but user inputs trigger a mock `setTimeout` that returns a static, hardcoded response. No API routes or controller handlers exist to support live career mentor conversations.

## Architecture
```text
[React Client AIMentorPage] ---> (Local State Updates) ---> [Mock Static Response]
```

## Frontend Components
* [AIMentorPage.jsx](file:///d:/campus_media/client/src/pages/AIMentorPage.jsx): Renders a chat interface with suggestion chips, sidebars, typing indicators, and message history list layouts.

## Backend Routes
* None.

## Controllers
* None.

## Services
* None.

## Database Collections
* None.

## Dependencies
* `framer-motion` - message list animations
* `lucide-react` - icon sets

## Flow Diagram (Text)
```text
1. Student enters a question (e.g. "DSA roadmap details") or clicks a suggestion chip.
2. Question is appended to the local messages array.
3. Chat logs update and a typing indicator starts.
4. After a 1.5-second timeout, a static template message is returned.
```

## API Endpoints
* None.

## Current Bugs
* None (the static simulation runs correctly without requesting external resources).

## Known Limitations
* Conversations are not processed by AI models.
* Refreshing the browser resets the chat history.

## Future Improvements
* Integrate the page with a backend route that uses a Gemini model to answer career questions.
* Add support for streaming text responses (server-sent events).
* Support saving conversation threads to database schemas.

## Testing Checklist
- [ ] Suggestion chip click handlers.
- [ ] Message log scroll layouts.
- [ ] Hardcoded response timing checks.

## Performance Notes
* The mock setup uses negligible resources since all operations run locally in browser state.

## Security Notes
* None (no data is sent to external servers).
