from fastapi import APIRouter, HTTPException
from .schema import SkillGapRequest, LearningGuideResponse, LearningPath, LearningResource
from datetime import datetime

router = APIRouter()

@router.post("/analyze", response_model=LearningGuideResponse)
async def analyze_skill_gaps(request: SkillGapRequest):
    """
    Personalized AI Learning Guide - Identifies skill gaps and recommends learning resources
    """
    try:
        # Dummy data for now
        dummy_resources = [
            LearningResource(
                title="Complete Python Bootcamp",
                type="course",
                platform="Udemy",
                duration="40 hours",
                difficulty="intermediate",
                url="https://udemy.com/python",
                rating=4.8
            ),
            LearningResource(
                title="AWS Certified Solutions Architect",
                type="certification",
                platform="AWS",
                duration="60 hours",
                difficulty="advanced",
                url="https://aws.amazon.com/certification",
                rating=4.9
            )
        ]
        
        dummy_learning_paths = [
            LearningPath(
                skill="Python",
                priority="high",
                resources=dummy_resources[:1],
                estimated_time="40 hours"
            ),
            LearningPath(
                skill="Cloud Computing",
                priority="medium",
                resources=dummy_resources[1:],
                estimated_time="60 hours"
            )
        ]
        
        return LearningGuideResponse(
            skill_gaps=["Python", "AWS", "Docker", "Kubernetes"],
            learning_paths=dummy_learning_paths,
            recommended_order=["Python", "Docker", "AWS", "Kubernetes"],
            total_estimated_time="150 hours",
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resources/{skill}")
async def get_skill_resources(skill: str):
    """
    Get learning resources for a specific skill
    """
    return {
        "skill": skill,
        "resources": [
            {"title": f"Master {skill}", "platform": "Coursera", "rating": 4.7},
            {"title": f"{skill} Fundamentals", "platform": "Udemy", "rating": 4.5}
        ]
    }
