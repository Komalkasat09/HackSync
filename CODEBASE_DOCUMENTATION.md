# HackSync - Complete Codebase Documentation

**Project Name:** HackSync (SkillSphere Platform)  
**Purpose:** AI-powered career guidance and job matching platform  
**Last Updated:** January 2026

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database & External Services](#database--external-services)
6. [Feature-by-Feature Breakdown](#feature-by-feature-breakdown)

---

## 🎯 Project Overview

**HackSync** is a comprehensive AI-powered career platform that helps users:
- Build and optimize their resumes with AI assistance
- Get career recommendations based on their skills
- Find and match with relevant job opportunities
- Prepare for interviews with mock interview sessions
- Track their learning progress with personalized roadmaps
- Build professional portfolios
- Apply to jobs with tailored cover letters and resumes

The platform connects users, AI services, job data, and learning resources into one unified system.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python)
- **Web Server:** Uvicorn
- **Database:** MongoDB (hosted on cloud)
- **Authentication:** JWT (JSON Web Tokens) + bcrypt password hashing
- **AI/ML Services:**
  - Google Gemini 2.5 Flash (multiple API keys with rotation)
  - Tavily API (web scraping and research)
  - Apify API (LinkedIn job scraping)
  - Vapi.ai (Voice-based AI interviews)

### Frontend
- **Framework:** Next.js 16 with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **HTTP Client:** Axios
- **State Management:** React Hooks
- **Charts & Visualization:** Nivo, Recharts, vis-network, ReactFlow, CesiumGlobe
- **PDF Handling:** @react-pdf/renderer, jsPDF, react-pdf
- **UI Components:** Radix UI, Lucide React icons

### Key Libraries & Tools
- **PDF Processing:** PyPDF2 (Python), jsPDF (React)
- **Video Download:** yt-dlp (Python)
- **Job Scheduling:** APScheduler (Python)
- **API Documentation:** OpenAPI/Swagger (FastAPI built-in)

---

## 🗂️ Backend Architecture

The backend is organized into modular feature-based folders:

### Main Entry Point: `backend/main.py`

```
FastAPI Application (SkillSphere API)
│
├── Startup Events
│   ├── MongoDB Connection
│   └── Job Scheduler Initialization
│
├── CORS Middleware (localhost:3000)
│
└── Route Routers (9 modules)
```

**Configuration:** `backend/config.py`
- MongoDB connection settings
- JWT/Authentication keys
- API keys for Gemini, Tavily, Apify, Vapi.ai
- Environment variable management

---

## 📦 Backend Module Breakdown

### 1. **Authentication** (`backend/auth/`)
**What it does:** Handles user registration, login, and JWT token management

**Key Files:**
- `routes.py` - Signup, login, token refresh endpoints
- `schema.py` - Data validation schemas (UserSignup, Token, UserResponse)

**Technologies Used:**
- JWT (JSON Web Tokens) for secure authentication
- bcrypt for password hashing
- OAuth2PasswordBearer for token-based security

**How it Works:**
1. User signs up with email/password
2. Password is hashed with bcrypt
3. JWT token issued for authenticated sessions
4. Token valid for 7 days

---

### 2. **User Profile** (`backend/user_profile/`)
**What it does:** Manages user profile data including skills, experience, education, projects, and links

**Key Files:**
- `routes.py` - Get/update profile, upload resume
- `resume_extractor.py` - Extract data from PDF resumes
- `schema.py` - Profile data structure validation

**Technologies Used:**
- PyPDF2 for PDF resume parsing
- MongoDB for data persistence
- Pydantic for data validation

**Features:**
- Upload PDF resume
- Extract skills, experience, education from resume
- Store and update profile information
- Manage portfolio links and projects

---

### 3. **AI Resume Builder** (`backend/ai_resume_builder/`)
**What it does:** Generates professional resumes using AI and user profile data

**Key Files:**
- `routes.py` - Resume analysis endpoint
- `gemini_service.py` - PDF extraction and resume analysis
- `schema.py` - Resume data structures

**Technologies Used:**
- Google Gemini AI (analyzes resume content)
- PyPDF2 (extracts text from PDFs)
- Shared Gemini Service with API key rotation

**Process:**
1. User uploads a resume PDF or provides profile data
2. Resume text extracted from PDF
3. Gemini AI analyzes and structures the content
4. Returns professional resume JSON format
5. Resume formatted for different use cases (job applications, ATS, etc.)

---

### 4. **Career Recommender** (`backend/career_recommender/`)
**What it does:** Provides AI-powered career path recommendations and counseling

**Key Files:**
- `routes.py` - Career recommendation and chat endpoints
- `career_counselor.py` - Orchestrates AI counseling with web intelligence
- `tavily_service.py` - Web scraping for career market data
- `schema.py` - Conversation and recommendation schemas

**Technologies Used:**
- Google Gemini AI (generates recommendations)
- Tavily API (searches web for market trends, job data)
- MongoDB (stores conversation history)

**Features:**
- Career path recommendations based on skills and interests
- Real-time career counseling chat
- Web-based market intelligence (salary trends, skill demand)
- Conversation history tracking
- Streaming responses for better UX

**Process:**
1. User provides their profile/query
2. System fetches market data via Tavily API
3. Gemini AI generates recommendations using market data
4. References and sources provided with recommendations
5. Multi-turn conversation support

---

### 5. **Learning Guide** (`backend/learning_guide/`)
**What it does:** Generates personalized learning roadmaps and resources

**Key Files:**
- `routes.py` - Analyze skill gaps, generate roadmap
- `roadmap_service.py` - Generate learning paths with Mermaid diagrams
- `schema.py` - Learning path structures

**Technologies Used:**
- Google Gemini AI (generates learning roadmaps)
- yt-dlp (finds YouTube learning resources)
- Mermaid diagrams (visualizes learning paths)

**Features:**
- Identify skill gaps
- Generate visual learning roadmaps (flowcharts)
- Recommend learning resources (courses, videos)
- Track progress through learning paths
- Connect to YouTube for video resources

**Learning Roadmap Format:**
- Progressive learning (beginner → intermediate → advanced)
- 8-12 nodes per roadmap
- Branching paths for parallel learning
- Mermaid flowchart visualization

---

### 6. **Interview Prep** (`backend/interview_prep/`)
**What it does:** Provides mock interview sessions and preparation materials

**Key Files:**
- `routes.py` - Mock interview endpoints
- `voice_interview_routes.py` - Voice-based interview via Vapi.ai
- `schema.py` - Interview question and feedback structures

**Technologies Used:**
- Mock interview question generator
- Vapi.ai for voice-based interviews
- n8n webhooks (optional AI interview workflows)

**Features:**
- Mock interview sessions with curated questions
- Multiple question types: behavioral, technical, situational
- Difficulty levels (easy, medium, hard)
- Sample answers and hints
- Feedback and scoring
- Voice-based AI interviews via Vapi.ai

---

### 7. **Job Tracker** (`backend/job_tracker/`)
**What it does:** Scrapes, matches, and tracks job opportunities

**Key Files:**
- `routes.py` - Get jobs, save jobs, get statistics
- `job_matcher.py` - Algorithmic matching between skills and job requirements
- `linkedin_scraper.py` - Scrape LinkedIn jobs
- `tavily_scraper.py` - Scrape jobs from web via Tavily
- `scheduler.py` - Background job scraping scheduler
- `schema.py` - Job and match data structures

**Technologies Used:**
- Apify API (LinkedIn job scraping)
- Tavily API (general web job scraping)
- APScheduler (background job scheduling)
- python-jobspy (job board scraping)
- MongoDB (store job listings and saved jobs)

**Features:**
- Automatic job scraping (runs on schedule)
- Match jobs to user skills with scoring algorithm
- Save/favorite jobs
- Track application history
- Job statistics and analytics
- Multiple job data sources

**Matching Algorithm:**
- Compares user skills with job requirements
- Calculates match percentage (0-100%)
- Considers skill level match
- Penalizes incomplete job data
- Ranks jobs by relevance

---

### 8. **Job Application** (`backend/job_application/`)
**What it does:** Generates tailored resumes and cover letters for specific jobs

**Key Files:**
- `routes.py` - Generate and save applications
- `application_service.py` - Application generation logic
- `schema.py` - Application data structures

**Technologies Used:**
- Google Gemini AI (tailors content to job description)
- MongoDB (store application history)

**Features:**
- Auto-generate cover letters for specific jobs
- Tailor resumes to job descriptions
- Store application history
- Track application status
- Multi-application support

---

### 9. **Portfolio** (`backend/portfolio/`)
**What it does:** Generates and manages professional portfolios

**Key Files:**
- `routes.py` - Get portfolio data, generate, deploy
- `portfolio_service.py` - Portfolio generation logic
- `templates/modern.html` - Portfolio HTML template
- `schema.py` - Portfolio data structures

**Technologies Used:**
- HTML/CSS templates
- MongoDB (fetch user data)

**Features:**
- Professional portfolio generation
- Multiple templates (modern, minimalist, etc.)
- Showcase projects, skills, experience
- Portfolio preview
- Custom domain deployment

---

### 10. **Shared Services** (`backend/shared/`)
**Key File:** `gemini_service.py`

**Purpose:** Centralized Gemini API management

**Features:**
- Automatic API key rotation (handles rate limits)
- Multiple API keys support
- Streaming response support
- Error handling and retry logic
- Used by all AI-dependent modules

**How Key Rotation Works:**
1. Loads multiple API keys from environment
2. Cycles through keys if rate limit is hit
3. Ensures service reliability
4. Tracks which key is currently active

---

## 🎨 Frontend Architecture

The frontend is a Next.js application with TypeScript, providing a dashboard-based user interface.

### File Structure

```
frontend/
├── app/                    # Next.js app router (pages)
├── components/             # React components (reusable UI)
├── lib/                    # Utilities, configs, helpers
├── public/                 # Static assets
├── types/                  # TypeScript type definitions
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

---

## 📄 Frontend Pages (Routes)

### `app/layout.tsx` & `app/page.tsx`
- Main layout wrapper
- Authentication check
- Home page

### `app/auth/`
**Purpose:** Authentication pages
- `login/` - User login page
- `signup/` - User registration page
- `callback/` - OAuth callback (currently disabled)

### `app/dashboard/`
**Main dashboard** - Hub for all features

**Sub-pages:**
- `page.tsx` - Dashboard overview with charts
- `your-profile/` - User profile management
- `profile/` - Detailed profile editor
- `ai-resume/` - AI resume builder interface
- `jobs/` - Job listing and matching
- `apply/` - Job application wizard
- `applications/` - View saved applications
- `career/` - Career counseling chat interface
- `interview/` - Mock interview sessions
- `roadmap/` - Learning roadmap viewer
- `portfolio/` - Portfolio builder
- `[userId]/` - Public portfolio view

---

## 🧩 Frontend Components

### Layout Components
- `Sidebar.tsx` - Navigation sidebar
- `ConversationsSidebar.tsx` - Chat conversation list
- `Layout.tsx` - Page wrapper

### UI Components (shadcn/ui)
- `ui/` folder - Reusable design system components
- Buttons, modals, dropdowns, cards, etc.

### Feature Components

**Profile & Resume**
- `ProfileDropdown.tsx` - User profile menu
- `SkillAutocomplete.tsx` - Skill suggestion autocomplete

**Interview**
- `interview/InterviewForm.tsx` - Interview setup form
- `interview/InterviewInProgress.tsx` - Active interview
- `interview/InterviewComplete.tsx` - Results display
- `interview/AudioVisualizer.tsx` - Voice visualizer
- `interview/FileUpload.tsx` - Resume upload

**Portfolio & Visualization**
- `PortfolioTemplate.tsx` - Portfolio preview
- `CesiumGlobe.tsx` - 3D globe visualization
- `ReferenceCard.tsx` - Reference display

**Modals & Dialogs**
- `PDFPreviewModal.tsx` - PDF preview
- `ReportPreviewModal.tsx` - Report preview
- `ConfirmDialog.tsx` - Confirmation dialogs
- `Toast.tsx` - Notifications

**Other**
- `ChatMessage.tsx` - Chat UI
- `ModeToggle.tsx` - Dark/light theme toggle
- `ThemeProvider.tsx` - Theme context provider
- `WhatsAppButton.tsx` - WhatsApp contact button
- `AnalyzeNewsButton.tsx` - News analysis button

### Hooks
- `useClaimAnalysis.ts` - Claims analysis logic

---

## 📚 Frontend Utilities

### `lib/config.ts`
**API Configuration**
```typescript
API_BASE_URL = "http://localhost:8000"
API_ENDPOINTS = {
  AUTH: { LOGIN, SIGNUP, ME },
  PROFILE: { GET, UPDATE },
  RESUME: { ANALYZE, DOWNLOAD },
  JOBS: { RELEVANT, ALL, SAVE },
  CAREER: { RECOMMEND, CHAT },
  INTERVIEW: { START, SUBMIT },
  LEARNING: { ANALYZE, ROADMAP },
  PORTFOLIO: { GET, GENERATE }
}
```

### `lib/supabase.ts`
**Authentication** (Currently disabled)
- Google OAuth integration (not active)

### `lib/utils.ts`
**Helper functions**
- String formatting
- Date utilities
- API response handling

### `lib/skillsSuggestions.ts`
**Skill suggestions**
- Predefined skill lists
- Autocomplete data

### `types/`
**TypeScript definitions**
- `interview.ts` - Interview types
- `transcript.ts` - Interview transcript types
- `news.ts` - News types
- `claims.ts` - Claim analysis types
- `social-graph.ts` - Social data types

---

## 💾 Database & External Services

### MongoDB
**Database Name:** `skillsphere`

**Collections:**
1. **users** - User accounts and authentication
   - _id, email, password_hash, created_at

2. **user_profiles** - Detailed user information
   - user_id, skills, experiences, education, projects, links
   - portfolios, interests, certifications

3. **jobs** - Job listings
   - title, company, location, description, salary, job_type
   - experience_level, posted_date, source

4. **saved_jobs** - User's saved jobs
   - user_id, job_id, saved_at

5. **applications** - Job applications
   - user_id, job_id, resume, cover_letter, status
   - applied_at, last_updated

6. **conversations** - Career counseling chats
   - user_id, messages, created_at, topic

7. **portfolios** - Portfolio records
   - user_id, template, data, url, deployed_at

---

### External AI & Data Services

#### Google Gemini AI 2.5 Flash
**Used for:**
- Resume analysis and enhancement
- Career recommendations
- Cover letter generation
- Learning roadmap generation
- Interview feedback

**Key Rotation:** Multiple API keys with automatic cycling

#### Tavily API
**Used for:**
- Web research and job market data
- Career trend analysis
- Salary information
- Skill demand trends
- General web scraping

#### Apify API
**Used for:**
- LinkedIn job scraping
- Job listing collection
- Company information

#### Vapi.ai
**Used for:**
- Voice-based AI interviews
- Real-time speech interaction
- Interview recording and transcription

#### n8n (Optional)
**Used for:**
- AI interview workflow automation
- Custom interview workflows
- Webhooks for interview creation/evaluation

---

## 🔄 Feature-by-Feature Breakdown

### 1. **Authentication & Profile**
```
User Registration
    ↓
Email/Password Storage (hashed with bcrypt)
    ↓
JWT Token Generation (valid 7 days)
    ↓
Profile Creation (skills, experience, education)
    ↓
Resume Upload & Parsing
```

**Technologies:** FastAPI, bcrypt, JWT, MongoDB, PyPDF2

---

### 2. **AI Resume Builder**
```
User Profile/Resume Upload
    ↓
Extract Text (PyPDF2)
    ↓
Send to Gemini AI for Analysis
    ↓
Gemini Structures Resume JSON
    ↓
Format for Applications
    ↓
User Downloads/Preview
```

**Technologies:** FastAPI, Gemini AI, PyPDF2, MongoDB

---

### 3. **Career Counseling & Recommendations**
```
User Query + Profile
    ↓
Tavily Fetches Market Data
    ↓
Gemini Generates Recommendations
    ↓
References Collected from Web
    ↓
Streaming Response to Frontend
    ↓
Chat History Saved in MongoDB
```

**Technologies:** FastAPI, Gemini AI, Tavily API, MongoDB

---

### 4. **Job Matching & Tracking**
```
Automatic Background Job Scraping (APScheduler)
    ↓
Jobs from Multiple Sources (LinkedIn, Web, JobSpy)
    ↓
Jobs Stored in MongoDB
    ↓
User Profile Loaded
    ↓
JobMatcher Algorithm Scores Each Job
    ↓
Ranked Results Returned to Frontend
    ↓
User Can Save/Apply Jobs
```

**Technologies:** FastAPI, Apify, Tavily, APScheduler, MongoDB

---

### 5. **Learning Roadmap**
```
User Selects Skill/Topic
    ↓
Gemini Generates Learning Path (Mermaid Diagram)
    ↓
yt-dlp Finds YouTube Resources
    ↓
Roadmap Saved to MongoDB
    ↓
Frontend Visualizes with Mermaid Renderer
    ↓
User Tracks Progress
```

**Technologies:** FastAPI, Gemini AI, yt-dlp, Mermaid, MongoDB

---

### 6. **Interview Preparation**
```
Option A: Mock Interview (Text-based)
├── Generate Questions (Gemini or predefined)
├── User Answers via Textarea
├── Gemini Evaluates & Provides Feedback
└── Results Saved

Option B: Voice Interview (Vapi.ai)
├── Connect to Vapi.ai Service
├── Real-time Voice Interaction
├── Transcribe Audio
├── Evaluate Performance
└── Generate Report
```

**Technologies:** FastAPI, Gemini AI, Vapi.ai, MongoDB

---

### 7. **Tailored Job Applications**
```
User Selects Job
    ↓
Load User Resume/Profile
    ↓
Load Job Description
    ↓
Gemini Tailors Resume for This Job
    ↓
Gemini Generates Tailored Cover Letter
    ↓
User Reviews Before Applying
    ↓
Application Saved in MongoDB
    ↓
Can Download/Send Resume & Cover Letter
```

**Technologies:** FastAPI, Gemini AI, MongoDB

---

### 8. **Portfolio Generation**
```
User Selects Template
    ↓
Fetch User Data from MongoDB
    ↓
Render HTML Template with Data
    ↓
User Previews
    ↓
Option to Deploy with Custom Domain
    ↓
Portfolio Accessible at Public URL
```

**Technologies:** FastAPI, HTML/CSS, MongoDB

---

### 9. **AI Resume Analysis (NEW)**
```
Option A: ATS Compatibility Check
├── User Uploads Resume
├── Optional: Add Job Description
├── Gemini Analyzes ATS Criteria:
│   ├── Formatting & Structure (25%)
│   ├── Keywords & Optimization (30%)
│   ├── Content Quality (25%)
│   └── ATS-Friendly Elements (20%)
├── Generate Score out of 100
├── Provide Actionable Suggestions
└── Return Strengths & Weaknesses

Option B: Gap Analysis
├── User Provides Resume + Job Description
├── Gemini Extracts Keywords from Both
├── Calculate Keyword Overlap Score (0-100)
├── Identify Skill Gaps by Importance:
│   ├── Critical (must-have)
│   ├── High (strongly preferred)
│   ├── Medium (nice to have)
│   └── Low (optional)
├── Fetch Learning Resources (YouTube via yt-dlp)
├── Return Targeted Resources for Top Gaps
└── Provide Prioritized Recommendations

Option C: Comprehensive Analysis
├── Run Both ATS Check + Gap Analysis
├── Generate Overall Recommendation
├── Create Prioritized Action Plan
└── Return Complete Report
```

**Technologies:** FastAPI, Gemini AI, yt-dlp, MongoDB

**Key Features:**
- **ATS Checker:** Inspired by Jobscan and Resume Worded
- **Gap Analysis:** Keyword overlap with targeted learning resources
- **Integration:** Uses existing learning guide infrastructure for resource fetching
- **Actionable:** Prioritized suggestions with impact levels and categories

---

## 🔗 API Communication Flow

```
Frontend (Next.js)
        ↓
Axios HTTP Requests
        ↓
FastAPI Backend (localhost:8000)
        ↓
Authentication Check (JWT)
        ↓
Route Handler
        ↓
├─→ Database Query (MongoDB)
├─→ AI Service Call (Gemini, Tavily, etc.)
└─→ Response Generation
        ↓
Return JSON/Stream
        ↓
Frontend Displays Results
```

---

## 📊 Data Flow Examples

### Example 1: Getting Career Recommendations
```
1. User opens Career page
2. Frontend sends POST /api/career/recommend with profile
3. Backend CareerCounselorService:
   - Gathers market data via Tavily
   - Sends to Gemini with context
   - Streams response back
   - Saves to MongoDB
4. Frontend displays recommendations with sources
```

### Example 2: Matching Jobs to User
```
1. Frontend requests /relevant?limit=20
2. Backend:
   - Retrieves user skills from MongoDB
   - Loads job listings from MongoDB
   - JobMatcher calculates scores for each job
   - Sorts by relevance
   - Returns top 20
3. Frontend displays with match percentage
```

### Example 3: Learning Roadmap
```
1. User selects "Machine Learning" topic
2. Frontend sends /api/learning/roadmap
3. Backend:
   - Sends prompt to Gemini
   - Receives Mermaid diagram
   - Finds YouTube videos via yt-dlp
   - Saves to MongoDB
4. Frontend renders Mermaid diagram
5. User can click nodes for more details
```

---

## 🚀 Deployment & Environment

### Backend (.env variables needed)
```
MONGODB_URL=<MongoDB connection string>
SECRET_KEY=<JWT secret>
GEMINI_API_KEY_1=<Gemini API key 1>
GEMINI_API_KEY_2=<Gemini API key 2>
GEMINI_API_KEY_3=<Gemini API key 3>
TAVILY_API_KEY=<Tavily API key>
APIFY_API_KEY=<Apify API key>
VAPI_API_KEY=<Vapi.ai API key>
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running the Platform
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Startup Process
1. Backend connects to MongoDB
2. Gemini service initializes with API keys
3. Job scheduler starts
4. API server ready on port 8000
5. Frontend builds and starts on port 3000

---

## 🎓 Key Design Patterns

### 1. **Shared Services Pattern**
- Common functionality (Gemini) in `shared/` folder
- Avoids code duplication
- Centralized configuration

### 2. **Modular Architecture**
- Each feature in separate folder
- Independent routes and schemas
- Easy to scale and modify

### 3. **API Key Rotation**
- Multiple Gemini keys
- Automatic rotation on rate limit
- Ensures service reliability

### 4. **Async-First Backend**
- FastAPI async endpoints
- Motor for async MongoDB
- Non-blocking I/O

### 5. **Type Safety**
- TypeScript in frontend
- Pydantic schemas in backend
- Compile-time and runtime validation

---

## 📝 Summary

**HackSync** is a sophisticated AI-powered career platform that:
- **Consolidates** user profiles, resumes, and career data
- **Leverages** multiple AI services (Gemini, Tavily, Vapi.ai)
- **Matches** users with relevant jobs algorithmically
- **Recommends** career paths based on market data
- **Prepares** users for interviews (text and voice)
- **Generates** tailored applications for each job
- **Tracks** learning progress with visual roadmaps
- **Builds** professional portfolios

The architecture is clean, modular, and scalable, allowing new features to be added easily without affecting existing functionality.

---

*This documentation was automatically generated from codebase analysis. For implementation details, refer to the specific files mentioned in each section.*
