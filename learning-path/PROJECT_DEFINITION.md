# Skill & Learning Path Recommendation System - Project Definition

## 1. Problem Statement
**The Challenge:**
In today’s rapidly evolving job market, learners and employees often feel overwhelmed by the sheer volume of educational content available. They struggle to identify:
1.  Which specific skills are required for their target roles.
2.  What is the most efficient sequence to learn these skills.
3.  Which resources (courses, articles, projects) are high-quality and relevant.

**The Solution:**
A **Skill & Learning Path Recommendation System** that acts as an intelligent career compass. It analyzes a user's current skill set vis-à-vis their target goals and dynamically generates a personalized, step-by-step learning roadmap.

---

## 2. User Personas

### A. The Aspiring Learner (Primary User)
*   **Name:** Alex
*   **Goal:** Switch from extensive manual QA testing to Full Stack Development.
*   **Pain Points:** Doesn't know if he should learn React or Angular first; gets distracted by tutorials that are too advanced or irrelevant.
*   **Needs:** A clear, ordered list of topics, progress tracking, and "quick wins" to stay motivated.

### B. The Skill Manager (Admin/Mentor)
*   **Name:** Sarah (L&D Manager)
*   **Goal:** Ensure her team is up-to-date with modern tech stacks.
*   **Pain Points:** Cannot manually curate paths for 50+ employees; difficult to track who is learning what.
*   **Needs:** Dashboard to assign specific domain paths (e.g., "Senior DevOps Path") and view team progress.

---

## 3. Feature Scope

### Phase 1: MVP (Minimum Viable Product)
1.  **Onboarding & Profiling:**
    *   Survey to capture current role, target role, and current skill proficiency (Beginner, Intermediate, Advanced).
2.  **Skill Gap Analysis:**
    *   Compare "Current Skills" vs. "Target Role Requirements" to identify the *Delta*.
3.  **Path Generation Engine:**
    *   Generate a linear timeline of modules (e.g., "Week 1: HTML Basics", "Week 2: CSS Flexbox").
4.  **Resource Library:**
    *   Curated database of courses (Video, Article, Interactive).
5.  **Dashboard:**
    *   Visual progress tracker (%).

### Phase 2: Future Enhancements
1.  **AI-Driven Recommendations:** Use LLMs to dynamically suggest resources based on user ratings.
2.  **Gamification:** Badges, streaks, and leaderboards.
3.  **Peer Learning:** Community forums attached to specific path nodes.

---

## 4. Inputs & Outputs

### Inputs (Data In)
1.  **User Profile:**
    *   Current Job Title.
    *   Target Job Title.
    *   Time available per week (e.g., "5 hours").
    *   Preferred Content Type (Video vs. Text).
2.  **System Data:**
    *   Skill Graph (Dependency trees, e.g., "React requires Javascript").
    *   Content Metadata (Duration, Difficulty, Rating).

### Outputs (Data Out)
1.  **The "Path":** An ordered sequence of learning nodes.
2.  **Timeline:** Estimated date of completion based on weekly availability.
3.  **Recommendations:** Specific content links for each node.

---

## 5. System Constraints & Non-Functional Requirements
1.  **Response Time:** Path generation must take less than 3 seconds.
2.  **Scalability:** Database must handle complex many-to-many relationships (Users <-> Skills <-> Courses).
3.  **Platform:** Web-based application (Responsive Mobile/Desktop).
4.  **Data Privacy:** User career data must be private and secure.

---

## 6. Proposed Tech Stack
*   **Frontend:** Next.js (React) - for SEO and fast page loads.
*   **Styling:** Tailwind CSS / Vanilla CSS - for modern, rapid UI development.
*   **Backend:** Python (FastAPI) - for robust NLP and AI capabilities.
*   **AI/ML:** spaCy, Sentence-Transformers, NetworkX - for skill parsing and gap analysis.
*   **Database:** JSON (MVP) / PostgreSQL (Production) - for storing user profiles and resources.
