from fastapi import APIRouter, HTTPException
from .schema import ResumeData, ResumeBuilderResponse, ResumeEvaluation
from datetime import datetime

router = APIRouter()

@router.post("/build", response_model=ResumeBuilderResponse)
async def build_resume(resume_data: ResumeData):
    """
    AI Resume Builder - Generates and formats professional resumes
    """
    try:
        # Dummy evaluation for now
        evaluation = ResumeEvaluation(
            overall_score=8.5,
            ats_compatibility=9.0,
            keyword_optimization=8.2,
            structure_quality=8.8,
            suggestions=[
                "Add quantifiable achievements to experience section",
                "Include relevant certifications",
                "Optimize keywords for target role",
                "Add a professional summary"
            ]
        )
        
        formatted_content = {
            "sections": ["header", "summary", "experience", "education", "skills", "projects"],
            "template": "professional",
            "color_scheme": "blue"
        }
        
        return ResumeBuilderResponse(
            resume_url="/resumes/sample_resume.pdf",
            evaluation=evaluation,
            formatted_content=formatted_content,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate")
async def evaluate_resume(resume_data: ResumeData):
    """
    Resume Readiness Evaluator - Analyzes resume quality and ATS compatibility
    """
    try:
        evaluation = ResumeEvaluation(
            overall_score=7.8,
            ats_compatibility=8.5,
            keyword_optimization=7.0,
            structure_quality=8.2,
            suggestions=[
                "Use more action verbs",
                "Quantify your achievements",
                "Tailor resume to job description",
                "Remove personal pronouns"
            ]
        )
        
        return {"evaluation": evaluation, "status": "completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
