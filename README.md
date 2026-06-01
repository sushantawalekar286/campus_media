# Campus Media — AI-Powered Student Placement & Career Companion

Campus Media is a state-of-the-art MERN web platform designed to elevate the university placement experience. Powered by Google Gemini AI, it helps students audit their resumes against industry requirements, simulate real-time live-voice interviews via WebSockets, generate personalized career roadmaps, and practice questions in a curated Question Bank.

---

## 🌟 Key Features

### 🔍 Resume AI Auditor
* Upload PDF resumes for instant applicant tracking system (ATS) matching.
* Get dynamic resume quality scores and ATS compatibility ratings.
* Receive concrete AI-rewritten bullet points using the impact-driven STAR method.

### 🎙️ Live Voice AI Mock Interviewer
* Experience realistic, voice-to-voice interview simulations powered by Gemini Live (`gemini-2.5-flash-native-audio-preview`).
* Adapts dynamically based on target role, experience level, and uploaded resume details.
* Generates a comprehensive post-interview feedback report highlighting technical strengths, improvements, and ideal answers.

### 🗺️ Career Roadmap Generator
* Input target domain and current skills to obtain a personalized 6-stage development roadmap.
* Includes time estimates, learning resources, and difficulty ratings for every milestone.

### 💬 Mentorship Chat Hub
* Real-time text channels (`#general`, `#interview-prep`, `#jobs`) to collaborate with peers, seniors, and alumni.

### 📚 Question Bank & Job Board
* Search, filter, and practice real-world questions submitted by students.
* Browse the latest on-campus and off-campus career listings with direct application links.

### 🛡️ Admin & Moderation Panel
* Full platform statistics and activity analytics (Recharts visualizations).
* Student user management (active/blocked state controls).
* Contributed interview question auditing, approvals, and deletion workflows.
* Global settings (announcement banners, maintenance mode toggle).

---

## 💻 Tech Stack

### Frontend (Client SPA)
* **Core**: React 18 (Hooks, dynamic Routing)
* **Routing**: React Router DOM (HashRouter)
* **Styling**: Tailwind CSS (Modern aesthetics & dark gradients)
* **Icons**: Lucide React
* **Charts**: Recharts
* **Real-time Live Audio**: Web Audio API + Google GenAI WebSockets SDK

### Backend (Server)
* **Core**: Node.js, Express.js (ES Module support)
* **Database**: MongoDB (Mongoose schemas) + Local JSON filesystem database fallback
* **Security & Auth**: JWT (JSON Web Tokens), bcryptjs password hashing
* **File Uploads**: Multer (In-memory storage)
* **PDF Extraction**: PDFParse

### AI Integration
* **API Engine**: `@google/genai` Node SDK
* **Models**:
  * `gemini-3.5-flash` (Resume analysis, roadmap generation, and mock interview feedback report)
  * `gemini-2.5-flash-native-audio-preview-12-2025` (Low-latency client-side WebSockets audio stream)

---

## 🛠️ Installation & Setup

### Prerequisites
* **Node.js**: v18.x or higher
* **MongoDB**: A running local MongoDB instance or MongoDB Atlas connection string
* **Google Gemini API Key**: Obtainable from Google AI Studio

### Step 1: Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/campus-media.git
cd campus-media

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory:
```env
# MongoDB Connection URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campus-media

# Secret for JWT Authentication signing
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini API key (server-side only)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Run the Application
Start the unified server (which launches Express and mounts Vite's middleware):
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`** to access the application.

---

## 📂 Folder Structure
```
├── components/          # React Layout & Nav bars
├── context/             # AppState Context Provider
├── data/                # Fallback database storage JSONs
├── pages/               # React route pages
├── server/
│   ├── src/
│   │   ├── models/      # MongoDB Schema Definitions
│   │   └── services/    # DB Helpers & AI prompts
│   └── tsconfig.json
├── services/            # Axios instance and API calls
├── utils/               # Audio conversion helpers
├── App.jsx              # Main Router setup
├── package.json
└── vite.config.js
```


## 🧪 Test Accounts

The following test accounts are pre-registered in the system for validation and testing:

1. **Test User** (Primary Student Account)
   - **Email:** `testuser@example.com`
   - **Password:** `Password@123`
   - **Role:** `USER` (Student)
   - **Purpose:** Testing typical student interactions including feed scrolling, creating public posts (projects/achievements), uploading documents or images, adding comments, and liking posts.

2. **Sushant Awalekar** (Administrator Account)
   - **Email:** `sushantawalekar286@gmail.com`
   - **Password:** `Sushant@1305`
   - **Role:** `ADMIN`
   - **Purpose:** Testing high-level administration features, moderation, note configuration, and system settings.

---

## 🔒 Security Best Practices
* **Excluding API Keys**: Do not commit the `.env` file or hardcode keys. The `.gitignore` has been pre-configured to exclude environment configurations.
* **JWT Signing**: Ensure that `JWT_SECRET` is set to a long, cryptographically strong random string in production.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create.
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
