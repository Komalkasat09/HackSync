from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class InterviewPrepRequest(BaseModel):
    user_id: str
    role: str
    company: Optional[str] = None
    experience_level: str
    skills: List[str]

class InterviewQuestion(BaseModel):
    question: str
    type: str  # technical, behavioral, situational
    difficulty: str
    hints: List[str]
    sample_answer: Optional[str] = None

class MockInterviewSession(BaseModel):
    session_id: str
    questions: List[InterviewQuestion]
    duration_minutes: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewFeedback(BaseModel):
    session_id: str
    overall_score: float
    communication_score: float
    technical_score: float
    confidence_score: float
    strengths: List[str]
    areas_for_improvement: List[str]
    detailed_feedback: dict

class InterviewPrepResponse(BaseModel):
    mock_session: Optional[MockInterviewSession] = None
    feedback: Optional[InterviewFeedback] = None
    recommended_practice: List[str]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    user_answer: str
    time_taken: Optional[int] = None
