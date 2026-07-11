# Controllers Directory (`server/controllers/`)

This directory houses the resource controllers that process incoming HTTP requests and format API payloads.

## Purpose
Acts as the intermediate orchestration layer between API routes, business services, and database models. Controllers parse payload elements, enforce input checks, delegate execution to services, and send HTTP responses.

## Responsibilities
* **User Authentication (`authController.js`)**: Manages credentials, tokens, sign-ups, log-ins, password resets, and OTP confirmations.
* **Media Uploads (`mediaController.js`)**: Processes file validation and writes uploads to Cloudinary storage.
* **Social Posting (`postController.js`)**: Orchestrates feed post generation, modification, deletion, likes, and comment logs.
* **User Accounts (`userController.js`)**: Coordinates user queries, profile details, follower counts, notification choices, and admin controls.

## Dependencies
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js) - database operations
* [authService.js](file:///d:/campus_media/server/services/authService.js) & [tokenService.js](file:///d:/campus_media/server/services/tokenService.js) - security
* [emailService.js](file:///d:/campus_media/server/services/emailService.js) - notification mail routing
* [cloudinary.js](file:///d:/campus_media/server/utils/cloudinary.js) - file storage
* Mongoose models (User, Post, Comment, Like, SavedPost, Follow, Connection, Notification)

## Important Files
* [authController.js](file:///d:/campus_media/server/controllers/authController.js)
* [mediaController.js](file:///d:/campus_media/server/controllers/mediaController.js)
* [postController.js](file:///d:/campus_media/server/controllers/postController.js)
* [userController.js](file:///d:/campus_media/server/controllers/userController.js)

## Important Classes / Functions
* `register`, `login`, `verifyOTP` inside `authController`.
* `createPost`, `deletePost`, `toggleLike`, `addComment` inside `postController`.
* `updateProfile`, `toggleFollow`, `getAdminStats`, `toggleUserStatus` inside `userController`.

## Used By
* Exclusively imported and bound to Express endpoints inside `server/routes/`.

## Future Improvements
* Standardize API response formats across all controller endpoints using a unified wrapper.
* Integrate automated schema validation (e.g. using Joi or Zod) to check requests before invoking controller actions.

## Common Errors
* **Database Errors Exposed**: Raw Mongoose queries can crash servers if they throw errors. Handled by wrapping handlers in try-catch blocks and forwarding errors to the global error middleware.
