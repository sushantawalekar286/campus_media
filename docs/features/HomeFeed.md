# Feature: Home Feed

## Feature Purpose
Displays social feed streams to users, showing projects, achievements, and text posts from followed users.

## Current Status
**Fully Functional**. Feeds are compiled dynamically and support polling.

## Architecture
```text
[React Client FeedPage] <---> [AppContext Provider]
                                      |
                           [Mongoose Query Post / Users]
```

## Frontend Components
* [FeedPage.jsx](file:///d:/campus_media/client/src/pages/FeedPage.jsx): Renders post timelines.
* [PostCard.jsx](file:///d:/campus_media/client/src/components/PostCard.jsx): Card layout displaying post details.

## Backend Routes
* [postRoutes.js](file:///d:/campus_media/server/routes/postRoutes.js)

## Controllers
* [postController.js](file:///d:/campus_media/server/controllers/postController.js)

## Services
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js)

## Database Collections
* `posts`
* `users`
* `likes`
* `comments`

## Dependencies
* Uses AppContext for global feeds state management.

## Flow Diagram (Text)
```text
1. FeedPage requests feed streams via AppContext.
2. Context queries details from post routes.
3. Express server runs queries and returns active post lists.
4. Client page renders post card lists.
```

## API Endpoints
* `GET /api/posts` - Fetches the feed timeline.

## Current Bugs
* None identified.

## Known Limitations
* Relies on polling to refresh the feed, which increases network requests.

## Future Improvements
* Set up pagination support to fetch posts in chunks.
* Implement infinite scrolling.

## Testing Checklist
- [ ] Timeline rendering validation.
- [ ] Polling update intervals check.
- [ ] Render speed verification.

## Performance Notes
* Retrieve operations should run `.populate('authorId')` in a single query to prevent database roundtrips.

## Security Notes
* Strip deleted posts from feed outputs.
