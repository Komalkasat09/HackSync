from pydantic import BaseModel
from typing import List, Optional

class PersonalInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None

class Skill(BaseModel):
    category: str
    skills: List[str]

class Experience(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: str
    end_date: str
    description: List[str]

class Project(BaseModel):
    name: str
    description: str
    technologies: List[str]
    link: Optional[str] = None
    highlights: List[str]

class Education(BaseModel):
    degree: str
    institution: str
    location: Optional[str] = None
    graduation_date: str
    gpa: Optional[str] = None
    achievements: Optional[List[str]] = None

class Certification(BaseModel):
    name: str
    issuer: str
    date: str
    credential_id: Optional[str] = None

class AIResumeData(BaseModel):
    personal_info: PersonalInfo
    summary: str
    skills: List[Skill]
    experience: List[Experience]
    projects: List[Project]
    education: List[Education]
    certifications: Optional[List[Certification]] = None
    awards: Optional[List[str]] = None
    languages: Optional[List[str]] = None

class ResumeAnalysisResponse(BaseModel):
    success: bool
    data: Optional[AIResumeData] = None
    message: str
