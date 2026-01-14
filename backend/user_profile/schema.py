from pydantic import BaseModel
from typing import List, Optional

class Skill(BaseModel):
    id: str
    name: str

class Experience(BaseModel):
    id: str
    title: str
    company: str
    duration: str
    description: str

class Project(BaseModel):
    id: str
    name: str
    description: str
    technologies: str

class Education(BaseModel):
    id: str
    degree: str
    institution: str
    year: str

class Interest(BaseModel):
    id: str
    name: str

class UserProfile(BaseModel):
    skills: List[Skill] = []
    experiences: List[Experience] = []
    projects: List[Project] = []
    education: List[Education] = []
    interests: List[Interest] = []

class UserProfileUpdate(BaseModel):
    skills: Optional[List[Skill]] = None
    experiences: Optional[List[Experience]] = None
    projects: Optional[List[Project]] = None
    education: Optional[List[Education]] = None
    interests: Optional[List[Interest]] = None

class UserProfileResponse(BaseModel):
    user_id: str
    skills: List[Skill]
    experiences: List[Experience]
    projects: List[Project]
    education: List[Education]
    interests: List[Interest]
    has_resume: bool
