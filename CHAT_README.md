# User Chat System

The user chat system provides text messaging between students after a connection (follow relationship) is established.

## User Flow
1. **Open Chat List**: User clicks the "Messages" icon or navigates to `/chat`. The sidebar displays a list of recent conversations. Each shows the profile picture, name of the recipient, snippet of the last message, and relative time of dispatch.
2. **Start Conversation**: Selecting an active conversation loads the historical messages between both users. If none exist, it displays an empty chat start screen.
3. **Send Message**: The sender inputs a message and clicks Send. The message is pushed to the database and appears instantly on the sender's screen.
4. **Receive Message**: The active chat poll or socket updates the chat log so new messages appear dynamically.

## APIs
- `GET /api/chat/conversations` - Retrieves list of active conversations with last messages and recipient info.
- `GET /api/chat/messages/:recipientId` - Fetches historical message exchanges between the logged-in user and the recipient.
- `POST /api/chat/send` - Dispatches a new text message. Expects `{ receiverId: String, content: String }`.

## Database Models
Inside `server/models/ChatMessage.js`:
- `senderId`: ObjectId (ref: User)
- `receiverId`: ObjectId (ref: User)
- `content`: String
- `timestamp`: Date / Number
- `isRead`: Boolean (default: false)

## Components
- `MessagesPage.jsx` - Dual panel messaging interface containing the recipient sidebar and current conversation window.

## Chat Access Control
Chat endpoints (sending messages, listing messages) verify that the relationship status between the two users is `accepted` in the `Follow` collection. If the connection is not accepted, the server rejects the request with a `403 Forbidden` status.
