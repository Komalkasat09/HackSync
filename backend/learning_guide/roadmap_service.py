import os
import json
import logging
from typing import List, Dict, Any
import google.generativeai as genai
from datetime import datetime
import requests
import yt_dlp
from config import settings

logger = logging.getLogger(__name__)

class RoadmapService:
    """
    Service to generate learning roadmaps and fetch resources.
    Uses Gemini for roadmap generation and YouTube for video resources.
    """
    
    def __init__(self):
        # Initialize Gemini
        api_keys = settings.get_gemini_api_keys()
        self.gemini_keys = api_keys
        self.current_key_index = 0
        
        # YouTube search (no API key needed with youtube-search-python)
        logger.info("YouTube search initialized (using youtube-search-python)")
    
    def _get_gemini_model(self):
        """Get Gemini model with fallback to next API key if one fails"""
        for i in range(len(self.gemini_keys)):
            try:
                key_index = (self.current_key_index + i) % len(self.gemini_keys)
                api_key = self.gemini_keys[key_index]
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-2.5-flash')
                self.current_key_index = key_index
                return model
            except Exception as e:
                logger.warning(f"Gemini API key {key_index + 1} failed: {e}")
                continue
        raise Exception("All Gemini API keys failed")
    
    def generate_roadmap(self, topic: str) -> Dict[str, Any]:
        """
        Generate learning roadmap using Gemini AI.
        Returns Mermaid code and list of node topics.
        """
        try:
            model = self._get_gemini_model()
            
            prompt = f"""Generate a comprehensive learning roadmap for: {topic}

STRICT REQUIREMENTS:
1. Create a progressive learning path from beginner to advanced
2. Include 8-12 nodes (topics/concepts)
3. Allow branching where concepts can be learned in parallel
4. Use ONLY this Mermaid syntax format:

flowchart TB
    A[Topic Name]
    B[Next Topic]
    C[Another Topic]
    A --> B
    A --> C
    B --> D[Advanced Topic]
    C --> D

RULES:
- Start with node A (fundamentals)
- Use square brackets [Topic Name] for regular nodes
- Use arrows --> to connect nodes
- Keep topic names short (2-4 words max)
- Include branching where appropriate (e.g., two paths converge later)
- End with advanced/specialized topics

Example for "React":
flowchart TB
    A[JavaScript Basics]
    B[ES6 Features]
    C[React Fundamentals]
    D[JSX Syntax]
    E[Components]
    F[Hooks]
    G[State Management]
    H[React Router]
    I[Redux]
    J[Next.js]
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    F --> H
    G --> I
    H --> J
    I --> J

NOW GENERATE FOR: {topic}

Return ONLY the Mermaid code, nothing else."""

            response = model.generate_content(prompt)
            mermaid_code = response.text.strip()
            
            # Remove markdown code blocks if present
            if mermaid_code.startswith('```'):
                mermaid_code = mermaid_code.split('```')[1]
                if mermaid_code.startswith('mermaid'):
                    mermaid_code = mermaid_code[7:].strip()
            
            # Extract node topics from Mermaid code
            topics = self._extract_topics_from_mermaid(mermaid_code)
            
            logger.info(f"Generated roadmap for {topic} with {len(topics)} nodes")
            return {
                "mermaid_code": mermaid_code,
                "topics": topics
            }
            
        except Exception as e:
            logger.error(f"Failed to generate roadmap: {e}")
            raise Exception(f"Roadmap generation failed: {str(e)}")
    
    def _extract_topics_from_mermaid(self, mermaid_code: str) -> List[str]:
        """Extract topic names from Mermaid code"""
        import re
        topics = []
        
        # Match patterns like A[Topic Name] or A{{Topic}}
        patterns = [
            r'[A-Z]+\[([^\]]+)\]',  # Square brackets
            r'[A-Z]+\{\{([^}]+)\}\}',  # Diamond brackets
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, mermaid_code)
            topics.extend(matches)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_topics = []
        for topic in topics:
            topic_clean = topic.strip()
            if topic_clean not in seen:
                seen.add(topic_clean)
                unique_topics.append(topic_clean)
        
        return unique_topics
    
    def fetch_youtube_resources(self, topic: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Fetch YouTube video resources using yt-dlp (no API key needed)"""
        try:
            search_query = f"ytsearch{max_results}:{topic} tutorial"
            
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
                    
                    resources.append({
                        "title": video.get('title', 'Unknown'),
                        "url": f"https://www.youtube.com/watch?v={video.get('id', '')}",
                        "platform": "YouTube",
                        "thumbnail": video.get('thumbnail', None),
                        "duration": duration,
                        "is_free": True,
                        "rating": None,
                        "instructor": video.get('channel', 'Unknown')
                    })
            
            logger.info(f"Fetched {len(resources)} YouTube resources for {topic}")
            return resources
            
        except Exception as e:
            logger.error(f"YouTube search error for {topic}: {e}")
            return []
    
    def fetch_udemy_resources(self, topic: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """Udemy not available without Tavily API"""
        return []
    
    def fetch_coursera_resources(self, topic: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """Coursera not available without Tavily API"""
        return []
    
    def fetch_all_resources(self, topic: str) -> List[Dict[str, Any]]:
        """
        Fetch resources from YouTube only (no API key required).
        """
        # Only YouTube (free, no API key needed)
        youtube_res = self.fetch_youtube_resources(topic, max_results=10)
        
        logger.info(f"Total {len(youtube_res)} YouTube resources fetched for {topic}")
        return youtube_res
