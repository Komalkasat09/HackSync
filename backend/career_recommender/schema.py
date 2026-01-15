from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

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

# ============= CHAT & CONVERSATION SCHEMAS =============

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class TavilyReference(BaseModel):
    id: int
    title: str
    url: str
    snippet: str
    score: float

class ChatMessageAttachment(BaseModel):
    type: str  # "image", "file", "document"
    url: Optional[str] = None
    filename: Optional[str] = None
    mime_type: Optional[str] = None
    content: Optional[str] = None  # For inline content

class ChatMessage(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    references: Optional[List[TavilyReference]] = []
    attachments: Optional[List[ChatMessageAttachment]] = []
    metadata: Optional[Dict[str, Any]] = {}

class Conversation(BaseModel):
    conversation_id: str
    user_id: str
    title: str = "New Conversation"
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = {}

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None  # None for new conversation
    user_id: str
    message: str
    attachments: Optional[List[ChatMessageAttachment]] = []

class ChatResponse(BaseModel):
    conversation_id: str
    message: ChatMessage
    is_streaming: bool = False

class ConversationListResponse(BaseModel):
    conversations: List[Dict[str, Any]]  # Simplified conversation metadata
    total: int
