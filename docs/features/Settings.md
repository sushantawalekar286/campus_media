# Feature: Settings

## Feature Purpose
Manages global system configurations (e.g. announcement banners, maintenance modes) and lets students update their individual privacy and notification settings.

## Current Status
**Fully Functional**. Admin system configs are stored in the database, and student settings are updated via profile forms.

## Architecture
```text
[React Client] ---> (JSON Updates) ---> [Express Server]
                                              |
     [Mongoose Model] <--- (Save Config) <----+
```

## Frontend Components
* [AdminPanel.jsx](file:///d:/campus_media/client/src/pages/AdminPanel.jsx): Form to edit global configurations.
* [ProfileSetup.jsx](file:///d:/campus_media/client/src/pages/ProfileSetup.jsx): Inputs to manage student notifications.

## Backend Routes
* `/api/config` routes inside [server.js](file:///d:/campus_media/server/server.js)
* `/api/users/profile` routes inside [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js)

## Controllers
* Handled inline for global configs, and in [userController.js](file:///d:/campus_media/server/controllers/userController.js) for student profiles.

## Database Collections
* `systemconfigs`
* `users`

## Dependencies
* None.

## Flow Diagram (Text)
```text
1. Admin enters a new announcement banner and saves it.
2. Server validates the admin credentials and saves the configuration.
3. Users reload the page -> Client fetches the updated configuration.
4. Client displays the new announcement banner at the top of the screen.
```

## API Endpoints
* `GET /api/config` - Fetches global configurations.
* `PATCH /api/config` - Updates global configurations.
* `PUT /api/users/profile` - Modifies student notification settings.

## Current Bugs
* None identified.

## Known Limitations
* The app does not poll the global configuration dynamically, so users must manually refresh the page to see banner updates.

## Future Improvements
* Add a banner caching mechanism to avoid querying the database on every page load.
* Support customizable scheduling for system announcements.

## Testing Checklist
- [ ] Config saving verification.
- [ ] Maintenance mode lock checks.
- [ ] Notification flag toggle testing.

## Performance Notes
* Global config is a single document, which has minimal impact on database performance.

## Security Notes
* Ensure only users with the `ADMIN` role can update global configuration settings.
