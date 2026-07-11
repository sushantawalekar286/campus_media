# Feature: Admin Panel (Moderation Panel)

## Feature Purpose
Provides administrators with the tools to manage users, review submitted interview questions, toggle system banner messages, and set maintenance configurations.

## Current Status
**Fully Functional**. Admin controls are protected by role validation middleware on the server.

## Architecture
```text
[React Client AdminPanel] ---> (Authorized Requests) ---> [Express Server]
                                                                |
 [User / Config updates] <--- (Verify JWT Admin Checks) <-------+
```

## Frontend Components
* [AdminPanel.jsx](file:///d:/campus_media/client/src/pages/AdminPanel.jsx): User grids, toggle controls, question lists, and configuration text areas.

## Backend Routes
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js)
* `/api/config` routes inside [server.js](file:///d:/campus_media/server/server.js)

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js)
* Config handlers inside [server.js](file:///d:/campus_media/server/server.js)

## Services
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js)

## Database Collections
* `users`
* `questions`
* `systemconfigs`

## Dependencies
* [roleMiddleware.js](file:///d:/campus_media/server/middleware/roleMiddleware.js) - admin validations

## Flow Diagram (Text)
```text
1. Admin opens AdminPanel page.
2. Selects user record in management grid and clicks 'Block'.
3. Client sends request to backend.
4. Role check middleware verifies Admin credentials.
5. Server sets user status to 'BLOCKED', preventing them from logging in.
```

## API Endpoints
* `GET /api/users` - Lists registered accounts.
* `PATCH /api/users/:id/status` - Blocks/unblocks users.
* `PATCH /api/config` - Modifies system configuration settings.

## Current Bugs
* None identified.

## Known Limitations
* Blocking a user does not immediately invalidate their active JWT token, letting them use the API until their session expires.

## Future Improvements
* Set up a token blocklist (e.g. using Redis) to immediately log out blocked users.
* Add audit logs to track admin actions.

## Testing Checklist
- [ ] Role validation checks (non-admins must be blocked).
- [ ] User status toggling verification.
- [ ] Config form validation.

## Performance Notes
* Retrieve queries use search and page limits to avoid loading huge user lists.

## Security Notes
* Always apply `roleMiddleware` to admin endpoints to prevent access bypasses.
