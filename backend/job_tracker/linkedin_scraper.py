"""
LinkedIn Job Scraper using Apify API
Uses the LinkedIn Jobs Scraper actor to fetch job postings
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import logging
from config import Settings

logger = logging.getLogger(__name__)
settings = Settings()

APIFY_API_KEY = settings.APIFY_API_KEY
APIFY_ACTOR_ID = "curious_coder/linkedin-jobs-scraper"
APIFY_API_BASE = "https://api.apify.com/v2"


class LinkedInScraper:
    def __init__(self):
        self.api_key = APIFY_API_KEY
        self.actor_id = APIFY_ACTOR_ID
        
    async def search_linkedin_jobs(
        self, 
        keywords: str, 
        location: str = "",
        max_jobs: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search LinkedIn jobs using Apify actor
        
        Args:
            keywords: Job search keywords (e.g., "software engineer")
            location: Location filter (e.g., "United States")
            max_jobs: Maximum number of jobs to fetch
            
        Returns:
            List of job dictionaries from Apify
        """
        try:
            # Construct LinkedIn search URL
            search_query = keywords.replace(" ", "%20")
            location_query = location.replace(" ", "%20") if location else ""
            
            # Build LinkedIn jobs search URL
            if location_query:
                linkedin_url = f"https://www.linkedin.com/jobs/search/?keywords={search_query}&location={location_query}&pageNum=0"
            else:
                linkedin_url = f"https://www.linkedin.com/jobs/search/?keywords={search_query}&pageNum=0"
            
            logger.info(f"🔍 Searching LinkedIn for: {keywords} in {location or 'All Locations'}")
            logger.info(f"📊 Max jobs to fetch: {max_jobs}")
            
            # Prepare Apify actor input with correct parameter names
            actor_input = {
                "urls": [linkedin_url],
                "maxJobsPerQuery": max_jobs,
                "scrapeCompanyDetails": True
            }
            
            # Start the actor run
            async with httpx.AsyncClient(timeout=120.0) as client:
                # Start actor - use the correct API endpoint format
                start_url = f"{APIFY_API_BASE}/acts/curious_coder~linkedin-jobs-scraper/runs?token={self.api_key}"
                logger.info(f"🚀 Starting Apify actor run...")
                
                start_response = await client.post(
                    start_url,
                    json=actor_input
                )
                
                if start_response.status_code != 201:
                    logger.error(f"❌ Failed to start actor: {start_response.status_code}")
                    logger.error(f"Response: {start_response.text}")
                    return []
                
                run_data = start_response.json()
                run_id = run_data["data"]["id"]
                logger.info(f"✅ Actor run started: {run_id}")
                
                # Wait for actor to finish with early check
                run_url = f"{APIFY_API_BASE}/actor-runs/{run_id}?token={self.api_key}"
                dataset_url_template = f"{APIFY_API_BASE}/actor-runs/{run_id}/dataset/items?token={self.api_key}"
                max_wait = 120  # 2 minutes max wait
                wait_time = 0
                abort_url = f"{APIFY_API_BASE}/actor-runs/{run_id}/abort?token={self.api_key}"
                
                while wait_time < max_wait:
                    await asyncio.sleep(5)
                    wait_time += 5
                    
                    status_response = await client.get(run_url)
                    if status_response.status_code != 200:
                        logger.error(f"❌ Failed to check run status: {status_response.status_code}")
                        return []
                    
                    status_data = status_response.json()
                    status = status_data["data"]["status"]
                    
                    # Check if we have enough jobs already and abort
                    if status == "RUNNING":
                        check_response = await client.get(dataset_url_template)
                        if check_response.status_code == 200:
                            current_jobs = check_response.json()
                            if len(current_jobs) >= max_jobs:
                                logger.info(f"🛑 Found {len(current_jobs)} jobs, aborting actor run...")
                                await client.post(abort_url)
                                await asyncio.sleep(2)  # Wait for abort
                                break
                    
                    if status == "SUCCEEDED":
                        logger.info(f"✅ Actor run completed successfully!")
                        break
                    elif status in ["FAILED", "TIMED-OUT"]:
                        logger.error(f"❌ Actor run {status}")
                        return []
                    elif status == "ABORTED":
                        logger.info(f"✅ Actor run aborted after collecting enough jobs")
                        break
                    
                    logger.info(f"⏳ Waiting for actor to complete... ({wait_time}s)")
                
                if wait_time >= max_wait:
                    logger.warning(f"⚠️ Actor still running after {max_wait}s, aborting...")
                    await client.post(abort_url)
                    await asyncio.sleep(2)
                
                # Get results from dataset (limit to max_jobs)
                dataset_id = status_data["data"]["defaultDatasetId"]
                dataset_url = f"{APIFY_API_BASE}/datasets/{dataset_id}/items?token={self.api_key}&limit={max_jobs}"
                
                results_response = await client.get(dataset_url)
                if results_response.status_code != 200:
                    logger.error(f"❌ Failed to fetch results: {results_response.status_code}")
                    return []
                
                jobs = results_response.json()
                # Extra safety: limit results
                jobs = jobs[:max_jobs]
                logger.info(f"✅ Fetched {len(jobs)} jobs from LinkedIn (limited to {max_jobs})")
                return jobs
                
        except Exception as e:
            logger.error(f"❌ Error searching LinkedIn jobs: {str(e)}")
            return []
    
    async def parse_linkedin_job(self, apify_job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Apify LinkedIn job result into our job schema format
        
        Args:
            apify_job: Raw job data from Apify actor
            
        Returns:
            Parsed job dictionary matching our schema
        """
        try:
            # Extract basic fields
            title = apify_job.get("title", "").strip()
            company = apify_job.get("company", "Unknown Company").strip()
            location = apify_job.get("location", "Not specified").strip()
            description = apify_job.get("description", "")
            url = apify_job.get("link", "")
            
            # Extract salary if available
            salary = None
            salary_info = apify_job.get("salary")
            if salary_info:
                salary = str(salary_info).strip()
            
            # Parse job type and experience level from description or seniority
            job_type = "full-time"
            experience_level = "Not specified"
            
            description_lower = description.lower()
            
            # Detect job type
            if any(term in description_lower for term in ["intern", "internship"]):
                job_type = "internship"
            elif any(term in description_lower for term in ["contract", "contractor"]):
                job_type = "contract"
            elif any(term in description_lower for term in ["part-time", "part time"]):
                job_type = "part-time"
            
            # Detect experience level
            seniority = apify_job.get("seniority", "").lower()
            if seniority:
                experience_level = seniority.title()
            elif any(term in description_lower for term in ["entry level", "junior", "graduate"]):
                experience_level = "Entry level"
            elif any(term in description_lower for term in ["senior", "lead", "principal"]):
                experience_level = "Senior"
            elif any(term in description_lower for term in ["mid-level", "intermediate"]):
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
                "Data Science", "Data Analysis", "Pandas", "NumPy", "Tableau", "Power BI"
            ]
            
            required_skills = []
            full_text = f"{title} {description}".lower()
            
            for skill in skill_keywords:
                if skill.lower() in full_text:
                    required_skills.append(skill)
            
            # Remove duplicates and limit to unique skills
            required_skills = list(set(required_skills))
            
            # Generate unique job ID
            job_id = hashlib.md5(f"{company}_{title}_{url}".encode()).hexdigest()
            
            # Extract application link
            apply_link = apify_job.get("applyLink") or url
            
            # Extract company details if available
            company_details = apify_job.get("companyDetails", {})
            company_info = None
            if company_details:
                company_info = {
                    "name": company_details.get("name", company),
                    "description": company_details.get("description", ""),
                    "website": company_details.get("website", ""),
                    "industry": company_details.get("industry", ""),
                    "company_size": company_details.get("companySize", ""),
                    "headquarters": company_details.get("headquarters", "")
                }
            
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
                "apply_link": apply_link,
                "source": "linkedin",
                "posted_date": apify_job.get("postedTime", datetime.utcnow().isoformat()),
                "scraped_at": datetime.utcnow().isoformat(),
                "company_info": company_info,
                "raw_data": {
                    "applicants": apify_job.get("applicants"),
                    "seniority": apify_job.get("seniority"),
                    "employment_type": apify_job.get("employmentType"),
                    "job_functions": apify_job.get("jobFunctions"),
                    "industries": apify_job.get("industries")
                }
            }
            
            return parsed_job
            
        except Exception as e:
            logger.error(f"❌ Error parsing LinkedIn job: {str(e)}")
            return None
    
    async def scrape_jobs_by_keywords(
        self, 
        keywords_list: List[str],
        locations: List[str] = [""],
        max_jobs_per_search: int = 50
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
        
        for keyword in keywords_list:
            for location in locations:
                logger.info(f"🔍 Searching: {keyword} in {location or 'All Locations'}")
                
                # Search LinkedIn
                raw_jobs = await self.search_linkedin_jobs(
                    keywords=keyword,
                    location=location,
                    max_jobs=max_jobs_per_search
                )
                
                # Parse each job
                for raw_job in raw_jobs:
                    parsed_job = await self.parse_linkedin_job(raw_job)
                    if parsed_job:
                        all_jobs.append(parsed_job)
                
                # Small delay between searches to be respectful
                await asyncio.sleep(2)
        
        # Remove duplicates based on job_id
        unique_jobs = {}
        for job in all_jobs:
            unique_jobs[job["job_id"]] = job
        
        logger.info(f"✅ Total unique jobs scraped: {len(unique_jobs)}")
        return list(unique_jobs.values())


# Singleton instance
linkedin_scraper = LinkedInScraper()
