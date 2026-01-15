from fastapi import APIRouter, HTTPException, Depends
from .schema import (
    SkillGapRequest, LearningGuideResponse, LearningPath, LearningResource,
    GenerateRoadmapRequest, GenerateRoadmapResponse, LearningNode, Resource,
    SaveRoadmapRequest, RoadmapListResponse, RoadmapDetailResponse,
    RoadmapMetadata, SavedRoadmap
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
        roadmap_data = await roadmap_service.generate_roadmap(topic)
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

@router.post("/save-roadmap")
async def save_roadmap(
    request: SaveRoadmapRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save a generated roadmap to the user's collection
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])

        # Create roadmap document
        roadmap_data = {
            "user_id": user_id,
            "topic": request.topic,
            "mermaid_code": request.mermaid_code,
            "nodes": [node.dict() for node in request.nodes],
            "created_at": datetime.utcnow(),
            "updated_at": None,
            "is_favorite": False,
            "notes": request.notes,
            "node_count": len(request.nodes)
        }

        # Insert into database
        result = await db.user_roadmaps.insert_one(roadmap_data)

        return {
            "success": True,
            "roadmap_id": str(result.inserted_id),
            "message": "Roadmap saved successfully"
        }

    except Exception as e:
        print(f"Error saving roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save roadmap: {str(e)}")

@router.get("/roadmaps", response_model=RoadmapListResponse)
async def get_user_roadmaps(current_user: dict = Depends(get_current_user)):
    """
    Get all roadmaps for the current user
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])

        # Fetch all roadmaps for user, sorted by creation date (newest first)
        cursor = db.user_roadmaps.find(
            {"user_id": user_id},
            {"mermaid_code": 0, "nodes": 0}  # Exclude large fields for list view
        ).sort("created_at", -1)

        roadmaps = []
        async for doc in cursor:
            roadmaps.append(RoadmapMetadata(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                topic=doc["topic"],
                created_at=doc["created_at"],
                node_count=doc.get("node_count", 0),
                is_favorite=doc.get("is_favorite", False),
                notes=doc.get("notes")
            ))

        return RoadmapListResponse(
            success=True,
            roadmaps=roadmaps,
            message=f"Found {len(roadmaps)} roadmaps"
        )

    except Exception as e:
        print(f"Error fetching roadmaps: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch roadmaps: {str(e)}")

@router.get("/roadmaps/{roadmap_id}", response_model=RoadmapDetailResponse)
async def get_roadmap(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific roadmap by ID
    """
    try:
        from bson import ObjectId
        db = await get_database()
        user_id = str(current_user["_id"])

        # Fetch roadmap
        roadmap = await db.user_roadmaps.find_one({
            "_id": ObjectId(roadmap_id),
            "user_id": user_id
        })

        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        # Convert to SavedRoadmap model
        saved_roadmap = SavedRoadmap(
            user_id=roadmap["user_id"],
            topic=roadmap["topic"],
            mermaid_code=roadmap["mermaid_code"],
            nodes=[LearningNode(**node) for node in roadmap["nodes"]],
            created_at=roadmap["created_at"],
            updated_at=roadmap.get("updated_at"),
            is_favorite=roadmap.get("is_favorite", False),
            notes=roadmap.get("notes")
        )

        return RoadmapDetailResponse(
            success=True,
            roadmap=saved_roadmap,
            message="Roadmap retrieved successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch roadmap: {str(e)}")

@router.delete("/roadmaps/{roadmap_id}")
async def delete_roadmap(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a roadmap by ID
    """
    try:
        from bson import ObjectId
        db = await get_database()
        user_id = str(current_user["_id"])

        # Delete roadmap (only if owned by user)
        result = await db.user_roadmaps.delete_one({
            "_id": ObjectId(roadmap_id),
            "user_id": user_id
        })

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        return {
            "success": True,
            "message": "Roadmap deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting roadmap: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete roadmap: {str(e)}")

@router.put("/roadmaps/{roadmap_id}/favorite")
async def toggle_favorite(
    roadmap_id: str,
    is_favorite: bool,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle favorite status of a roadmap
    """
    try:
        from bson import ObjectId
        db = await get_database()
        user_id = str(current_user["_id"])

        # Update favorite status
        result = await db.user_roadmaps.update_one(
            {
                "_id": ObjectId(roadmap_id),
                "user_id": user_id
            },
            {
                "$set": {
                    "is_favorite": is_favorite,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Roadmap not found")

        return {
            "success": True,
            "message": "Favorite status updated"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating favorite: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update favorite: {str(e)}")
