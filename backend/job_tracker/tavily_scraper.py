"""
Tavily-powered Job Scraper
Searches LinkedIn, Indeed, and Internshala for latest job postings
"""
import os
import httpx
import hashlib
import re
from typing import List, Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class TavilyJobScraper:
    """Scrape job postings using Tavily API"""
    
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        self.base_url = "https://api.tavily.com/search"
        self.cache_duration = timedelta(hours=24)
        
        if not self.api_key:
            logger.warning("⚠ TAVILY_API_KEY not found")
        else:
            logger.info("✓ Tavily Job Scraper initialized")
    
    async def search_jobs(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search for jobs using Tavily API
        Searches broadly for actual job postings, not restricted to specific domains
        """
        if not self.api_key:
            logger.error("❌ Tavily API key not configured")
            return []
        
        try:
            logger.info(f"🔎 Searching: '{query}' (max {max_results} results)")
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "api_key": self.api_key,
                    "query": query + " job posting hiring apply",
                    "search_depth": "advanced",
                    "max_results": max_results,
                    # Remove include_domains to get actual job postings from any source
                    "include_answer": False,
                    "include_raw_content": True
                }
                
                response = await client.post(self.base_url, json=payload)
                response.raise_for_status()
                data = response.json()
                
                results = data.get("results", [])
                
                # Filter out job board listing pages (we want individual job postings)
                filtered_results = []
                for result in results:
                    url = result.get("url", "")
                    title = result.get("title", "").lower()
                    
                    # Skip if it's a jobs listing page
                    if any(x in url.lower() for x in ["/jobs?", "/jobs/", "/q-", "/search"]):
                        if any(x in title for x in ["jobs in", "jobs near", "jobs employment"]):
                            continue
                    
                    filtered_results.append(result)
                
                logger.info(f"   ✓ Found {len(filtered_results)} actual job postings for '{query}'")
                return filtered_results
                return results
                
        except Exception as e:
            logger.error(f"   ✗ Tavily search failed for '{query}': {e}")
            return []
    
    async def scrape_jobs_by_keywords(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Scrape jobs for multiple keywords/job titles
        """
        logger.info(f"🔍 Starting scrape for {len(keywords)} keywords...")
        all_jobs = []
        
        for i, keyword in enumerate(keywords, 1):
            query = f"{keyword} jobs hiring 2026"
            logger.info(f"   [{i}/{len(keywords)}] Searching: {keyword}")
            results = await self.search_jobs(query, max_results=5)
            all_jobs.extend(results)
        
        logger.info(f"📥 Total raw results scraped: {len(all_jobs)} from {len(keywords)} keywords")
        return all_jobs
    
    async def parse_job_posting(self, raw_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Tavily result into structured job data using regex and text parsing
        No AI required - pure text extraction
        """
        try:
            url = raw_result.get("url", "")
            title = raw_result.get("title", "")
            content = raw_result.get("content", "")
            raw_content = raw_result.get("raw_content", "")
            
            # Combine all text for parsing
            full_text = f"{title} {content} {raw_content}"
            
            # Determine source from URL
            source = "other"
            if "linkedin.com" in url:
                source = "linkedin"
            elif "indeed.com" in url:
                source = "indeed"
            elif "internshala.com" in url:
                source = "internshala"
            elif "greenhouse.io" in url:
                source = "greenhouse"
            elif "lever.co" in url:
                source = "lever"
            elif "workday.com" in url:
                source = "workday"
            
            # Generate company from various text patterns
            company_patterns = [
                r'([A-Z][A-Za-z0-9\s&\.]{2,30})\s+is\s+(?:hiring|looking|seeking)',
                r'Join\s+([A-Z][A-Za-z0-9\s&\.]{2,30})\s+(?:as|team)',
                r'Company:\s*([A-Z][A-Za-z0-9\s&\.]{2,30})',
                r'at\s+([A-Z][A-Za-z0-9\s&\.]{2,30})\s*[-|·•]',
                r'Work\s+(?:at|for)\s+([A-Z][A-Za-z0-9\s&\.]{2,30})',
            ]
            for pattern in company_patterns:
                match = re.search(pattern, full_text)
                if match:
                    company = match.group(1).strip()
                    # Remove trailing punctuation
                    company = re.sub(r'[\s\-|·•]+$', '', company)
                    break
            
            # Extract from title if not found (e.g., "Software Engineer - Google")
            if company == "Unknown Company":
                title_company_match = re.search(r'\s+[-–|]\s+([A-Z][A-Za-z0-9\s&\.]{2,30})(?:\s|$)', title)
                if title_company_match:
                    company = title_company_match.group(1).strip()
            
            # Location extraction patterns
            location_patterns = [
                r'Location:\s*([A-Z][a-z]+(?:,\s*[A-Z][A-Za-z\s]+)?)',
                r'(?:in|at)\s+([A-Z][a-z]+,\s*[A-Z]{2}(?:\s|,|$))',
                r'([A-Z][a-z]+,\s*(?:USA|Canada|India|UK|Germany|France))',
                r'\b(Remote|Hybrid|On-site)\b',
                r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s+([A-Z]{2,})\b',
            ]
            for pattern in location_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    location = match.group(1).strip()
                    break
            
            # Extract skills (common tech keywords)
            skill_keywords = [
                'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP',
                'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'FastAPI',
                'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD',
                'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
                'Machine Learning', 'AI', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Science',
                'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
                'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS',
                'Linux', 'Bash', 'Shell', 'DevOps', 'Terraform', 'Ansible'
            ]
            required_skills = []
            for skill in skill_keywords:
                if re.search(r'\b' + re.escape(skill) + r'\b', full_text, re.IGNORECASE):
                    required_skills.append(skill)
            
            # Extract salary
            salary = None
            salary_patterns = [
                r'\$\s*(\d+[,\d]*)\s*-\s*\$?\s*(\d+[,\d]*)',
                r'(\d+[,\d]*)\s*-\s*(\d+[,\d]*)\s*(?:USD|INR|EUR)',
                r'salary:\s*\$?(\d+[,\d]*)',
            ]
            for pattern in salary_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    salary = match.group(0)
                    break
            
            # Extract job type
            job_type = "full-time"
            if re.search(r'\b(internship|intern)\b', full_text, re.IGNORECASE):
                job_type = "internship"
            elif re.search(r'\b(part[- ]time)\b', full_text, re.IGNORECASE):
                job_type = "part-time"
            elif re.search(r'\b(contract|freelance)\b', full_text, re.IGNORECASE):
                job_type = "contract"
            
            # Extract experience level
            experience_level = None
            if re.search(r'\b(entry[- ]level|junior|fresher|0[- ]2 years)\b', full_text, re.IGNORECASE):
                experience_level = "entry"
            elif re.search(r'\b(senior|lead|principal|architect|staff)\b', full_text, re.IGNORECASE):
                experience_level = "senior"
            elif re.search(r'\b(mid[- ]level|intermediate|2[- ]5 years)\b', full_text, re.IGNORECASE):
                experience_level = "mid"
            
            # Build job object
            job_data = {
                "job_id": job_id,
                "title": title,
                "company": company,
                "location": location,
                "description": content[:300] if content else "No description available",
                "required_skills": required_skills[:10],  # Limit to top 10 skills
                "url": url,
                "salary": salary,
                "job_type": job_type,
                "experience_level": experience_level,
                "source": source,
                "posted_date": None,
                "scraped_at": datetime.utcnow().isoformat()
            }
            
            return job_data
            
        except Exception as e:
            logger.error(f"Failed to parse job: {e}")
            # Return basic job data if parsing fails completely
            url = raw_result.get("url", "")
            source = "unknown"
            if "linkedin.com" in url:
                source = "linkedin"
            elif "indeed.com" in url:
                source = "indeed"
            elif "internshala.com" in url:
                source = "internshala"
            
            return {
                "job_id": hashlib.md5(url.encode()).hexdigest()[:16],
                "title": raw_result.get("title", "Job Posting"),
                "company": "Unknown",
                "location": "Not specified",
                "description": raw_result.get("content", "")[:300],
                "required_skills": [],
                "url": url,
                "salary": None,
                "job_type": "unspecified",
                "experience_level": None,
                "source": source,
                "posted_date": None,
                "scraped_at": datetime.utcnow().isoformat()
            }
    
    async def fetch_and_parse_jobs(self, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Complete pipeline: search jobs -> parse each result
        """
        raw_results = await self.scrape_jobs_by_keywords(keywords)
        logger.info(f"🤖 Parsing {len(raw_results)} job postings with AI...")
        parsed_jobs = []
        
        for i, result in enumerate(raw_results, 1):
            logger.info(f"   [{i}/{len(raw_results)}] Parsing: {result.get('title', 'Unknown')[:60]}")
            job_data = await self.parse_job_posting(result)
            parsed_jobs.append(job_data)
        
        logger.info(f"✅ Successfully parsed {len(parsed_jobs)} jobs")
        
        # Log summary
        internships = sum(1 for j in parsed_jobs if j.get('job_type') == 'internship')
        full_time = sum(1 for j in parsed_jobs if j.get('job_type') == 'full-time')
        logger.info(f"📊 Summary: {internships} internships, {full_time} full-time positions")
        
        return parsed_jobs

# Singleton instance
tavily_scraper = TavilyJobScraper()
