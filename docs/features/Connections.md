# Feature: Connections & Mutual Networking

## Feature Purpose
Enables students to build their professional networks by sending connection requests, follow updates, and checking mutual connections.

## Current Status
**Fully Functional**. Supports sending, accepting, rejecting, blocking, removing, and cancelling connection requests.

## Architecture
```text
[React Client] <---> [Connection APIs] <---> [Connection Schema]
                                                     |
                                            (Auto-Sync Hooks)
                                                     |
                                            [Follow Legacy Fields]
```

## Frontend Components
* [ConnectionsPage.jsx](file:///d:/campus_media/client/src/pages/ConnectionsPage.jsx): Displays sent requests, received invites, and mutual connections.
* [PostCard.jsx](file:///d:/campus_media/client/src/components/PostCard.jsx): Inline connection action triggers next to author profile cards.

## Backend Routes
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js)

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js)

## Database Collections
* `connections` (consolidated)
* `users`

## Connection Request States
The system enforces the following relationship states inside the consolidated `Connection` collection:
* `pending`: Connection request sent by requester to recipient.
* `accepted`: Connection accepted; users are connected and private chat opens.
* `rejected`: Connection request declined by the recipient.
* `cancelled`: Connection request retracted by the requester before acceptance.
* `removed`: Connection broken/deleted later by either user.
* `blocked`: Relationship blocked; prevents future interactions.

## Mutual Connection Calculations
To display mutual connections count:
1. Query all connected user IDs for Student A (status is `accepted`).
2. Query all connected user IDs for Student B (status is `accepted`).
3. Compute the intersection count of both sets and attach it to the profile/card payloads.

## API Endpoints
* `POST /api/users/follow/:id` - Sends/Requests connection.
* `DELETE /api/users/unfollow/:id` - Removes/Cancels connection.
* `POST /api/users/connections/accept/:id` - Accepts pending connection.
* `POST /api/users/connections/reject/:id` - Rejects pending connection.
* `GET /api/users/connections/pending` - Lists pending connection invites.

## Performance Notes
* Feed API calls automatically compute connection status and mutual connections count in a single database lookup.
