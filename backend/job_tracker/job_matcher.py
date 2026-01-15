"""
Job Matching Algorithm
Calculates relevance score between user skills and job requirements
"""
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class JobMatcher:
    """Match jobs to user skills with scoring"""
    
    @staticmethod
    def calculate_match_score(user_skills: List[str], job_skills: List[str]) -> Dict[str, Any]:
        """
        Calculate match percentage between user skills and job requirements
        
        Returns:
            - match_score: Percentage (0-100)
            - matched_skills: Skills user has that job requires
            - missing_skills: Skills job requires that user doesn't have
        """
        if not user_skills:
            return {
                "match_score": 0.0,
                "matched_skills": [],
                "missing_skills": job_skills
            }
        
        if not job_skills:
            # If no specific skills required, give base score
            return {
                "match_score": 50.0,
                "matched_skills": [],
                "missing_skills": []
            }
        
        # Normalize skills (lowercase for comparison)
        user_skills_normalized = [s.lower().strip() for s in user_skills]
        job_skills_normalized = [s.lower().strip() for s in job_skills]
        
        # Find matches
        matched = []
        missing = []
        
        for job_skill in job_skills:
            job_skill_normalized = job_skill.lower().strip()
            
            # Check for exact match or partial match
            is_matched = False
            for user_skill in user_skills_normalized:
                # Exact match
                if job_skill_normalized == user_skill:
                    matched.append(job_skill)
                    is_matched = True
                    break
                # Partial match (e.g., "React" matches "React.js")
                elif job_skill_normalized in user_skill or user_skill in job_skill_normalized:
                    matched.append(job_skill)
                    is_matched = True
                    break
            
            if not is_matched:
                missing.append(job_skill)
        
        # Calculate score
        if len(job_skills) == 0:
            match_score = 50.0
        else:
            match_score = (len(matched) / len(job_skills)) * 100
        
        # Bonus for having extra relevant skills
        if len(matched) > 0 and len(user_skills) > len(job_skills):
            bonus = min(10, (len(user_skills) - len(job_skills)) * 2)
            match_score = min(100, match_score + bonus)
        
        return {
            "match_score": round(match_score, 1),
            "matched_skills": matched,
            "missing_skills": missing
        }
    
    @staticmethod
    def rank_jobs(jobs: List[Dict[str, Any]], user_skills: List[str]) -> List[Dict[str, Any]]:
        """
        Rank jobs by relevance score
        
        Returns list of jobs with match_score, matched_skills, missing_skills added
        """
        ranked_jobs = []
        
        for job in jobs:
            job_skills = job.get("required_skills", [])
            match_data = JobMatcher.calculate_match_score(user_skills, job_skills)
            
            ranked_job = {
                **job,
                "match_score": match_data["match_score"],
                "matched_skills": match_data["matched_skills"],
                "missing_skills": match_data["missing_skills"]
            }
            ranked_jobs.append(ranked_job)
        
        # Sort by match score (highest first)
        ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
        
        logger.info(f"Ranked {len(ranked_jobs)} jobs by relevance")
        return ranked_jobs

# Singleton instance
job_matcher = JobMatcher()
