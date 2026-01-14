# SkillSphere Backend

FastAPI backend for the SkillSphere AI-powered career guidance platform.

## Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Configure MongoDB:
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get your connection string
   - Add it to `.env` file:
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

3. Run the server:
```bash
uvicorn main:app --reload
```

4. API will be available at [http://localhost:8000](http://localhost:8000)
5. API documentation at [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── config.py               # Configuration and MongoDB setup
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
│
├── career_recommender/     # Career path recommendations
│   ├── __init__.py
│   ├── schema.py          # Pydantic models
│   └── routes.py          # API endpoints
│
├── resume_builder/         # Resume building and evaluation
│   ├── __init__.py
│   ├── schema.py
│   └── routes.py
│
├── learning_guide/         # Personalized learning paths
│   ├── __init__.py
│   ├── schema.py
│   └── routes.py
│
└── interview_prep/         # Mock interviews and feedback
    ├── __init__.py
    ├── schema.py
    └── routes.py
```

## API Endpoints

### Career Recommender
- `POST /api/career/recommend` - Get career recommendations
- `GET /api/career/trends` - Get trending careers and skills

### Resume Builder
- `POST /api/resume/build` - Build and format resume
- `POST /api/resume/evaluate` - Evaluate resume quality

### Learning Guide
- `POST /api/learning/analyze` - Analyze skill gaps
- `GET /api/learning/resources/{skill}` - Get learning resources

### Interview Prep
- `POST /api/interview/start-session` - Start mock interview
- `POST /api/interview/submit-feedback` - Submit answers for feedback
- `GET /api/interview/common-questions/{role}` - Get common questions

## Features

1. **AI Career Path Recommender**: Suggests suitable career paths based on user skills and interests
2. **Resume Builder & Evaluator**: Generates ATS-optimized resumes with quality scores
3. **Personalized Learning Guide**: Identifies skill gaps and recommends courses
4. **Interview Preparation**: Mock interviews with AI-driven feedback

## Tech Stack

- FastAPI
- MongoDB (Motor async driver)
- Pydantic for data validation
- Python 3.8+
