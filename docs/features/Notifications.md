# Feature: Notifications

## Feature Purpose
Alerts students about new likes, comments, connections, messages, and job listings.

## Current Status
**Placeholder / Under Development**. User preferences (email/push flags) are saved, but the system relies on a placeholder frontend component.

## Architecture
```text
[React Client] ---> (Updates Settings) ---> [User Controller]
                                                    |
                                            [User Schema Model]
```

## Frontend Components
* `NotificationsPage` inside [PlaceholderPages.jsx](file:///d:/campus_media/client/src/pages/PlaceholderPages.jsx): A placeholder view explaining the feature.

## Backend Routes
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js): Exposes endpoints to save notification settings.

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js): Saves user preferences.

## Database Collections
* `notifications` (Model created but unused)
* `users` (Stores preference flags)

## Dependencies
* None.

## Flow Diagram (Text)
```text
1. User navigates to Settings and toggles Email Notifications.
2. Form submits preference updates to the backend.
3. Server saves the new settings to the User document.
4. Notifications are skipped on future events if the preference flags are false.
```

## API Endpoints
* `PUT /api/users/profile` - Saves notification settings.

## Current Bugs
* None identified.

## Known Limitations
* Real-time notifications and feed updates are not yet implemented.

## Future Improvements
* Set up a real-time event dispatcher on the server.
* Add in-app notifications.

## Testing Checklist
- [ ] Settings save validation.
- [ ] Unsubscribe workflow check.

## Performance Notes
* Retrieve operations should load settings on session start to avoid redundant database calls.

## Security Notes
* Ensure users can only modify their own notification settings.
