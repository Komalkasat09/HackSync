"""
FastAPI application for portfolio generation service.

Provides endpoints to:
- Upload resume and generate portfolio
- Retrieve generated portfolios
- Get generation status
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uuid
import os
from pathlib import Path
import asyncio
from datetime import datetime

from pipeline import PortfolioPipeline


# Initialize FastAPI app
app = FastAPI(
    title="Portfolio Generator API",
    description="AI-powered portfolio generation from resume and GitHub data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directory for generated portfolios
PORTFOLIO_DIR = Path("generated_portfolios")
PORTFOLIO_DIR.mkdir(exist_ok=True)

# In-memory job store (use database in production)
jobs: Dict[str, Dict[str, Any]] = {}


# Request/Response Models
class GitHubRepoInput(BaseModel):
    """GitHub repository input data."""
    name: str
    description: Optional[str] = None
    url: str
    languages: Dict[str, int] = Field(default_factory=dict)
    stars: int = 0
    readme_content: Optional[str] = None


class GeneratePortfolioRequest(BaseModel):
    """Request to generate portfolio."""
    github_repos: Optional[List[GitHubRepoInput]] = None


class ProfileMetadata(BaseModel):
    """Extracted profile metadata."""
    name: Optional[str]
    current_role: Optional[str]
    domain: str
    skills: List[str]
    skills_count: int
    clusters_count: int
    projects_count: int


class GeneratePortfolioResponse(BaseModel):
    """Response after portfolio generation."""
    job_id: str
    status: str  # 'processing', 'completed', 'failed'
    portfolio_url: Optional[str] = None
    skill_graph: Optional[Dict[str, Any]] = None
    metadata: Optional[ProfileMetadata] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None


class JobStatus(BaseModel):
    """Job status response."""
    job_id: str
    status: str
    progress: Optional[str] = None
    error: Optional[str] = None


# Helper functions
def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """
    Extract text from uploaded file.
    
    Args:
        file_content: File content bytes.
        filename: Original filename.
    
    Returns:
        Extracted text.
    """
    file_ext = filename.lower().split('.')[-1]
    
    if file_ext == 'txt':
        return file_content.decode('utf-8')
    elif file_ext == 'pdf':
        try:
            from PyPDF2 import PdfReader
            import io
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise HTTPException(400, f"Failed to parse PDF: {str(e)}")
    else:
        raise HTTPException(400, f"Unsupported file type: {file_ext}")


async def run_pipeline_async(
    job_id: str,
    resume_text: str,
    github_repos: Optional[List[Dict[str, Any]]]
):
    """
    Run the portfolio generation pipeline asynchronously.
    
    Args:
        job_id: Unique job identifier.
        resume_text: Resume text content.
        github_repos: Optional GitHub repository data.
    """
    try:
        # Update job status
        jobs[job_id]['status'] = 'processing'
        jobs[job_id]['progress'] = 'Starting pipeline...'
        
        # Create output directory for this job
        job_dir = PORTFOLIO_DIR / job_id
        job_dir.mkdir(exist_ok=True)
        
        output_path = job_dir / "portfolio.html"
        log_path = job_dir / "pipeline.log"
        
        # Initialize and run pipeline
        pipeline = PortfolioPipeline(log_file=str(log_path))
        result = pipeline.run(
            resume_text=resume_text,
            github_repos=github_repos,
            output_path=str(output_path)
        )
        
        if result['success']:
            # Store results
            jobs[job_id]['status'] = 'completed'
            jobs[job_id]['completed_at'] = datetime.now().isoformat()
            jobs[job_id]['portfolio_url'] = f"/api/portfolio/{job_id}/html"
            jobs[job_id]['skill_graph'] = result.get('graph_data')
            jobs[job_id]['metadata'] = {
                'name': result['data'].get('name'),
                'current_role': result['data'].get('current_role'),
                'domain': result['data']['domain'],
                'skills': result['data'].get('skills', []),
                'skills_count': result['data']['skills_count'],
                'clusters_count': result['data']['clusters_count'],
                'projects_count': result['data']['projects_count']
            }
            jobs[job_id]['duration'] = result['total_duration']
        else:
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['error'] = result.get('error', 'Unknown error')
            jobs[job_id]['completed_at'] = datetime.now().isoformat()
    
    except Exception as e:
        jobs[job_id]['status'] = 'failed'
        jobs[job_id]['error'] = str(e)
        jobs[job_id]['completed_at'] = datetime.now().isoformat()


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Portfolio Generator API",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/api/generate", response_model=GeneratePortfolioResponse)
async def generate_portfolio(
    background_tasks: BackgroundTasks,
    resume: UploadFile = File(...),
    request: Optional[str] = None
):
    """
    Generate portfolio from uploaded resume.
    
    Args:
        resume: Resume file (txt or pdf).
        request: Optional JSON string with github_repos data.
    
    Returns:
        Job information with portfolio URL, skill graph, and metadata.
    """
    # Validate file
    if not resume.filename:
        raise HTTPException(400, "No file uploaded")
    
    # Read file content
    try:
        file_content = await resume.read()
        resume_text = extract_text_from_file(file_content, resume.filename)
    except Exception as e:
        raise HTTPException(400, f"Failed to read resume: {str(e)}")
    
    # Parse optional GitHub repos
    github_repos = None
    if request:
        try:
            import json
            request_data = json.loads(request)
            if 'github_repos' in request_data:
                github_repos = [repo for repo in request_data['github_repos']]
        except Exception as e:
            raise HTTPException(400, f"Invalid request JSON: {str(e)}")
    
    # Create job
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        'job_id': job_id,
        'status': 'queued',
        'created_at': datetime.now().isoformat(),
        'filename': resume.filename
    }
    
    # Start pipeline in background
    background_tasks.add_task(run_pipeline_async, job_id, resume_text, github_repos)
    
    return GeneratePortfolioResponse(
        job_id=job_id,
        status='queued',
        created_at=jobs[job_id]['created_at']
    )


@app.get("/api/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get status of a portfolio generation job.
    
    Args:
        job_id: Job identifier.
    
    Returns:
        Job status information.
    """
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    job = jobs[job_id]
    return JobStatus(
        job_id=job_id,
        status=job['status'],
        progress=job.get('progress'),
        error=job.get('error')
    )


@app.get("/api/portfolio/{job_id}", response_model=GeneratePortfolioResponse)
async def get_portfolio(job_id: str):
    """
    Get complete portfolio data for a job.
    
    Args:
        job_id: Job identifier.
    
    Returns:
        Complete portfolio response with HTML URL, graph, and metadata.
    """
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    job = jobs[job_id]
    
    if job['status'] == 'processing':
        raise HTTPException(202, "Portfolio is still being generated")
    
    if job['status'] == 'failed':
        raise HTTPException(500, job.get('error', 'Generation failed'))
    
    return GeneratePortfolioResponse(
        job_id=job_id,
        status=job['status'],
        portfolio_url=job.get('portfolio_url'),
        skill_graph=job.get('skill_graph'),
        metadata=ProfileMetadata(**job['metadata']) if job.get('metadata') else None,
        error=job.get('error'),
        created_at=job['created_at'],
        completed_at=job.get('completed_at')
    )


@app.get("/api/portfolio/{job_id}/html", response_class=HTMLResponse)
async def get_portfolio_html(job_id: str):
    """
    Get generated portfolio HTML.
    
    Args:
        job_id: Job identifier.
    
    Returns:
        HTML content of the portfolio.
    """
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    job = jobs[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(404, "Portfolio not ready")
    
    html_path = PORTFOLIO_DIR / job_id / "portfolio.html"
    
    if not html_path.exists():
        raise HTTPException(404, "Portfolio HTML not found")
    
    return FileResponse(html_path, media_type="text/html")


@app.get("/api/portfolio/{job_id}/graph")
async def get_skill_graph(job_id: str):
    """
    Get skill graph JSON for a portfolio.
    
    Args:
        job_id: Job identifier.
    
    Returns:
        Cytoscape-compatible skill graph JSON.
    """
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    job = jobs[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(404, "Portfolio not ready")
    
    if not job.get('skill_graph'):
        raise HTTPException(404, "Skill graph not available")
    
    return JSONResponse(content=job['skill_graph'])


@app.get("/api/portfolio/{job_id}/metadata")
async def get_metadata(job_id: str):
    """
    Get extracted profile metadata.
    
    Args:
        job_id: Job identifier.
    
    Returns:
        Profile metadata including name, role, domain, skills.
    """
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    job = jobs[job_id]
    
    if job['status'] != 'completed':
        raise HTTPException(404, "Portfolio not ready")
    
    if not job.get('metadata'):
        raise HTTPException(404, "Metadata not available")
    
    return JSONResponse(content=job['metadata'])


@app.delete("/api/portfolio/{job_id}")
async def delete_portfolio(job_id: str):
    """
    Delete a generated portfolio and its job data.
    
    Args:
        job_id: Job identifier.
    
    Returns:
        Success message.
    """
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    
    # Delete files
    job_dir = PORTFOLIO_DIR / job_id
    if job_dir.exists():
        import shutil
        shutil.rmtree(job_dir)
    
    # Remove from jobs
    del jobs[job_id]
    
    return {"message": "Portfolio deleted successfully"}


@app.get("/api/jobs")
async def list_jobs():
    """
    List all portfolio generation jobs.
    
    Returns:
        List of all jobs with their status.
    """
    return {
        "jobs": [
            {
                "job_id": job_id,
                "status": job['status'],
                "created_at": job['created_at'],
                "completed_at": job.get('completed_at'),
                "filename": job.get('filename')
            }
            for job_id, job in jobs.items()
        ]
    }


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    # Check for required environment variables
    if not os.getenv("GEMINI_API_KEY"):
        print("Warning: GEMINI_API_KEY not set in environment")
    
    print("Starting Portfolio Generator API...")
    print("API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
