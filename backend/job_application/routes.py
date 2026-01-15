from fastapi import APIRouter, Depends, HTTPException
from auth.routes import get_current_user
from config import get_database
from .schema import (
    ApplicationRequest, 
    ApplicationGenerateResponse, 
    SaveApplicationRequest,
    ApplicationResponse,
    ApplicationsListResponse,
    Application
)
from .application_service import generate_tailored_application
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/job-application", tags=["job_application"])

@router.post("/generate", response_model=ApplicationGenerateResponse)
async def generate_application(
    request: ApplicationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate JD-tailored resume and cover letter.
    """
    try:
        # Get database
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Fetch user profile data
        profile = await db.user_profiles.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found. Please complete your profile first.")
        
        # Add user basic info to profile
        profile['name'] = current_user.get('full_name', '')
        profile['email'] = current_user.get('email', '')
        profile['phone'] = ''
        for link in profile.get('links', []):
            if link.get('type') == 'phone':
                profile['phone'] = link.get('value', '')
                break
        
        # Generate tailored application materials
        result = await generate_tailored_application(
            job_description=request.job_description,
            job_title=request.job_title,
            company=request.company,
            user_profile=profile
        )
        
        return ApplicationGenerateResponse(
            success=True,
            tailored_resume=result.get("tailored_resume"),
            cover_letter=result.get("cover_letter"),
            message="Application materials generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate application: {str(e)}")

@router.post("/save", response_model=ApplicationResponse)
async def save_application(
    request: SaveApplicationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save a job application with tailored resume and cover letter.
    """
    try:
        # Get database
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Check if application already exists for this job
        existing = await db.job_applications.find_one({
            "user_id": user_id,
            "job_id": request.job_id
        })
        
        # Prepare application data
        application_data = {
            "user_id": user_id,
            "job_id": request.job_id,
            "job_title": request.job_title,
            "company": request.company,
            "job_description": request.job_description,
            "tailored_resume": request.tailored_resume.dict(),
            "cover_letter": request.cover_letter.dict(),
            "updated_at": datetime.utcnow(),
            "status": "draft"
        }
        
        if existing:
            # Update existing application
            await db.job_applications.update_one(
                {"_id": existing["_id"]},
                {"$set": application_data}
            )
            application_data["created_at"] = existing["created_at"]
            application_data["_id"] = existing["_id"]
        else:
            # Create new application
            application_data["created_at"] = datetime.utcnow()
            result = await db.job_applications.insert_one(application_data)
            application_data["_id"] = result.inserted_id
        
        # Remove MongoDB _id from response
        application_data.pop("_id", None)
        
        return ApplicationResponse(
            success=True,
            application=Application(**application_data),
            message="Application saved successfully"
        )
        
    except Exception as e:
        print(f"Error saving application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save application: {str(e)}")

@router.get("/my-applications", response_model=ApplicationsListResponse)
async def get_my_applications(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all applications for the current user.
    """
    try:
        # Get database
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Fetch user's applications
        cursor = db.job_applications.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(limit)
        
        applications = []
        async for app in cursor:
            app.pop("_id", None)
            applications.append(Application(**app))
        
        return ApplicationsListResponse(
            success=True,
            applications=applications,
            total=len(applications),
            message="Applications fetched successfully"
        )
        
    except Exception as e:
        print(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch applications: {str(e)}")

@router.delete("/delete/{job_id}")
async def delete_application(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an application.
    """
    try:
        # Get database
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Delete application
        result = await db.job_applications.delete_one({
            "user_id": user_id,
            "job_id": job_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        
        return {"success": True, "message": "Application deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete application: {str(e)}")
