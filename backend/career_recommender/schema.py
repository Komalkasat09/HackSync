from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CareerRecommendationRequest(BaseModel):
    user_id: str
    skills: List[str]
    education: str
    interests: List[str]
    experience_years: int = 0

class CareerPath(BaseModel):
    career_title: str
    match_score: float
    description: str
    required_skills: List[str]
    trending_industries: List[str]
    average_salary: str
    growth_outlook: str

class CareerRecommendationResponse(BaseModel):
    recommendations: List[CareerPath]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
