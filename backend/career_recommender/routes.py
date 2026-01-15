from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from .schema import (
    CareerRecommendationRequest, 
    CareerRecommendationResponse, 
    CareerPath,
    ChatRequest,
    ChatResponse,
    ChatMessage,
    MessageRole,
    ConversationListResponse,
    Conversation
)
from datetime import datetime
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import uuid
from .career_counselor import career_counselor

router = APIRouter()

# Sync MongoDB client for synchronous operations
mongo_client = MongoClient(os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
db_sync = mongo_client["skillsphere"]  # Changed from hacksync to skillsphere
conversations_collection = db_sync["conversations"]

# Async MongoDB client for async operations
async_mongo_client = AsyncIOMotorClient(os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI", "mongodb://localhost:27017/"))
db_async = async_mongo_client["skillsphere"]  # Changed from hacksync to skillsphere
user_profiles_collection = db_async["user_profiles"]

@router.post("/recommend", response_model=CareerRecommendationResponse)
async def get_career_recommendations(request: CareerRecommendationRequest):
    """
    AI Career Path Recommender - Suggests suitable career paths based on user profile
    Uses Tavily web scraping + Gemini AI to provide real-time career recommendations
    """
    try:
        from .tavily_service import tavily_service
        
        # Search for trending careers based on user profile
        tavily_data = await tavily_service.search_career_trends(
            skills=request.skills,
            interests=request.interests
        )
        
        # Build prompt for Gemini to analyze and structure the data
        prompt = f"""
Analyze the following web-scraped job market data and user profile, then provide 3-5 personalized career recommendations.

USER PROFILE:
- Skills: {', '.join(request.skills)}
- Interests: {', '.join(request.interests)}
- Education: {request.education}
- Experience: {request.experience_years} years

LATEST JOB MARKET DATA (2026):
{chr(10).join([f"- {result.get('title', '')}: {result.get('content', '')[:200]}" for result in tavily_data.get('results', [])[:8]])}

For each career recommendation, provide:
1. Career Title
2. Match Score (0-1, how well it fits the user)
3. Description (2-3 sentences)
4. Required Skills (list 4-6 key skills)
5. Trending Industries (list 3-4 industries)
6. Average Salary Range
7. Growth Outlook

Return ONLY valid JSON in this exact format:
{{
  "recommendations": [
    {{
      "career_title": "string",
      "match_score": 0.95,
      "description": "string",
      "required_skills": ["skill1", "skill2"],
      "trending_industries": ["industry1", "industry2"],
      "average_salary": "$XX,000 - $XX,000",
      "growth_outlook": "string"
    }}
  ]
}}"""

        # Get AI analysis
        if career_counselor.model:
            response = await career_counselor.model.generate_content_async(prompt)
            
            # Parse JSON response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response.text)
            if json_match:
                parsed_data = json.loads(json_match.group())
                recommendations = [CareerPath(**rec) for rec in parsed_data.get("recommendations", [])]
            else:
                raise ValueError("Failed to parse AI response")
        else:
            # Fallback: Return basic recommendations from Tavily data
            recommendations = []
            for idx, result in enumerate(tavily_data.get("results", [])[:3], 1):
                recommendations.append(CareerPath(
                    career_title=result.get("title", f"Career Option {idx}"),
                    match_score=0.8,
                    description=result.get("content", "No description available")[:150],
                    required_skills=request.skills[:4],
                    trending_industries=["Technology", "Innovation"],
                    average_salary="Market Rate",
                    growth_outlook="Based on current trends"
                ))
        
        return CareerRecommendationResponse(
            recommendations=recommendations,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        print(f"Error in career recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends")
async def get_career_trends():
    """
    Get current career trends and in-demand skills
    """
    return {
        "trending_careers": ["AI/ML Engineer", "Cloud Architect", "Cybersecurity Analyst"],
        "hot_skills": ["Python", "AWS", "React", "Machine Learning", "Docker"],
        "growing_industries": ["AI/ML", "Cybersecurity", "Cloud Computing", "Data Science"]
    }

# ============= CHAT ENDPOINTS =============

@router.post("/chat", response_model=ChatResponse)
async def chat_message(request: ChatRequest):
    """
    Send a message and get AI counseling response
    """
    try:
        # Get or create conversation
        if request.conversation_id:
            conversation_doc = conversations_collection.find_one({"conversation_id": request.conversation_id})
            if not conversation_doc:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation
            conversation_id = str(uuid.uuid4())
            conversation_doc = {
                "conversation_id": conversation_id,
                "user_id": request.user_id,
                "title": request.message[:50] + "..." if len(request.message) > 50 else request.message,
                "messages": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            conversations_collection.insert_one(conversation_doc)
        
        # Get user profile for context from user_profiles collection
        user_profile_doc = await user_profiles_collection.find_one({"user_id": request.user_id})
        
        # Convert to dict format expected by career_counselor
        user_profile = None
        if user_profile_doc:
            # Extract skill names (skills are stored as {id, name} objects)
            skills = [s.get("name") if isinstance(s, dict) else s for s in user_profile_doc.get("skills", [])]
            interests = [i.get("name") if isinstance(i, dict) else i for i in user_profile_doc.get("interests", [])]
            
            user_profile = {
                "skills": skills,
                "interests": interests,
                "education": user_profile_doc.get("education", []),
                "experience_years": len(user_profile_doc.get("experiences", [])),
                "experiences": user_profile_doc.get("experiences", []),
                "projects": user_profile_doc.get("projects", [])
            }
            print(f"✓ Loaded user profile: {len(skills)} skills ({', '.join(skills[:5])}...), {len(interests)} interests")
        else:
            print(f"⚠ No profile found for user_id: {request.user_id}")
        
        # Add user message to conversation
        user_message = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow().isoformat(),
            "attachments": [att.model_dump() for att in request.attachments] if request.attachments else []
        }
        
        conversations_collection.update_one(
            {"conversation_id": conversation_doc["conversation_id"]},
            {
                "$push": {"messages": user_message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Generate AI response
        ai_response_text, references = await career_counselor.generate_response(
            user_message=request.message,
            user_profile=user_profile,
            conversation_history=conversation_doc.get("messages", []),
            attachments=[att.model_dump() for att in request.attachments] if request.attachments else None
        )
        
        # Add AI message to conversation
        ai_message = {
            "role": "assistant",
            "content": ai_response_text,
            "timestamp": datetime.utcnow().isoformat(),
            "references": references,
            "metadata": {}
        }
        
        conversations_collection.update_one(
            {"conversation_id": conversation_doc["conversation_id"]},
            {
                "$push": {"messages": ai_message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return ChatResponse(
            conversation_id=conversation_doc["conversation_id"],
            message=ChatMessage(**ai_message)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_message_stream(request: ChatRequest):
    """
    Send a message and get streaming AI response (Server-Sent Events)
    """
    async def event_generator():
        try:
            # Get or create conversation
            if request.conversation_id:
                conversation_doc = conversations_collection.find_one({"conversation_id": request.conversation_id})
                if not conversation_doc:
                    yield f"data: {json.dumps({'error': 'Conversation not found'})}\n\n"
                    return
            else:
                conversation_id = str(uuid.uuid4())
                conversation_doc = {
                    "conversation_id": conversation_id,
                    "user_id": request.user_id,
                    "title": request.message[:50] + "..." if len(request.message) > 50 else request.message,
                    "messages": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                conversations_collection.insert_one(conversation_doc)
                
                # Send conversation ID first
                yield f"data: {json.dumps({'type': 'conversation_id', 'conversation_id': conversation_id})}\n\n"
            
            # Get user profile from user_profiles collection
            user_profile_doc = await user_profiles_collection.find_one({"user_id": request.user_id})
            
            # Convert to dict format expected by career_counselor
            user_profile = None
            if user_profile_doc:
                # Extract skill names (skills are stored as {id, name} objects)
                skills = [s.get("name") if isinstance(s, dict) else s for s in user_profile_doc.get("skills", [])]
                interests = [i.get("name") if isinstance(i, dict) else i for i in user_profile_doc.get("interests", [])]
                
                user_profile = {
                    "skills": skills,
                    "interests": interests,
                    "education": user_profile_doc.get("education", []),
                    "experience_years": len(user_profile_doc.get("experiences", [])),
                    "experiences": user_profile_doc.get("experiences", []),
                    "projects": user_profile_doc.get("projects", [])
                }
                print(f"✓ Loaded profile: {len(skills)} skills, {len(interests)} interests")
            else:
                print(f"⚠ No profile found for user_id: {request.user_id}")
            
            # Add user message
            user_message = {
                "role": "user",
                "content": request.message,
                "timestamp": datetime.utcnow().isoformat(),
                "attachments": [att.model_dump() for att in request.attachments] if request.attachments else []
            }
            
            conversations_collection.update_one(
                {"conversation_id": conversation_doc["conversation_id"]},
                {
                    "$push": {"messages": user_message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            # Stream AI response
            full_response = ""
            references_sent = False
            saved_references = []  # Store references for saving to DB
            
            async for chunk, references in career_counselor.generate_streaming_response(
                user_message=request.message,
                user_profile=user_profile,
                conversation_history=conversation_doc.get("messages", []),
                attachments=[att.model_dump() for att in request.attachments] if request.attachments else None
            ):
                full_response += chunk
                
                # Send text chunk
                yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"
                
                # Send references (only once with first chunk)
                if references and not references_sent:
                    saved_references = references  # Save for DB storage
                    yield f"data: {json.dumps({'type': 'references', 'references': references})}\n\n"
                    references_sent = True
            
            # Save complete AI message to conversation
            ai_message = {
                "role": "assistant",
                "content": full_response,
                "timestamp": datetime.utcnow().isoformat(),
                "references": saved_references,  # Use saved references
                "metadata": {}
            }
            
            conversations_collection.update_one(
                {"conversation_id": conversation_doc["conversation_id"]},
                {
                    "$push": {"messages": ai_message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/conversations/{user_id}", response_model=ConversationListResponse)
async def get_user_conversations(user_id: str):
    """
    Get all conversations for a user (for sidebar)
    """
    try:
        conversations = list(
            conversations_collection.find(
                {"user_id": user_id},
                {
                    "conversation_id": 1,
                    "title": 1,
                    "updated_at": 1,
                    "created_at": 1,
                    "_id": 0
                }
            ).sort("updated_at", -1)
        )
        
        # Format timestamps (handle None values)
        for conv in conversations:
            if conv.get("updated_at"):
                conv["updated_at"] = conv["updated_at"].isoformat() if hasattr(conv["updated_at"], "isoformat") else str(conv["updated_at"])
            else:
                conv["updated_at"] = datetime.utcnow().isoformat()
                
            if conv.get("created_at"):
                conv["created_at"] = conv["created_at"].isoformat() if hasattr(conv["created_at"], "isoformat") else str(conv["created_at"])
            else:
                conv["created_at"] = datetime.utcnow().isoformat()
        
        return ConversationListResponse(
            conversations=conversations,
            total=len(conversations)
        )
        
    except Exception as e:
        print(f"Error fetching conversations: {str(e)}")
        # Return empty list instead of error
        return ConversationListResponse(
            conversations=[],
            total=0
        )
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations/{user_id}/{conversation_id}")
async def get_conversation(user_id: str, conversation_id: str):
    """
    Get full conversation with all messages
    """
    try:
        conversation = conversations_collection.find_one(
            {"conversation_id": conversation_id, "user_id": user_id},
            {"_id": 0}
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Format timestamps (handle None values)
        if conversation.get("created_at"):
            conversation["created_at"] = conversation["created_at"].isoformat() if hasattr(conversation["created_at"], "isoformat") else str(conversation["created_at"])
        if conversation.get("updated_at"):
            conversation["updated_at"] = conversation["updated_at"].isoformat() if hasattr(conversation["updated_at"], "isoformat") else str(conversation["updated_at"])
        
        return conversation
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversations/{user_id}/{conversation_id}")
async def delete_conversation(user_id: str, conversation_id: str):
    """
    Delete a conversation
    """
    try:
        result = conversations_collection.delete_one({
            "conversation_id": conversation_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

