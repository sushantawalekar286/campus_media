# Connections & Follow System

The connect system handles relationships between students, allowing them to follow one another, send connection requests, and approve interactions.

## User Flow
1. **Visit Student Profile**: When visiting a profile, a button indicates "Follow" or "Following" or "Requested".
2. **Follow Action**: Clicking "Follow" submits a request. If the recipient's profile is public, the relationship is established immediately. If private or requiring connection authorization, a pending request is logged.
3. **Accept/Reject Requests**: Users can view pending connection requests on their notification hub/dashboard and choose to approve or dismiss them.
4. **Followers/Following Update**: Once established, the counters on both profiles are incremented, enabling chat functionality between the two users.

## APIs
- `POST /api/users/follow/:userId` - Follow a user (or send request).
- `POST /api/users/unfollow/:userId` - Remove follow/connection relationship.
- `GET /api/users/connections/pending` - List pending follow requests.
- `POST /api/users/connections/accept/:requestId` - Accept a pending connection request.
- `POST /api/users/connections/reject/:requestId` - Decline a pending connection request.

## Database Models
Inside `server/models/Follow.js`:
- `followerId`: ObjectId (ref: User)
- `followingId`: ObjectId (ref: User)
- `status`: String (enum: ['pending', 'accepted'], default: 'accepted')

## Components
- `Profile.jsx` - Contains the Connect/Message action buttons mapped to relationship state.
- `ConnectionsPage.jsx` - Dashboard with tabbed views for current Connections and Pending Requests.

## Robust Query Matching (Mixed Field Support)
Because the `Follow` collection's `followerId` and `followingId` schema fields are defined as `Mixed` types, mongoose does not auto-cast input search strings to MongoDB ObjectIds. To ensure flawless queries regardless of whether IDs are saved as ObjectIds or plain strings, the backend follow controllers use `$or` criteria to test combinations of original ObjectIds and casted string representations.
