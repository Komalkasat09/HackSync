from pydantic import BaseModel
from typing import List, Optional

class PortfolioData(BaseModel):
    """Aggregated portfolio data from user profile"""
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    links: List[dict] = []
    skills: List[dict] = []
    experiences: List[dict] = []
    projects: List[dict] = []
    education: List[dict] = []
    interests: List[dict] = []

class PortfolioGenerateResponse(BaseModel):
    success: bool
    html_content: str
    message: str

class PortfolioDeployResponse(BaseModel):
    success: bool
    portfolio_url: str
    message: str
