# Feature: Search (Discover Students)

## Feature Purpose
Enables students to search for classmates, seniors, and alumni by name, username, skills (e.g. React), or education details.

## Current Status
**Fully Functional**. Supports keyword searching and automatically displays recommended users on the Explore page.

## Architecture
```text
[React ExplorePage] ---> (GET Search Request) ---> [User Routes]
                                                         |
                   [MongoDB Query] <--- (Regex Match) <--+
```

## Frontend Components
* [ExplorePage.jsx](file:///d:/campus_media/client/src/pages/ExplorePage.jsx): Renders search input boxes, result grids, suggestion lists, and StudentCard elements.

## Backend Routes
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js):
  * `GET /api/users/search`
  * `GET /api/users/suggestions`

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js): Implements `searchUsers` and `getUserSuggestions`.

## Database Collections
* `users`

## Dependencies
* None.

## Flow Diagram (Text)
```text
1. User enters a keyword (e.g. "React") in the Explore page search bar and clicks submit.
2. Client sends a request to `/api/users/search?query=React`.
3. Server executes a regex search across user names, usernames, skills, and bio fields.
4. Server filters out passwords and blocked accounts and returns matching users.
5. Client renders the matching profiles in a student card grid.
```

## API Endpoints
* `GET /api/users/search?query=:keyword` - Searches registered user profiles.
* `GET /api/users/suggestions` - Fetches recommended users to connect with.

## Current Bugs
* None identified.

## Known Limitations
* Searches use basic regular expressions (`$regex`), which can cause database slow downs for large databases.

## Future Improvements
* Set up MongoDB Atlas Search indexes to support fuzzy search queries.
* Implement search filters for graduation years or roles.

## Testing Checklist
- [ ] Regex query execution verification.
- [ ] Password field exclusion checks.
- [ ] Suggestions list loading validation.

## Performance Notes
* Basic regex searches can be slow. Ensure queried fields (like `name` and `username`) are indexed.

## Security Notes
* Ensure blocked users are filtered out of search results.
