# Feature: Student Profile

## Feature Purpose
Manages student identity cards, skills inventories, portfolios, education history, and platform metrics.

## Current Status
**Fully Functional**. Supports customized editing, resume attachments, and follower metrics.

## Architecture
```text
[React Client] ---> (JSON Payloads) ---> [User Routes]
                                                |
 [Cloudinary File Cloud] <--- (Files) <--- [User Controller] ---> [User Model Mongoose]
```

## Frontend Components
* [Profile.jsx](file:///d:/campus_media/client/src/pages/Profile.jsx): Displays profile details, tabs, timeline, and resume uploads.
* [ProfileSetup.jsx](file:///d:/campus_media/client/src/pages/ProfileSetup.jsx): Profile creation form.

## Backend Routes
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js)

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js)

## Services
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js)

## Database Collections
* `users`
* `resumes`
* `follows`

## Dependencies
* Uses standard Mongoose queries and Cloudinary storage for profile pictures.

## Flow Diagram (Text)
```text
1. User requests Profile setup screen.
2. Form submits details (biography, skills, external links).
3. Backend validates inputs and updates the User document.
4. Profile page queries details and renders user cards.
```

## API Endpoints
* `GET /api/users/profile/:username` - Queries user profiles.
* `PUT /api/users/profile` - Modifies profile details.
* `POST /api/users/follow/:id` - Follows/unfollows users.

## Current Bugs
* None identified.

## Known Limitations
* Usernames are not validated for URL safety, which can break profile link routing.

## Future Improvements
* Add a LinkedIn scraping tool to automatically populate profile fields.
* Support custom portfolio templates for students.

## Testing Checklist
- [ ] Profile updating verification.
- [ ] User follower increments check.
- [ ] External social links validation.

## Performance Notes
* Retrieve operations should run `.select('-password')` to prevent credentials leakage and reduce database payload sizes.

## Security Notes
* Verify user permissions before committing edits to profiles.
