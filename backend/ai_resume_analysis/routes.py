from fastapi import APIRouter, HTTPException
from .schema import (
    ATSCheckRequest,
    ATSCheckResponse,
    GapAnalysisRequest,
    GapAnalysisResponse,
    ComprehensiveAnalysisRequest,
    ComprehensiveAnalysisResponse
)
from .ats_checker import ats_checker
from .gap_analyzer import gap_analyzer
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/ats-check", response_model=ATSCheckResponse)
async def check_ats_compatibility(request: ATSCheckRequest):
    """
    ATS Compatibility Checker
    
    Analyzes resume for ATS (Applicant Tracking System) compatibility
    Provides a score out of 100 and actionable suggestions to improve
    
    Inspired by Jobscan and Resume Worded
    """
    try:
        logger.info("Processing ATS check request")
        
        if not request.resume_text or len(request.resume_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Resume text is too short. Please provide a complete resume."
            )
        
        result = await ats_checker.analyze_ats_compatibility(
            resume_text=request.resume_text,
            job_description=request.job_description
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"ATS compatibility check failed: {str(e)}"
        )

@router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def analyze_skill_gaps(request: GapAnalysisRequest):
    """
    Resume-Job Gap Analysis
    
    Compares resume keywords with job description keywords
    Provides:
    - Keyword overlap score out of 100
    - List of matching and missing keywords
    - Identified skill gaps with importance levels
    - Learning resources for filling gaps (integrated with learning path feature)
    """
    try:
        logger.info("Processing gap analysis request")
        
        if not request.resume_text or len(request.resume_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Resume text is too short. Please provide a complete resume."
            )
        
        if not request.job_description or len(request.job_description.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Job description is too short. Please provide a complete job description."
            )
        
        result = await gap_analyzer.analyze_gaps(
            resume_text=request.resume_text,
            job_description=request.job_description
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gap analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Gap analysis failed: {str(e)}"
        )

@router.post("/comprehensive-analysis", response_model=ComprehensiveAnalysisResponse)
async def comprehensive_resume_analysis(request: ComprehensiveAnalysisRequest):
    """
    Comprehensive Resume Analysis
    
    Combines both ATS checking and gap analysis for a complete overview
    Provides:
    - ATS compatibility score and suggestions
    - Keyword overlap analysis and skill gaps
    - Learning resources for identified gaps
    - Overall recommendation and action plan
    """
    try:
        logger.info("Processing comprehensive analysis request")
        
        if not request.resume_text or len(request.resume_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Resume text is too short. Please provide a complete resume."
            )
        
        if not request.job_description or len(request.job_description.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Job description is too short. Please provide a complete job description."
            )
        
        # Run both analyses in parallel
        import asyncio
        ats_result, gap_result = await asyncio.gather(
            ats_checker.analyze_ats_compatibility(
                resume_text=request.resume_text,
                job_description=request.job_description
            ),
            gap_analyzer.analyze_gaps(
                resume_text=request.resume_text,
                job_description=request.job_description
            )
        )
        
        # Generate overall recommendation
        overall_recommendation = _generate_overall_recommendation(
            ats_score=ats_result.score,
            gap_score=gap_result.score,
            ats_suggestions=ats_result.suggestions,
            skill_gaps=gap_result.skill_gaps
        )
        
        # Generate action plan
        action_plan = _generate_action_plan(
            ats_result=ats_result,
            gap_result=gap_result
        )
        
        return ComprehensiveAnalysisResponse(
            ats_analysis=ats_result,
            gap_analysis=gap_result,
            overall_recommendation=overall_recommendation,
            action_plan=action_plan
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Comprehensive analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Comprehensive analysis failed: {str(e)}"
        )

def _generate_overall_recommendation(
    ats_score: int,
    gap_score: int,
    ats_suggestions: list,
    skill_gaps: list
) -> str:
    """Generate overall recommendation based on both analyses"""
    
    avg_score = (ats_score + gap_score) / 2
    
    if avg_score >= 80:
        recommendation = "🌟 **Excellent Match!** Your resume shows strong ATS compatibility and good keyword alignment with the job description. "
    elif avg_score >= 65:
        recommendation = "✅ **Good Match** Your resume is well-positioned but has room for improvement. "
    elif avg_score >= 50:
        recommendation = "⚠️ **Moderate Match** Your resume needs significant improvements to better match this role. "
    else:
        recommendation = "❌ **Needs Work** Your resume requires substantial changes to be competitive for this position. "
    
    # Add specific guidance
    if ats_score < 70:
        recommendation += "Focus on improving ATS compatibility first by addressing formatting and keyword optimization. "
    
    critical_gaps = [g for g in skill_gaps if g.importance == "critical" and not g.found_in_resume]
    if critical_gaps:
        recommendation += f"Address {len(critical_gaps)} critical skill gaps identified in the analysis. "
    
    return recommendation

def _generate_action_plan(ats_result, gap_result) -> list:
    """Generate prioritized action plan"""
    
    action_plan = []
    
    # Top 3 ATS improvements
    high_priority_ats = [s for s in ats_result.suggestions if s.priority <= 3]
    for suggestion in high_priority_ats[:3]:
        action_plan.append(f"[ATS] {suggestion.category}: {suggestion.suggestion}")
    
    # Critical skill gaps
    critical_gaps = [
        g for g in gap_result.skill_gaps 
        if g.importance == "critical" and not g.found_in_resume
    ]
    for gap in critical_gaps[:3]:
        action_plan.append(f"[Skill Gap] Learn {gap.skill} - {gap.category}")
    
    # Learning resources reminder
    if gap_result.gaps_with_resources:
        action_plan.append(
            f"[Resources] Check learning resources provided for {len(gap_result.gaps_with_resources)} key skills"
        )
    
    # Final recommendation
    if ats_result.score < 70 or gap_result.score < 70:
        action_plan.append(
            "[Next Steps] Revise resume based on suggestions, then resubmit for analysis"
        )
    else:
        action_plan.append(
            "[Next Steps] Your resume is ready! Consider tailoring it further for specific companies"
        )
    
    return action_plan
