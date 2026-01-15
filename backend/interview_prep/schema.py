from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
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

# Voice Interview Schemas
class CreateVoiceInterviewRequest(BaseModel):
    candidate_name: str
    candidate_email: str
    job_description: str
    resume: str  # base64 encoded

class CreateVoiceInterviewResponse(BaseModel):
    success: bool
    assistant_id: str
    interview_details: Dict[str, Any]
    message: str

class FetchTranscriptResponse(BaseModel):
    success: bool
    qaPairs: List[Dict[str, Any]]  # Changed from q_a to qaPairs
    messages: Optional[List[Dict[str, Any]]] = None
    candidateName: str  # Changed from candidate_name
    candidateEmail: str  # Changed from candidate_email
    duration: Optional[int] = None  # Changed from duration_seconds
    durationFormatted: Optional[str] = None
    status: Optional[str] = None
    callId: Optional[str] = None
    message: str

class EvaluateInterviewRequest(BaseModel):
    qaPairs: List[Dict[str, Any]]  # Changed from q_a
    candidateName: str  # Changed from candidate_name
    candidateEmail: str  # Changed from candidate_email

class EvaluateInterviewResponse(BaseModel):
    success: bool
    report: Dict[str, Any]
    metrics: Dict[str, Any]
    recommendation: str
    message: str

