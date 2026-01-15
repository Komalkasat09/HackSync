ERROR:    [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000): only one usage of each socket address (protocol/network address/port) is normally permitted
# SkillAI Pathfinder - Project Features

## 1. Core Logic & Intelligence
*   **Resume Parsing (NLP):**
    *   Uses `spaCy` and `EntityRuler` to extract skill entities from raw text inputs.
    *   Normalizes extracted terms to a standard taxonomy (e.g., mapping "JS" to "JavaScript").
*   **Skill Gap Analysis:**
    *   Compares user's current proficiency against target role requirements.
    *   Identifies two types of gaps: `MISSING` (skill not present) and `PROFICIENCY_LOW` (skill exists but needs improvement).
*   **AI-Driven Recommendations:**
    *   Uses **Sentence Transformers** (`all-MiniLM-L6-v2`) for semantic search.
    *   Matches skill gaps to learning resources based on meaning, not just keywords (e.g., matching "AI" to "Machine Learning").
*   **Intelligent Scheduling:**
    *   Generates a weekly learning roadmap based on user's available hours per week.
    *   Respects skill dependencies (e.g., Python before Machine Learning) using a Directed Acyclic Graph (DAG).
*   **Explainability:**
    *   Provides natural language explanations for *why* a specific module or resource was assigned (e.g., "To advance your Python skills from Beginner to Intermediate").

## 2. Data & Content
*   **Multi-Source Scraper:**
    *   Aggregates content from **YouTube**, **freeCodeCamp**, **Coursera**, and **GitHub**.
    *   Includes social proof mechanisms:
        *   Verifies YouTube videos based on view counts (>100k) and social mentions (Reddit/Twitter search).
*   **Structured Schemas:**
    *   Standardized JSON schemas for Skill Taxonomy, Job Roles, and Learning Resources.

## 3. Backend (FastAPI)
*   **REST API:**
    *   `POST /parse-resume`: Endpoint for skill extraction.
    *   `POST /analyze-gaps`: Endpoint for detailed gap reports.
    *   `POST /generate-path`: Full pipeline execution returning a scheduled roadmap.
    *   `GET /recommend`: Standalone semantic search for resources.
*   **Scalable Architecture:**
    *   Clean separation of concerns: `api`, `logic`, `models`, `nlp`, and `scraper`.
    *   Pydantic models for request/response validation.

## 4. Frontend (Next.js)
*   **Dashboard UI:**
    *   Input: Resume text area and target role selection.
    *   Status: Real-time processing feedback.
*   **Visual Roadmap:**
    *   Interactive timeline component grouped by weeks.
    *   Displays recommended resources with verified badges and trusted source indicators.
*   **Modern Design:**
    *   Glassmorphism aesthetic with Tailwind CSS / Custom CSS variables.
    *   Responsive layout for desktop and mobile.
