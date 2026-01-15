from fastapi import APIRouter, HTTPException, Depends
from .schema import (
    SkillGapRequest, LearningGuideResponse, LearningPath, LearningResource,
    GenerateRoadmapRequest, GenerateRoadmapResponse, LearningNode, Resource
)
from .roadmap_service import RoadmapService
from config import get_database
from auth.routes import get_current_user
from datetime import datetime

router = APIRouter()
roadmap_service = RoadmapService()

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

@router.post("/generate-roadmap", response_model=GenerateRoadmapResponse)
async def generate_learning_roadmap(
    request: GenerateRoadmapRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a learning roadmap with pre-fetched resources from YouTube, Udemy, and Coursera.
    Uses MongoDB caching to avoid re-fetching resources for topics already in database.
    """
    try:
        db = await get_database()
        topic = request.topic
        
        # Step 1: Generate roadmap structure using Gemini
        roadmap_data = roadmap_service.generate_roadmap(topic)
        mermaid_code = roadmap_data["mermaid_code"]
        topics = roadmap_data["topics"]
        
        # Step 2: Fetch resources for each topic (with caching)
        nodes = []
        for topic_name in topics:
            # Check if topic exists in MongoDB
            cached_node = await db.learning_resources.find_one({"topic": topic_name})
            
            if cached_node:
                # Use cached resources
                nodes.append(LearningNode(
                    topic=cached_node["topic"],
                    resources=[Resource(**res) for res in cached_node["resources"]],
                    fetched_at=cached_node.get("fetched_at")
                ))
                print(f"✓ Using cached resources for: {topic_name}")
            else:
                # Fetch new resources
                print(f"⟳ Fetching new resources for: {topic_name}")
                resources = roadmap_service.fetch_all_resources(topic_name)
                
                # Save to MongoDB
                node_data = {
                    "topic": topic_name,
                    "resources": [res for res in resources],  # Already dict format
                    "fetched_at": datetime.utcnow().isoformat()
                }
                await db.learning_resources.insert_one(node_data)
                
                nodes.append(LearningNode(
                    topic=topic_name,
                    resources=[Resource(**res) for res in resources],
                    fetched_at=node_data["fetched_at"]
                ))
        
        return GenerateRoadmapResponse(
            success=True,
            mermaid_code=mermaid_code,
            nodes=nodes,
            message=f"Learning roadmap generated with {len(nodes)} topics"
        )
        
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")
