"""
Company Finder Scraper
Scrapes from multiple sources to find company URLs
Uses Tavily + direct website scraping to get 100+ companies
"""
import os
import httpx
import aiohttp
from typing import List, Dict, Set, Optional
from urllib.parse import urlparse
import re
from bs4 import BeautifulSoup
import asyncio

class CompanyFinder:
    def __init__(self):
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.tavily_base_url = "https://api.tavily.com/search"
        self.seen_domains: Set[str] = set()
        
    async def find_companies(self, company_type: str, target_count: int = 100) -> List[Dict]:
        """
        Find companies from multiple sources
        Returns list of companies with name and website URL
        """
        companies = []
        self.seen_domains.clear()
        
        # Strategy 1: Tavily search (multiple queries)
        print(f"🔍 Searching Tavily for {company_type} companies...")
        tavily_companies = await self._search_tavily(company_type, max_results=50)
        companies.extend(tavily_companies)
        print(f"   ✓ Found {len(tavily_companies)} companies from Tavily")
        
        # Strategy 2: Scrape from known startup directories
        if len(companies) < target_count:
            print(f"🌐 Scraping startup directories...")
            directory_companies = await self._scrape_startup_directories(company_type, max_results=50)
            companies.extend(directory_companies)
            print(f"   ✓ Found {len(directory_companies)} companies from directories")
        
        # Strategy 3: Scrape from Crunchbase-style pages (via Tavily)
        if len(companies) < target_count:
            print(f"📊 Searching company databases...")
            db_companies = await self._search_company_databases(company_type, max_results=30)
            companies.extend(db_companies)
            print(f"   ✓ Found {len(db_companies)} companies from databases")
        
        # Strategy 4: Scrape from news articles mentioning companies
        if len(companies) < target_count:
            print(f"📰 Searching news articles...")
            news_companies = await self._search_news_articles(company_type, max_results=30)
            companies.extend(news_companies)
            print(f"   ✓ Found {len(news_companies)} companies from news")
        
        # Remove duplicates and return
        unique_companies = []
        seen = set()
        for company in companies:
            domain = company.get("domain", "")
            if domain and domain not in seen:
                seen.add(domain)
                unique_companies.append(company)
        
        print(f"✅ Total unique companies found: {len(unique_companies)}")
        return unique_companies[:target_count]
    
    async def _search_tavily(self, company_type: str, max_results: int = 50) -> List[Dict]:
        """Search using Tavily API with multiple queries"""
        if not self.tavily_api_key:
            return []
        
        companies = []
        queries = [
            f"{company_type} startups companies list",
            f"top {company_type} companies 2024 2025",
            f"{company_type} startup directory website",
            f"{company_type} companies hiring careers",
            f"best {company_type} startups",
        ]
        
        for query in queries:
            if len(companies) >= max_results:
                break
                
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        self.tavily_base_url,
                        json={
                            "api_key": self.tavily_api_key,
                            "query": query,
                            "search_depth": "advanced",
                            "max_results": 20,
                            "include_answer": False,
                            "include_raw_content": True
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    for result in data.get("results", []):
                        company = self._extract_company_from_result(result, company_type)
                        if company and company["domain"] not in self.seen_domains:
                            self.seen_domains.add(company["domain"])
                            companies.append(company)
                            
            except Exception as e:
                print(f"   ⚠ Tavily query failed: {e}")
                continue
        
        return companies
    
    async def _scrape_startup_directories(self, company_type: str, max_results: int = 50) -> List[Dict]:
        """Scrape from known startup directory websites"""
        companies = []
        
        # List of startup directory URLs to scrape
        directory_urls = [
            f"https://www.producthunt.com/search?q={company_type}",
            f"https://www.crunchbase.com/discover/organization.companies/{company_type}",
            f"https://www.angellist.com/search?q={company_type}",
            f"https://www.betalist.com/?search={company_type}",
            f"https://www.startupbase.io/search?q={company_type}",
        ]
        
        tasks = [self._scrape_directory_page(url, company_type) for url in directory_urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                for company in result:
                    if company["domain"] not in self.seen_domains:
                        self.seen_domains.add(company["domain"])
                        companies.append(company)
                        if len(companies) >= max_results:
                            break
        
        return companies[:max_results]
    
    async def _scrape_directory_page(self, url: str, company_type: str) -> List[Dict]:
        """Scrape a single directory page for company links"""
        companies = []
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Find all links that might be company websites
                        links = soup.find_all('a', href=True)
                        for link in links:
                            href = link.get('href', '')
                            text = link.get_text(strip=True)
                            
                            # Check if it looks like a company website
                            if self._is_company_url(href):
                                company = self._parse_company_from_link(href, text)
                                if company:
                                    companies.append(company)
                                    
        except Exception as e:
            print(f"   ⚠ Failed to scrape {url}: {e}")
        
        return companies[:20]  # Limit per page
    
    async def _search_company_databases(self, company_type: str, max_results: int = 30) -> List[Dict]:
        """Search company databases via Tavily"""
        if not self.tavily_api_key:
            return []
        
        companies = []
        queries = [
            f"crunchbase {company_type} companies",
            f"angellist {company_type} startups",
            f"producthunt {company_type} products",
        ]
        
        for query in queries:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        self.tavily_base_url,
                        json={
                            "api_key": self.tavily_api_key,
                            "query": query,
                            "search_depth": "basic",
                            "max_results": 15,
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    for result in data.get("results", []):
                        company = self._extract_company_from_result(result, company_type)
                        if company and company["domain"] not in self.seen_domains:
                            self.seen_domains.add(company["domain"])
                            companies.append(company)
                            
            except Exception as e:
                continue
        
        return companies[:max_results]
    
    async def _search_news_articles(self, company_type: str, max_results: int = 30) -> List[Dict]:
        """Search news articles mentioning companies"""
        if not self.tavily_api_key:
            return []
        
        companies = []
        queries = [
            f"{company_type} startups featured techcrunch",
            f"{company_type} companies forbes",
            f"top {company_type} startups 2024",
        ]
        
        for query in queries:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        self.tavily_base_url,
                        json={
                            "api_key": self.tavily_api_key,
                            "query": query,
                            "search_depth": "basic",
                            "max_results": 15,
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    for result in data.get("results", []):
                        # Extract company mentions from article content
                        content = result.get("content", "")
                        companies_from_content = self._extract_companies_from_text(content, company_type)
                        for company in companies_from_content:
                            if company["domain"] not in self.seen_domains:
                                self.seen_domains.add(company["domain"])
                                companies.append(company)
                                
            except Exception as e:
                continue
        
        return companies[:max_results]
    
    def _extract_company_from_result(self, result: Dict, company_type: str) -> Optional[Dict]:
        """Extract company info from Tavily result"""
        url = result.get("url", "")
        title = result.get("title", "")
        content = result.get("content", "")
        
        if not url:
            return None
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "").lower()
            
            # Skip non-company domains
            skip_domains = [
                "linkedin.com", "indeed.com", "glassdoor.com", "techcrunch.com",
                "forbes.com", "crunchbase.com", "producthunt.com", "github.com",
                "medium.com", "reddit.com", "twitter.com", "facebook.com", "x.com",
                "instagram.com", "youtube.com", "wikipedia.org", "angel.co",
                "wellfound.com", "ycombinator.com", "betapage.co", "angellist.com"
            ]
            
            if any(skip in domain for skip in skip_domains):
                return None
            
            company_name = self._extract_company_name(title, domain, content)
            website = url if url.startswith("http") else f"https://{domain}"
            
            return {
                "company_name": company_name,
                "website": website,
                "domain": domain,
                "description": content[:200] if content else None
            }
        except:
            return None
    
    def _is_company_url(self, url: str) -> bool:
        """Check if URL looks like a company website"""
        if not url or len(url) < 5:
            return False
        
        # Must be http/https
        if not url.startswith(("http://", "https://")):
            return False
        
        # Skip known non-company domains
        skip_patterns = [
            "linkedin", "twitter", "facebook", "instagram", "youtube",
            "github", "medium", "reddit", "wikipedia", "google", "amazon"
        ]
        
        url_lower = url.lower()
        if any(pattern in url_lower for pattern in skip_patterns):
            return False
        
        return True
    
    def _parse_company_from_link(self, url: str, text: str) -> Optional[Dict]:
        """Parse company info from a link"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "").lower()
            
            if not domain or "." not in domain:
                return None
            
            company_name = text.strip() if text and len(text) < 50 else domain.split(".")[0].capitalize()
            website = url if url.startswith("http") else f"https://{domain}"
            
            return {
                "company_name": company_name,
                "website": website,
                "domain": domain,
                "description": None
            }
        except:
            return None
    
    def _extract_companies_from_text(self, text: str, company_type: str) -> List[Dict]:
        """Extract company mentions from text content"""
        companies = []
        
        # Look for patterns like "CompanyName.com" or "CompanyName (companyname.com)"
        patterns = [
            r'([A-Z][a-zA-Z0-9\s&]+)\s*\(([a-z0-9.-]+\.(?:com|io|ai|co|tech|app))\)',
            r'([A-Z][a-zA-Z0-9\s&]+)\s+at\s+([a-z0-9.-]+\.(?:com|io|ai|co|tech|app))',
            r'([a-z0-9.-]+\.(?:com|io|ai|co|tech|app))',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.groups()) >= 2:
                    name = match.group(1).strip()
                    domain = match.group(2).lower()
                else:
                    domain = match.group(0).lower()
                    name = domain.split(".")[0].capitalize()
                
                if domain and domain not in self.seen_domains:
                    companies.append({
                        "company_name": name,
                        "website": f"https://{domain}",
                        "domain": domain,
                        "description": None
                    })
        
        return companies[:10]  # Limit extracted companies
    
    def _extract_company_name(self, title: str, domain: str, content: str) -> str:
        """Extract company name from various sources"""
        # From title
        if title:
            title_clean = re.sub(r'^(Top|Best|List of|The)\s+', '', title, flags=re.IGNORECASE)
            title_clean = re.sub(r'\s+(Startups|Companies|List|Directory).*$', '', title_clean, flags=re.IGNORECASE)
            if len(title_clean.split()) <= 3:
                return title_clean.strip()
        
        # From domain
        if domain:
            domain_parts = domain.split(".")
            if len(domain_parts) >= 2:
                name = domain_parts[0].capitalize()
                name = re.sub(r'^(www|app|get|try|use)', '', name, flags=re.IGNORECASE)
                if name:
                    return name.capitalize()
        
        return domain.split(".")[0].capitalize() if domain else "Company"

# Singleton instance
company_finder = CompanyFinder()

