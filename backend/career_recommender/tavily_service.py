"""
Tavily API Integration for Career Intelligence
Scrapes web for trending careers, job market data, salary trends
"""
import os
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta

class TavilyService:
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        self.base_url = "https://api.tavily.com/search"
        self.cache = {}  # Simple in-memory cache
        self.cache_duration = timedelta(hours=6)  # Cache for 6 hours
        
    async def search_career_trends(self, skills: List[str], interests: List[str], custom_query: Optional[str] = None) -> Dict:
        """
        Search for trending careers based on user skills and interests
        """
        if custom_query:
            query = custom_query
        else:
            query = f"trending careers for {', '.join(skills[:3])} professionals in {', '.join(interests[:2])} industry 2026"
        cache_key = f"trends_{hash(query)}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.utcnow() - timestamp < self.cache_duration:
                return cached_data
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    json={
                        "api_key": self.api_key,
                        "query": query,
                        "search_depth": "advanced",
                        "max_results": 8,
                        "include_domains": [
                            "linkedin.com",
                            "indeed.com",
                            "glassdoor.com",
                            "techcrunch.com",
                            "forbes.com"
                        ]
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Cache the result
                self.cache[cache_key] = (data, datetime.utcnow())
                return data
                
        except Exception as e:
            print(f"Tavily API Error: {str(e)}")
            return self._get_fallback_trends()
    
    async def search_specific_career(self, career_title: str) -> Dict:
        """
        Deep dive into a specific career path
        """
        query = f"{career_title} job outlook salary requirements skills 2026"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    json={
                        "api_key": self.api_key,
                        "query": query,
                        "search_depth": "advanced",
                        "max_results": 5
                    }
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            print(f"Tavily API Error: {str(e)}")
            return {"results": []}
    
    async def search_skill_demand(self, skills: List[str]) -> Dict:
        """
        Check current market demand for specific skills
        """
        query = f"job market demand for {', '.join(skills)} skills hiring trends 2026"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    json={
                        "api_key": self.api_key,
                        "query": query,
                        "search_depth": "basic",
                        "max_results": 5
                    }
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            print(f"Tavily API Error: {str(e)}")
            return {"results": []}
    
    async def search_industry_trends(self, industry: str) -> Dict:
        """
        Get latest industry trends and growth outlook
        """
        query = f"{industry} industry trends growth outlook career opportunities 2026"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    json={
                        "api_key": self.api_key,
                        "query": query,
                        "search_depth": "basic",
                        "max_results": 5
                    }
                )
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            print(f"Tavily API Error: {str(e)}")
            return {"results": []}
    
    def _get_fallback_trends(self) -> Dict:
        """
        Fallback data when API fails
        """
        return {
            "results": [
                {
                    "title": "2026 Tech Career Outlook",
                    "url": "https://example.com",
                    "content": "AI and machine learning roles continue to see high demand...",
                    "score": 0.8
                }
            ]
        }
    
    def format_references(self, tavily_response: Dict) -> List[Dict]:
        """
        Format Tavily results for frontend reference display
        """
        results = tavily_response.get("results", [])
        references = []
        
        for idx, result in enumerate(results[:5], 1):  # Limit to 5 references
            references.append({
                "id": idx,
                "title": result.get("title", "Source"),
                "url": result.get("url", ""),
                "snippet": result.get("content", "")[:200] + "...",
                "score": result.get("score", 0.0)
            })
        
        return references

# Singleton instance
tavily_service = TavilyService()
