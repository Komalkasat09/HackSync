# Testing Guide - SkillAI Pathfinder

This guide explains how to test the different layers of the Skill & Learning Path Recommendation System.

---

## 1. Prerequisites
Ensure you have all dependencies installed for both the backend and frontend.

### Backend Setup
```bash
# From the project root
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Frontend Setup
```bash
cd frontend
npm install
```

---

## 2. Testing the Scraper
The scraper gathers content from YouTube, freeCodeCamp, Coursera, and GitHub.

**Command:**
```bash
# From the project root
cd scraper
python scraper.py
```
**Verification:**
- Check if `scraper/learning_resources.json` is generated/updated.
- Verify that it contains "YouTube" sources with `"social_verified": true`.

---

## 3. Testing the NLP & Logic (Unit Level)
Most logic modules have built-in `__main__` test blocks.

### Skill Parser
```bash
python -m nlp.skill_parser
```
*Tests if a raw resume string (e.g. "I know Python and react") is correctly parsed into a list of skills.*

### Learning Path Generation
```bash
python -m logic.path_generator
```
*Tests if a user profile vs. target role correctly generates a 12-week roadmap with weekly dates and resource links.*

---

## 4. Testing the API (Backend)
The FastAPI server exposes the logic to the web.

**Start the Server:**
```bash
# From the project root
python -m api.main
```
The server will run at `http://localhost:8000`.

**Endpoints to Test:**
- **Health:** Open `http://localhost:8000/` in your browser.
- **Generate Path (via POST):**
  Use a tool like Postman or `curl`:
  ```bash
  curl -X POST "http://localhost:8000/generate-path" \
       -H "Content-Type: application/json" \
       -d '{
         "user_id": "test_user",
         "current_skills": {"Python": "Intermediate"},
         "target_role": "Data Scientist",
         "hours_per_week": 15
       }'
  ```

---

## 5. Testing the UI (Frontend)
The Next.js dashboard provides a visual interface for users.

**Start the Dashboard:**
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` in your browser.

**Manual Test Flow:**
1. Enter a target role (e.g., "Full Stack Developer").
2. Paste a sample resume or list of skills.
3. Click **"Generate My Path"**.
4. Observe the loading state and the final **Roadmap Timeline**.

---

## 6. Testing Recommendation Metrics
We have a dedicated evaluation script to compute Precision, Recall, and NDCG.

**Command:**
```bash
python -m logic.evaluation
```
*This calculates how well our semantic search matches "ground truth" URLs defined in the test data.*
