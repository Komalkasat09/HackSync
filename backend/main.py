from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from config import settings, connect_to_mongo, close_mongo_connection

# Import routers
from auth.routes import router as auth_router
from career_recommender.routes import router as career_router
from resume_builder.routes import router as resume_router
from learning_guide.routes import router as learning_router
from interview_prep.routes import router as interview_router
from learningPath.routes import router as learningpath_router

app = FastAPI(
    title="SkillSphere API",
    description="AI-powered career guidance platform",
    version="1.0.0"
)

# Global exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"❌ Validation Error on {request.url}")
    print(f"   Errors: {exc.errors()}")
    body = await request.body()
    print(f"   Body received: {body.decode()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

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
app.include_router(career_router, prefix="/api/career", tags=["Career Recommender"])
app.include_router(resume_router, prefix="/api/resume", tags=["Resume Builder"])
app.include_router(learning_router, prefix="/api/learning", tags=["Learning Guide"])
app.include_router(interview_router, prefix="/api/interview", tags=["Interview Prep"])
app.include_router(learningpath_router, prefix="/api/learning-path", tags=["Learning Path AI"])

@app.get("/")
async def root():
    return {"message": "Welcome to SkillSphere API", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
