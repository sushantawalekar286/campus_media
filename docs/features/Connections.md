# Feature: Connections

## Feature Purpose
Enables students to network with peers, mentors, and seniors.

## Current Status
**Fully Functional**. Supports sending, accepting, and deleting connection requests.

## Architecture
```text
[React Client ConnectionsPage] ---> (API Requests) ---> [User Routes]
                                                               |
                                                       [User Controller] ---> [Connection Model]
```

## Frontend Components
* [ConnectionsPage.jsx](file:///d:/campus_media/client/src/pages/ConnectionsPage.jsx): Displays sent requests, received invites, and mutual connections.

## Backend Routes
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js)

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js)

## Database Collections
* `connections`
* `users`

## Dependencies
* None.

## Flow Diagram (Text)
```text
1. Student clicks 'Connect' on a peer's profile card.
2. Server creates a Connection document set to 'PENDING'.
3. Recipient views the invite on their ConnectionsPage and clicks 'Accept'.
4. Server updates status to 'ACCEPTED', establishing the link.
```

## API Endpoints
* `GET /api/users/connections` - Lists active connections.
* `POST /api/users/connect/:id` - Sends a connection request.
* `PATCH /api/users/connect/:id` - Accepts a request.
* `DELETE /api/users/connect/:id` - Rejects or removes a connection.

## Current Bugs
* None identified.

## Known Limitations
* Notifications are not automatically sent to recipients when connection requests are created.

## Future Improvements
* Add a connection recommendation engine based on shared skills.

## Testing Checklist
- [ ] Invitation creation checks.
- [ ] Acceptance state toggling tests.
- [ ] Decline workflow validation.

## Performance Notes
* Retrieve operations should run `.populate()` selectively to avoid loading large profile documents.

## Security Notes
* Ensure users can only accept requests that were sent to them.
