from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ResumeData(BaseModel):
    user_id: str
    personal_info: dict
    education: List[dict]
    experience: List[dict]
    skills: List[str]
    projects: List[dict]

class ResumeEvaluation(BaseModel):
    overall_score: float
    ats_compatibility: float
    keyword_optimization: float
    structure_quality: float
    suggestions: List[str]

class ResumeBuilderResponse(BaseModel):
    resume_url: Optional[str] = None
    evaluation: ResumeEvaluation
    formatted_content: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)
