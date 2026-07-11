# Feature: Messaging (Mentorship Chat)

## Feature Purpose
Enables real-time collaboration and networking between students, mentors, and seniors across channels (such as `#general`, `#interview-prep`, and `#jobs`).

## Current Status
**Fully Functional**. Messages are exchanged using REST API endpoints.

## Architecture
```text
[React Client MessagesPage] <---> [AppContext Messaging Poll]
                                         |
                                  [Express Server] ---> [ChatMessage Schema]
```

## Frontend Components
* [MessagesPage.jsx](file:///d:/campus_media/client/src/pages/MessagesPage.jsx): Chat UI showing active channels, direct message threads, and text inputs.

## Backend Routes
* [chatRoutes.js](file:///d:/campus_media/server/routes/chatRoutes.js)

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js) (Note: chat logic is split across controllers)

## Services
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js)

## Database Collections
* `chatmessages`

## Dependencies
* None.

## Flow Diagram (Text)
```text
1. User enters text in a chat channel and clicks send.
2. Client sends a POST request containing the channel ID and message content.
3. Server saves the ChatMessage document and returns it.
4. Client UI receives the response and appends the message to the chat layout.
```

## API Endpoints
* `GET /api/chat/conversations` - Retrieves a list of active conversations with last messages and recipient info.
* `GET /api/chat/messages/:recipientId` - Fetches historical message exchanges between the logged-in user and the recipient.
* `POST /api/chat/send` - Sends a new direct message. Expects `{ receiverId: String, content: String }`.

## Current Bugs
* None identified.

## Known Limitations
* Polling is used instead of WebSockets, which can delay message delivery.

## Future Improvements
* Refactor the system to use Socket.IO for real-time messaging.
* Add read receipts.

## Testing Checklist
- [ ] Channel switching validation.
- [ ] Message dispatch and rendering tests.
- [ ] Input field overflow handling.

## Performance Notes
* Limit the number of messages loaded initially to the 50 most recent to minimize query response times.

## Security Notes
* **Connection Verification**: Chat endpoints (sending messages, listing messages) verify that the relationship status between the two users is `accepted` in the `Follow` collection. If the connection is not accepted, the server rejects the request with a `403 Forbidden` status.
* Sanitize message inputs on the server to prevent XSS injection attacks.
