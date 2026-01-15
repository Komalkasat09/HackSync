import logging
import json
import sys
import re
from typing import Dict, Any, List
sys.path.append('..')
from shared.gemini_service import gemini_service
from .schema import ATSCheckResponse, ATSSuggestion

logger = logging.getLogger(__name__)

class ATSChecker:
    """
    ATS (Applicant Tracking System) Checker Service
    Analyzes resume for ATS compatibility and provides actionable suggestions
    Inspired by Jobscan and Resume Worded
    """
    
    def __init__(self):
        self.gemini = gemini_service
        logger.info("ATS Checker initialized with shared Gemini service")
    
    async def analyze_ats_compatibility(
        self, 
        resume_text: str, 
        job_description: str = None
    ) -> ATSCheckResponse:
        """
        Comprehensive ATS analysis with scoring and suggestions
        """
        try:
            prompt = self._build_ats_prompt(resume_text, job_description)
            
            # Get analysis from Gemini
            response = await self.gemini.generate_content_async(prompt)
            analysis = self._parse_ats_response(response)
            
            logger.info(f"ATS analysis completed with score: {analysis['score']}")
            return ATSCheckResponse(**analysis)
            
        except Exception as e:
            logger.error(f"ATS analysis failed: {e}")
            raise Exception(f"ATS compatibility check failed: {str(e)}")
    
    def _build_ats_prompt(self, resume_text: str, job_description: str = None) -> str:
        """Build comprehensive prompt for ATS analysis"""
        
        base_prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer with deep knowledge of how companies like Jobscan and Resume Worded evaluate resumes.

Analyze this resume for ATS compatibility and provide:
1. An overall ATS compatibility score (0-100)
2. Detailed, actionable suggestions to improve the score
3. Specific strengths and weaknesses
4. Keyword optimization recommendations

RESUME:
{resume_text}
"""
        
        if job_description:
            base_prompt += f"""

JOB DESCRIPTION (for keyword matching):
{job_description}

Analyze keyword overlap and relevance to this specific job posting.
"""
        
        base_prompt += """

ANALYSIS CRITERIA:
1. **Formatting & Structure (25 points)**
   - Standard section headers (Experience, Education, Skills)
   - Proper use of bullet points
   - No tables, images, headers/footers, or complex formatting
   - Clean, simple layout
   - Consistent font and spacing

2. **Keywords & Optimization (30 points)**
   - Relevant industry keywords
   - Job-specific terminology
   - Skills mentioned in job description (if provided)
   - Action verbs and quantifiable achievements
   - Natural keyword integration (not keyword stuffing)

3. **Content Quality (25 points)**
   - Clear job titles and company names
   - Measurable achievements with numbers/metrics
   - Relevant experience highlighted
   - Education properly formatted
   - Contact information complete and standard

4. **ATS-Friendly Elements (20 points)**
   - Standard file format compatibility
   - No graphics, logos, or special characters
   - Dates in standard format
   - Full words instead of abbreviations (when appropriate)
   - Phone numbers and emails in standard format

RETURN YOUR ANALYSIS IN THIS EXACT JSON FORMAT:
```json
{
  "score": 85,
  "overall_assessment": "Your resume shows strong ATS compatibility with good keyword usage and clear formatting. Main improvements needed in quantifying achievements and optimizing for specific job requirements.",
  "keyword_match_rate": 0.72,
  "strengths": [
    "Clear section headers that ATS can easily parse",
    "Strong use of industry-relevant keywords",
    "Quantified achievements with specific metrics"
  ],
  "weaknesses": [
    "Some technical skills are abbreviated",
    "Missing key skills mentioned in job description",
    "Date formatting is inconsistent"
  ],
  "suggestions": [
    {
      "category": "Keywords",
      "issue": "Missing 'Python', 'AWS', and 'CI/CD' mentioned in job description",
      "suggestion": "Add these skills to your Skills section and incorporate them into relevant experience bullets",
      "impact": "high",
      "priority": 1
    },
    {
      "category": "Formatting",
      "issue": "Date format varies between 'MM/YYYY' and 'Month Year'",
      "suggestion": "Use consistent date format throughout (recommend: 'Month YYYY' format)",
      "impact": "medium",
      "priority": 3
    },
    {
      "category": "Content",
      "issue": "Some bullet points lack quantifiable metrics",
      "suggestion": "Add specific numbers, percentages, or metrics to show impact (e.g., 'Improved performance by 40%')",
      "impact": "high",
      "priority": 2
    },
    {
      "category": "Keywords",
      "issue": "Technical terms abbreviated (e.g., 'JS' instead of 'JavaScript')",
      "suggestion": "Spell out technologies on first mention, then can use abbreviations (e.g., 'JavaScript (JS)')",
      "impact": "medium",
      "priority": 4
    },
    {
      "category": "Formatting",
      "issue": "Section header 'Work History' not standard",
      "suggestion": "Change to 'Professional Experience' or 'Work Experience' - these are more ATS-friendly",
      "impact": "low",
      "priority": 5
    }
  ]
}
```

IMPORTANT:
- Be specific and actionable in suggestions
- Prioritize suggestions by impact (priority 1 = most important)
- Include 5-10 suggestions
- Score should be realistic based on actual ATS criteria
- If job description is provided, heavily weight keyword matching
- Return ONLY valid JSON, no markdown formatting, no extra text
"""
        
        return base_prompt
    
    def _parse_ats_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini response and extract structured analysis"""
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group(0)
                analysis = json.loads(json_str)
            else:
                # Fallback parsing if no JSON found
                analysis = self._fallback_parse(response)
            
            # Validate and structure the response
            return {
                "score": max(0, min(100, analysis.get("score", 50))),
                "overall_assessment": analysis.get("overall_assessment", "Analysis completed"),
                "keyword_match_rate": analysis.get("keyword_match_rate"),
                "strengths": analysis.get("strengths", []),
                "weaknesses": analysis.get("weaknesses", []),
                "suggestions": [
                    ATSSuggestion(**suggestion) 
                    for suggestion in analysis.get("suggestions", [])
                ]
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse ATS response as JSON: {e}")
            return self._fallback_parse(response)
        except Exception as e:
            logger.error(f"Error parsing ATS response: {e}")
            raise
    
    def _fallback_parse(self, response: str) -> Dict[str, Any]:
        """Fallback parser if JSON extraction fails"""
        logger.warning("Using fallback parser for ATS response")
        
        # Try to extract a score
        score_match = re.search(r'score["\s:]+(\d+)', response.lower())
        score = int(score_match.group(1)) if score_match else 50
        
        return {
            "score": score,
            "overall_assessment": "Resume analysis completed. Please review the detailed feedback.",
            "keyword_match_rate": None,
            "strengths": ["Analysis completed"],
            "weaknesses": ["Unable to provide detailed breakdown"],
            "suggestions": [
                ATSSuggestion(
                    category="General",
                    issue="Detailed analysis unavailable",
                    suggestion="Please try again or contact support",
                    impact="medium",
                    priority=1
                )
            ]
        }

# Singleton instance
ats_checker = ATSChecker()
