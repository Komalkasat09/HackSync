"""
Learning Path Routes - Integrates with HackSync Backend
Wraps the standalone learning path API into the main application
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging
import os
import json

# Configure Logging
logger = logging.getLogger("LearningPath")

# Initialize ML Models (lazy loading)
_ml_models: Dict[str, Any] = {}
_import_error: Optional[str] = None

def get_models():
    """Lazy load ML models on first request"""
    global _import_error
    
    if _import_error:
        raise HTTPException(status_code=503, detail=f"Learning Path module unavailable: {_import_error}")
    
    if not _ml_models:
        logger.info("Loading Learning Path ML Models...")
        try:
            # Import here to avoid loading at startup
            from learningPath.nlp.skill_parser import SkillMapper
            from learningPath.models.user_profile import UserProfile
            from learningPath.logic.gap_analysis import GapAnalyzer, SkillGap
            from learningPath.logic.path_generator import PathGenerator, LearningPath
            from learningPath.logic.recommender import ContentRecommender
            from learningPath.scraper.scraper import LearningScraper
            
            _ml_models["skill_mapper"] = SkillMapper()
            _ml_models["gap_analyzer"] = GapAnalyzer(skill_mapper=_ml_models["skill_mapper"])
            _ml_models["path_generator"] = PathGenerator()
            _ml_models["imports"] = {
                "UserProfile": UserProfile,
                "SkillGap": SkillGap,
                "LearningPath": LearningPath,
                "LearningScraper": LearningScraper,
            }
            logger.info("Learning Path ML Models Loaded Successfully.")
        except Exception as e:
            error_msg = f"Failed to load models: {str(e)}"
            logger.error(error_msg)
            _import_error = error_msg
            raise HTTPException(status_code=503, detail=error_msg)
    return _ml_models

# Create Router
router = APIRouter()

# --- Pydantic Models ---

class ResumeRequest(BaseModel):
    text: str

class SkillResponse(BaseModel):
    skills: List[str]

class ProfileRequest(BaseModel):
    user_id: str
    current_skills: Dict[str, str]  # Name -> Proficiency (e.g. "Python": "Intermediate")
    target_role: str
    target_skills: Optional[List[str]] = None
    hours_per_week: int = 10  # Default to 10 hours per week
    hours_per_week: int = 10

class PathResponse(BaseModel):
    user_id: str
    target_role: str
    total_estimated_hours: int
    total_weeks: int
    modules: List[Dict[str, Any]]

class ScrapeRequest(BaseModel):
    topic: str

# --- Helper Functions ---

def _build_user_profile(request: ProfileRequest):
    """Build user profile from request - imports done inside function"""
    from learningPath.models.user_profile import UserProfile
    
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
            "timeline_months": 6
        }
    )

def _get_target_skills(request: ProfileRequest) -> List[str]:
    """Get target skills for role - imports done inside function"""
    import os
    import json
    
    if request.target_skills:
        return request.target_skills
    
    # Load requirements from JSON
    req_path = os.path.join(os.path.dirname(__file__), 'nlp', 'role_requirements.json')
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

@router.get("/health")
def health_check():
    """Check if learning path module is ready"""
    status = "active" if not _import_error else "unavailable"
    return {
        "status": status, 
        "module": "learning-path", 
        "models_loaded": bool(_ml_models),
        "error": _import_error
    }

@router.post("/parse-resume", response_model=SkillResponse)
def parse_resume(request: ResumeRequest):
    """
    Extract skills from raw resume text using NLP.
    """
    models = get_models()
    mapper = models["skill_mapper"]
    extracted = mapper.process_resume(request.text)
    return {"skills": extracted}

@router.post("/analyze-gaps")
def analyze_gaps(request: ProfileRequest):
    """
    Detect skill gaps based on current profile and target role.
    """
    from dataclasses import asdict
    
    models = get_models()
    user = _build_user_profile(request, models)
    target_skills = _get_target_skills(request)
    
    analyzer = models["gap_analyzer"]
    gaps = analyzer.analyze(user, target_skills)
    
    return [asdict(g) for g in gaps]

@router.get("/recommend")
def recommend_resources(query: str, top_k: int = 5):
    """
    Get AI-driven resource recommendations for a specific query.
    """
    models = get_models()
    rec_engine = models["path_generator"].recommender
    results = rec_engine.recommend(query, top_k=top_k)
    return results

@router.post("/scrape")
def run_scraper(request: ScrapeRequest):
    """
    Trigger the scraper for a specific topic and reload the recommender.
    """
    models = get_models()
    LearningScraper = models["imports"]["LearningScraper"]
    
    logger.info(f"Triggering manual scrape for: {request.topic}")
    scraper = LearningScraper(request.topic)
    count = scraper.run_all()
    
    # Reload Recommender in the PathGenerator to see the new data
    from learningPath.logic.recommender import ContentRecommender
    generator = models["path_generator"]
    generator.recommender = ContentRecommender()
    
    return {"status": "success", "resources_scraped": count}

@router.post("/generate-path", response_model=PathResponse)
def generate_learning_path(request: ProfileRequest):
    """
    Generate a full personalized learning path with scheduling and explanations.
    """
    try:
        from dataclasses import asdict
        
        models = get_models()
        user = _build_user_profile(request)
        target_skills = _get_target_skills(request)
        logger.info(f"Target Skills for {request.target_role}: {target_skills}")
        
        analyzer = models["gap_analyzer"]
        gaps = analyzer.analyze(user, target_skills)
        logger.info(f"Detected {len(gaps)} gaps: {[g.skill_name for g in gaps]}")
        
        generator = models["path_generator"]
        path = generator.generate_path(
            user_id=request.user_id,
            role=request.target_role,
            gaps=gaps,
            hours_per_week=request.hours_per_week
        )
        
        logger.info(f"Generated {len(path.modules)} modules.")
        # Serialize LearningPath dataclass to Dict
        return asdict(path)
    except Exception as e:
        logger.error(f"Error generating learning path: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
