import logging
import json
import sys
import re
from typing import Dict, Any, List, Set
sys.path.append('..')
from shared.gemini_service import gemini_service
from .schema import (
    GapAnalysisResponse, 
    SkillGap, 
    GapWithResources,
    LearningResource
)
import yt_dlp

logger = logging.getLogger(__name__)

class GapAnalyzer:
    """
    Gap Analysis Service
    Compares resume keywords with job description keywords
    Identifies skill gaps and provides targeted learning resources
    """
    
    def __init__(self):
        self.gemini = gemini_service
        logger.info("Gap Analyzer initialized with shared Gemini service")
    
    async def analyze_gaps(
        self, 
        resume_text: str, 
        job_description: str
    ) -> GapAnalysisResponse:
        """
        Comprehensive gap analysis with keyword matching and resource recommendations
        """
        try:
            # Step 1: Extract and compare keywords
            prompt = self._build_gap_analysis_prompt(resume_text, job_description)
            response = await self.gemini.generate_content_async(prompt)
            analysis = self._parse_gap_response(response)
            
            # Step 2: Fetch learning resources for identified gaps
            critical_gaps = [
                gap for gap in analysis['skill_gaps'] 
                if gap.importance in ['critical', 'high'] and not gap.found_in_resume
            ]
            
            gaps_with_resources = []
            for gap in critical_gaps[:5]:  # Limit to top 5 critical gaps
                resources = self._fetch_resources_for_skill(gap.skill)
                if resources:
                    gaps_with_resources.append(
                        GapWithResources(
                            skill=gap.skill,
                            category=gap.category,
                            importance=gap.importance,
                            resources=resources
                        )
                    )
            
            analysis['gaps_with_resources'] = gaps_with_resources
            
            logger.info(f"Gap analysis completed with score: {analysis['score']}")
            return GapAnalysisResponse(**analysis)
            
        except Exception as e:
            logger.error(f"Gap analysis failed: {e}")
            raise Exception(f"Gap analysis failed: {str(e)}")
    
    def _build_gap_analysis_prompt(self, resume_text: str, job_description: str) -> str:
        """Build prompt for gap analysis"""
        
        prompt = f"""You are an expert career analyst specializing in skill gap analysis and job-resume matching.

Analyze the overlap between this resume and job description:

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Perform a comprehensive keyword and skill gap analysis:

1. **Keyword Extraction**
   - Extract all technical skills, tools, technologies from both documents
   - Extract soft skills and competencies
   - Identify certifications mentioned
   - Note experience levels, methodologies, frameworks

2. **Gap Identification**
   - Which critical keywords from JD are missing in resume?
   - Which skills are present in both (matching)?
   - Categorize gaps by importance and type

3. **Scoring**
   - Calculate keyword overlap percentage
   - Score out of 100 based on:
     * Technical skills match (40%)
     * Soft skills & competencies match (20%)
     * Tools & technologies match (25%)
     * Certifications & experience level match (15%)

4. **Recommendations**
   - What specific skills should the candidate learn?
   - Priority order for skill development

RETURN YOUR ANALYSIS IN THIS EXACT JSON FORMAT:
```json
{{
  "score": 68,
  "matched_percentage": 68.5,
  "matching_keywords": [
    "Python",
    "JavaScript",
    "React",
    "Team Collaboration",
    "Problem Solving"
  ],
  "missing_keywords": [
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Microservices",
    "PostgreSQL"
  ],
  "skill_gaps": [
    {{
      "skill": "AWS",
      "category": "cloud_platform",
      "importance": "critical",
      "found_in_jd": true,
      "found_in_resume": false
    }},
    {{
      "skill": "Docker",
      "category": "devops_tool",
      "importance": "high",
      "found_in_jd": true,
      "found_in_resume": false
    }},
    {{
      "skill": "Kubernetes",
      "category": "devops_tool",
      "importance": "high",
      "found_in_jd": true,
      "found_in_resume": false
    }},
    {{
      "skill": "PostgreSQL",
      "category": "database",
      "importance": "medium",
      "found_in_jd": true,
      "found_in_resume": false
    }}
  ],
  "recommendations": [
    "Priority 1: Learn AWS fundamentals (EC2, S3, Lambda) - critical for this role",
    "Priority 2: Get hands-on with Docker containerization",
    "Priority 3: Study Kubernetes orchestration basics",
    "Priority 4: Build projects using PostgreSQL database",
    "Consider: AWS Certified Solutions Architect certification"
  ]
}}
```

IMPORTANT:
- Be thorough in keyword extraction (look for synonyms and variations)
- Consider context: 'React' and 'React.js' are the same
- Categorize skills appropriately (technical, soft_skill, certification, tool, language, framework, etc.)
- Importance levels: critical (must-have), high (strongly preferred), medium (nice to have), low (optional)
- Score should reflect true keyword overlap percentage
- Limit skill_gaps to top 10-15 most important gaps
- Return ONLY valid JSON, no markdown formatting, no extra text
"""
        
        return prompt
    
    def _parse_gap_response(self, response: str) -> Dict[str, Any]:
        """Parse Gemini response and extract structured gap analysis"""
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group(0)
                analysis = json.loads(json_str)
            else:
                analysis = self._fallback_gap_parse(response)
            
            # Validate and structure the response
            return {
                "score": max(0, min(100, analysis.get("score", 50))),
                "matched_percentage": analysis.get("matched_percentage", 0.0),
                "matching_keywords": analysis.get("matching_keywords", []),
                "missing_keywords": analysis.get("missing_keywords", []),
                "skill_gaps": [
                    SkillGap(**gap) 
                    for gap in analysis.get("skill_gaps", [])
                ],
                "gaps_with_resources": [],  # Will be populated later
                "recommendations": analysis.get("recommendations", [])
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse gap analysis as JSON: {e}")
            return self._fallback_gap_parse(response)
        except Exception as e:
            logger.error(f"Error parsing gap response: {e}")
            raise
    
    def _fallback_gap_parse(self, response: str) -> Dict[str, Any]:
        """Fallback parser if JSON extraction fails"""
        logger.warning("Using fallback parser for gap analysis")
        
        # Try to extract a score
        score_match = re.search(r'score["\s:]+(\d+)', response.lower())
        score = int(score_match.group(1)) if score_match else 50
        
        return {
            "score": score,
            "matched_percentage": float(score),
            "matching_keywords": [],
            "missing_keywords": [],
            "skill_gaps": [],
            "recommendations": ["Unable to provide detailed analysis. Please try again."]
        }
    
    def _fetch_resources_for_skill(self, skill: str, max_results: int = 5) -> List[LearningResource]:
        """
        Fetch learning resources for a specific skill
        Uses YouTube (no API key required) similar to learning_guide
        """
        try:
            search_query = f"ytsearch{max_results}:{skill} tutorial"
            
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'extract_flat': True,
                'force_generic_extractor': False
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                search_results = ydl.extract_info(search_query, download=False)
            
            resources = []
            if search_results and 'entries' in search_results:
                for video in search_results['entries']:
                    if not video:
                        continue
                    
                    # Format duration
                    duration_sec = video.get('duration', 0)
                    if duration_sec:
                        hours = duration_sec // 3600
                        minutes = (duration_sec % 3600) // 60
                        seconds = duration_sec % 60
                        if hours > 0:
                            duration = f"{hours}h {minutes}m"
                        elif minutes > 0:
                            duration = f"{minutes}m {seconds}s"
                        else:
                            duration = f"{seconds}s"
                    else:
                        duration = "N/A"
                    
                    resources.append(
                        LearningResource(
                            title=video.get('title', 'Unknown'),
                            url=f"https://www.youtube.com/watch?v={video.get('id', '')}",
                            platform="YouTube",
                            thumbnail=video.get('thumbnail', None),
                            duration=duration,
                            is_free=True,
                            rating=None,
                            instructor=video.get('channel', 'Unknown')
                        )
                    )
            
            logger.info(f"Fetched {len(resources)} resources for {skill}")
            return resources[:max_results]
            
        except Exception as e:
            logger.error(f"Failed to fetch resources for {skill}: {e}")
            return []

# Singleton instance
gap_analyzer = GapAnalyzer()
