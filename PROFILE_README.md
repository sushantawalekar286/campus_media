# User Profile System

This system handles viewing student profiles, managing skills, educational history, career achievements, project portfolios, and visual customization (profile picture & cover picture).

## User Flow
1. **View Own Profile**: User clicks on "Profile" in the navigation. The app queries `/api/users/profile` and displays user's cover picture, profile picture, social stats (posts, followers, following), basic info (department, year, bio), and dynamic tabs for projects, achievements, skills, and AI module logs.
2. **Edit Profile**: If viewing their own profile, edit buttons are visible. The user can:
   - Click edit profile to modify basic info (fullname, bio, year, department).
   - Click the camera icons overlaying the avatar or banner to upload new images.
   - Add, edit, or delete items in the Education, Projects, Skills, and Achievements tabs.
3. **View Other Student's Profile**: When visiting `/profile/:username`, the client fetches `/api/users/:username`. If the target user's visibility is private, they are restricted. If public, the profile details are rendered, including a "Follow/Connect" button.

## APIs
- `GET /api/users/profile` - Get logged-in user profile
- `GET /api/users/:username` - Get public profile of a user by username
- `PUT /api/users/profile` - Update profile bio and metadata
- `PUT /api/users/profile-picture` - Upload profile image (multipart/form-data)
- `PUT /api/users/cover-picture` - Upload cover image (multipart/form-data)
- `PUT /api/users/skills` - Update skills list
- `PUT /api/users/education` - Update education array
- `PUT /api/users/projects` - Update projects array
- `PUT /api/users/achievements` - Update achievements array

## Database Models
Inside `server/models/User.js`:
- `fullname`: String
- `username`: String
- `email`: String
- `bio`: String
- `skills`: [String]
- `education`: [{ school: String, degree: String, fieldOfStudy: String, startYear: Number, endYear: Number, current: Boolean }]
- `projects`: [{ title: String, description: String, link: String, technologies: [String] }]
- `achievements`: [{ title: String, description: String, date: Date }]
- `followersCount`: Number
- `followingCount`: Number
- `postsCount`: Number

## Components
- `Profile.jsx` - Main profile layout, banner image, social stats, tabs switcher, connect triggers, and update modals.

## Routing Fallback Mechanism
To support legacy users or external references without a strict `username` field, the `/profile/:username` path dynamically fallbacks to query by `_id` / `id` (both ObjectId and UUID strings) if a matching username is not found in the Database. Similarly, frontend links resolve to `user.username || user._id || user.id`.
