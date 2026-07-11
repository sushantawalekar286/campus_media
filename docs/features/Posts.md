# Feature: Posts

## Feature Purpose
Enables students and admins to create, publish, and delete posts (containing text, media files, or links).

## Current Status
**Fully Functional**. Supports text posts and file uploads via Multer.

## Architecture
```text
[React Client] ---> (Multipart Form) ---> [Post Routes]
                                                 |
[Cloudinary Storage] <--- (Images) <--- [Post Controller] ---> [Mongoose Models]
```

## Frontend Components
* [CreatePostModal.jsx](file:///d:/campus_media/client/src/components/CreatePostModal.jsx): Handles inputs and uploads.
* [PostCard.jsx](file:///d:/campus_media/client/src/components/PostCard.jsx): Renders post layouts and actions.

## Backend Routes
* [postRoutes.js](file:///d:/campus_media/server/routes/postRoutes.js)

## Controllers
* [postController.js](file:///d:/campus_media/server/controllers/postController.js)

## Services
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js)

## Database Collections
* `posts`
* `media`

## Dependencies
* `multer` - parses file uploads
* [cloudinary.js](file:///d:/campus_media/server/utils/cloudinary.js) - cloud file storage

## Flow Diagram (Text)
```text
1. User opens CreatePostModal, writes text, and attaches files.
2. Form transmits payload as multipart data.
3. Express server validates payload and uploads files to Cloudinary.
4. Server saves the post details and returns the new post document.
```

## API Endpoints
* `POST /api/posts` - Creates a new post.
* `DELETE /api/posts/:id` - Deletes a post.

## Current Bugs
* None identified.

## Known Limitations
* Post deletion does not automatically remove the corresponding files from Cloudinary, wasting cloud storage.

## Future Improvements
* Set up background tasks to handle uploading large files.
* Support post drafts.

## Testing Checklist
- [ ] Text post creation verification.
- [ ] Image upload validation.
- [ ] Admin deletion workflow checks.

## Performance Notes
* Limit post sizes on the frontend to prevent huge network requests.

## Security Notes
* Verify user ownership before allowing post deletions.
