from fastapi import APIRouter, HTTPException, Depends, Query
from .schema import (
    Job, JobMatchResponse, RelevantJobsResponse, AllJobsResponse,
    SavedJob, SaveJobRequest, JobScraperStats
)
from .job_matcher import job_matcher
from .tavily_scraper import tavily_scraper
from config import get_database
from auth.routes import get_current_user
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/relevant", response_model=RelevantJobsResponse)
async def get_relevant_jobs(
    limit: int = Query(20, ge=1, le=100),
    min_match: float = Query(0, ge=0, le=100, description="Minimum match score %"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get jobs most relevant to user's skills
    Returns jobs ranked by match score
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Get user profile with skills
        user_profile = await db.user_profiles.find_one({"user_id": user_id})
        
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Extract user skills (handle both formats: strings or {id, name} objects)
        raw_skills = user_profile.get("skills", [])
        user_skills = []
        for skill in raw_skills:
            if isinstance(skill, dict):
                user_skills.append(skill.get("name", ""))
            else:
                user_skills.append(str(skill))
        user_skills = [s for s in user_skills if s]
        
        if not user_skills:
            return RelevantJobsResponse(
                success=True,
                jobs=[],
                total_jobs=0,
                user_skills=[],
                message="Please add skills to your profile to see relevant jobs"
            )
        
        # Get all jobs from MongoDB
        jobs_cursor = db.jobs.find({})
        jobs = await jobs_cursor.to_list(length=1000)
        
        if not jobs:
            return RelevantJobsResponse(
                success=True,
                jobs=[],
                total_jobs=0,
                user_skills=user_skills,
                message="No jobs available yet. Jobs are fetched every 24 hours."
            )
        
        # Rank jobs by relevance
        ranked_jobs = job_matcher.rank_jobs(jobs, user_skills)
        
        # Filter by minimum match score
        filtered_jobs = [j for j in ranked_jobs if j["match_score"] >= min_match]
        
        # Limit results
        limited_jobs = filtered_jobs[:limit]
        
        # Format response
        job_matches = []
        for job_data in limited_jobs:
            # Separate job fields from match fields
            job = Job(
                job_id=job_data["job_id"],
                title=job_data["title"],
                company=job_data["company"],
                location=job_data["location"],
                description=job_data["description"],
                required_skills=job_data.get("required_skills", []),
                url=job_data["url"],
                salary=job_data.get("salary"),
                job_type=job_data.get("job_type"),
                experience_level=job_data.get("experience_level"),
                source=job_data["source"],
                posted_date=job_data.get("posted_date"),
                scraped_at=datetime.fromisoformat(job_data["scraped_at"]) if isinstance(job_data["scraped_at"], str) else job_data["scraped_at"]
            )
            
            job_match = JobMatchResponse(
                job=job,
                match_score=job_data["match_score"],
                matched_skills=job_data["matched_skills"],
                missing_skills=job_data["missing_skills"]
            )
            job_matches.append(job_match)
        
        return RelevantJobsResponse(
            success=True,
            jobs=job_matches,
            total_jobs=len(filtered_jobs),
            user_skills=user_skills,
            message=f"Found {len(job_matches)} relevant jobs matching your skills"
        )
        
    except Exception as e:
        logger.error(f"Error fetching relevant jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all", response_model=AllJobsResponse)
async def get_all_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    source: Optional[str] = Query(None, description="Filter by source: linkedin, indeed, internshala"),
    job_type: Optional[str] = Query(None, description="Filter by type: full-time, part-time, internship"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all available jobs with pagination and filters
    """
    try:
        db = await get_database()
        
        # Build filter query
        query = {}
        if source:
            query["source"] = source
        if job_type:
            query["job_type"] = job_type
        
        # Get total count
        total = await db.jobs.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        jobs_cursor = db.jobs.find(query).skip(skip).limit(limit).sort("scraped_at", -1)
        jobs_data = await jobs_cursor.to_list(length=limit)
        
        # Format jobs
        jobs = []
        for job_data in jobs_data:
            job = Job(
                job_id=job_data["job_id"],
                title=job_data["title"],
                company=job_data["company"],
                location=job_data["location"],
                description=job_data["description"],
                required_skills=job_data.get("required_skills", []),
                url=job_data["url"],
                salary=job_data.get("salary"),
                job_type=job_data.get("job_type"),
                experience_level=job_data.get("experience_level"),
                source=job_data["source"],
                posted_date=job_data.get("posted_date"),
                scraped_at=datetime.fromisoformat(job_data["scraped_at"]) if isinstance(job_data["scraped_at"], str) else job_data["scraped_at"]
            )
            jobs.append(job)
        
        return AllJobsResponse(
            success=True,
            jobs=jobs,
            total=total,
            page=page,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Error fetching all jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_job(
    request: SaveJobRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save or apply to a job
    Tracks user's job applications
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Check if job exists
        job = await db.jobs.find_one({"job_id": request.job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Save to user's saved jobs
        saved_job = {
            "user_id": user_id,
            "job_id": request.job_id,
            "status": request.status,
            "saved_at": datetime.utcnow().isoformat(),
            "applied_at": datetime.utcnow().isoformat() if request.status == "applied" else None,
            "notes": request.notes
        }
        
        # Upsert (update if exists, insert if not)
        await db.saved_jobs.update_one(
            {"user_id": user_id, "job_id": request.job_id},
            {"$set": saved_job},
            upsert=True
        )
        
        return {
            "success": True,
            "message": f"Job {request.status} successfully"
        }
        
    except Exception as e:
        logger.error(f"Error saving job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/saved")
async def get_saved_jobs(
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's saved/applied jobs
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Get saved jobs
        saved_cursor = db.saved_jobs.find({"user_id": user_id}).sort("saved_at", -1)
        saved_jobs = await saved_cursor.to_list(length=100)
        
        # Enrich with full job details
        enriched_jobs = []
        for saved in saved_jobs:
            job = await db.jobs.find_one({"job_id": saved["job_id"]})
            if job:
                enriched_jobs.append({
                    **job,
                    "saved_status": saved["status"],
                    "saved_at": saved["saved_at"],
                    "applied_at": saved.get("applied_at"),
                    "notes": saved.get("notes")
                })
        
        return {
            "success": True,
            "jobs": enriched_jobs,
            "total": len(enriched_jobs)
        }
        
    except Exception as e:
        logger.error(f"Error fetching saved jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_scraper_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get job scraper statistics
    """
    try:
        db = await get_database()
        
        # Get latest stats
        stats = await db.job_scraper_stats.find_one(sort=[("last_scrape", -1)])
        
        # Get total jobs count by source
        total_jobs = await db.jobs.count_documents({})
        linkedin_count = await db.jobs.count_documents({"source": "linkedin"})
        indeed_count = await db.jobs.count_documents({"source": "indeed"})
        internshala_count = await db.jobs.count_documents({"source": "internshala"})
        
        return {
            "success": True,
            "total_jobs": total_jobs,
            "by_source": {
                "linkedin": linkedin_count,
                "indeed": indeed_count,
                "internshala": internshala_count
            },
            "last_scrape": stats.get("last_scrape") if stats else None,
            "last_scrape_stats": stats if stats else None
        }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-scrape")
async def trigger_manual_scrape(
    current_user: dict = Depends(get_current_user)
):
    """
    Manually trigger job scraping (admin only)
    """
    try:
        from .scheduler import job_scheduler
        
        # Trigger scraping
        await job_scheduler.scrape_and_save_jobs()
        
        return {
            "success": True,
            "message": "Job scraping triggered successfully"
        }
        
    except Exception as e:
        logger.error(f"Error triggering scrape: {e}")
        raise HTTPException(status_code=500, detail=str(e))
