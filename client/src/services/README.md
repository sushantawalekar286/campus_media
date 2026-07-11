# Services Directory (`client/src/services/`)

This directory contains the client-side wrappers for network requests, Axios configurations, and external integrations.

## Purpose
Exposes clean asynchronous functions to query APIs, insulating UI components from raw network details.

## Responsibilities
* **HTTP Client Mapping**: Exports direct POST routes for career features (resume uploads, roadmaps, technical feedback).
* **Base URL Centralization**: Redirects requests using the unified client configuration to backend routes.

## Dependencies
* `axios` - request client
* [apiClient.js](file:///d:/campus_media/client/src/api/apiClient.js) - base configuration parameters

## Important Files
* [api.js](file:///d:/campus_media/client/src/services/api.js): Centralizes the axios instance export.
* [geminiService.js](file:///d:/campus_media/client/src/services/geminiService.js): Declares methods for backend-driven Gemini utilities.

## Important Classes / Functions
* `analyzeResumeText(text, role, level)`: Triggers backend resume parsing.
* `generateFeedbackFromTranscript(transcript)`: Transmits interview script logs for evaluation reports.
* `generateRoadmap(currentSkills, targetDomain)`: Requests 6-stage development timeline pathways.

## Used By
* Imported across active feature pages (such as [ResumeAnalyzer.jsx](file:///d:/campus_media/client/src/pages/ResumeAnalyzer.jsx), [MockInterview.jsx](file:///d:/campus_media/client/src/pages/MockInterview.jsx), and [RoadmapGenerator.jsx](file:///d:/campus_media/client/src/pages/RoadmapGenerator.jsx)).

## Future Improvements
* Set up standard TypeScript schemas for mock responses and parameters.
* Implement client-side query caching utilizing `@tanstack/react-query` to eliminate redundant requests.

## Common Errors
* **CORS / Relative URL Failure**: Triggered if relative URLs are called while running a standalone front-end build. Handled by configuring proxy configurations during development.
