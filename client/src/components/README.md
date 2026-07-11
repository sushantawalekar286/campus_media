# Components Directory (`client/src/components/`)

This directory houses the presentation layouts and interactive modal dialog wrappers that represent shared, reusable frontend UI components.

## Purpose
Maintains component consistency across the client application. It ensures standard navigation structures, layout styles, and reusable modules for posting and viewing social content.

## Responsibilities
* **Page Layout Orchestration (`Layout.jsx`)**: Manages the viewport structure, sidebar navigation, user role check updates, responsive styling headers, notifications toggling, and global logouts.
* **Post Creation Dialog (`CreatePostModal.jsx`)**: Renders forms and upload zones enabling students to publish public text, document links, or media.
* **Social Feed Card Component (`PostCard.jsx`)**: Handles post body presentation, media attachments (images/documents), likes, comments lists, and deletion buttons.

## Dependencies
* `react` & `react-router-dom` - layouts and nav routing
* `lucide-react` - icon sets
* `framer-motion` - modal entry/exit transitions

## Important Files
* [Layout.jsx](file:///d:/campus_media/client/src/components/Layout.jsx): Shell for authenticated pages, containing sidebars and user info boxes.
* [CreatePostModal.jsx](file:///d:/campus_media/client/src/components/CreatePostModal.jsx): Pop-up dialog managing inputs and multi-part data formatting for social feed submissions.
* [PostCard.jsx](file:///d:/campus_media/client/src/components/PostCard.jsx): Individual card elements displaying content details and inline comments.

## Important Classes / Functions
* `Layout`: Top-level router shell rendering the child router `<Outlet />` inside standard container boundaries.
* `PostCard`: Reusable component displaying username, timeline, body, media links, and comment forms.

## Used By
* Exclusively rendered by client routers defined in `client/src/App.jsx`.

## Future Improvements
* Refactor `PostCard.jsx` to support dynamic image galleries for posts with multiple files.
* Abstract standard navigation links inside `Layout.jsx` into a dynamic JSON-driven configuration module.

## Common Errors
* **Layout Flash on Load**: Occurs if user profiles are loading slower than navigation frames. Handled by verifying state loading values before displaying user names in sidebar panels.
