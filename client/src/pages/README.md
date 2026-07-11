# Pages Directory (`client/src/pages/`)

This directory houses the top-level route pages of the Campus Media client application.

## Purpose
Exposes specialized views corresponding to distinct pages in the user journey, including placement dashboards, live interviews, roadmaps, social networks, and authentication screens.

## Responsibilities
Each file corresponds to a specific page layout:
* **Authentication**: Login, Signup, VerifyOTP, ForgotPassword, ResetPassword.
* **Profiles**: ProfileSetup (editing student details) and Profile (viewing student info, resumes, activity).
* **Social Hub**: FeedPage / SocialFeed (scrolling and posting) and ExplorePage (finding users, jobs, posts).
* **Job Board**: JobBoard (viewing list of jobs, applying, adding jobs as Admin).
* **Direct Messaging**: MessagesPage (interacting with peers and mentors).
* **Connections**: ConnectionsPage (tracking friends, requests, and followers).
* **AI Career Features**: AIMentorPage (AI-driven mentor chat), ResumeAnalyzer (ATS scanner), MockInterview (Live audio simulator), and RoadmapGenerator (learning pathways).
* **Administration**: AdminPanel (viewing platform metrics and modifying configurations).
* **Stubs**: PlaceholderPages (placeholder layouts for notifications and stubs).

## Dependencies
* `react` & `react-router-dom` - view bindings and transitions
* `@google/genai` & `lucide-react` - live voice integrations and symbols
* [authStore.js](file:///d:/campus_media/client/src/store/authStore.js) & [AppContext.jsx](file:///d:/campus_media/client/src/context/AppContext.jsx) - authentication and state contexts
* [audioUtils.js](file:///d:/campus_media/client/src/utils/audioUtils.js) - mock interview audio helper conversion functions

## Important Files
* [MockInterview.jsx](file:///d:/campus_media/client/src/pages/MockInterview.jsx): Live microphone stream audio capture and WebSocket handler.
* [AdminPanel.jsx](file:///d:/campus_media/client/src/pages/AdminPanel.jsx): Visual analytics dashboard displaying user statistics.
* [Profile.jsx](file:///d:/campus_media/client/src/pages/Profile.jsx): Displays user details, resumes, skills, and timelines.

## Important Classes / Functions
* `MockInterview`: Component controlling AudioContext structures and WebSockets.
* `AdminPanel`: Renders Recharts visualizations and coordinates user bans or banner alterations.

## Used By
* Exclusively imported and routed inside [App.jsx](file:///d:/campus_media/client/src/App.jsx).

## Future Improvements
* Refactor page components to isolate heavy UI sub-trees into independent sub-components.
* Introduce lazy loading dynamically for heavy AI modules to speed up initial site rendering.

## Common Errors
* **State Resets on Page Navigation**: Navigating out of pages resets local state variables. Solved by storing durable values inside context providers or Zustand stores.
