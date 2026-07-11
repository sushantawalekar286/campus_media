# API Reference

This document provides details for the API routes of the Campus Media application. All request and response structures are formatted in JSON unless specified otherwise.

---

## Base Path
* Development: `http://localhost:3000/api`
* Production: `/api` (Relative pathways)

---

## 🔒 Authentication API (`/auth`)

### 1. Register User
* **Method**: `POST`
* **URL**: `/auth/register`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123",
    "role": "USER",
    "year": "Junior"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "user": {
      "_id": "603d2e9e2b10a112249a5b3a",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER",
      "year": "Junior"
    },
    "token": "eyJhbGci..."
  }
  ```
* **Possible Errors**:
  * `400 Bad Request`: Validation failure (e.g. invalid password complexity or missing fields).
  * `400 Bad Request`: Email already exists.
* **Controller**: `authController.register`
* **Middleware**: `authValidator.validateRegister`
* **MongoDB Collections Used**: `users`

### 2. Login User
* **Method**: `POST`
* **URL**: `/auth/login`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password@123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "user": {
      "_id": "603d2e9e2b10a112249a5b3a",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER"
    },
    "token": "eyJhbGci..."
  }
  ```
* **Possible Errors**:
  * `400 Bad Request`: Login failed (invalid email or password mismatch).
* **Controller**: `authController.login`
* **Middleware**: `authValidator.validateLogin`
* **MongoDB Collections Used**: `users`

### 3. Verify OTP
* **Method**: `POST`
* **URL**: `/auth/verify-otp`
* **Auth Required**: No
* **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "otp": "123456"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "Email verified successfully."
  }
  ```
* **Controller**: `authController.verifyEmail`
* **Middleware**: `otpVerifyLimiter`
* **MongoDB Collections Used**: `users`, `otps`

---

## 👤 User & Profile API (`/users`)

### 1. Get Profile
* **Method**: `GET`
* **URL**: `/users/profile`
* **Auth Required**: Yes (`Bearer <token>`)
* **Response (200 OK)**:
  ```json
  {
    "fullname": "Jane Doe",
    "email": "jane@example.com",
    "skills": ["React", "Node.js"],
    "education": [],
    "connectionsCount": 0
  }
  ```
* **Controller**: `userController.getProfile`
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: `users`

### 2. Search Users
* **Method**: `GET`
* **URL**: `/users/search`
* **Auth Required**: Yes
* **Query Parameters**: `query` (string)
* **Response (200 OK)**:
  ```json
  [
    {
      "_id": "603d2e9e2b10a112249a5b3a",
      "fullname": "Jane Doe",
      "username": "janedoe",
      "profilePicture": "https://res.cloudinary.com/..."
    }
  ]
  ```
* **Controller**: `userController.searchUsers`
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: `users`

---

## 📝 Posts & Feeds API (`/posts`)

### 1. Create Post
* **Method**: `POST`
* **URL**: `/posts/create`
* **Auth Required**: Yes
* **Request Body**: Multipart Form Data (`content` text, optional file upload)
* **Response (201 Created)**:
  ```json
  {
    "_id": "603d2e9e2b10a112249a5b4c",
    "content": "My new DSA project completed!",
    "authorId": "603d2e9e2b10a112249a5b3a",
    "likes": [],
    "comments": []
  }
  ```
* **Controller**: `postController.createPost`
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: `posts`

### 2. Toggle Like
* **Method**: `PUT`
* **URL**: `/posts/like/:id`
* **Auth Required**: Yes
* **Response (200 OK)**:
  ```json
  {
    "likes": ["603d2e9e2b10a112249a5b3a"]
  }
  ```
* **Controller**: `postController.toggleLike`
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: `posts`, `likes`

---

## 🎙️ AI Features API (Root Routing)

### 1. Analyze Resume
* **Method**: `POST`
* **URL**: `/resume/analyze`
* **Auth Required**: Yes
* **Request Body**: Multipart Form Data (`resume` PDF file, targetRole, experienceLevel)
* **Response (200 OK)**:
  ```json
  {
    "score": 85,
    "atsCompatibility": 82,
    "strengths": ["Clear formatting"],
    "weaknesses": ["Passive bullets"],
    "suggestions": ["Quantify impact"],
    "missingSkills": ["TypeScript"],
    "optimizedPoints": [
      {
        "original": "Worked on backend",
        "optimized": "Designed and deployed 12 REST endpoints",
        "reason": "Uses action verbs and quantifies impact"
      }
    ],
    "summary": "Solid foundation"
  }
  ```
* **Controller**: Inline routing handler
* **Middleware**: `authMiddleware`, Multer storage upload
* **MongoDB Collections Used**: `resumes`

### 2. Interview Feedback
* **Method**: `POST`
* **URL**: `/interview/feedback`
* **Auth Required**: Yes
* **Request Body**:
  ```json
  {
    "transcript": "AI: Welcome. User: Hello. AI: Tell me about React."
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "score": 78,
    "strengths": ["Clear explanation"],
    "mistakes": ["Missed caching details"],
    "improvements": ["Highlight Big-O complexity"],
    "correctedAnswers": [
      {
        "question": "Explain SQL joins",
        "originalAnswer": "It joins two tables",
        "idealAnswer": "SQL joins retrieve rows from multiple tables based on related columns."
      }
    ]
  }
  ```
* **Controller**: Inline routing handler
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: None

### 3. Generate Roadmap
* **Method**: `POST`
* **URL**: `/roadmap`
* **Auth Required**: Yes
* **Request Body**:
  ```json
  {
    "currentSkills": ["HTML", "CSS"],
    "targetDomain": "Frontend Developer"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "targetDomain": "Frontend Developer",
    "stages": [
      {
        "stageName": "Stage 1: Javascript Foundations",
        "description": "Learn syntax rules",
        "items": [
          {
            "topic": "DOM manipulation",
            "reason": "Required to dynamically update pages",
            "timeEstimate": "1 week",
            "difficulty": "Easy",
            "resources": ["MDN Docs"]
          }
        ]
      }
    ]
  }
  ```
* **Controller**: Inline routing handler
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: None

---

## 💬 Chat / Messaging API (`/chat`)

### 1. Get Conversations
* **Method**: `GET`
* **URL**: `/chat/conversations`
* **Auth Required**: Yes
* **Response (200 OK)**:
  ```json
  [
    {
      "user": {
        "_id": "603d2e9e2b10a112249a5b3b",
        "fullname": "John Doe",
        "username": "johndoe"
      },
      "lastMessage": "Sounds good!",
      "timestamp": 1718000000000
    }
  ]
  ```
* **Controller**: Inline routing handler
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: `chatmessages`, `follows`, `users`

### 2. Send Chat Message
* **Method**: `POST`
* **URL**: `/chat/send`
* **Auth Required**: Yes
* **Request Body**:
  ```json
  {
    "receiverId": "603d2e9e2b10a112249a5b3b",
    "content": "Are you available for a quick prep session?"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "_id": "603d2e9e2b10a112249a5b7d",
    "senderId": "603d2e9e2b10a112249a5b3a",
    "receiverId": "603d2e9e2b10a112249a5b3b",
    "content": "Are you available for a quick prep session?",
    "timestamp": 1718000000000
  }
  ```
* **Controller**: Inline routing handler
* **Middleware**: `authMiddleware`
* **MongoDB Collections Used**: `chatmessages`, `follows`, `users`
