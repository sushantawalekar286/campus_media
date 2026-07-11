# Context Directory (`client/src/context/`)

This directory houses the custom React context providers that handle sharing dynamic state parameters across non-contiguous components.

## Purpose
Maintains shared state domains (such as social feed lists, peer messages, notes collections, and active resume models) without resorting to prop-drilling or large external state orchestration wrappers.

## Responsibilities
* **App State Orchestration**: Synchronizes and fetches lists of feed posts, mentorship messages, connections, resume scan states, and note catalogs.
* **Polling Management**: Periodically updates feed lists and notification channels to keep the client interface fresh.
* **State Exposure**: Exports standard hooks to retrieve and mutate values safely.

## Dependencies
* `react` - Context API creation
* [apiClient.js](file:///d:/campus_media/client/src/api/apiClient.js) - custom Axios instance

## Important Files
* [AppContext.jsx](file:///d:/campus_media/client/src/context/AppContext.jsx): Defines `AppContext` and implements the `<AppProvider />` component.

## Important Classes / Functions
* `AppProvider`: Implements `useState` and `useEffect` blocks to manage and poll global states, exposing values and trigger functions.
* `useApp`: Custom React hook used to easily import app context.

## Used By
* Imported globally at the root in [App.jsx](file:///d:/campus_media/client/src/App.jsx) to wrap all child layouts and pages.

## Future Improvements
* Replace REST polling algorithms with active WebSocket triggers to conserve server resources.
* Split monolithic state objects into discrete, focused context modules (e.g. `SocialContext`, `MentorshipContext`).

## Common Errors
* **useApp used outside AppProvider**: Thrown if developer attempts to query context variables from outside the root wrapper.
