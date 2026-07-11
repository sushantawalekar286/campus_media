# Feature: Career Roadmap Generator

## Feature Purpose
Creates personalized 6-stage career paths based on a student's current skill set and target industry.

## Current Status
**Fully Functional**. Supported by fallback mock data if Gemini API keys are missing.

## Architecture
```text
[React RoadmapGenerator] ---> (POST Request) ---> [Express Server]
                                                         |
 [Gemini AI Model] <--- (Schema Prompt) <--- [aiService: generateRoadmap]
```

## Frontend Components
* [RoadmapGenerator.jsx](file:///d:/campus_media/client/src/pages/RoadmapGenerator.jsx): Timelines, difficulty colors, and interactive detail boxes.

## Backend Routes
* Enposed directly inside the unified server script [server/server.js](file:///d:/campus_media/server/server.js#L219-L228):
  * `POST /api/roadmap`

## Controllers
* Handled inline within the unified backend routing code.

## Services
* [aiService.js](file:///d:/campus_media/server/services/aiService.js): Declares `generateRoadmap`.

## Database Collections
* None (roadmaps are displayed to users but not saved to schemas in the database).

## Dependencies
* `@google/genai` - backend REST model connector

## Flow Diagram (Text)
```text
1. User enters current skills and target domain -> Form submits POST request.
2. Server validates payload, checking process variables for API keys.
3. Server queries Gemini using a prompt with a defined JSON schema.
4. Gemini generates a structured response with 6 milestones.
5. Client UI receives the response and renders the timeline card layouts.
```

## API Endpoints
* `POST /api/roadmap` - Generates structured 6-stage development plans.

## Current Bugs
* None identified.

## Known Limitations
* Roadmaps are not saved, requiring users to regenerate them on every visit.

## Future Improvements
* Add a save button to allow students to pin roadmaps to their profiles.
* Add progress checkmarks to let students track completed milestones.

## Testing Checklist
- [ ] Timeline rendering validation.
- [ ] Difficulty color scheme checks.
- [ ] Schema parsing tests.

## Performance Notes
* Strict schema validation forces the Gemini model to return clean JSON, reducing frontend parsing errors.

## Security Notes
* Sanitize all inputs before using them in prompts to prevent prompt injection.
