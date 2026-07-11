# Feature: Admin Dashboard

## Feature Purpose
Provides admins with a visual summary of platform statistics, including student sign-ups, resume uploads, contributed interview questions, active notes, and database connection states.

## Current Status
**Fully Functional**. Supported by Recharts data visualization models.

## Architecture
```text
[React AdminPanel View] ---> (Queries Metrics) ---> [Express Server]
                                                            |
                     [MongoDB Datastore] <--- (Aggregates) -+
```

## Frontend Components
* [AdminPanel.jsx](file:///d:/campus_media/client/src/pages/AdminPanel.jsx): Renders statistical metrics cards and chart sections.

## Backend Routes
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js): Exposes the `/api/users/stats` endpoint.

## Controllers
* [userController.js](file:///d:/campus_media/server/controllers/userController.js): Gathers counts from collections to build database metric objects.

## Services
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js): Fetches statistics from Mongoose/JSON databases.

## Database Collections
* `users`
* `posts`
* `resumes`
* `questions`
* `notes`

## Dependencies
* `recharts` - data visualization library
* `lucide-react` - icon sets

## Flow Diagram (Text)
```text
1. Admin loads the AdminPanel page.
2. React triggers an API query to /api/users/stats.
3. Server counts active documents across collections.
4. Server returns a formatted statistics summary.
5. Recharts plots metric timelines and distribution charts.
```

## API Endpoints
* `GET /api/users/stats` - Compiles metrics across all active models.

## Current Bugs
* None identified.

## Known Limitations
* Analytics are compiled on-demand, which can slow down database response times as the collection size grows.

## Future Improvements
* Add support for exporting statistics as CSV or PDF documents.
* Set up database queries to cache stats, avoiding redundant collection counts.

## Testing Checklist
- [ ] Card metric update checks.
- [ ] Graph rendering validation.
- [ ] Database query fallback tests.

## Performance Notes
* Running count queries on unindexed fields can cause CPU bottlenecks at scale. Consider using optimized collection statistics APIs or cron aggregation tasks.

## Security Notes
* Ensure only users with the `ADMIN` role can access the stats endpoint.
