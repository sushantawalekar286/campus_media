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
* `connections` / `follows`
* `users`
* **Mongoose Mixed Field Query Handling**: Because the `Follow` collection's `followerId` and `followingId` schema fields are defined as `Mixed` types, Mongoose does not automatically cast input search strings to MongoDB ObjectIds. To ensure flawless queries regardless of whether IDs are saved as ObjectIds or plain strings, the backend follow controllers use `$or` criteria to check combinations of original ObjectIds and stringified IDs.

## Dependencies
* None.

## Flow Diagram (Text)
```text
1. Student clicks 'Connect' on a peer's profile card.
2. Server creates a Connection/Follow document set to 'accepted' (for public profile follows) or 'pending' (for private connection requests).
3. Recipient views the invite on their ConnectionsPage and clicks 'Accept'.
4. Server updates status to 'accepted', establishing the link.
```

## API Endpoints
* `POST /api/users/follow/:id` - Follow a user (or send request).
* `DELETE /api/users/unfollow/:id` - Remove follow/connection relationship.
* `GET /api/users/connections/pending` - List pending follow requests.
* `POST /api/users/connections/accept/:id` - Accept a pending connection request.
* `POST /api/users/connections/reject/:id` - Decline a pending connection request.
* `GET /api/users/followers/:id` - Lists user's followers.
* `GET /api/users/following/:id` - Lists users the user is following.

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
