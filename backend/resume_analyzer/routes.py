from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from .schema import ResumeAnalysisRequest, ResumeAnalysisResponse
from auth.routes import get_current_user
from shared.gemini_service import gemini_service
from PyPDF2 import PdfReader
import io
import json

router = APIRouter(prefix="/resume-analyzer", tags=["Resume Analyzer"])

def extract_resume_text(pdf_content: bytes) -> str:
    """Extract text from PDF resume bytes."""
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

async def analyze_resume_with_gemini(resume_text: str, job_description: str) -> dict:
    """Analyze resume against job description using Gemini AI."""
    try:
        prompt = f"""You are an expert ATS (Applicant Tracking System) resume analyzer and career consultant. Analyze the following resume against the job description and provide a comprehensive analysis.

**RESUME TEXT:**
{resume_text}

**JOB DESCRIPTION:**
{job_description}

**INSTRUCTIONS:**
1. Calculate an ATS score (0-100) based on how well the resume is formatted for ATS systems (keywords, formatting, structure)
2. Calculate a readiness score (0-100) based on how well the candidate matches the job requirements
3. Identify specific gaps between the resume and job requirements
4. List strengths that align with the job description
5. Provide actionable tips to improve the resume
6. Calculate overall match percentage (0-100)
7. Provide specific recommendations for improvement

**REQUIRED JSON STRUCTURE:**
{{
  "ats_score": 85,
  "readiness_score": 78,
  "match_percentage": 81.5,
  "tips": [
    "Add more relevant keywords from the job description",
    "Quantify achievements with specific metrics",
    "Include more technical skills mentioned in the JD"
  ],
  "gaps": [
    "Missing experience with React framework mentioned in JD",
    "No mention of cloud computing experience required",
    "Leadership experience not clearly demonstrated"
  ],
  "strengths": [
    "Strong background in Python and JavaScript",
    "Relevant work experience in software development",
    "Good educational background"
  ],
  "recommendations": [
    "Consider adding a skills section with keywords from the job description",
    "Highlight any cloud computing or DevOps experience",
    "Add metrics to quantify your achievements (e.g., 'Improved performance by 30%')"
  ]
}}

Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text. Ensure all scores are numbers, not strings.
"""
        
        response = await gemini_service.generate_content(prompt)
        result_text = response.strip()
        
        # Clean up response - remove markdown code blocks if present
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()
        
        # Parse JSON response
        analysis_data = json.loads(result_text)
        
        return analysis_data
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse Gemini response as JSON: {str(e)}\nResponse: {result_text[:500]}")
    except Exception as e:
        raise Exception(f"Failed to analyze resume with Gemini: {str(e)}")

@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze resume against job description
    Returns ATS score, readiness score, tips, gaps, and recommendations
    """
    try:
        # Validate file type
        if not resume.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read PDF content
        pdf_content = await resume.read()
        
        # Extract text from PDF
        resume_text = extract_resume_text(pdf_content)
        
        if not resume_text or len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from PDF. Please ensure the PDF contains readable text.")
        
        if not job_description or len(job_description.strip()) < 20:
            raise HTTPException(status_code=400, detail="Job description is required and must be at least 20 characters long")
        
        # Analyze with Gemini
        analysis = await analyze_resume_with_gemini(resume_text, job_description)
        
        return ResumeAnalysisResponse(
            success=True,
            ats_score=float(analysis.get("ats_score", 0)),
            readiness_score=float(analysis.get("readiness_score", 0)),
            tips=analysis.get("tips", []),
            gaps=analysis.get("gaps", []),
            strengths=analysis.get("strengths", []),
            recommendations=analysis.get("recommendations", []),
            match_percentage=float(analysis.get("match_percentage", 0)),
            message="Resume analysis completed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

