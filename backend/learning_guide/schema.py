from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SkillGapRequest(BaseModel):
    user_id: str
    current_skills: List[str]
    target_role: str
    experience_level: str  # beginner, intermediate, advanced

class LearningResource(BaseModel):
    title: str
    type: str  # course, certification, tutorial, book
    platform: str
    duration: str
    difficulty: str
    url: str
    rating: float

class LearningPath(BaseModel):
    skill: str
    priority: str  # high, medium, low
    resources: List[LearningResource]
    estimated_time: str

class LearningGuideResponse(BaseModel):
    skill_gaps: List[str]
    learning_paths: List[LearningPath]
    recommended_order: List[str]
    total_estimated_time: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
