from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ATSCheckRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

class ATSSuggestion(BaseModel):
    category: str  # formatting, keywords, content, etc.
    issue: str
    suggestion: str
    impact: str  # high, medium, low
    priority: int  # 1-5, where 1 is highest priority

class ATSCheckResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="ATS compatibility score out of 100")
    overall_assessment: str
    suggestions: List[ATSSuggestion]
    strengths: List[str]
    weaknesses: List[str]
    keyword_match_rate: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class GapAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    user_id: Optional[str] = None

class SkillGap(BaseModel):
    skill: str
    category: str  # technical, soft_skill, certification, tool, etc.
    importance: str  # critical, high, medium, low
    found_in_jd: bool = True
    found_in_resume: bool = False

class LearningResource(BaseModel):
    title: str
    url: str
    platform: str
    thumbnail: Optional[str] = None
    duration: Optional[str] = None
    is_free: bool = True
    rating: Optional[float] = None
    instructor: Optional[str] = None

class GapWithResources(BaseModel):
    skill: str
    category: str
    importance: str
    resources: List[LearningResource]

class GapAnalysisResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Keyword overlap score out of 100")
    matching_keywords: List[str]
    missing_keywords: List[str]
    skill_gaps: List[SkillGap]
    gaps_with_resources: List[GapWithResources]
    recommendations: List[str]
    matched_percentage: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ComprehensiveAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str
    user_id: Optional[str] = None

class ComprehensiveAnalysisResponse(BaseModel):
    ats_analysis: ATSCheckResponse
    gap_analysis: GapAnalysisResponse
    overall_recommendation: str
    action_plan: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
