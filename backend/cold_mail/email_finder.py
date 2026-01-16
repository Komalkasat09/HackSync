"""
Email Finder Scraper
Takes company URLs and finds email addresses from their websites
Scrapes multiple pages: homepage, contact, about, careers
"""
import aiohttp
from typing import List, Set
from urllib.parse import urljoin, urlparse
import re
from bs4 import BeautifulSoup
import asyncio

class EmailFinder:
    def __init__(self):
        self.timeout = aiohttp.ClientTimeout(total=10)
        self.max_emails_per_company = 3
        
    async def find_emails(self, website: str) -> List[str]:
        """
        Find email addresses from a company website
        Scrapes multiple pages: homepage, contact, about, careers
        """
        emails: Set[str] = set()
        
        # Get base URL
        parsed = urlparse(website)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # Pages to check
        pages_to_check = [
            website,  # Homepage
            urljoin(base_url, "/contact"),
            urljoin(base_url, "/about"),
            urljoin(base_url, "/careers"),
            urljoin(base_url, "/team"),
            urljoin(base_url, "/contact-us"),
        ]
        
        # Check pages in parallel (with limit)
        semaphore = asyncio.Semaphore(3)  # Max 3 concurrent requests
        
        async def check_page(url: str):
            async with semaphore:
                page_emails = await self._scrape_emails_from_page(url)
                emails.update(page_emails)
        
        tasks = [check_page(url) for url in pages_to_check]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter and prioritize emails
        filtered_emails = self._filter_emails(list(emails))
        
        return filtered_emails[:self.max_emails_per_company]
    
    async def _scrape_emails_from_page(self, url: str) -> List[str]:
        """Scrape emails from a single page"""
        emails = []
        
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(url, allow_redirects=True) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Extract emails using regex
                        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                        found_emails = re.findall(email_pattern, html)
                        
                        # Also check in href="mailto:" links
                        soup = BeautifulSoup(html, 'html.parser')
                        mailto_links = soup.find_all('a', href=re.compile(r'^mailto:'))
                        for link in mailto_links:
                            href = link.get('href', '')
                            email_match = re.search(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', href)
                            if email_match:
                                found_emails.append(email_match.group(1))
                        
                        emails.extend(found_emails)
                        
        except asyncio.TimeoutError:
            pass
        except Exception as e:
            # Silently fail for individual pages
            pass
        
        return emails
    
    def _filter_emails(self, emails: List[str]) -> List[str]:
        """Filter and prioritize email addresses"""
        filtered = []
        seen = set()
        
        # Patterns to skip
        skip_patterns = [
            "example.com", "test.com", "domain.com", "email.com",
            "noreply", "no-reply", "donotreply", "privacy",
            "support@", "help@", "webmaster@", "postmaster@",
            "abuse@", "security@", "legal@", "dmca@"
        ]
        
        # Priority patterns (contact emails we want)
        priority_patterns = [
            "contact@", "hello@", "info@", "careers@", "jobs@",
            "hr@", "recruiting@", "talent@", "hiring@", "apply@"
        ]
        
        priority_emails = []
        regular_emails = []
        
        for email in emails:
            email_lower = email.lower()
            
            # Skip if matches skip patterns
            if any(pattern in email_lower for pattern in skip_patterns):
                continue
            
            # Skip duplicates
            if email_lower in seen:
                continue
            
            seen.add(email_lower)
            
            # Check if it's a priority email
            if any(pattern in email_lower for pattern in priority_patterns):
                priority_emails.append(email)
            else:
                regular_emails.append(email)
        
        # Return priority emails first, then regular emails
        return priority_emails + regular_emails

# Singleton instance
email_finder = EmailFinder()

