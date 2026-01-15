"""
Job Matching Algorithm
Calculates relevance score between user skills and job requirements
Advanced scoring based on skill matching, experience, and data completeness
"""
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class JobMatcher:
    """Match jobs to user skills with advanced scoring"""
    
    @staticmethod
    def is_nan_or_empty(value: Any) -> bool:
        """
        Check if a value is NaN, None, empty, or placeholder text
        """
        if value is None:
            return True
        
        # Convert to string for checking
        str_value = str(value).strip().lower()
        
        # Check for various empty/nan representations
        nan_values = [
            "", "nan", "none", "null", "n/a", "na", 
            "not specified", "unknown", "unknown company",
            "not available", "undefined"
        ]
        
        return str_value in nan_values
    
    @staticmethod
    def count_nan_fields(job: Dict[str, Any]) -> int:
        """
        Count number of important fields that are NaN/empty
        Lower count = better data quality
        """
        nan_count = 0
        
        # Critical fields to check
        important_fields = [
            "company", "location", "title", "job_type",
            "experience_level", "salary", "description"
        ]
        
        for field in important_fields:
            value = job.get(field)
            if JobMatcher.is_nan_or_empty(value):
                nan_count += 1
            elif field == "description" and isinstance(value, str) and len(value.strip()) < 50:
                nan_count += 0.5  # Partial penalty for very short descriptions
        
        return nan_count
    
    @staticmethod
    def calculate_data_completeness_score(job: Dict[str, Any]) -> int:
        """
        Calculate completeness score (0-20) based on available job data
        Prioritizes jobs with complete information and NO NaN values
        """
        score = 0
        
        # Company name present and not NaN (5 points)
        company = job.get("company")
        if not JobMatcher.is_nan_or_empty(company):
            score += 5
        
        # Location specified and not NaN (4 points)
        location = job.get("location")
        if not JobMatcher.is_nan_or_empty(location):
            score += 4
        
        # Salary information present (3 points)
        salary = job.get("salary")
        if not JobMatcher.is_nan_or_empty(salary):
            score += 3
        
        # Job type specified (2 points)
        job_type = job.get("job_type")
        if not JobMatcher.is_nan_or_empty(job_type):
            score += 2
        
        # Experience level specified (2 points)
        exp_level = job.get("experience_level")
        if not JobMatcher.is_nan_or_empty(exp_level):
            score += 2
        
        # Company info available (2 points)
        company_info = job.get("company_info")
        if company_info and isinstance(company_info, dict) and len(company_info) > 0:
            score += 2
        
        # Description present and substantial (2 points)
        description = job.get("description")
        if not JobMatcher.is_nan_or_empty(description) and isinstance(description, str) and len(description.strip()) > 100:
            score += 2
        
        return score
    
    @staticmethod
    def calculate_skill_match_score(user_skills: List[str], job_skills: List[str]) -> Dict[str, Any]:
        """
        Calculate detailed skill match score (0-70) with weighted matching
        
        Returns:
            - match_score: Score (0-70)
            - matched_skills: Skills user has that job requires
            - missing_skills: Skills job requires that user doesn't have
            - match_percentage: Percentage of required skills matched
        """
        # Ensure valid input
        if not user_skills or not isinstance(user_skills, list):
            user_skills = []
        if not job_skills or not isinstance(job_skills, list):
            job_skills = []
        
        # Filter out None/empty values
        user_skills = [s for s in user_skills if s and isinstance(s, str)]
        job_skills = [s for s in job_skills if s and isinstance(s, str)]
        
        if not user_skills:
            return {
                "match_score": 0,
                "matched_skills": [],
                "missing_skills": job_skills,
                "match_percentage": 0
            }
        
        if not job_skills:
            # If no specific skills required, give moderate base score
            return {
                "match_score": 35,
                "matched_skills": [],
                "missing_skills": [],
                "match_percentage": 50
            }
        
        # Normalize skills (lowercase for comparison)
        user_skills_normalized = {s.lower().strip(): s for s in user_skills}
        job_skills_normalized = [(s, s.lower().strip()) for s in job_skills]
        
        # Find matches with different match levels
        exact_matches = []
        partial_matches = []
        missing = []
        
        for job_skill, job_skill_normalized in job_skills_normalized:
            matched = False
            
            # Check for exact match
            if job_skill_normalized in user_skills_normalized:
                exact_matches.append(job_skill)
                matched = True
            else:
                # Check for partial match (e.g., "React" matches "React.js")
                for user_skill_norm, user_skill_orig in user_skills_normalized.items():
                    if (job_skill_normalized in user_skill_norm or 
                        user_skill_norm in job_skill_normalized):
                        partial_matches.append(job_skill)
                        matched = True
                        break
            
            if not matched:
                missing.append(job_skill)
        
        # Calculate weighted score
        total_required = len(job_skills)
        exact_weight = 1.0  # Full credit
        partial_weight = 0.7  # 70% credit
        
        weighted_matches = (len(exact_matches) * exact_weight + 
                          len(partial_matches) * partial_weight)
        
        # Base skill match score (0-60 points)
        if total_required > 0:
            match_percentage = (weighted_matches / total_required) * 100
            base_score = (match_percentage / 100) * 60
        else:
            match_percentage = 50
            base_score = 30
        
        # Bonus for having additional relevant skills (up to 10 points)
        matched_count = len(exact_matches) + len(partial_matches)
        if matched_count > 0:
            extra_skills = len(user_skills) - matched_count
            if extra_skills > 0:
                bonus = min(10, extra_skills * 1.5)
                base_score += bonus
        
        # Cap at 70 points for skill matching
        final_score = min(70, base_score)
        
        all_matched = exact_matches + partial_matches
        
        return {
            "match_score": round(final_score, 1),
            "matched_skills": all_matched,
            "missing_skills": missing,
            "match_percentage": round(match_percentage, 1)
        }
    
    @staticmethod
    def calculate_title_relevance_score(job_title: str, user_skills: List[str], user_interests: List[str] = None) -> int:
        """
        Calculate relevance based on job title matching user profile (0-10)
        """
        if not job_title or not isinstance(job_title, str):
            return 0
        
        title_lower = job_title.strip().lower() if job_title else ""
        if not title_lower:
            return 0
        score = 0
        
        # Check if job title contains user skills
        user_skills_lower = [s.lower() for s in user_skills] if user_skills else []
        for skill in user_skills_lower:
            if skill in title_lower:
                score += 3
                break
        
        # Check if job title matches user interests
        if user_interests:
            user_interests_lower = [i.lower() for i in user_interests]
            for interest in user_interests_lower:
                if interest in title_lower:
                    score += 3
                    break
        
        # Bonus for senior/lead positions if user has many skills
        if len(user_skills) >= 8:
            if any(term in title_lower for term in ["senior", "lead", "principal", "staff"]):
                score += 2
        
        # Bonus for entry level if user has few skills
        if len(user_skills) <= 3:
            if any(term in title_lower for term in ["junior", "entry", "intern", "graduate"]):
                score += 2
        
        return min(10, score)
    
    @staticmethod
    def calculate_comprehensive_match_score(
        job: Dict[str, Any], 
        user_skills: List[str],
        user_interests: List[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive match score (1-100) combining multiple factors:
        - Skill matching: 0-70 points
        - Data completeness: 0-20 points
        - Title relevance: 0-10 points
        
        Returns job with enhanced scoring information
        """
        job_skills = job.get("required_skills", []) or []
        job_title = job.get("title", "") or ""
        
        # Ensure we have valid data types
        if not isinstance(job_skills, list):
            job_skills = []
        if not isinstance(job_title, str):
            job_title = ""
        
        # Calculate component scores
        skill_match = JobMatcher.calculate_skill_match_score(user_skills, job_skills)
        completeness_score = JobMatcher.calculate_data_completeness_score(job)
        title_score = JobMatcher.calculate_title_relevance_score(job_title, user_skills, user_interests)
        
        # Total score (1-100)
        total_score = skill_match["match_score"] + completeness_score + title_score
        
        # Ensure minimum score of 1 if there's any data
        if total_score < 1 and (user_skills or job_skills):
            total_score = 1
        
        # Cap at 100
        total_score = min(100, round(total_score, 1))
        
        return {
            "match_score": total_score,
            "matched_skills": skill_match["matched_skills"],
            "missing_skills": skill_match["missing_skills"],
            "match_percentage": skill_match["match_percentage"],
            "completeness_score": completeness_score,
            "title_relevance_score": title_score,
            "skill_match_score": skill_match["match_score"]
        }
    
    @staticmethod
    def rank_jobs(
        jobs: List[Dict[str, Any]], 
        user_skills: List[str],
        user_interests: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Rank jobs with strict priority:
        1. Jobs with NO NaN values first (sorted by match score)
        2. Jobs with fewer NaN values next (sorted by match score within each group)
        3. Jobs with many NaN values last
        
        Returns list of jobs with match_score and detailed scoring breakdown
        """
        ranked_jobs = []
        
        for job in jobs:
            try:
                # Count NaN fields
                nan_count = JobMatcher.count_nan_fields(job)
                
                match_data = JobMatcher.calculate_comprehensive_match_score(
                    job, user_skills, user_interests
                )
                
                ranked_job = {
                    **job,
                    "match_score": match_data["match_score"],
                    "matched_skills": match_data["matched_skills"],
                    "missing_skills": match_data["missing_skills"],
                    "match_percentage": match_data.get("match_percentage", 0),
                    "completeness_score": match_data["completeness_score"],
                    "nan_count": nan_count,
                    "has_complete_data": nan_count == 0,  # Perfect data = no NaN fields
                    "has_good_data": nan_count <= 2  # Good data = max 2 missing fields
                }
                ranked_jobs.append(ranked_job)
            except Exception as e:
                logger.error(f"Error scoring job {job.get('job_id', 'unknown')}: {str(e)}")
                # Add job with minimal score if scoring fails
                ranked_job = {
                    **job,
                    "match_score": 1,
                    "matched_skills": [],
                    "missing_skills": [],
                    "match_percentage": 0,
                    "completeness_score": 0,
                    "nan_count": 99,
                    "has_complete_data": False,
                    "has_good_data": False
                }
                ranked_jobs.append(ranked_job)
        
        # Sort by NaN count (ascending - less NaN first), then by match score (descending - higher score first)
        ranked_jobs.sort(
            key=lambda x: (x["nan_count"], -x["match_score"])
        )
        
        complete_count = sum(1 for j in ranked_jobs if j["has_complete_data"])
        good_count = sum(1 for j in ranked_jobs if j["has_good_data"])
        
        logger.info(f"Ranked {len(ranked_jobs)} jobs by data quality and match score")
        logger.info(f"Perfect jobs (no NaN): {complete_count}")
        logger.info(f"Good jobs (≤2 NaN): {good_count}")
        
        return ranked_jobs

# Singleton instance
job_matcher = JobMatcher()
