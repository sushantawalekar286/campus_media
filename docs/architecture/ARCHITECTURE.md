# Architecture Documentation

This document explains the high-level architecture, data flows, and future design plans for the Campus Media platform.

---

## 🏛️ High-Level System Architecture

```text
       +---------------------------------------------+
       |             Student Web Browser             |
       +-----------------------+---------------------+
                               |
            (HTTP/REST JSON)   |   (Direct WebSocket)
             +-----------------+-----------------+
             |                                   |
             v                                   v
    +--------+---------+               +---------+---------+
    |  Express Backend |               |    Google Gemini  |
    |  REST API Server |               |    Live Gateway   |
    +--------+---------+               +-------------------+
             |
             +-------------+
             |             |
             v             v
        +----+----+   +----+----+
        | MongoDB |   |  Local  |
        | Databas |   | JSON DB |
        +---------+   +---------+
```

* **Client SPA**: A React application that communicates with the backend via REST APIs and streams audio directly to Gemini Live over WebSockets.
* **REST API Server**: An Express server that handles authentication, database operations, and AI tasks.
* **Storage Layer**: Dual-storage setup using MongoDB Mongoose schemas with local JSON file storage fallbacks.

---

## 🔄 Core Data Flows

### 1. Authentication Flow
```text
[Signup Page] ---> POST credentials ---> [Express API] ---> Hash Password (bcrypt) ---> Save User (status: PENDING)
                                                                                            |
[OTP Screen]  <--- Code via email   <--- [Nodemailer]   <--- Generate OTP (6-digits) <------+
     |
     +--- Submit OTP ---> Validate OTP ---> Set status: ACTIVE ---> Sign JWT ---> Return Token
```

### 2. Media Upload Flow
```text
[CreatePostModal] ---> Form Multipart Upload ---> [Express Multer]
                                                          |
[Post Feed UI]    <--- Save Post URL      <--- Upload File (Cloudinary)
```

### 3. Resume Analysis Flow
```text
[Resume UI] ---> Upload PDF ---> [Express Multer] ---> PDFParse (Extract Text) ---> Check Content Hash (DB)
                                                                                          |
[Results]   <--- Save Result <--- Return Analysis <--- Gemini REST (Analyze) <------------+
```

### 4. Voice Interview Flow
```text
[MockInterview Page] ---> Request Mic Permissions ---> Open WebSocket to Gemini Live
                                                              |
[Feedback Report]    <--- POST Transcript   <--- User Ends Interview Stream
```

### 5. Roadmap Generation Flow
```text
[Roadmap UI] ---> Skills & Target Domain ---> [Express API] ---> Query Gemini Flash (JSON Schema)
                                                                         |
[Timeline]   <--- Render Timeline       <--- Return Structured JSON <----+
```

---

## 🚀 Future SaaS Multi-Tenant Architecture
To scale the platform for multiple universities, the architecture will evolve to support:
* **Tenant Routing**: Route traffic based on subdomains (e.g. `oxford.campusmedia.com`) to isolate tenant organizations.
* **Schema Tenant Isolation**: Add a `tenantId` field to database collections to ensure strict data separation.
* **Tenant Settings**: Allow each university to configure custom placement criteria and banner settings.
