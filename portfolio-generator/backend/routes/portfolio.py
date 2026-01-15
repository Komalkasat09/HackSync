from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from models.schemas import (
    Portfolio, PortfolioCreate, PortfolioUpdate, GitHubFetchRequest,
    GitHubProfile, ResumeData, PersonalInfo, PortfolioConfig, TemplateType
)
from services.github_service import github_service
from services.resume_parser import resume_parser
from services.generator_service import portfolio_generator
from typing import Optional
import os
import uuid
from datetime import datetime
import json

router = APIRouter()

@router.post("/create", response_model=Portfolio)
async def create_portfolio(portfolio_create: PortfolioCreate):
    """Create a new portfolio"""
    try:
        # Create portfolio object
        portfolio = Portfolio(
            id=str(uuid.uuid4()),
            personal_info=portfolio_create.personal_info,
            config=portfolio_create.config or PortfolioConfig(template=TemplateType.MODERN),
            projects=[],
            skills=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Save portfolio
        saved_portfolio = await portfolio_generator.create_portfolio(portfolio)
        
        return saved_portfolio
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{portfolio_id}", response_model=Portfolio)
async def get_portfolio(portfolio_id: str):
    """Get portfolio by ID"""
    try:
        portfolio = await portfolio_generator.load_portfolio(portfolio_id)
        return portfolio
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{portfolio_id}", response_model=Portfolio)
async def update_portfolio(portfolio_id: str, portfolio_update: PortfolioUpdate):
    """Update portfolio"""
    try:
        # Load existing portfolio
        portfolio = await portfolio_generator.load_portfolio(portfolio_id)
        
        # Update fields
        if portfolio_update.personal_info:
            portfolio.personal_info = portfolio_update.personal_info
        if portfolio_update.github_profile:
            portfolio.github_profile = portfolio_update.github_profile
        if portfolio_update.linkedin_profile:
            portfolio.linkedin_profile = portfolio_update.linkedin_profile
        if portfolio_update.resume_data:
            portfolio.resume_data = portfolio_update.resume_data
        if portfolio_update.projects:
            portfolio.projects = portfolio_update.projects
        if portfolio_update.skills:
            portfolio.skills = portfolio_update.skills
        if portfolio_update.config:
            portfolio.config = portfolio_update.config
        
        portfolio.updated_at = datetime.now()
        
        # Save updated portfolio
        await portfolio_generator.save_portfolio(portfolio)
        
        return portfolio
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{portfolio_id}")
async def delete_portfolio(portfolio_id: str):
    """Delete portfolio"""
    try:
        await portfolio_generator.delete_portfolio(portfolio_id)
        return {"message": "Portfolio deleted successfully"}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_portfolios():
    """List all portfolios"""
    try:
        portfolios = await portfolio_generator.list_portfolios()
        return portfolios
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{portfolio_id}/github", response_model=GitHubProfile)
async def fetch_github_profile(portfolio_id: str, request: GitHubFetchRequest):
    """Fetch and add GitHub profile to portfolio"""
    try:
        # Fetch GitHub profile
        github_profile = await github_service.fetch_profile(
            request.username,
            max_repos=request.max_repos
        )
        
        # Load portfolio
        portfolio = await portfolio_generator.load_portfolio(portfolio_id)
        
        # Update GitHub profile
        portfolio.github_profile = github_profile
        portfolio.updated_at = datetime.now()
        
        # Save portfolio
        await portfolio_generator.save_portfolio(portfolio)
        
        return github_profile
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{portfolio_id}/resume/upload")
async def upload_resume(
    portfolio_id: str,
    file: UploadFile = File(...),
    format: Optional[str] = Form("pdf")
):
    """Upload and parse resume file"""
    try:
        # Load portfolio
        portfolio = await portfolio_generator.load_portfolio(portfolio_id)
        
        # Save uploaded file
        upload_dir = "data/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, f"{portfolio_id}_{file.filename}")
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Parse resume based on format
        if format == "json":
            resume_data = await resume_parser.parse_json(file_path)
        elif format == "pdf":
            # Extract text from PDF
            text = await resume_parser.parse_pdf(file_path)
            # Extract structured data
            extracted_data = await resume_parser.extract_structured_data_from_text(text)
            # Convert to ResumeData (simplified)
            resume_data = await resume_parser.parse_json_from_dict(extracted_data)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        # Update portfolio
        portfolio.resume_data = resume_data
        portfolio.updated_at = datetime.now()
        
        # Save portfolio
        await portfolio_generator.save_portfolio(portfolio)
        
        return {
            "message": "Resume uploaded and parsed successfully",
            "resume_data": resume_data
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{portfolio_id}/resume/json", response_model=Portfolio)
async def add_resume_json(portfolio_id: str, resume_data: ResumeData):
    """Add resume data directly as JSON"""
    try:
        # Load portfolio
        portfolio = await portfolio_generator.load_portfolio(portfolio_id)
        
        # Update resume data
        portfolio.resume_data = resume_data
        portfolio.updated_at = datetime.now()
        
        # Save portfolio
        await portfolio_generator.save_portfolio(portfolio)
        
        return portfolio
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{portfolio_id}/preview")
async def preview_portfolio(portfolio_id: str):
    """Preview portfolio HTML"""
    try:
        html = await portfolio_generator.generate_html(portfolio_id)
        return {"html": html}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{portfolio_id}/validate-github")
async def validate_github_username(username: str):
    """Validate if GitHub username exists"""
    try:
        is_valid = await github_service.validate_username(username)
        return {"valid": is_valid, "username": username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
