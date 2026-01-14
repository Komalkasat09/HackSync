from pydantic import BaseModel
from typing import List, Optional

class Skill(BaseModel):
    id: str
    name: str

class Link(BaseModel):
    id: str
    type: str  # github, linkedin, website, phone, email, portfolio
    value: str

class Experience(BaseModel):
    id: str
    title: str
    company: str
    startDate: str
    endDate: str
    currentlyWorking: bool
    description: str

class Project(BaseModel):
    id: str
    name: str
    description: str
    technologies: str
    link: Optional[str] = None

class Education(BaseModel):
    id: str
    degree: str
    institution: str
    year: str

class Interest(BaseModel):
    id: str
    name: str

class UserProfile(BaseModel):
    location: Optional[str] = None
    links: List[Link] = []
    skills: List[Skill] = []
    experiences: List[Experience] = []
    projects: List[Project] = []
    education: List[Education] = []
    interests: List[Interest] = []

class UserProfileUpdate(BaseModel):
    location: Optional[str] = None
    links: Optional[List[Link]] = None
    skills: Optional[List[Skill]] = None
    experiences: Optional[List[Experience]] = None
    projects: Optional[List[Project]] = None
    education: Optional[List[Education]] = None
    interests: Optional[List[Interest]] = None

class UserProfileResponse(BaseModel):
    user_id: str
    location: Optional[str] = None
    links: List[Link]
    skills: List[Skill]
    experiences: List[Experience]
    projects: List[Project]
    education: List[Education]
    interests: List[Interest]
    has_resume: bool
