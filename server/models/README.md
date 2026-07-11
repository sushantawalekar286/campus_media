# Models Directory (`server/models/`)

This directory houses the schema structures and indexes for data storage.

## Purpose
Defines constraints, data types, validation structures, default values, and reference relations for all objects stored in the MongoDB database or the local JSON fallback system.

## Responsibilities
* **Identity Management**: User schema (credentials, status, role, stats, professional profiles) and OTP schema (email verification, expiration dates).
* **Social Systems**: Post, Comment, Like, SavedPost, and Connection schemas. The Connection schema replaces the legacy Follow collection.
* **AI Resources**: Resume (text, score results) and Session schemas.
* **Academic Resources**: Resource schema (upgrades and replaces Note.js, detailing category, semester, department, and approval states) and Job schema.
* **Student Achievements**: Achievement schema (competition details) and Project schema (portfolios).
* **Messaging Systems**: Conversation schema (participant maps and unread status) and ChatMessage schema (seen status and reactions).

## Dependencies
* `mongoose` - ODM library

## Important Files
* [User.js](file:///d:/campus_media/server/models/User.js): Core user profile schema.
* [Post.js](file:///d:/campus_media/server/models/Post.js): Main social post model.
* [Connection.js](file:///d:/campus_media/server/models/Connection.js): Consolidated follow and friendship requests.
* [Resource.js](file:///d:/campus_media/server/models/Resource.js): Shareable notes, lab manuals, and PPT files.

## Used By
* Queries executed in services (like `dbHelper.js` or `aiService.js`) and controllers (like `postController.js` or `userController.js`).

## Future Improvements
* Add secondary indexes on frequently queried fields (such as `userId`, `senderId`, and `status`) to optimize query speeds.
* Set up pre-save hooks to automatically sanitize inputs and strip scripts before saving documents.

## Common Errors
* **Reference Failures**: Querying details without calling `.populate()` can return raw ObjectIds. Resolved by configuring Mongoose populate joins in controllers.
