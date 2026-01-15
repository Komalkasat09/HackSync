from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class TemplateType(str, Enum):
    MODERN = "modern"
    CREATIVE = "creative"
    PROFESSIONAL = "professional"
    DEVELOPER = "developer"

class SocialLinks(BaseModel):
    github: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None
    email: Optional[EmailStr] = None

class PersonalInfo(BaseModel):
    full_name: str
    title: str
    bio: str
    location: Optional[str] = None
    phone: Optional[str] = None
    email: EmailStr
    social_links: SocialLinks
    profile_image: Optional[str] = None

class GitHubRepo(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    stars: int
    forks: int
    language: Optional[str] = None
    topics: List[str] = []
    homepage: Optional[str] = None

class GitHubProfile(BaseModel):
    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: str
    followers: int
    following: int
    public_repos: int
    repositories: List[GitHubRepo] = []
    top_languages: Dict[str, int] = {}
    total_stars: int = 0
    total_contributions: int = 0

class WorkExperience(BaseModel):
    company: str
    position: str
    location: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    current: bool = False
    description: str
    achievements: List[str] = []

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    start_date: str
    end_date: Optional[str] = None
    gpa: Optional[str] = None
    description: Optional[str] = None

class Project(BaseModel):
    name: str
    description: str
    technologies: List[str]
    url: Optional[str] = None
    github_url: Optional[str] = None
    image: Optional[str] = None
    highlights: List[str] = []

class Skill(BaseModel):
    name: str
    level: Optional[str] = None  # beginner, intermediate, advanced, expert
    category: Optional[str] = None  # programming, framework, tool, soft-skill

class Certification(BaseModel):
    name: str
    issuer: str
    date: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class LinkedInProfile(BaseModel):
    profile_url: str
    headline: Optional[str] = None
    summary: Optional[str] = None
    experience: List[WorkExperience] = []
    education: List[Education] = []
    skills: List[str] = []
    certifications: List[Certification] = []

class ResumeData(BaseModel):
    personal_info: PersonalInfo
    summary: Optional[str] = None
    experience: List[WorkExperience] = []
    education: List[Education] = []
    skills: List[Skill] = []
    projects: List[Project] = []
    certifications: List[Certification] = []

class PortfolioConfig(BaseModel):
    template: TemplateType
    primary_color: str = "#3B82F6"
    secondary_color: str = "#1E40AF"
    font_family: str = "Inter"
    dark_mode: bool = False
    show_github: bool = True
    show_experience: bool = True
    show_education: bool = True
    show_projects: bool = True
    show_skills: bool = True
    show_certifications: bool = True

class Portfolio(BaseModel):
    id: str
    user_id: Optional[str] = None
    personal_info: PersonalInfo
    github_profile: Optional[GitHubProfile] = None
    linkedin_profile: Optional[LinkedInProfile] = None
    resume_data: Optional[ResumeData] = None
    projects: List[Project] = []
    skills: List[Skill] = []
    config: PortfolioConfig
    created_at: datetime
    updated_at: datetime

class PortfolioCreate(BaseModel):
    personal_info: PersonalInfo
    config: Optional[PortfolioConfig] = None

class PortfolioUpdate(BaseModel):
    personal_info: Optional[PersonalInfo] = None
    github_profile: Optional[GitHubProfile] = None
    linkedin_profile: Optional[LinkedInProfile] = None
    resume_data: Optional[ResumeData] = None
    projects: Optional[List[Project]] = None
    skills: Optional[List[Skill]] = None
    config: Optional[PortfolioConfig] = None

class GitHubFetchRequest(BaseModel):
    username: str
    include_repos: bool = True
    max_repos: int = 10

class ExportFormat(str, Enum):
    HTML = "html"
    ZIP = "zip"
    PDF = "pdf"

class ExportRequest(BaseModel):
    portfolio_id: str
    format: ExportFormat
    include_assets: bool = True
