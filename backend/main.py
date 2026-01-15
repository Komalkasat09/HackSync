from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings, connect_to_mongo, close_mongo_connection

# Import routers
from auth.routes import router as auth_router
from career_recommender.routes import router as career_router
from learning_guide.routes import router as learning_router
from interview_prep.routes import router as interview_router
from user_profile.routes import router as profile_router
from ai_resume_builder.routes import router as ai_resume_router
from job_tracker.routes import router as job_tracker_router
from job_application.routes import router as job_application_router
from job_tracker.scheduler import job_scheduler
from portfolio.routes import router as portfolio_router

app = FastAPI(
    title="SkillSphere API",
    description="AI-powered career guidance platform",
    version="1.0.0"
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    job_scheduler.start()  # Start job scraping scheduler

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    job_scheduler.shutdown()  # Stop scheduler gracefully

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="", tags=["Authentication"])
app.include_router(profile_router, prefix="", tags=["User Profile"])
app.include_router(ai_resume_router, prefix="", tags=["AI Resume Builder"])
app.include_router(career_router, prefix="/api/career", tags=["Career Recommender"])
app.include_router(learning_router, prefix="/api/learning", tags=["Learning Guide"])
app.include_router(interview_router, prefix="/api/interview", tags=["Interview Prep"])
app.include_router(job_tracker_router, prefix="/api/jobs", tags=["Job Tracker"])
app.include_router(portfolio_router, prefix="/api", tags=["Portfolio"])
app.include_router(job_application_router, prefix="/api", tags=["Job Application"])

@app.get("/")
async def root():
    return {"message": "Welcome to SkillSphere API", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
