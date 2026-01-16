"""
Tavily API Integration for Company Search
Specifically designed for finding company websites and startups
"""
import os
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import re
from urllib.parse import urlparse

class TavilyCompanySearch:
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        self.base_url = "https://api.tavily.com/search"
        self.cache = {}
        self.cache_duration = timedelta(hours=6)
        
    async def search_companies(self, company_type: str, max_results: int = 50) -> List[Dict]:
        """
        Search for companies/startups of a specific type
        Returns list of companies with name, website, and description
        """
        if not self.api_key:
            print("⚠️ TAVILY_API_KEY not found")
            return []
        
        cache_key = f"companies_{hash(company_type)}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.utcnow() - timestamp < self.cache_duration:
                return cached_data
        
        companies = []
        seen_domains = set()
        
        # Multiple search strategies
        search_queries = [
            f"{company_type} startups companies list",
            f"top {company_type} companies 2024",
            f"{company_type} startup directory",
            f"{company_type} companies hiring",
        ]
        
        for query in search_queries:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        self.base_url,
                        json={
                            "api_key": self.api_key,
                            "query": query,
                            "search_depth": "advanced",
                            "max_results": 20,  # Get more results per query
                            "include_answer": False,
                            "include_raw_content": True
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    # Extract companies from results
                    for result in data.get("results", []):
                        company = self._extract_company_from_result(result, company_type)
                        if company and company["domain"] not in seen_domains:
                            seen_domains.add(company["domain"])
                            companies.append({
                                "company_name": company["name"],
                                "website": company["website"],
                                "description": company.get("description")
                            })
                            
                            if len(companies) >= max_results:
                                break
                    
                    if len(companies) >= max_results:
                        break
                        
            except Exception as e:
                print(f"Tavily search error for query '{query}': {e}")
                continue
        
        # Cache the result
        self.cache[cache_key] = (companies, datetime.utcnow())
        return companies
    
    def _extract_company_from_result(self, result: Dict, company_type: str) -> Optional[Dict]:
        """Extract company information from a Tavily search result"""
        title = result.get("title", "")
        url = result.get("url", "")
        content = result.get("content", "")
        
        if not url:
            return None
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "").lower()
            
            # Skip common non-company domains
            skip_domains = [
                "linkedin.com", "indeed.com", "glassdoor.com", "techcrunch.com",
                "forbes.com", "crunchbase.com", "producthunt.com", "github.com",
                "medium.com", "reddit.com", "twitter.com", "facebook.com",
                "x.com", "instagram.com", "youtube.com", "wikipedia.org",
                "angel.co", "wellfound.com", "ycombinator.com", "betapage.co"
            ]
            
            # Check if domain should be skipped
            if any(skip in domain for skip in skip_domains):
                return None
            
            # Extract company name
            company_name = self._extract_company_name(title, domain, content)
            
            # Build website URL
            if not url.startswith("http"):
                website = f"https://{domain}"
            else:
                website = url.split("?")[0].split("#")[0]  # Remove query params and fragments
            
            # Extract description
            description = None
            if content:
                # Try to find company description in content
                sentences = content.split(". ")
                for sentence in sentences[:3]:
                    if any(word in sentence.lower() for word in ["company", "startup", "founded", "provides", "offers"]):
                        description = sentence[:200]
                        break
                if not description:
                    description = content[:200]
            
            return {
                "name": company_name,
                "domain": domain,
                "website": website,
                "description": description
            }
            
        except Exception as e:
            print(f"Error extracting company from result: {e}")
            return None
    
    def _extract_company_name(self, title: str, domain: str, content: str) -> str:
        """Extract company name from title, domain, or content"""
        # Try to extract from title first
        if title:
            # Remove common prefixes/suffixes
            title_clean = re.sub(r'^(Top|Best|List of|The)\s+', '', title, flags=re.IGNORECASE)
            title_clean = re.sub(r'\s+(Startups|Companies|List|Directory).*$', '', title_clean, flags=re.IGNORECASE)
            
            # If title looks like a company name (short, no special chars)
            if len(title_clean.split()) <= 3 and not any(char in title_clean for char in ['|', '-', ':', '–']):
                return title_clean.strip()
        
        # Extract from domain
        if domain:
            domain_parts = domain.split(".")
            if len(domain_parts) >= 2:
                company_from_domain = domain_parts[0].capitalize()
                # Clean up common domain prefixes
                company_from_domain = re.sub(r'^(www|app|get|try|use)', '', company_from_domain, flags=re.IGNORECASE)
                if company_from_domain:
                    return company_from_domain.capitalize()
        
        # Try to extract from content
        if content:
            # Look for patterns like "CompanyName is a..." or "CompanyName, a..."
            patterns = [
                r'([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)\s+(?:is|was|provides|offers)',
                r'([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?),\s+(?:a|an)',
            ]
            for pattern in patterns:
                match = re.search(pattern, content)
                if match:
                    name = match.group(1).strip()
                    if len(name.split()) <= 3:
                        return name
        
        # Fallback: use domain name
        if domain:
            return domain.split(".")[0].capitalize()
        
        return "Company"

# Singleton instance
tavily_company_search = TavilyCompanySearch()

