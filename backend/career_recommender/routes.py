from fastapi import APIRouter, HTTPException
from .schema import CareerRecommendationRequest, CareerRecommendationResponse, CareerPath
from datetime import datetime

router = APIRouter()

@router.post("/recommend", response_model=CareerRecommendationResponse)
async def get_career_recommendations(request: CareerRecommendationRequest):
    """
    AI Career Path Recommender - Suggests suitable career paths based on user profile
    """
    try:
        # Dummy data for now - will be replaced with AI logic
        dummy_recommendations = [
            CareerPath(
                career_title="Full Stack Developer",
                match_score=0.92,
                description="Build complete web applications from frontend to backend",
                required_skills=["JavaScript", "React", "Node.js", "MongoDB"],
                trending_industries=["Tech Startups", "FinTech", "E-commerce"],
                average_salary="$80,000 - $120,000",
                growth_outlook="High demand, 22% growth expected"
            ),
            CareerPath(
                career_title="Data Scientist",
                match_score=0.85,
                description="Analyze complex data to drive business decisions",
                required_skills=["Python", "Machine Learning", "SQL", "Statistics"],
                trending_industries=["Healthcare", "Finance", "Tech"],
                average_salary="$90,000 - $140,000",
                growth_outlook="Very high demand, 31% growth expected"
            ),
            CareerPath(
                career_title="UX/UI Designer",
                match_score=0.78,
                description="Create intuitive and engaging user experiences",
                required_skills=["Figma", "User Research", "Prototyping", "Design Systems"],
                trending_industries=["SaaS", "Mobile Apps", "Gaming"],
                average_salary="$70,000 - $110,000",
                growth_outlook="Strong demand, 18% growth expected"
            )
        ]
        
        return CareerRecommendationResponse(
            recommendations=dummy_recommendations,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends")
async def get_career_trends():
    """
    Get current career trends and in-demand skills
    """
    return {
        "trending_careers": ["AI/ML Engineer", "Cloud Architect", "Cybersecurity Analyst"],
        "hot_skills": ["Python", "AWS", "React", "Machine Learning", "Docker"],
        "growing_industries": ["AI/ML", "Cybersecurity", "Cloud Computing", "Data Science"]
    }
