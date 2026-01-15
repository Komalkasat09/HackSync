import httpx
from fastapi import APIRouter, HTTPException, Depends
from auth.routes import get_current_user
from config import settings
from .schema import (
    CreateVoiceInterviewRequest,
    CreateVoiceInterviewResponse,
    FetchTranscriptResponse,
    EvaluateInterviewRequest,
    EvaluateInterviewResponse
)
import base64
import json

router = APIRouter(prefix="/interview", tags=["interview"])

@router.post("/create-voice-interview", response_model=CreateVoiceInterviewResponse)
async def create_voice_interview(
    request: CreateVoiceInterviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new voice interview by calling n8n webhook
    """
    try:
        if not settings.N8N_CREATE_INTERVIEW_WEBHOOK:
            raise HTTPException(
                status_code=503,
                detail="Interview service not configured. Please contact administrator."
            )
        
        # Prepare payload for n8n
        payload = {
            "resume": request.resume,
            "jobDescription": request.job_description,
            "candidateName": request.candidate_name,
            "candidateEmail": request.candidate_email,
        }
        
        # Call n8n webhook
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.N8N_CREATE_INTERVIEW_WEBHOOK,
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to create interview: {response.text}"
                )
            
            data = response.json()
            
            if not data.get("success"):
                raise HTTPException(
                    status_code=500,
                    detail=data.get("message", "Failed to create interview")
                )
            
            return CreateVoiceInterviewResponse(
                success=True,
                assistant_id=data.get("assistantId"),
                interview_details=data.get("interviewDetails", {}),
                message="Interview created successfully"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating voice interview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create interview: {str(e)}"
        )


@router.get("/fetch-transcript", response_model=FetchTranscriptResponse)
async def fetch_transcript(
    call_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch transcript from Vapi API after interview ends.
    Can accept either a specific call_id or an assistant_id to fetch the most recent call.
    """
    try:
        # Validate call_id
        if not call_id or call_id == "undefined" or call_id == "null":
            print(f"❌ Invalid call_id received: {call_id}")
            raise HTTPException(
                status_code=400,
                detail="Invalid call ID. Please ensure the interview completed successfully."
            )
        
        if not settings.VAPI_API_KEY:
            print("❌ VAPI_API_KEY not configured")
            raise HTTPException(
                status_code=503,
                detail="Vapi service not configured. Please contact administrator."
            )
        
        print(f"📞 Fetching transcript for ID: {call_id}")
        
        call_data = None
        
        # Call Vapi API - try as call_id first
        async with httpx.AsyncClient() as client:
            # First try as direct call ID
            response = await client.get(
                f"https://api.vapi.ai/call/{call_id}",
                headers={"Authorization": f"Bearer {settings.VAPI_API_KEY}"}
            )
            
            print(f"🔍 Vapi API response status: {response.status_code}")
            
            if response.status_code == 200:
                call_data = response.json()
                print(f"✅ Found call by ID")
            elif response.status_code == 404:
                # Not found as call ID, try as assistant ID
                print(f"⚠️  Not found as call ID, trying as assistant ID...")
                response = await client.get(
                    f"https://api.vapi.ai/call?assistantId={call_id}&limit=5",
                    headers={"Authorization": f"Bearer {settings.VAPI_API_KEY}"}
                )
                
                if response.status_code == 200:
                    calls = response.json()
                    if isinstance(calls, list) and len(calls) > 0:
                        # Get most recent ended call
                        ended_call = next((c for c in calls if c.get("status") == "ended" or c.get("endedAt")), None)
                        call_data = ended_call or calls[0]
                        print(f"✅ Found {len(calls)} calls for assistant, using most recent")
                    else:
                        raise HTTPException(
                            status_code=404,
                            detail="No calls found for this assistant"
                        )
                else:
                    error_text = response.text
                    print(f"❌ Vapi API error: {error_text}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Failed to fetch call data from Vapi: {error_text}"
                    )
            else:
                error_text = response.text
                print(f"❌ Vapi API error: {error_text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch call data from Vapi: {error_text}"
                )
            
            # Verify we got call data
            if not call_data:
                raise HTTPException(
                    status_code=404,
                    detail="No call data found"
                )
            
            print(f"✅ Call data retrieved: status={call_data.get('status')}, messages={len(call_data.get('messages', []))}")
            
            # Extract Q&A pairs from messages - matching Lovable's logic exactly
            qaPairs = []
            messages = call_data.get("messages", [])
            
            # Filter to only get bot and user messages (not system)
            conversationMessages = [
                msg for msg in messages 
                if msg.get("role") in ["bot", "user", "assistant"]
            ]
            
            questionNumber = 0
            pendingQuestion = None
            pendingAnswer = []
            
            for i, msg in enumerate(conversationMessages):
                isBot = msg.get("role") in ["bot", "assistant"]
                isUser = msg.get("role") == "user"
                
                if isBot:
                    # If we have a pending question with answers, save it
                    if pendingQuestion and pendingAnswer:
                        questionNumber += 1
                        qaPairs.append({
                            "questionNumber": questionNumber,
                            "question": pendingQuestion,
                            "answer": " ".join(pendingAnswer),
                        })
                        pendingAnswer = []
                    # Set new pending question (combine consecutive bot messages)
                    if pendingQuestion and not pendingAnswer:
                        pendingQuestion += " " + msg.get("message", "")
                    else:
                        pendingQuestion = msg.get("message", "")
                elif isUser and pendingQuestion:
                    # Accumulate user answers
                    pendingAnswer.append(msg.get("message", ""))
            
            # Don't forget the last Q&A pair
            if pendingQuestion and pendingAnswer:
                questionNumber += 1
                qaPairs.append({
                    "questionNumber": questionNumber,
                    "question": pendingQuestion,
                    "answer": " ".join(pendingAnswer),
                })
            
            print(f"📝 Extracted {len(qaPairs)} Q&A pairs")
            
            # Extract metadata
            candidateName = call_data.get("customer", {}).get("name", "Unknown")
            candidateEmail = call_data.get("customer", {}).get("email", "unknown@email.com")
            
            # Calculate duration (only once the call has ended)
            duration = None
            durationFormatted = None
            
            startedAt = call_data.get("startedAt")
            endedAt = call_data.get("endedAt")
            
            if startedAt and endedAt:
                try:
                    from datetime import datetime
                    startTime = datetime.fromisoformat(startedAt.replace('Z', '+00:00'))
                    endTime = datetime.fromisoformat(endedAt.replace('Z', '+00:00'))
                    duration = int((endTime - startTime).total_seconds())
                    durationFormatted = f"{duration // 60}:{(duration % 60):02d}"
                except Exception as e:
                    print(f"⚠️  Duration calculation error: {e}")
            
            return FetchTranscriptResponse(
                success=True,
                qaPairs=qaPairs,
                messages=messages,
                candidateName=candidateName,
                candidateEmail=candidateEmail,
                duration=duration,
                durationFormatted=durationFormatted,
                status=call_data.get("status", "unknown"),
                callId=call_data.get("id"),
                message="Transcript fetched successfully"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching transcript: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch transcript: {str(e)}"
        )


@router.post("/evaluate-interview", response_model=EvaluateInterviewResponse)
async def evaluate_interview(
    request: EvaluateInterviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Evaluate interview by sending Q&A pairs to n8n webhook
    """
    try:
        if not settings.N8N_EVALUATE_INTERVIEW_WEBHOOK:
            raise HTTPException(
                status_code=503,
                detail="Evaluation service not configured. Please contact administrator."
            )
        
        # Convert qaPairs to n8n expected format (q_a with q1/a1, q2/a2, etc.)
        q_a_formatted = []
        for qa in request.qaPairs:
            qNum = qa.get("questionNumber", 1)
            q_a_formatted.append({
                f"q{qNum}": qa.get("question", ""),
                f"a{qNum}": qa.get("answer", ""),
                "difficulty": qa.get("difficulty", "medium")
            })
        
        # Prepare payload for n8n - use format expected by webhook
        payload = {
            "q_a": q_a_formatted,
            "name": request.candidateName,
            "Email": request.candidateEmail,
        }
        
        print(f"📤 Sending {len(q_a_formatted)} Q&A pairs for evaluation to n8n webhook")
        
        # Call n8n evaluation webhook
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                settings.N8N_EVALUATE_INTERVIEW_WEBHOOK,
                json=payload
            )
            
            print(f"📥 n8n response status: {response.status_code}")
            
            if response.status_code != 200:
                error_text = response.text
                print(f"❌ n8n webhook error: {error_text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to evaluate interview: {error_text}"
                )
            
            data = response.json()
            print(f"✅ Evaluation received from n8n")
            
            # n8n returns array with single object
            if isinstance(data, list) and len(data) > 0:
                data = data[0]
            
            structured_report = data.get("structuredReport", {})
            metrics = data.get("metrics", {})
            
            # Transform n8n response to match frontend expectations
            report = {
                "evaluations": structured_report.get("evaluations", []),
                "overallAssessment": structured_report.get("overallAssessment", {}),
                "recommendation": structured_report.get("recommendation", "N/A"),
                "summaryStrengths": structured_report.get("summaryStrengths", []),
                "summaryWeaknesses": structured_report.get("summaryWeaknesses", []),
                "interviewCompleteness": structured_report.get("interviewCompleteness", "unknown"),
                "questionsAnswered": structured_report.get("questionsAnswered", 0),
                "additionalNotes": structured_report.get("additionalNotes", ""),
                "metrics": metrics,
                "textReport": data.get("textReport", "")
            }
            
            return EvaluateInterviewResponse(
                success=True,
                report=report,
                metrics=metrics,
                recommendation=structured_report.get("recommendation", "N/A"),
                message="Interview evaluated successfully"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error evaluating interview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate interview: {str(e)}"
        )
