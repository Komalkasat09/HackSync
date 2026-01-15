from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Job(BaseModel):
    """Job posting model"""
    job_id: str = Field(..., description="Unique job identifier")
    title: str
    company: str
    location: str
    description: str
    required_skills: List[str] = Field(default_factory=list)
    url: str
    salary: Optional[str] = None
    job_type: Optional[str] = None  # full-time, part-time, internship, contract
    experience_level: Optional[str] = None  # entry, mid, senior
    source: str  # linkedin, indeed, internshala
    posted_date: Optional[str] = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)

class JobMatchResponse(BaseModel):
    """Job with relevance score"""
    job: Job
    match_score: float = Field(..., ge=0, le=100, description="Percentage match to user skills")
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)

class RelevantJobsResponse(BaseModel):
    """Response for relevant jobs endpoint"""
    success: bool
    jobs: List[JobMatchResponse]
    total_jobs: int
    user_skills: List[str]
    message: str

class AllJobsResponse(BaseModel):
    """Response for all jobs endpoint"""
    success: bool
    jobs: List[Job]
    total: int
    page: int
    limit: int

class SavedJob(BaseModel):
    """User's saved/applied job"""
    user_id: str
    job_id: str
    status: str  # saved, applied, interviewing, rejected, accepted
    saved_at: datetime = Field(default_factory=datetime.utcnow)
    applied_at: Optional[datetime] = None
    notes: Optional[str] = None

class SaveJobRequest(BaseModel):
    """Request to save/apply to a job"""
    job_id: str
    status: str = "saved"
    notes: Optional[str] = None

class JobScraperStats(BaseModel):
    """Statistics from job scraping"""
    total_scraped: int
    linkedin_jobs: int
    indeed_jobs: int
    internshala_jobs: int
    last_scrape: datetime
    next_scrape: datetime
