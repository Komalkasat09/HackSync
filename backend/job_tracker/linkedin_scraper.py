"""
Job Scraper using JobSpy library
Scrapes jobs from LinkedIn, Indeed, ZipRecruiter, and Glassdoor
GitHub: https://github.com/speedyapply/JobSpy
"""

from jobspy import scrape_jobs
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import logging
import pandas as pd

logger = logging.getLogger(__name__)


class JobSpyScraper:
    def __init__(self):
        self.supported_sites = ["linkedin", "indeed", "zip_recruiter", "glassdoor"]
    
    def scrape_jobs(
        self,
        search_term: str,
        location: str = "",
        results_wanted: int = 20,
        site_name: List[str] = None,
        job_type: str = None,
        is_remote: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs using JobSpy library
        
        Args:
            search_term: Job search keywords (e.g., "software engineer")
            location: Location (e.g., "United States", "India")
            results_wanted: Number of jobs to fetch
            site_name: List of sites to scrape ["linkedin", "indeed", "zip_recruiter", "glassdoor"]
            job_type: "fulltime", "parttime", "internship", "contract"
            is_remote: Filter for remote jobs only
            
        Returns:
            List of job dictionaries
        """
        try:
            if site_name is None:
                site_name = ["linkedin", "indeed"]
            
            logger.info(f"🔍 Scraping jobs for: {search_term} in {location or 'All Locations'}")
            logger.info(f"📊 Target: {results_wanted} jobs from {', '.join(site_name)}")
            logger.info(f"🏠 Remote only: {is_remote}")
            
            # Scrape jobs synchronously
            jobs_df = scrape_jobs(
                site_name=site_name,
                search_term=search_term,
                location=location,
                results_wanted=results_wanted,
                hours_old=72,  # Jobs posted in last 72 hours
                country_indeed="India" if "india" in location.lower() else "USA",
                job_type=job_type,
                is_remote=is_remote
            )
            
            if jobs_df is None or jobs_df.empty:
                logger.warning(f"⚠️ No jobs found for {search_term}")
                return []
            
            # Convert DataFrame to list of dicts
            jobs_list = jobs_df.to_dict('records')
            logger.info(f"✅ Found {len(jobs_list)} jobs")
            
            return jobs_list
            
        except Exception as e:
            logger.error(f"❌ Error scraping jobs: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return []
    
    def parse_jobspy_result(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse JobSpy result into our job schema format
        
        Args:
            job_data: Raw job data from JobSpy
            
        Returns:
            Parsed job dictionary matching our schema
        """
        try:
            # JobSpy provides clean data already
            title = str(job_data.get("title", "")).strip()
            company = str(job_data.get("company", "Unknown Company")).strip()
            location = str(job_data.get("location", "Not specified")).strip()
            description = str(job_data.get("description", ""))
            url = str(job_data.get("job_url", ""))
            
            # Extract salary - JobSpy provides min_amount and max_amount
            salary = None
            min_salary = job_data.get("min_amount")
            max_salary = job_data.get("max_amount")
            interval = job_data.get("interval", "")
            currency = job_data.get("currency", "")
            
            if min_salary and max_salary:
                salary = f"{currency}{min_salary:,.0f} - {currency}{max_salary:,.0f} {interval}"
            elif min_salary:
                salary = f"{currency}{min_salary:,.0f}+ {interval}"
            
            # JobSpy provides job_type directly
            job_type = str(job_data.get("job_type", "fulltime")).lower()
            if job_type == "fulltime":
                job_type = "full-time"
            elif job_type == "parttime":
                job_type = "part-time"
            
            experience_level = "Not specified"
            is_remote = job_data.get("is_remote", False)
            
            description_lower = description.lower()
            title_lower = title.lower()
            
            # Detect experience level from title and description
            if any(term in title_lower for term in ["intern", "internship"]):
                experience_level = "Internship"
                job_type = "internship"
            elif any(term in title_lower + description_lower for term in ["entry", "junior", "graduate", "fresher"]):
                experience_level = "Entry level"
            elif any(term in title_lower for term in ["senior", "sr.", "lead", "principal", "staff"]):
                experience_level = "Senior"
            elif any(term in title_lower + description_lower for term in ["mid", "intermediate"]):
                experience_level = "Mid-Senior level"
            
            # Extract skills from description
            skill_keywords = [
                "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "Angular", "Vue.js",
                "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "Scala",
                "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "CI/CD",
                "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
                "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
                "React Native", "Flutter", "iOS", "Android", "Mobile Development",
                "Git", "Agile", "Scrum", "REST API", "GraphQL", "Microservices",
                "Django", "Flask", "FastAPI", "Spring Boot", "Express.js",
                "HTML", "CSS", "Sass", "Tailwind", "Bootstrap",
                "Linux", "Unix", "Bash", "Shell Scripting",
                "Data Science", "Data Analysis", "Pandas", "NumPy", "Tableau", "Power BI",
                "AI", "Artificial Intelligence", "LLM", "Generative AI"
            ]
            
            required_skills = []
            full_text = f"{title} {description}".lower()
            
            for skill in skill_keywords:
                if skill.lower() in full_text:
                    required_skills.append(skill)
            
            # Remove duplicates
            required_skills = list(set(required_skills))
            
            # Generate unique job ID from URL or fallback
            job_id = str(job_data.get("job_id", hashlib.md5(f"{company}_{title}_{url}".encode()).hexdigest()))
            
            # JobSpy provides the source site
            source = str(job_data.get("site", "unknown")).lower()
            
            # Get posted date
            date_posted = job_data.get("date_posted")
            if date_posted and hasattr(date_posted, 'isoformat'):
                posted_date = date_posted.isoformat()
            else:
                posted_date = str(date_posted) if date_posted else datetime.utcnow().isoformat()
            
            # Company URL from JobSpy
            company_url = str(job_data.get("company_url", ""))
            
            # Build the parsed job
            parsed_job = {
                "job_id": job_id,
                "title": title,
                "company": company,
                "location": location,
                "description": description,
                "required_skills": required_skills,
                "salary": salary,
                "job_type": job_type,
                "experience_level": experience_level,
                "url": url,
                "apply_link": url,
                "source": source,
                "posted_date": posted_date,
                "scraped_at": datetime.utcnow().isoformat(),
                "is_remote": is_remote,
                "company_info": {
                    "name": company,
                    "url": company_url
                } if company_url else None
            }
            
            return parsed_job
            
        except Exception as e:
            logger.error(f"❌ Error parsing job: {str(e)}")
            logger.error(f"Job data: {job_data}")
            return None
    
    async def scrape_jobs_by_keywords(
        self, 
        keywords_list: List[str],
        locations: List[str] = [""],
        max_jobs_per_search: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs for multiple keywords and locations
        
        Args:
            keywords_list: List of job search keywords
            locations: List of locations to search in
            max_jobs_per_search: Max jobs per keyword-location combination
            
        Returns:
            List of parsed jobs
        """
        all_jobs = []
        
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        
        for keyword in keywords_list:
            for location in locations:
                try:
                    logger.info(f"🔍 Searching: {keyword} in {location or 'All Locations'}")
                    
                    # Run JobSpy scraping in thread pool (it's synchronous)
                    raw_jobs = await loop.run_in_executor(
                        None,
                        self.scrape_jobs,
                        keyword,
                        location,
                        max_jobs_per_search,
                        ["linkedin", "indeed"],  # Scrape from both sites
                        None,  # job_type
                        False  # is_remote
                    )
                    
                    # Parse each job
                    for raw_job in raw_jobs:
                        parsed_job = self.parse_jobspy_result(raw_job)
                        if parsed_job:
                            all_jobs.append(parsed_job)
                    
                    # Small delay between searches
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(f"❌ Error scraping {keyword} in {location}: {str(e)}")
                    continue
        
        # Remove duplicates based on job_id
        unique_jobs = {}
        for job in all_jobs:
            unique_jobs[job["job_id"]] = job
        
        logger.info(f"✅ Total unique jobs scraped: {len(unique_jobs)}")
        return list(unique_jobs.values())


# Singleton instance
job_scraper = JobSpyScraper()
