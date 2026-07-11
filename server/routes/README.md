# Routes Directory (`server/routes/`)

This directory houses the route definitions for the Express backend REST API.

## Purpose
Exposes endpoint paths, associates them with controllers, and applies relevant middleware layers (such as authentication or role checks) to protect resources.

## Responsibilities
* **`authRoutes.js`**: Public routes for signup, login, OTP confirmation, and password recovery.
* **`userRoutes.js`**: Endpoints to manage user records, profile setup, follower maps, connection tokens, and admin controls.
* **`postRoutes.js`**: Coordinates creating and interacting with posts.
* **`chatRoutes.js`**: Messaging channel lists, notifications, and mentorship messages.
* **`mediaRoutes.js`**: Handles multi-part uploads for images and documents.

## Dependencies
* `express` - router engines
* [authMiddleware.js](file:///d:/campus_media/server/middleware/authMiddleware.js) - JWT verification
* [roleMiddleware.js](file:///d:/campus_media/server/middleware/roleMiddleware.js) - admin validations
* [authValidator.js](file:///d:/campus_media/server/validators/authValidator.js) - payload validation
* controllers (authController, userController, postController, mediaController)

## Important Files
* [authRoutes.js](file:///d:/campus_media/server/routes/authRoutes.js)
* [userRoutes.js](file:///d:/campus_media/server/routes/userRoutes.js)
* [postRoutes.js](file:///d:/campus_media/server/routes/postRoutes.js)
* [chatRoutes.js](file:///d:/campus_media/server/routes/chatRoutes.js)

## Used By
* Exclusively imported and mounted in the main unified server script [server/server.js](file:///d:/campus_media/server/server.js).

## Future Improvements
* Set up automated OpenAPI / Swagger documentation generation based on route comments.
* Implement structured versioning (e.g. `/api/v1/posts`) to prepare for future updates.

## Common Errors
* **Routing Order Collisions**: Static sub-routes (like `/api/users/stats`) can conflict with dynamic query routes (like `/api/users/:id`). Resolved by placing static routes before dynamic ones.
