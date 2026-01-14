from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging
import os
import json
from datetime import datetime
from contextlib import asynccontextmanager
from dataclasses import asdict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Core Logic
from nlp.skill_parser import SkillMapper
from models.user_profile import UserProfile
from logic.gap_analysis import GapAnalyzer, SkillGap
from logic.path_generator import PathGenerator, LearningPath
from logic.recommender import ContentRecommender
from scraper.scraper import LearningScraper
from scraper.gemini_scraper import GeminiSmartScraper
from ai.gemini_service import GeminiService

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API")

# Global State for ML Models
ml_models: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models on startup
    logger.info("Loading ML Models and AI Services...")
    try:
        ml_models["skill_mapper"] = SkillMapper()
        ml_models["gap_analyzer"] = GapAnalyzer(skill_mapper=ml_models["skill_mapper"])
        ml_models["path_generator"] = PathGenerator() # This loads Recommender internally
        
        # Initialize Gemini AI service
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            logger.warning("GEMINI_API_KEY not found in environment variables")
            ml_models["gemini_service"] = None
        else:
            ml_models["gemini_service"] = GeminiService(gemini_api_key)
            
        logger.info("All services loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load models: {str(e)}")
        raise e
    yield
    # Clean up
    ml_models.clear()

app = FastAPI(title="Learning Path AI API", lifespan=lifespan)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class ResumeRequest(BaseModel):
    text: str

class SkillResponse(BaseModel):
    skills: List[str]

class ProfileRequest(BaseModel):
    user_id: str
    current_skills: Dict[str, str] # Name -> Proficiency (e.g. "Python": "Intermediate")
    target_role: str
    target_skills: Optional[List[str]] = None
    hours_per_week: int = 10

class PathResponse(BaseModel):
    user_id: str
    target_role: str
    total_estimated_hours: int
    total_weeks: int
    modules: List[Dict[str, Any]]

class ChatRequest(BaseModel):
    user_id: str
    message: str
    user_context: Optional[Dict] = None

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None

class ActivityRequest(BaseModel):
    user_id: str
    resource_title: str
    resource_type: str
    topic: str
    time_spent_minutes: int
    status: str = "completed"

class ProgressResponse(BaseModel):
    user_id: str
    progress_summary: Dict[str, Any]
    recent_activities: List[Dict[str, Any]]
    badges: List[Dict[str, Any]]

class RecommendationRequest(BaseModel):
    user_id: str
    skill_gaps: List[str]
    preferences: Optional[Dict] = None

class EnhancedRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    explanations: List[Dict[str, Any]]
    projects: List[Dict[str, Any]]

# --- Helpers ---

def _build_user_profile(request: ProfileRequest) -> UserProfile:
    skills_list = [
        {"name": k, "proficiency": v} for k, v in request.current_skills.items()
    ]
    target_skills = _get_target_skills(request)
    return UserProfile(
        user_id=request.user_id,
        name="User",
        email="user@example.com",
        current_skills=skills_list,
        goals={
            "target_role": request.target_role,
            "target_skills": target_skills,
            "timeline_months": 6  # Default timeline
        }
    )

def _get_target_skills(request: ProfileRequest) -> List[str]:
    if request.target_skills:
        return request.target_skills
    
    # Load requirements from JSON
    req_path = os.path.join(os.path.dirname(__file__), '..', 'nlp', 'role_requirements.json')
    if os.path.exists(req_path):
        with open(req_path, 'r', encoding='utf-8') as f:
            role_map = json.load(f)
        
        # Exact match first
        if request.target_role in role_map:
            return list(role_map[request.target_role].keys())
            
        # Case-insensitive partial match
        role_lower = request.target_role.lower()
        for role_name, skills_dict in role_map.items():
            if role_name.lower() in role_lower or role_lower in role_name.lower():
                return list(skills_dict.keys())

    # Final hardcoded fallback if file missing or no match
    return ["Python", "JavaScript", "SQL", "Git"]

# --- Endpoints ---

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "active", "models_loaded": len(ml_models) > 0}

@app.post("/parse-resume", response_model=SkillResponse, tags=["Profile"])
def parse_resume(request: ResumeRequest):
    """
    Extract skills from raw resume text using NLP.
    """
    mapper: SkillMapper = ml_models["skill_mapper"]
    extracted = mapper.process_resume(request.text)
    return {"skills": extracted}

@app.post("/analyze-gaps", tags=["Profile"])
def analyze_gaps(request: ProfileRequest):
    """
    Detect skill gaps based on current profile and target role.
    """
    user = _build_user_profile(request)
    target_skills = _get_target_skills(request)
    
    analyzer: GapAnalyzer = ml_models["gap_analyzer"]
    gaps: List[SkillGap] = analyzer.analyze(user, target_skills)
    
    return [asdict(g) for g in gaps]

@app.get("/recommend", tags=["Resources"])
def recommend_resources(query: str, top_k: int = 5):
    """
    Get AI-driven resource recommendations for a specific query.
    """
    # Access the recommender from the path generator instance
    rec_engine: ContentRecommender = ml_models["path_generator"].recommender
    results = rec_engine.recommend(query, top_k=top_k)
    return results

class ScrapeRequest(BaseModel):
    topic: str

@app.post("/scrape", tags=["Resources"])
def run_scraper(request: ScrapeRequest):
    """
    Trigger the AI-powered scraper with social validation for a specific topic.
    Uses Gemini to find and validate resources from Twitter/Reddit community sentiment.
    """
    logger.info(f"Triggering AI scraper with social validation for: {request.topic}")
    
    gemini_service: GeminiService = ml_models.get("gemini_service")
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI scraper service not available")
    
    # Use Gemini Smart Scraper
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    smart_scraper = GeminiSmartScraper(gemini_api_key)
    
    # Scrape and validate resources
    resources = smart_scraper.scrape_and_validate([request.topic], validate=True)
    
    # Save to file
    count = smart_scraper.save_resources(resources)
    
    # Reload Recommender in the PathGenerator to see the new data
    generator: PathGenerator = ml_models["path_generator"]
    generator.recommender = ContentRecommender()
    
    return {
        "status": "success",
        "resources_scraped": len(resources),
        "total_resources": count,
        "validation_enabled": True,
        "resources_preview": resources[:20]  # Show top 20 for better variety
    }

@app.post("/quick-scrape", tags=["Resources"])
def quick_scrape(request: ScrapeRequest):
    """
    Fast mode: Get AI recommendations without full social validation.
    Perfect for real-time responses.
    """
    logger.info(f"Quick AI scrape for: {request.topic}")
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(status_code=503, detail="AI scraper not configured")
    
    smart_scraper = GeminiSmartScraper(gemini_api_key)
    resources = smart_scraper.get_quick_recommendations(request.topic, count=5)
    
    return {
        "status": "success",
        "resources": resources,
        "mode": "quick"
    }

@app.post("/generate-path", response_model=PathResponse, tags=["Path"])
def generate_learning_path(request: ProfileRequest):
    """
    Generate a full personalized learning path with scheduling and explanations.
    """
    user = _build_user_profile(request)
    target_skills = _get_target_skills(request)
    logger.info(f"Target Skills for {request.target_role}: {target_skills}")
    
    analyzer: GapAnalyzer = ml_models["gap_analyzer"]
    gaps: List[SkillGap] = analyzer.analyze(user, target_skills)
    logger.info(f"Detected {len(gaps)} gaps: {[g.skill_name for g in gaps]}")
    
    generator: PathGenerator = ml_models["path_generator"]
    path = generator.generate_path(
        user_id=request.user_id,
        role=request.target_role,
        gaps=gaps,
        hours_per_week=request.hours_per_week
    )
    
    logger.info(f"Generated {len(path.modules)} modules.")
    # Serialize LearningPath dataclass to Dict
    return asdict(path)

# --- Enhanced AI-Powered Endpoints ---

@app.post("/chat-mentor", response_model=ChatResponse, tags=["AI Mentor"])
def chat_with_ai_mentor(request: ChatRequest):
    """
    Chat with AI learning mentor for personalized guidance and motivation.
    """
    gemini_service: GeminiService = ml_models.get("gemini_service")
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI mentor service not available")
    
    user_context = request.user_context or {}
    learning_history = user_context.get("learning_history", [])
    
    response = gemini_service.chat_with_mentor(
        user_message=request.message,
        user_profile=user_context,
        learning_history=learning_history
    )
    
    return ChatResponse(
        response=response,
        suggestions=["Tell me about learning resources", "How am I progressing?", "What should I focus on next?"]
    )

@app.post("/track-activity", tags=["Progress"])
def track_learning_activity(request: ActivityRequest):
    """
    Track a completed learning activity and update user progress.
    """
    # In a real app, you'd load the user profile from a database
    # For now, we'll simulate this
    logger.info(f"Tracking activity for user {request.user_id}: {request.resource_title}")
    
    return {
        "status": "success",
        "message": "Activity tracked successfully",
        "xp_earned": 50 + (request.time_spent_minutes // 10),
        "streak_updated": True
    }

@app.get("/progress/{user_id}", response_model=ProgressResponse, tags=["Progress"])
def get_user_progress(user_id: str):
    """
    Get comprehensive user progress including XP, badges, and learning analytics.
    """
    # In a real implementation, load from database
    # For demo, return sample progress data
    sample_progress = {
        "total_xp": 1250,
        "level": 3,
        "total_hours_learned": 24.5,
        "activities_completed": 15,
        "current_streak": 5,
        "longest_streak": 12,
        "badges_earned": 4,
        "weekly_progress": {
            "goal_hours": 10,
            "completed_hours": 7.5,
            "progress_percentage": 75
        }
    }
    
    sample_activities = [
        {"title": "Python Basics", "type": "Video", "completed": "2024-01-14", "time_spent": 120},
        {"title": "Data Structures", "type": "Article", "completed": "2024-01-13", "time_spent": 45}
    ]
    
    sample_badges = [
        {"name": "First Steps", "description": "Completed first activity!", "category": "Special"},
        {"name": "Learning Enthusiast", "description": "10 activities completed", "category": "Progress"}
    ]
    
    return ProgressResponse(
        user_id=user_id,
        progress_summary=sample_progress,
        recent_activities=sample_activities,
        badges=sample_badges
    )

@app.post("/enhanced-recommendations", response_model=EnhancedRecommendationResponse, tags=["AI Recommendations"])
def get_enhanced_recommendations(request: RecommendationRequest):
    """
    Get AI-enhanced recommendations with explanations and project suggestions.
    """
    gemini_service: GeminiService = ml_models.get("gemini_service")
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI recommendation service not available")
    
    # Get basic recommendations from existing system
    recommender: ContentRecommender = ml_models["path_generator"].recommender
    query = " ".join(request.skill_gaps)
    basic_recommendations = recommender.recommend(query, top_k=5)
    
    # Enhance with AI explanations
    explanations = []
    user_profile = {"skills": {}, "target_role": "Developer", "preferences": request.preferences or {}}
    gap_analysis = {"gaps": request.skill_gaps}
    
    for resource in basic_recommendations:
        if gemini_service:
            explanation = gemini_service.explain_recommendation(user_profile, resource, gap_analysis)
            explanations.append({
                "resource_title": resource.get("title", ""),
                "explanation": explanation.explanation,
                "relevance_score": explanation.relevance_score,
                "position": explanation.learning_path_position
            })
    
    # Generate project suggestions
    projects = []
    if gemini_service:
        projects = gemini_service.generate_project_suggestions(request.skill_gaps, "Intermediate")
    
    return EnhancedRecommendationResponse(
        recommendations=basic_recommendations,
        explanations=explanations,
        projects=projects
    )

@app.get("/skill-assessment/{user_id}", tags=["AI Assessment"])
def get_ai_skill_assessment(user_id: str, target_role: str):
    """
    Get AI-powered detailed skill gap assessment.
    """
    gemini_service: GeminiService = ml_models.get("gemini_service")
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI assessment service not available")
    
    # In a real app, load user's current skills from database
    current_skills = {"Python": "Intermediate", "JavaScript": "Beginner"}
    target_requirements = {"Python": "Advanced", "JavaScript": "Intermediate", "React": "Intermediate", "Docker": "Beginner"}
    
    assessments = gemini_service.assess_skill_gaps(current_skills, target_requirements)
    
    return {
        "user_id": user_id,
        "target_role": target_role,
        "skill_assessments": [asdict(assessment) for assessment in assessments]
    }

@app.post("/generate-insights/{user_id}", tags=["AI Analytics"])
def generate_learning_insights(user_id: str):
    """
    Generate AI-powered learning insights and recommendations.
    """
    gemini_service: GeminiService = ml_models.get("gemini_service")
    if not gemini_service:
        raise HTTPException(status_code=503, detail="AI insights service not available")
    
    # Sample progress data (in real app, load from database)
    progress_data = {
        "total_hours": 25.5,
        "activities_completed": 18,
        "current_streak": 7,
        "preferred_content_types": ["Video", "Interactive"]
    }
    
    resources_completed = [
        {"title": "Python Fundamentals", "topic": "Python", "rating": 5},
        {"title": "Web Development Basics", "topic": "HTML/CSS", "rating": 4}
    ]
    
    insights = gemini_service.generate_learning_insights(progress_data, resources_completed)
    
    return {
        "user_id": user_id,
        "insights": insights,
        "generated_at": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=False)
