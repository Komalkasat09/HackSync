from pydantic import BaseModel
from typing import List, Optional

class ResumeAnalysisRequest(BaseModel):
    job_description: str

class ResumeAnalysisResponse(BaseModel):
    success: bool
    ats_score: float
    readiness_score: float
    tips: List[str]
    gaps: List[str]
    strengths: List[str]
    recommendations: List[str]
    match_percentage: float
    message: Optional[str] = None

