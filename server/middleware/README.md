# Middleware Directory (`server/middleware/`)

This directory houses the Express middlewares that intercept and process requests.

## Purpose
Enforces security, validates tokens, checks user permissions, and handles server errors.

## Responsibilities
* **`authMiddleware.js`**: Checks requests for signed cookies or Authorization header tokens, decodes the JWT, and attaches user info to `req.user`.
* **`roleMiddleware.js`**: Enforces role constraints (e.g. checks that a user's role is `ADMIN` before allowing configuration changes).
* **`errorMiddleware.js`**: Catches unhandled Express errors, logs them to the console, and returns a sanitized JSON response.

## Dependencies
* `jsonwebtoken` - token decoding
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js) - user status lookups

## Important Files
* [authMiddleware.js](file:///d:/campus_media/server/middleware/authMiddleware.js): Intercepts protected routes.
* [errorMiddleware.js](file:///d:/campus_media/server/middleware/errorMiddleware.js): Centralized error response formatter.

## Used By
* Mounted in the main unified server setup and added to protected route groups inside `server/routes/`.

## Future Improvements
* Add request rate-limiting middlewares for specific actions (such as logins or registration endpoints).
* Set up request logging middlewares (like Morgan) to track incoming routes and response times.

## Common Errors
* **Token Expired / Missing**: Throws 401 exceptions if credentials expire. Handled by checking token validity and prompting users to log in again.
