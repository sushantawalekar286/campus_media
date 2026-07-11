# Models Directory (`server/models/`)

This directory houses the schema structures and indexes for data storage.

## Purpose
Defines constraints, data types, validation structures, default values, and reference relations for all objects stored in the MongoDB database or the local JSON fallback system.

## Responsibilities
* **Identity Management**: User schema (credentials, status, role) and OTP schema (email verification, expiration dates).
* **Social Systems**: Post, Comment, Like, SavedPost, Follow, and Connection schemas.
* **AI Resources**: Resume (text, score results) and Session schemas.
* **Community Resources**: Job, Note, Question, ChatMessage, and SystemConfig schemas.

## Dependencies
* `mongoose` - ODM library

## Important Files
* [User.js](file:///d:/campus_media/server/models/User.js): Core user profile schema.
* [Post.js](file:///d:/campus_media/server/models/Post.js): Main social post model.
* [Resume.js](file:///d:/campus_media/server/models/Resume.js): Schema for extracted resume text and ATS score reviews.

## Used By
* Queries executed in services (like `dbHelper.js` or `aiService.js`) and controllers (like `postController.js` or `userController.js`).

## Future Improvements
* Add secondary indexes on frequently queried fields (such as `userId`, `senderId`, and `status`) to optimize query speeds.
* Set up pre-save hooks to automatically sanitize inputs and strip scripts before saving documents.

## Common Errors
* **Reference Failures**: Querying details without calling `.populate()` can return raw ObjectIds. Resolved by configuring Mongoose populate joins in controllers.
