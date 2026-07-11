# Feature: Comments

## Feature Purpose
Enables students to discuss projects, congratulate peers, and ask questions directly on social feed posts.

## Current Status
**Fully Functional**. Supports thread listings and inline creation and deletion workflows.

## Architecture
```text
[React Client PostCard] ---> (POST Request) ---> [Post Routes]
                                                        |
                                                 [Post Controller] ---> [Comment Schema]
```

## Frontend Components
* [PostCard.jsx](file:///d:/campus_media/client/src/components/PostCard.jsx): Renders lists of comments and handles comment inputs.

## Backend Routes
* [postRoutes.js](file:///d:/campus_media/server/routes/postRoutes.js)

## Controllers
* [postController.js](file:///d:/campus_media/server/controllers/postController.js)

## Database Collections
* `comments`
* `posts`

## Dependencies
* Uses standard Mongoose relations.

## Flow Diagram (Text)
```text
1. User writes a comment in a PostCard input box and presses submit.
2. Client sends a POST request containing post ID and text.
3. Server saves the comment document.
4. Server returns the comment, updating the UI.
```

## API Endpoints
* `POST /api/posts/:postId/comments` - Adds a comment to a post.
* `DELETE /api/posts/:postId/comments/:commentId` - Removes a comment.

## Current Bugs
* None identified.

## Known Limitations
* Nested comment threads are not supported.

## Future Improvements
* Add support for rich text formatting and user mentions in comments.

## Testing Checklist
- [ ] Comment creation verification.
- [ ] Comment deletion validation.
- [ ] Long text input testing.

## Performance Notes
* Limit the number of comments retrieved on the initial page load.

## Security Notes
* Ensure users can only delete comments they created (or posts they own).
