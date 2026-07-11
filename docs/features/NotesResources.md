# Feature: Notes & Resources Sharing

## Feature Purpose
Enables students and faculty to upload, share, and review study materials, placement preparation sheets, notes, and resource documents.

## Current Status
**Dormant (Backend Fully Functional, Frontend UI Absent)**. Schema models, backend REST APIs, controllers, and frontend `AppContext` API fetch methods are fully implemented. However, no page component in `/client/src/pages` is currently rendering the notes library UI.

## Architecture
```text
[React Client AppContext] ---> (Axios Request) ---> [Express Server]
                                                           |
 [Local / Cloud Storage] <--- (Downloads) <--- [Note Model Mongoose]
```

## Frontend Components
* None (no UI file exists inside `/client/src/pages`).
* Integration is stubbed inside [AppContext.jsx](file:///d:/campus_media/client/src/context/AppContext.jsx#L41) with `notes` states.

## Backend Routes
* Enposed directly inside the unified server script [server/server.js](file:///d:/campus_media/server/server.js#L302-L344):
  * `GET /api/notes`
  * `POST /api/notes`
  * `DELETE /api/notes/:id`

## Controllers
* Handled inline within the unified backend routing code.

## Services
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js) (handles dual Mongoose/JSON file fallback operations).

## Database Collections
* `notes`

## Dependencies
* Uses standard Mongoose schemas.

## Flow Diagram (Text)
```text
1. Frontend context initializes and fetches all shared notes from the backend database.
2. User submits a resource upload form (currently stubbed).
3. Express route processes the metadata (title, category, external link, author).
4. Note record is created in MongoDB or fallback JSON database.
```

## API Endpoints
* `GET /api/notes` - Retrieves all notes.
* `POST /api/notes` - Adds a note link.
* `DELETE /api/notes/:id` - Deletes a note by ID.

## Current Bugs
* None identified.

## Known Limitations
* Missing a dedicated page or component tab in the student navigation portal.
* Does not support uploading raw PDF files directly to notes (only links are saved).

## Future Improvements
* Build a dedicated "Resource Library" page displaying card layouts with search filters.
* Support raw document uploads to Cloudinary storage for direct note downloads.

## Testing Checklist
- [ ] Notes API retrieval checks.
- [ ] Note creation schema validation.
- [ ] Deletion authorization validations.

## Performance Notes
* Retrieve queries return all documents. Pagination should be added once collection sizes grow.

## Security Notes
* Ensure students can only delete notes they uploaded.
