# Technology Stack & Functions

## 🎯 Overview
Complete technology stack for the AI-powered Learning Resource Scraper and Recommendation System.

---

## 🔧 **Backend Technologies**

### **Core Framework**
| Technology | Version | Function |
|------------|---------|----------|
| **Python** | 3.11+ | Primary backend language for API, ML models, and scraping logic |
| **FastAPI** | Latest | High-performance REST API framework with async support |
| **Uvicorn** | Latest | ASGI server to run FastAPI applications |
| **Pydantic** | Latest | Data validation and serialization using Python type annotations |

**FastAPI Functions:**
- `/scrape` - Multi-platform resource scraping endpoint
- `/parse-resume` - Extract skills from resume text
- `/analyze-gaps` - Identify skill gaps for target roles
- `/generate-path` - Create personalized learning roadmaps
- `/chat-mentor` - AI mentor chat interface
- `/track-activity` - User progress tracking
- `/progress/{user_id}` - Get user learning progress and badges

---

### **AI & Machine Learning**

| Technology | Version | Function |
|------------|---------|----------|
| **Google Generative AI (Gemini)** | 1.5-flash / gemini-pro | Advanced LLM for content generation, skill extraction, and intelligent recommendations |
| **Sentence Transformers** | Latest | Semantic similarity using `all-MiniLM-L6-v2` model for skill matching |
| **PyTorch** | Latest | Deep learning backend for transformer models |
| **NumPy** | Latest | Numerical computing for embeddings and vector operations |
| **Scikit-learn** | Latest | ML utilities and preprocessing |

**Gemini AI Functions:**
- Resume parsing and skill extraction
- Intelligent content recommendations
- Learning path explanations ("why this module?")
- Conversational AI mentor responses
- Resource quality assessment

**Sentence Transformers Functions:**
- Convert skills to embeddings (768-dimensional vectors)
- Semantic similarity between user skills and requirements
- Content-based resource filtering
- Skill taxonomy encoding

---

### **Web Scraping & APIs**

| Technology | Version | Function |
|------------|---------|----------|
| **Requests** | Latest | HTTP client for making API calls and web requests |
| **BeautifulSoup4** | Latest | HTML/XML parsing for web scraping |
| **lxml** | Latest | Fast XML/HTML parser backend for BeautifulSoup |
| **praw** | Latest | Python Reddit API Wrapper for social validation |
| **tweepy** | Latest | Twitter API v2 client for sentiment analysis |
| **Regex (re)** | Built-in | Pattern matching for YouTube video extraction |

**Scraping Functions by Platform:**

#### **YouTube Scraping**
```python
# Function: scrape_youtube(skill, limit)
# Method: HTTP GET + Regex parsing
# Extracts: Video IDs, titles from HTML response
# Pattern: r'"videoId":"([^"]+)"'
# Returns: List of video resources with URLs, titles, metadata
```

#### **GitHub Scraping**
```python
# Function: scrape_github(skill, limit)
# Method: GitHub REST API (api.github.com/search/repositories)
# Filters: Excludes frameworks (tensorflow, pytorch, django)
#          Requires tutorial keywords (tutorial, course, learn)
#          Validates skill presence in name/description
# Returns: Tutorial repositories with star counts, descriptions
```

#### **FreeCodeCamp Scraping**
```python
# Function: scrape_freecodecamp(skill)
# Method 1: Direct curriculum mapping (predefined URLs)
# Method 2: YouTube search for "freecodecamp {skill}"
# Returns: FreeCodeCamp courses + long-form YouTube tutorials
```

#### **Coursera Scraping**
```python
# Function: scrape_coursera(skill)
# Method 1: Web scraping search results with BeautifulSoup
# Method 2: Predefined popular specializations
# Extracts: Course links using regex r'/learn/'
# Returns: Course URLs, titles, specializations
```

#### **Reddit Validation**
```python
# Function: search_reddit_mentions(resource_title, skill)
# API: Reddit API via praw
# Subreddits: learnprogramming, programming, webdev, coding
# Analysis: Sentiment scoring (positive/negative keywords)
# Returns: {mention_count, sentiment_score, comments[]}
```

#### **Twitter Validation**
```python
# Function: search_twitter_mentions(resource_title, skill)
# API: Twitter API v2 via tweepy
# Search: Recent tweets with tutorial/course/learning keywords
# Analysis: Engagement metrics (likes, retweets) + sentiment
# Returns: {mention_count, sentiment_score, tweets[]}
```

---

### **Data Management**

| Technology | Version | Function |
|------------|---------|----------|
| **JSON** | Built-in | Data storage and resource persistence |
| **python-dotenv** | Latest | Environment variable management from .env files |
| **jsonschema** | Latest | JSON data validation against schemas |

**Data Files:**
- `learning_resources.json` - Scraped resource database (101+ resources)
- `skill_taxonomy.json` - Hierarchical skill categorization
- `role_requirements.json` - Job role skill requirements
- `.env` - API keys and credentials (GEMINI_API_KEY, REDDIT_CLIENT_ID, TWITTER_BEARER_TOKEN)

---

### **Dependency Graph & Logic**

| Module | Function |
|--------|----------|
| **nlp/skill_parser.py** | `SkillMapper` - NLP-based skill extraction from text |
| **models/user_profile.py** | `UserProfile` - User state management and skill tracking |
| **logic/gap_analysis.py** | `GapAnalyzer` - Identify skill gaps between current and target |
| **logic/path_generator.py** | `PathGenerator` - Create personalized learning roadmaps |
| **logic/recommender.py** | `ContentRecommender` - Semantic resource matching |
| **logic/prerequisites.py** | Skill dependency management and learning order |
| **scraper/gemini_scraper.py** | `GeminiSmartScraper` - Multi-platform intelligent scraper |
| **ai/gemini_service.py** | `GeminiService` - Gemini API wrapper and utilities |

---

## 🎨 **Frontend Technologies**

### **Core Framework**

| Technology | Version | Function |
|------------|---------|----------|
| **Next.js** | 16.1.1 | React framework with server-side rendering and routing |
| **React** | 18.3.1 | UI component library and state management |
| **TypeScript** | 5.x | Type-safe JavaScript for robust code |
| **Turbopack** | Built-in | Next.js build tool (faster than Webpack) |

**Next.js Features Used:**
- App Router (`src/app/` directory)
- Server Components and Client Components
- API route integration
- Hot Module Replacement (HMR)

---

### **UI & Styling**

| Technology | Version | Function |
|------------|---------|----------|
| **Tailwind CSS** | Latest | Utility-first CSS framework for rapid styling |
| **CSS Modules** | Built-in | Scoped component-level styling |
| **Framer Motion** | Latest | Animation library for smooth transitions and micro-interactions |
| **Lucide React** | Latest | Beautiful icon library (Search, Youtube, Github, Star, etc.) |

**UI Components:**
- Gradient backgrounds and glass-morphism effects
- Responsive grid layouts (1/2/3 columns)
- Animated cards with hover states
- Loading spinners and skeleton states
- Modal dialogs and notifications

---

### **State & API Management**

| Technology | Version | Function |
|------------|---------|----------|
| **Axios** | Latest | Promise-based HTTP client for API requests |
| **React Hooks** | Built-in | State management (useState, useEffect, useCallback) |

**API Client (`lib/api.ts`):**
```typescript
// Functions:
api.scrape(topic)                    // Scrape resources
api.parseResume(text)                // Extract skills
api.generatePath(...)                // Generate roadmap
api.chatWithMentor(...)              // AI chat
api.trackActivity(...)               // Log progress
api.getUserProgress(userId)          // Get analytics
```

---

### **Development Tools**

| Technology | Version | Function |
|------------|---------|----------|
| **ESLint** | Latest | Code linting and style enforcement |
| **TypeScript Compiler** | 5.x | Type checking and transpilation |
| **npm** | Latest | Package manager and script runner |
| **Console Ninja** | Extension | Enhanced browser console debugging |

---

## 🗄️ **Data Storage & Schemas**

### **JSON Schemas**

| Schema File | Purpose |
|-------------|---------|
| `schemas/skill_taxonomy_schema.json` | Validates skill hierarchy and categorization |
| `schemas/job_role_schema.json` | Validates job role requirements and skill mappings |
| `schemas/resource_schema.json` | Validates learning resource structure and metadata |

**Resource Schema Structure:**
```json
{
  "title": "string",
  "url": "string",
  "source": "YouTube|GitHub|FreeCodeCamp|Coursera",
  "type": "Video|Tutorial|Course|Repository",
  "duration": "string",
  "difficulty": "Beginner|Intermediate|Advanced",
  "topics": ["string"],
  "recommendation_reason": "string",
  "estimated_quality_score": "number (1-10)",
  "validation_score": "number (1-10)",
  "social_validation": {
    "community_rating": "number",
    "pros": ["string"],
    "cons": ["string"],
    "reddit_mentions": "number",
    "twitter_mentions": "number",
    "reddit_sentiment": "number (-1 to 1)",
    "twitter_sentiment": "number (-1 to 1)"
  }
}
```

---

## 🔐 **Environment Configuration**

### **Required API Keys**

| Variable | Service | Function |
|----------|---------|----------|
| `GEMINI_API_KEY` | Google AI | LLM operations, content generation |
| `REDDIT_CLIENT_ID` | Reddit API | Social validation via Reddit |
| `REDDIT_CLIENT_SECRET` | Reddit API | Authentication for Reddit API |
| `REDDIT_USER_AGENT` | Reddit API | App identification (optional, default provided) |
| `TWITTER_BEARER_TOKEN` | Twitter API v2 | Social validation via Twitter |

**Setup (.env file):**
```env
GEMINI_API_KEY=your_gemini_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=LearningResourceScraper/1.0
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

---

## 📊 **ML Model Details**

### **Sentence Transformer Model**
- **Model ID:** `all-MiniLM-L6-v2`
- **Embedding Dimension:** 768
- **Purpose:** Semantic similarity between skills
- **Speed:** ~200ms for 50 skills
- **Accuracy:** 85%+ for skill matching

### **Skill Taxonomy**
- **Total Skills:** 39 categorized skills
- **Categories:** Frontend, Backend, Database, DevOps, ML, etc.
- **Encoding:** Pre-computed embeddings for fast lookup

### **Dependency Graph**
- **Nodes:** 22 skills
- **Edges:** 20 dependencies
- **Algorithm:** Topological sort for learning order
- **Example:** HTML → CSS → JavaScript → React

---

## 🚀 **Performance Characteristics**

### **Backend Performance**
- **Startup Time:** 5-8 seconds (loading ML models)
- **API Response Time:**
  - Resume parsing: 1-2 seconds
  - Resource scraping: 15-25 seconds (with validation)
  - Path generation: 3-5 seconds
  - Chat response: 2-4 seconds

### **Scraping Performance**
- **YouTube:** 2-3 seconds (8 videos)
- **GitHub:** 1-2 seconds (5 repos)
- **FreeCodeCamp:** 2 seconds (1 course + 3 videos)
- **Coursera:** 3-4 seconds (11 courses)
- **Reddit Validation:** 5-8 seconds (3 subreddits)
- **Twitter Validation:** 2-3 seconds (10 tweets)

### **Frontend Performance**
- **Initial Load:** <2 seconds
- **Hot Reload:** <500ms
- **Bundle Size:** Optimized with Next.js code splitting
- **Rendering:** 60fps animations with Framer Motion

---

## 🔄 **CORS & Middleware**

### **FastAPI Middleware**
```python
CORSMiddleware(
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

**Purpose:** Enable cross-origin requests from Next.js frontend to FastAPI backend

---

## 📦 **Package Management**

### **Backend (requirements.txt)**
```
fastapi
uvicorn
pydantic
python-multipart
google-generativeai
sentence-transformers
torch
numpy
scikit-learn
jsonschema
python-dotenv
praw
tweepy
requests
beautifulsoup4
lxml
```

### **Frontend (package.json)**
```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "18.3.1",
    "typescript": "5.x",
    "axios": "latest",
    "framer-motion": "latest",
    "lucide-react": "latest",
    "tailwindcss": "latest"
  }
}
```

---

## 🧪 **Testing & Validation**

### **Validation Scoring Algorithm**
```python
# Base score from platform reliability
base_score = 7.0 - 9.5

# Social media boost
reddit_boost = sentiment * 2.0 + mentions * 0.3
twitter_boost = sentiment * 1.5 + mentions * 0.2

# Keyword analysis
penalty = framework_keywords * -1.5  # tensorflow, pytorch, etc.
boost = beginner_keywords * +0.8     # tutorial, learn, etc.

# Final score
validation_score = base + social_boost + boost - penalty
validation_score = clamp(1.0, 10.0)  # Range: 1-10
```

---

## 🏗️ **Architecture Pattern**

### **Backend:** Layered Architecture
```
API Layer (FastAPI routes)
    ↓
Service Layer (GeminiService, ContentRecommender)
    ↓
Logic Layer (GapAnalyzer, PathGenerator)
    ↓
Data Layer (JSON files, ML models)
```

### **Frontend:** Component-Based Architecture
```
Pages (app/page.tsx)
    ↓
Components (Reusable UI)
    ↓
API Client (lib/api.ts)
    ↓
Backend API (localhost:8000)
```

---

## 🔒 **Security Considerations**

1. **API Keys:** Stored in `.env`, never committed to version control
2. **Input Validation:** Pydantic models validate all API inputs
3. **CORS:** Restricted to localhost:3000 in development
4. **Rate Limiting:** GitHub API limited to 60 req/hour (unauthenticated)
5. **Error Handling:** Graceful degradation when APIs fail

---

## 📈 **Scalability Notes**

### **Current Limitations:**
- In-memory ML models (no distributed caching)
- File-based JSON storage (no database)
- Synchronous scraping (no async parallelization)
- Single-server deployment

### **Future Improvements:**
- PostgreSQL/MongoDB for persistent storage
- Redis for caching embeddings and API responses
- Celery for async task queue (background scraping)
- Docker containerization
- Kubernetes for horizontal scaling

---

## 🎯 **Technology Selection Rationale**

| Technology | Why Chosen |
|------------|------------|
| **FastAPI** | Fastest Python framework, async support, auto-generated docs |
| **Next.js** | Best React framework, SEO, SSR, excellent developer experience |
| **Gemini** | Most advanced LLM with multimodal support and long context |
| **Sentence Transformers** | Industry-standard for semantic similarity |
| **praw** | Official Reddit API wrapper with excellent documentation |
| **Framer Motion** | Most popular React animation library |
| **Tailwind CSS** | Rapid prototyping, consistent design system |

---

## 📝 **Version Information**

- **Project Version:** 1.1.0
- **Python:** 3.11+
- **Node.js:** 18.x or higher
- **Next.js:** 16.1.1 (Turbopack enabled)
- **Last Updated:** January 15, 2026

---

## 🔗 **External Dependencies**

| API/Service | Rate Limits | Cost |
|-------------|-------------|------|
| **Gemini API** | 60 req/min (free tier) | Free with limits |
| **GitHub API** | 60 req/hour (unauth), 5000/hour (auth) | Free |
| **Reddit API** | 60 req/min | Free with app registration |
| **Twitter API v2** | 500k tweets/month (Essential tier) | $100/month or Free tier |
| **YouTube** | Web scraping (no official API used) | Free |
| **Coursera** | Web scraping (no official API) | Free |

---

*This document provides a complete overview of all technologies, their versions, and exact functions in the AI Learning Resource Scraper system.*
