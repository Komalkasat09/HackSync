from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Reuse AIResumeData structure from ai_resume_builder
from ai_resume_builder.schema import AIResumeData

class CoverLetterSection(BaseModel):
    """Structured cover letter section"""
    heading: str
    content: str

class CoverLetter(BaseModel):
    """Well-structured cover letter in JSON format"""
    greeting: str  # e.g., "Dear Hiring Manager,"
    opening_paragraph: str  # Hook and position interest
    body_paragraphs: List[str]  # 2-3 paragraphs about qualifications, experiences
    closing_paragraph: str  # Call to action and availability
    signature: str  # e.g., "Sincerely, [Name]"

class ApplicationRequest(BaseModel):
    """Request to generate application materials"""
    job_id: str
    job_title: str
    company: str
    job_description: str

class ApplicationGenerateResponse(BaseModel):
    """Response with generated resume and cover letter"""
    success: bool
    tailored_resume: Optional[AIResumeData] = None
    cover_letter: Optional[CoverLetter] = None
    message: str

class SaveApplicationRequest(BaseModel):
    """Request to save an application"""
    job_id: str
    job_title: str
    company: str
    job_description: str
    tailored_resume: AIResumeData
    cover_letter: CoverLetter

class Application(BaseModel):
    """Saved application model"""
    user_id: str
    job_id: str
    job_title: str
    company: str
    job_description: str
    tailored_resume: AIResumeData
    cover_letter: CoverLetter
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    status: str = "draft"  # draft, submitted, archived

class ApplicationResponse(BaseModel):
    """Response with single application"""
    success: bool
    application: Optional[Application] = None
    message: str

class ApplicationsListResponse(BaseModel):
    """Response with list of user applications"""
    success: bool
    applications: List[Application]
    total: int
    message: str
