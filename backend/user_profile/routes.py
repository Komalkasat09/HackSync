from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime
import io
from .schema import UserProfile, UserProfileUpdate, UserProfileResponse
from .resume_extractor import extract_profile_from_resume
import sys
sys.path.append('..')
from auth.routes import get_current_user
from config import get_database

router = APIRouter(prefix="/profile", tags=["User Profile"])

@router.get("", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user's profile data"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    # Get profile from user_profiles collection
    profile = await db.user_profiles.find_one({"user_id": user_id})
    
    if not profile:
        # Create empty profile if doesn't exist
        profile = {
            "user_id": user_id,
            "links": [],
            "skills": [],
            "experiences": [],
            "projects": [],
            "education": [],
            "interests": [],
            "resume_data": None,
            "resume_filename": None,
            "created_at": datetime.utcnow()
        }
        await db.user_profiles.insert_one(profile)
    
    # Check if resume exists
    has_resume = profile.get("resume_data") is not None
    
    return UserProfileResponse(
        user_id=user_id,
        links=profile.get("links", []),
        skills=profile.get("skills", []),
        experiences=profile.get("experiences", []),
        projects=profile.get("projects", []),
        education=profile.get("education", []),
        interests=profile.get("interests", []),
        has_resume=has_resume
    )

@router.put("", response_model=UserProfileResponse)
async def update_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's profile data"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    # Build update document
    update_data = {}
    if profile_update.links is not None:
        update_data["links"] = [link.dict() for link in profile_update.links]
    if profile_update.skills is not None:
        update_data["skills"] = [skill.dict() for skill in profile_update.skills]
    if profile_update.experiences is not None:
        update_data["experiences"] = [exp.dict() for exp in profile_update.experiences]
    if profile_update.projects is not None:
        update_data["projects"] = [proj.dict() for proj in profile_update.projects]
    if profile_update.education is not None:
        update_data["education"] = [edu.dict() for edu in profile_update.education]
    if profile_update.interests is not None:
        update_data["interests"] = [interest.dict() for interest in profile_update.interests]
    
    update_data["updated_at"] = datetime.utcnow()
    
    # Update profile
    result = await db.user_profiles.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    # Get updated profile
    profile = await db.user_profiles.find_one({"user_id": user_id})
    
    # Check if resume exists
    has_resume = profile.get("resume") is not None
    
    return UserProfileResponse(
        user_id=user_id,
        links=profile.get("links", []),
        skills=profile.get("skills", []),
        experiences=profile.get("experiences", []),
        projects=profile.get("projects", []),
        education=profile.get("education", []),
        interests=profile.get("interests", []),
        has_resume=has_resume
    )

@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload resume PDF using GridFS"""
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Validate file size (10MB limit)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    db = await get_database()
    user_id = str(current_user["_id"])
    
    # Store resume directly in user_profiles collection as binary data
    await db.user_profiles.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "resume_data": content,
                "resume_filename": file.filename,
                "resume_uploaded_at": datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return {
        "message": "Resume uploaded successfully",
        "filename": file.filename
    }

@router.get("/resume")
async def get_resume(current_user: dict = Depends(get_current_user)):
    """Get resume PDF from user_profiles collection"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    # Get profile
    profile = await db.user_profiles.find_one({"user_id": user_id})
    
    if not profile or not profile.get("resume_data"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Return resume as streaming response
    return StreamingResponse(
        io.BytesIO(profile["resume_data"]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={profile.get('resume_filename', 'resume.pdf')}"
        }
    )

@router.delete("/resume")
async def delete_resume(current_user: dict = Depends(get_current_user)):
    """Delete resume from GridFS"""
    # Get current user ucurrent_user: dict = Depends(get_current_user)):
    """Delete resume from GridFS"""
    
    # Get profile
    profile = await db.user_profiles.find_one({"user_id": user_id})
    
    if not profile or not profile.get("resume_gridfs_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
@router.delete("/resume")
async def delete_resume(current_user: dict = Depends(get_current_user)):
    """Delete resume from user_profiles collection"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    # Get profile
    profile = await db.user_profiles.find_one({"user_id": user_id})
    
    if not profile or not profile.get("resume_data"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Remove resume from profile
    await db.user_profiles.update_one(
        {"user_id": user_id},
        {
            "$unset": {
                "resume_data": "",
                "resume_filename": "",
                "resume_uploaded_at": ""
            }
        }
    )
    
    return {"message": "Resume deleted successfully"}


@router.post("/extract-resume")
async def extract_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Extract all profile data from resume PDF using AI.
    Auto-fills skills, experience, education, projects, links, interests.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Read PDF content
        pdf_content = await file.read()
        
        # Extract profile data using Gemini AI
        print(f"Extracting resume for user: {user_id}")
        extracted_data = extract_profile_from_resume(pdf_content)
        print(f"Extracted data: {extracted_data}")
        
        # Update user profile with extracted data
        await db.user_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "skills": extracted_data.get("skills", []),
                    "links": extracted_data.get("links", []),
                    "experiences": extracted_data.get("experience", []),
                    "projects": extracted_data.get("projects", []),
                    "education": extracted_data.get("education", []),
                    "interests": extracted_data.get("interests", []),
                    "extracted_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Resume data extracted successfully",
            "data": extracted_data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract resume data: {str(e)}"
        )
