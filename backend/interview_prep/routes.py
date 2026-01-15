from fastapi import APIRouter, HTTPException, Request, Body, UploadFile, File
from .schema import (
    InterviewPrepRequest, InterviewPrepResponse, MockInterviewSession,
    InterviewQuestion, InterviewFeedback, SubmitAnswerRequest
)
from .ai_service import AIInterviewService
from .voice_service import VoiceService
from datetime import datetime
import uuid
from typing import Dict, Any
import tempfile
import os

router = APIRouter()

# Store for interview sessions and answers (in production, use MongoDB)
interview_sessions = {}
interview_answers = {}

@router.post("/start-session-debug")
async def debug_payload(payload: Dict[Any, Any] = Body(...)):
    """Debug endpoint to see raw payload"""
    print(f"Raw payload received: {payload}")
    print(f"Payload keys: {payload.keys()}")
    print(f"Payload types: {[(k, type(v).__name__) for k, v in payload.items()]}")
    
    # Try to create the request object
    try:
        request = InterviewPrepRequest(**payload)
        return {"success": True, "parsed": True}
    except Exception as e:
        return {"success": False, "error": str(e), "payload": payload}

@router.post("/start-session", response_model=InterviewPrepResponse)
async def start_mock_interview(request: InterviewPrepRequest):
    """
    Interactive Interview Preparation - Start a mock interview session with AI-generated questions
    """
    try:
        print(f"Received request: user_id={request.user_id}, role={request.role}, skills={request.skills}, experience={request.experience_level}")
        
        # Generate personalized questions using AI
        questions = AIInterviewService.generate_questions(
            role=request.role,
            skills=request.skills,
            experience_level=request.experience_level,
            company=request.company,
            num_questions=10  # Generate 10 questions
        )
        
        session_id = str(uuid.uuid4())
        
        mock_session = MockInterviewSession(
            session_id=session_id,
            questions=questions,
            duration_minutes=45,
            created_at=datetime.utcnow()
        )
        
        # Store session for later use
        interview_sessions[session_id] = {
            'questions': questions,
            'role': request.role,
            'created_at': datetime.utcnow()
        }
        interview_answers[session_id] = []
        
        # Generate audio for first question if TTS is available
        first_question_audio = None
        if VoiceService.is_tts_available() and questions:
            first_question_audio = VoiceService.text_to_speech_base64(questions[0].question)
        
        response_data = InterviewPrepResponse(
            mock_session=mock_session,
            feedback=None,
            recommended_practice=[
                f"Review {request.role} role responsibilities and common challenges",
                "Practice STAR method for behavioral questions",
                f"Brush up on: {', '.join(request.skills[:3])}",
                "Prepare questions to ask the interviewer",
                "Research company culture and values" if request.company else "Prepare company-specific questions"
            ],
            timestamp=datetime.utcnow()
        )
        
        # Add audio if available
        result = response_data.dict()
        if first_question_audio:
            result['first_question_audio'] = first_question_audio
            result['tts_enabled'] = True
        else:
            result['tts_enabled'] = False
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit-feedback")
async def submit_interview_feedback(request: SubmitAnswerRequest):
    """
    Submit interview answer and get AI-driven feedback
    """
    try:
        # Get the session and question
        print(f"Looking for session: {request.session_id}")
        print(f"Available sessions: {list(interview_sessions.keys())}")
        
        if request.session_id not in interview_sessions:
            raise HTTPException(status_code=404, detail=f"Interview session not found: {request.session_id}")
        
        session = interview_sessions[request.session_id]
        questions = session['questions']
        
        # Find the specific question
        question_index = int(request.question_id) - 1  # question_id is 1-based
        if question_index < 0 or question_index >= len(questions):
            raise HTTPException(status_code=400, detail="Invalid question ID")
        
        question = questions[question_index]
        
        # Evaluate the answer using AI
        evaluation = AIInterviewService.evaluate_answer(
            question=question.question,
            question_type=question.type,
            user_answer=request.user_answer,
            expected_topics=question.hints
        )
        
        # Store the answer and evaluation
        interview_answers[request.session_id].append({
            'question_id': request.question_id,
            'question': question.question,
            'answer': request.user_answer,
            'evaluation': evaluation,
            'timestamp': datetime.utcnow()
        })
        
        return {
            "message": "Answer submitted successfully",
            "evaluation": evaluation,
            "progress": f"{len(interview_answers[request.session_id])}/{len(questions)}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{session_id}")
async def get_interview_results(session_id: str):
    """
    Get comprehensive feedback for completed interview
    """
    try:
        if session_id not in interview_answers or not interview_answers[session_id]:
            raise HTTPException(status_code=404, detail="No answers found for this session")
        
        answers = interview_answers[session_id]
        
        # Calculate overall scores
        total_technical = sum(a['evaluation']['technical_score'] for a in answers)
        total_communication = sum(a['evaluation']['communication_score'] for a in answers)
        total_completeness = sum(a['evaluation']['completeness_score'] for a in answers)
        total_confidence = sum(a['evaluation']['confidence_score'] for a in answers)
        
        num_answers = len(answers)
        
        # Aggregate strengths and weaknesses
        all_strengths = []
        all_weaknesses = []
        all_detailed_feedback = {}
        all_improvements = []
        
        for idx, answer in enumerate(answers, 1):
            eval_data = answer['evaluation']
            all_strengths.extend(eval_data['strengths'])
            all_weaknesses.extend(eval_data['weaknesses'])
            all_detailed_feedback[f"question_{idx}"] = eval_data['detailed_feedback']
            all_improvements.extend(eval_data['improvement_suggestions'])
        
        # Remove duplicates while preserving order
        unique_strengths = list(dict.fromkeys(all_strengths))[:5]
        unique_improvements = list(dict.fromkeys(all_weaknesses))[:5]
        unique_suggestions = list(dict.fromkeys(all_improvements))[:5]
        
        feedback = InterviewFeedback(
            session_id=session_id,
            overall_score=round((total_technical + total_communication + total_completeness + total_confidence) / (4 * num_answers), 1),
            communication_score=round(total_communication / num_answers, 1),
            technical_score=round(total_technical / num_answers, 1),
            confidence_score=round(total_confidence / num_answers, 1),
            strengths=unique_strengths,
            areas_for_improvement=unique_improvements,
            detailed_feedback=all_detailed_feedback
        )
        
        return {
            "feedback": feedback,
            "status": "completed",
            "total_questions": len(interview_sessions[session_id]['questions']),
            "answered_questions": num_answers,
            "improvement_suggestions": unique_suggestions
        }
    except HTTPException:
        raise
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

# ============== Voice Endpoints ==============

@router.post("/text-to-speech")
async def generate_speech(text: str = Body(..., embed=True)):
    """
    Generate speech audio from text using ElevenLabs
    Returns base64 encoded audio for web playback
    """
    try:
        if not VoiceService.is_tts_available():
            raise HTTPException(
                status_code=503,
                detail="Text-to-Speech service not configured. Add ELEVENLABS_API_KEY to .env"
            )
        
        audio_base64 = VoiceService.text_to_speech_base64(text)
        
        if not audio_base64:
            raise HTTPException(status_code=500, detail="Failed to generate speech")
        
        return {
            "audio_base64": audio_base64,
            "format": "mp3",
            "text": text
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speech-to-text")
async def transcribe_speech(audio: UploadFile = File(...)):
    """
    Transcribe speech audio to text using AssemblyAI
    Accepts audio files: mp3, wav, webm, m4a, etc.
    """
    try:
        if not VoiceService.is_stt_available():
            raise HTTPException(
                status_code=503,
                detail="Speech-to-Text service not configured. Add ASSEMBLYAI_API_KEY to .env"
            )
        
        # Read audio file
        audio_bytes = await audio.read()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe
            text = VoiceService.speech_to_text(temp_file_path)
            
            if not text:
                raise HTTPException(status_code=500, detail="Failed to transcribe audio")
            
            return {
                "text": text,
                "filename": audio.filename,
                "size_bytes": len(audio_bytes)
            }
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voice-features-status")
async def get_voice_features_status():
    """Check which voice features are available"""
    return {
        "text_to_speech": VoiceService.is_tts_available(),
        "speech_to_text": VoiceService.is_stt_available(),
        "message": "Both features are enabled!" if VoiceService.is_tts_available() and VoiceService.is_stt_available() else "Add API keys to enable voice features"
    }
