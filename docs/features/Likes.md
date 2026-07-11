# Feature: Likes

## Feature Purpose
Provides a quick way for students to react to and show support for achievements, projects, and notes.

## Current Status
**Fully Functional**. Toggles likes on and off, updating the total counts instantly.

## Architecture
```text
[React Client PostCard] ---> (POST Request) ---> [Post Routes]
                                                        |
                                                 [Post Controller] ---> [Like Schema]
```

## Frontend Components
* [PostCard.jsx](file:///d:/campus_media/client/src/components/PostCard.jsx): Renders the like button state and like count.

## Backend Routes
* [postRoutes.js](file:///d:/campus_media/server/routes/postRoutes.js)

## Controllers
* [postController.js](file:///d:/campus_media/server/controllers/postController.js)

## Database Collections
* `likes`
* `posts`

## Dependencies
* None.

## Flow Diagram (Text)
```text
1. User clicks the like button on a PostCard.
2. Client sends a POST toggle request to the server.
3. Server checks if a Like document already exists for the user/post.
4. Server either deletes the Like (unlike) or creates a new one (like), returning the updated count.
```

## API Endpoints
* `POST /api/posts/:postId/like` - Toggles the like state on a post.

## Current Bugs
* None identified.

## Known Limitations
* React buttons do not support emojis or diverse reactions.

## Future Improvements
* Add reaction types (e.g. Celebrate, Helpful, Idea).

## Testing Checklist
- [ ] Like button toggle verification.
- [ ] Like count increment and decrement checks.

## Performance Notes
* Retrieve operations should run `.countDocuments()` queries instead of loading all like documents to verify counts.

## Security Notes
* Ensure users can only like posts they are authorized to view.
