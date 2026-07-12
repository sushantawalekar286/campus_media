# Feature: Student Profile & Portfolios

## Feature Purpose
Serves as a production-quality, LinkedIn-style student portfolio containing education milestone logs, project portfolios, recent activities, earned achievements, and AI career companion stats.

## Current Status
**Fully Functional**. Supports public visibility, private profile lock guard screens, and dynamic data population from MongoDB sub-collections.

## Architecture
```text
                       [React Profile Screen]
                                 |
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
   [Public Profile]                             [Private Profile]
           │                                           │
  (Renders Full Tabs)                         (Checks Connection)
           │                                           │
  ┌────────┼────────┐                                  ├── Connected?
  ▼        ▼        ▼                                  │     ├── Yes -> Shows Full Tabs
[Posts] [Projects] [Resources]                         │     └── No  -> Shows Lock Screen
                                                       ▼
                                            "This Account is Private"
```

## Database Collections Referencing
To avoid duplicate data, all portfolios are normalized:
* **Projects**: Referenced from the `Project` collection (`userId` ref).
* **Achievements**: Referenced from the `Achievement` collection (`userId` ref).
* **Resources**: Referenced from the `Resource` collection (`uploaderId` ref).
* **Posts**: Referenced from the `Post` collection (`userId` ref).

## Profile Privacy Controls
* **Public Accounts**: All tabs (Posts, Projects, Achievements, Resources, About) are visible to any platform user.
* **Private Accounts**: 
  * Only basic info (Avatar, Cover, Full Name, Username, Bio, Department, Year, counts) is returned if not connected.
  * Attempting to view tabs will trigger the restricted lock screen overlay: **"This account is private"**.
  * Complete portfolio details are unlocked once a connection request is **accepted**.
  * Privacy parameters (`hideFollowers`, `hideFollowing`, `hideResumeScore`, etc.) are checked and respected dynamically on the backend.

## Frontend Components
* [Profile.jsx](file:///d:/campus_media/client/src/pages/Profile.jsx): Displays profile setup, banner, contact cards, activity history, and lock screens.
* [ProjectDetailModal.jsx](file:///d:/campus_media/client/src/components/ProjectDetailModal.jsx): Interactive modal to open and audit project cards.

## API Endpoints
* `GET /api/users/profile` - Gets current user profile details.
* `GET /api/users/:username` - Queries student profiles (handles private lock flag `isPrivateAndRestricted`).
* `PUT /api/users/projects` - Synchronizes user projects inside the Mongoose Project collection.
* `PUT /api/users/achievements` - Synchronizes user achievements.
