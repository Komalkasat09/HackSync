from fastapi import APIRouter, HTTPException
from .schema import (
    InterviewPrepRequest, InterviewPrepResponse, MockInterviewSession,
    InterviewQuestion, InterviewFeedback
)
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/start-session", response_model=InterviewPrepResponse)
async def start_mock_interview(request: InterviewPrepRequest):
    """
    Interactive Interview Preparation - Start a mock interview session
    """
    try:
        # Dummy questions for now
        dummy_questions = [
            InterviewQuestion(
                question="Tell me about yourself and your experience",
                type="behavioral",
                difficulty="easy",
                hints=["Structure using present-past-future", "Focus on relevant experience"],
                sample_answer="I'm currently..."
            ),
            InterviewQuestion(
                question="Explain the difference between REST and GraphQL",
                type="technical",
                difficulty="medium",
                hints=["Discuss query flexibility", "Compare data fetching approaches"],
                sample_answer=None
            ),
            InterviewQuestion(
                question="Describe a challenging project you worked on",
                type="behavioral",
                difficulty="medium",
                hints=["Use STAR method", "Highlight problem-solving skills"],
                sample_answer=None
            )
        ]
        
        mock_session = MockInterviewSession(
            session_id=str(uuid.uuid4()),
            questions=dummy_questions,
            duration_minutes=45,
            created_at=datetime.utcnow()
        )
        
        return InterviewPrepResponse(
            mock_session=mock_session,
            feedback=None,
            recommended_practice=[
                "Practice STAR method for behavioral questions",
                "Review system design fundamentals",
                "Prepare questions to ask the interviewer"
            ],
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit-feedback")
async def submit_interview_feedback(session_id: str, answers: dict):
    """
    Submit interview answers and get AI-driven feedback
    """
    try:
        feedback = InterviewFeedback(
            session_id=session_id,
            overall_score=8.2,
            communication_score=8.5,
            technical_score=7.8,
            confidence_score=8.4,
            strengths=[
                "Clear communication",
                "Good technical knowledge",
                "Structured answers"
            ],
            areas_for_improvement=[
                "Provide more specific examples",
                "Practice time management",
                "Elaborate on problem-solving approach"
            ],
            detailed_feedback={
                "question_1": "Well structured, good use of examples",
                "question_2": "Correct answer but could provide more depth",
                "question_3": "Excellent use of STAR method"
            }
        )
        
        return {"feedback": feedback, "status": "completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/common-questions/{role}")
async def get_common_questions(role: str):
    """
    Get common interview questions for a specific role
    """
    return {
        "role": role,
        "questions": [
            "What interests you about this role?",
            "Describe your experience with [key skill]",
            "How do you handle tight deadlines?"
        ]
    }
