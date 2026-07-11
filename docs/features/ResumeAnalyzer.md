# Feature: Resume AI Auditor

## Feature Purpose
Enables students to upload their PDF resumes to receive an instant applicant tracking system (ATS) rating score, analysis of strengths/weaknesses, lists of missing key skills, and impact-driven STAR rewrites.

## Current Status
**Fully Functional**. Supported by fallback mock logic if Gemini keys are missing.

## Architecture
```text
[React ResumeAnalyzer] ---> (PDF Upload) ---> [Express Unified Server]
                                                    |
[Gemini AI SDK] <--- (Audit Prompt) <--- [aiService: analyzeResumeText]
                                                    |
[Mongoose MongoDB] <--- (Save Result) <--- [Resume Schema Model]
```

## Frontend Components
* [ResumeAnalyzer.jsx](file:///d:/campus_media/client/src/pages/ResumeAnalyzer.jsx): Renders file drop boxes, score indicators, missing skills tags, and rewrites.

## Backend Routes
* Enposed directly inside the unified server script [server/server.js](file:///d:/campus_media/server/server.js#L141-L206):
  * `POST /api/resume/analyze`

## Controllers
* Handled inline within the unified backend routing code.

## Services
* [aiService.js](file:///d:/campus_media/server/services/aiService.js): Declares `analyzeResumeText`.
* [dbHelper.js](file:///d:/campus_media/server/services/dbHelper.js): Manages saved resume records.

## Database Collections
* `resumes`

## Dependencies
* `pdf-parse` - parses text from binary files
* `@google/genai` - backend REST model connector

## Flow Diagram (Text)
```text
1. User drops PDF resume -> Client uploads file to /api/resume/analyze.
2. Server validates mime-type (PDF) and size (limit to 5MB).
3. pdf-parse extracts the text -> Server checks the database for a matching SHA-256 text hash.
4. If found, returns saved results. If new, calls Gemini AI model to analyze.
5. Saves results and returns a JSON audit report.
```

## API Endpoints
* `POST /api/resume/analyze` - Validates, extracts, and scans resume documents.

## Current Bugs
* Scanned or image-only PDF uploads return blank text blocks, throwing API exceptions.

## Known Limitations
* Text extraction is limited to standard formatting structure.
* Gemini prompt is capped at 30,000 characters.

## Future Improvements
* Add OCR support using tools like Tesseract.js to scan image-only PDFs.
* Support DOC and DOCX file uploads.

## Testing Checklist
- [ ] Mime-type checking verification.
- [ ] Text extraction validation.
- [ ] SHA-256 hash match checks.
- [ ] Empty PDF upload error handling.

## Performance Notes
* Resume hashing prevents redundant calls to the Gemini API, saving API costs and database space.

## Security Notes
* Resumes are stored on the server file system in-memory during extraction, eliminating residual file storage leaks.
