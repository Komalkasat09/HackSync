import os
import json
import logging
from typing import List, Dict, Any
import google.generativeai as genai
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re
import praw
import tweepy
from urllib.parse import quote

logger = logging.getLogger(__name__)

class GeminiSmartScraper:
    """
    Real web scraper for learning resources from YouTube, GitHub, FreeCodeCamp, and Coursera.
    Features:
    - YouTube video and playlist scraping
    - GitHub repository search
    - FreeCodeCamp curriculum mapping
    - Coursera course discovery
    - Quality scoring and social validation
    """
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        try:
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("Gemini Smart Scraper initialized with gemini-pro")
        except Exception as e:
            logger.warning(f"Failed to load gemini-pro: {e}")
            self.model = None
        
        # Reddit API setup
        self.reddit = None
        try:
            reddit_client_id = os.getenv('REDDIT_CLIENT_ID')
            reddit_client_secret = os.getenv('REDDIT_CLIENT_SECRET')
            reddit_user_agent = os.getenv('REDDIT_USER_AGENT', 'LearningResourceScraper/1.0')
            
            if reddit_client_id and reddit_client_secret:
                self.reddit = praw.Reddit(
                    client_id=reddit_client_id,
                    client_secret=reddit_client_secret,
                    user_agent=reddit_user_agent
                )
                logger.info("Reddit API initialized")
            else:
                logger.warning("Reddit API credentials not found, social validation will be limited")
        except Exception as e:
            logger.warning(f"Reddit API initialization failed: {e}")
        
        # Twitter API setup
        self.twitter = None
        try:
            twitter_bearer = os.getenv('TWITTER_BEARER_TOKEN')
            
            if twitter_bearer:
                self.twitter = tweepy.Client(bearer_token=twitter_bearer)
                logger.info("Twitter API initialized")
            else:
                logger.warning("Twitter API credentials not found, social validation will be limited")
        except Exception as e:
            logger.warning(f"Twitter API initialization failed: {e}")
    
    def scrape_youtube(self, skill: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Scrape YouTube videos using web scraping"""
        resources = []
        
        try:
            # Use YouTube search URL
            search_url = f"https://www.youtube.com/results?search_query={skill}+tutorial+course"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(search_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                # Extract video IDs from the response
                video_ids = re.findall(r'"videoId":"([^"]+)"', response.text)
                titles = re.findall(r'"title":{"runs":\[{"text":"([^"]+)"}', response.text)
                
                # Take unique videos
                seen = set()
                for video_id, title in zip(video_ids[:limit*2], titles[:limit*2]):
                    if video_id not in seen and len(resources) < limit:
                        seen.add(video_id)
                        resources.append({
                            "title": title,
                            "url": f"https://www.youtube.com/watch?v={video_id}",
                            "source": "YouTube",
                            "type": "Video",
                            "duration": "Variable",
                            "difficulty": "Mixed",
                            "topics": [skill, "Tutorial"],
                            "recommendation_reason": "Popular tutorial video",
                            "estimated_quality_score": 8.0
                        })
                
                logger.info(f"Scraped {len(resources)} YouTube videos for {skill}")
            else:
                logger.warning(f"YouTube returned status {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error scraping YouTube for {skill}: {e}")
        
        return resources
    
    def scrape_github(self, skill: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Scrape GitHub repositories - ONLY actual tutorials and learning projects"""
        resources = []
        
        try:
            skill_lower = skill.lower()
            
            # Search with VERY specific learning-focused terms
            query = f"{skill_lower}-tutorial OR {skill_lower}-course OR learn-{skill_lower}"
            
            url = f"https://api.github.com/search/repositories"
            params = {
                'q': query,
                'sort': 'stars',
                'order': 'desc',
                'per_page': 50  # Get many to filter heavily
            }
            headers = {'Accept': 'application/vnd.github.v3+json'}
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # EXCLUDE these keywords - frameworks, libraries, tools
                framework_keywords = [
                    'framework', 'library', 'tensorflow', 'pytorch', 'keras', 'django', 'flask',
                    'react', 'vue', 'angular', 'spring', 'laravel', 'rails', 'express',
                    'production', 'enterprise', 'system-design', 'interview', 'awesome-',
                    'roadmap', 'resources-list', 'cheatsheet', 'algorithm', 'data-structure'
                ]
                
                # REQUIRE these keywords - must be explicitly educational
                required_keywords = ['tutorial', 'course', 'learn', 'beginner', 'example', 'practice', 'exercise', 'guide']
                
                for repo in data.get('items', []):
                    name = repo.get('name', '').lower()
                    description = (repo.get('description') or '').lower()
                    full_text = f"{name} {description}"
                    
                    # SKIP if it's a framework/library
                    if any(fw in full_text for fw in framework_keywords):
                        continue
                    
                    # MUST have learning keywords
                    if not any(kw in full_text for kw in required_keywords):
                        continue
                    
                    # MUST mention the skill explicitly
                    if skill_lower not in name and skill_lower not in description[:100]:
                        continue
                    
                    # Additional check: Skip if description suggests it's a tool/framework
                    tool_indicators = ['framework for', 'library for', 'platform for', 'tool for', 'engine for']
                    if any(indicator in description for indicator in tool_indicators):
                        continue
                    
                    stars = repo.get('stargazers_count', 0)
                    description_full = repo.get('description', f'Learn {skill}')
                    
                    resources.append({
                        "title": repo.get('name', ''),
                        "url": repo.get('html_url', ''),
                        "source": "GitHub",
                        "type": "Tutorial Repository",
                        "duration": "Self-paced",
                        "difficulty": "Beginner to Intermediate",
                        "topics": [skill, "Hands-on", "Projects"],
                        "recommendation_reason": f"⭐ {stars:,} stars - {description_full[:80]}",
                        "estimated_quality_score": min(8.5, 7.0 + (stars / 15000)),
                        "stars": stars
                    })
                    
                    if len(resources) >= limit:
                        break
                
                logger.info(f"Scraped {len(resources)} verified learning repos for {skill}")
            else:
                logger.warning(f"GitHub API returned status {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error scraping GitHub for {skill}: {e}")
        
        return resources
    
    def scrape_freecodecamp(self, skill: str) -> List[Dict[str, Any]]:
        """Scrape FreeCodeCamp resources"""
        resources = []
        
        try:
            # FreeCodeCamp curriculum mapping
            fcc_courses = {
                "HTML": "https://www.freecodecamp.org/learn/responsive-web-design/",
                "CSS": "https://www.freecodecamp.org/learn/responsive-web-design/",
                "JavaScript": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
                "Python": "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
                "React": "https://www.freecodecamp.org/learn/front-end-development-libraries/",
                "SQL": "https://www.freecodecamp.org/learn/relational-database/",
                "Node": "https://www.freecodecamp.org/learn/back-end-development-and-apis/",
                "Machine Learning": "https://www.freecodecamp.org/learn/machine-learning-with-python/",
                "Data Analysis": "https://www.freecodecamp.org/learn/data-analysis-with-python/",
            }
            
            # Find matching courses
            for topic, url in fcc_courses.items():
                if skill.lower() in topic.lower() or topic.lower() in skill.lower():
                    resources.append({
                        "title": f"FreeCodeCamp {topic} Certification",
                        "url": url,
                        "source": "FreeCodeCamp",
                        "type": "Interactive Course",
                        "duration": "300+ hours",
                        "difficulty": "Beginner to Intermediate",
                        "topics": [topic, "Certification", "Projects"],
                        "recommendation_reason": "Free certification course with hands-on projects",
                        "estimated_quality_score": 9.5
                    })
            
            # Also search FreeCodeCamp YouTube channel
            fcc_search_url = f"https://www.youtube.com/results?search_query=freecodecamp+{skill}"
            response = requests.get(fcc_search_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
            
            if response.status_code == 200:
                video_ids = re.findall(r'"videoId":"([^"]+)"', response.text)
                titles = re.findall(r'"title":{"runs":\[{"text":"([^"]+)"}', response.text)
                
                for video_id, title in zip(video_ids[:3], titles[:3]):
                    if 'freecodecamp' in title.lower():
                        resources.append({
                            "title": title,
                            "url": f"https://www.youtube.com/watch?v={video_id}",
                            "source": "FreeCodeCamp YouTube",
                            "type": "Video Tutorial",
                            "duration": "Long-form",
                            "difficulty": "Beginner",
                            "topics": [skill, "Complete Course"],
                            "recommendation_reason": "Comprehensive FreeCodeCamp tutorial",
                            "estimated_quality_score": 9.0,
                            "channel": "freeCodeCamp.org"
                        })
            
            logger.info(f"Scraped {len(resources)} FreeCodeCamp resources for {skill}")
        
        except Exception as e:
            logger.error(f"Error scraping FreeCodeCamp for {skill}: {e}")
        
        return resources
    
    def scrape_coursera(self, skill: str) -> List[Dict[str, Any]]:
        """Scrape Coursera courses"""
        resources = []
        
        try:
            # Search Coursera catalog
            search_url = f"https://www.coursera.org/search"
            params = {'query': skill}
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(search_url, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                # Try to find course cards (Coursera's HTML structure may vary)
                course_links = soup.find_all('a', href=re.compile(r'/learn/'))
                
                seen_urls = set()
                for link in course_links[:10]:
                    href = link.get('href', '')
                    if href and href not in seen_urls:
                        full_url = f"https://www.coursera.org{href}" if href.startswith('/') else href
                        seen_urls.add(href)
                        
                        title = link.get_text(strip=True) or f"{skill} Course"
                        
                        resources.append({
                            "title": title,
                            "url": full_url,
                            "source": "Coursera",
                            "type": "Online Course",
                            "duration": "4-8 weeks",
                            "difficulty": "Beginner to Intermediate",
                            "topics": [skill, "Certification"],
                            "recommendation_reason": "Professional course with certificate",
                            "estimated_quality_score": 8.8
                        })
            
            # Add well-known Coursera specializations
            popular_coursera = {
                "Python": [
                    {
                        "title": "Python for Everybody Specialization",
                        "url": "https://www.coursera.org/specializations/python",
                        "topics": ["Python Basics", "Data Structures", "Web Scraping"]
                    }
                ],
                "Machine Learning": [
                    {
                        "title": "Machine Learning Specialization",
                        "url": "https://www.coursera.org/specializations/machine-learning-introduction",
                        "topics": ["Supervised Learning", "Neural Networks", "ML Systems"]
                    }
                ],
                "Data Science": [
                    {
                        "title": "IBM Data Science Professional Certificate",
                        "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
                        "topics": ["Data Analysis", "Python", "Machine Learning"]
                    }
                ]
            }
            
            for topic, courses in popular_coursera.items():
                if skill.lower() in topic.lower() or topic.lower() in skill.lower():
                    for course in courses:
                        resources.append({
                            "title": course["title"],
                            "url": course["url"],
                            "source": "Coursera",
                            "type": "Specialization",
                            "duration": "3-6 months",
                            "difficulty": "Beginner to Advanced",
                            "topics": course["topics"],
                            "recommendation_reason": "Industry-recognized specialization with certificate",
                            "estimated_quality_score": 9.2
                        })
            
            logger.info(f"Scraped {len(resources)} Coursera resources for {skill}")
        
        except Exception as e:
            logger.error(f"Error scraping Coursera for {skill}: {e}")
        
        return resources
    
    def search_reddit_mentions(self, resource_title: str, skill: str) -> Dict[str, Any]:
        """
        Search Reddit for mentions of the resource and analyze sentiment.
        """
        if not self.reddit:
            return {'mention_count': 0, 'sentiment_score': 0, 'comments': []}
        
        try:
            # Search relevant subreddits
            subreddits = ['learnprogramming', 'programming', 'webdev', 'coding', 'learnpython', 
                         'learnjavascript', 'cscareerquestions', 'datascience']
            
            mentions = []
            positive_keywords = ['recommend', 'great', 'excellent', 'helpful', 'amazing', 'love', 'best']
            negative_keywords = ['bad', 'terrible', 'waste', 'avoid', 'disappointing', 'poor']
            
            # Search for resource mentions
            search_query = f"{resource_title} {skill}"
            
            for subreddit_name in subreddits[:3]:  # Limit to 3 subreddits for performance
                try:
                    subreddit = self.reddit.subreddit(subreddit_name)
                    for submission in subreddit.search(search_query, limit=5):
                        text = (submission.title + ' ' + submission.selftext).lower()
                        
                        positive_count = sum(1 for kw in positive_keywords if kw in text)
                        negative_count = sum(1 for kw in negative_keywords if kw in text)
                        
                        mentions.append({
                            'text': submission.title,
                            'score': submission.score,
                            'positive': positive_count,
                            'negative': negative_count
                        })
                except Exception as e:
                    logger.debug(f"Error searching r/{subreddit_name}: {e}")
                    continue
            
            if not mentions:
                return {'mention_count': 0, 'sentiment_score': 0, 'comments': []}
            
            # Calculate sentiment score
            total_positive = sum(m['positive'] for m in mentions)
            total_negative = sum(m['negative'] for m in mentions)
            avg_score = sum(m['score'] for m in mentions) / len(mentions)
            
            sentiment_score = (total_positive - total_negative + avg_score / 10) / len(mentions)
            sentiment_score = max(-1, min(1, sentiment_score))  # Normalize to -1 to 1
            
            return {
                'mention_count': len(mentions),
                'sentiment_score': sentiment_score,
                'comments': [m['text'] for m in mentions[:3]]
            }
            
        except Exception as e:
            logger.error(f"Reddit search error: {e}")
            return {'mention_count': 0, 'sentiment_score': 0, 'comments': []}
    
    def search_twitter_mentions(self, resource_title: str, skill: str) -> Dict[str, Any]:
        """
        Search Twitter for mentions of the resource and analyze sentiment.
        """
        if not self.twitter:
            return {'mention_count': 0, 'sentiment_score': 0, 'tweets': []}
        
        try:
            # Search for tweets mentioning the resource
            search_query = f"{resource_title} {skill} (tutorial OR course OR learning)"
            
            tweets = self.twitter.search_recent_tweets(
                query=search_query,
                max_results=10,
                tweet_fields=['created_at', 'public_metrics', 'text']
            )
            
            if not tweets.data:
                return {'mention_count': 0, 'sentiment_score': 0, 'tweets': []}
            
            positive_keywords = ['recommend', 'great', 'excellent', 'helpful', 'amazing', 'love', 'best']
            negative_keywords = ['bad', 'terrible', 'waste', 'avoid', 'disappointing', 'poor']
            
            mentions = []
            for tweet in tweets.data:
                text = tweet.text.lower()
                positive_count = sum(1 for kw in positive_keywords if kw in text)
                negative_count = sum(1 for kw in negative_keywords if kw in text)
                
                mentions.append({
                    'text': tweet.text,
                    'likes': tweet.public_metrics['like_count'],
                    'retweets': tweet.public_metrics['retweet_count'],
                    'positive': positive_count,
                    'negative': negative_count
                })
            
            # Calculate sentiment score
            total_positive = sum(m['positive'] for m in mentions)
            total_negative = sum(m['negative'] for m in mentions)
            avg_engagement = sum(m['likes'] + m['retweets'] for m in mentions) / len(mentions)
            
            sentiment_score = (total_positive - total_negative + avg_engagement / 100) / len(mentions)
            sentiment_score = max(-1, min(1, sentiment_score))  # Normalize to -1 to 1
            
            return {
                'mention_count': len(mentions),
                'sentiment_score': sentiment_score,
                'tweets': [m['text'] for m in mentions[:3]]
            }
            
        except Exception as e:
            logger.error(f"Twitter search error: {e}")
            return {'mention_count': 0, 'sentiment_score': 0, 'tweets': []}
    
    def search_learning_resources(self, skill: str, resource_type: str = "all") -> List[Dict[str, Any]]:
        """
        Scrape learning resources from multiple platforms.
        
        Args:
            skill: The skill to search for (e.g., "Python", "React", "Machine Learning")
            resource_type: Type of resource ("video", "course", "playlist", "article", "all")
        
        Returns:
            List of learning resources with metadata
        """
        
        all_resources = []
        
        try:
            logger.info(f"Starting multi-platform scraping for: {skill}")
            
            # Scrape from all platforms with conservative limits
            youtube_resources = self.scrape_youtube(skill, limit=8)  # Reduced from 15
            all_resources.extend(youtube_resources)
            
            github_resources = self.scrape_github(skill, limit=5)  # Reduced, only tutorials
            all_resources.extend(github_resources)
            
            freecodecamp_resources = self.scrape_freecodecamp(skill)
            all_resources.extend(freecodecamp_resources)
            
            coursera_resources = self.scrape_coursera(skill)
            all_resources.extend(coursera_resources)
            
            # Add metadata to all resources
            for resource in all_resources:
                resource['skill'] = skill
                resource['scraped_at'] = datetime.now().isoformat()
                resource['social_verified'] = False
            
            logger.info(f"Total resources scraped: {len(all_resources)} from all platforms")
            
            return all_resources
            
        except Exception as e:
            logger.error(f"Error in search_learning_resources: {e}")
            return []
    
    def validate_with_social_sentiment(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Real social validation using Twitter and Reddit APIs.
        Analyzes community sentiment and mentions to validate resource quality.
        """
        source = resource.get('source', '')
        title = resource.get('title', '').lower()
        description = resource.get('recommendation_reason', '').lower()
        skill = resource.get('skill', '')
        
        # Base score
        base_score = resource.get('estimated_quality_score', 8.0)
        
        # Get real social data from Twitter and Reddit
        reddit_data = self.search_reddit_mentions(resource.get('title', ''), skill)
        twitter_data = self.search_twitter_mentions(resource.get('title', ''), skill)
        
        # Log social validation results
        if reddit_data['mention_count'] > 0 or twitter_data['mention_count'] > 0:
            logger.info(f"Social validation for '{resource.get('title', '')}': Reddit mentions={reddit_data['mention_count']}, Twitter mentions={twitter_data['mention_count']}")
        
        # Apply social sentiment scores from real APIs
        social_boost = 0
        
        # Reddit sentiment contribution
        if reddit_data['mention_count'] > 0:
            social_boost += reddit_data['sentiment_score'] * 2.0  # Reddit weight
            social_boost += min(reddit_data['mention_count'] * 0.3, 1.5)  # Mention bonus
        
        # Twitter sentiment contribution  
        if twitter_data['mention_count'] > 0:
            social_boost += twitter_data['sentiment_score'] * 1.5  # Twitter weight
            social_boost += min(twitter_data['mention_count'] * 0.2, 1.0)  # Mention bonus
        
        # PENALIZE if it looks like a framework/tool rather than learning resource
        penalty_keywords = [
            'framework', 'library', 'production', 'enterprise', 'system',
            'infrastructure', 'deployment', 'tensorflow', 'pytorch', 'django',
            'advanced', 'expert', 'professional', 'commercial'
        ]
        
        penalty = 0
        for keyword in penalty_keywords:
            if keyword in title or keyword in description:
                penalty += 1.5  # Heavy penalty
        
        # BOOST if explicitly beginner-friendly
        boost_keywords = [
            'beginner', 'tutorial', 'learn', 'introduction', 'basics',
            'getting started', 'guide', 'course', 'fundamentals', 'crash course'
        ]
        
        boost = 0
        for keyword in boost_keywords:
            if keyword in title or keyword in description:
                boost += 0.8
        
        # Source-based adjustment
        source_bonus = {
            'FreeCodeCamp': 1.5,
            'FreeCodeCamp YouTube': 1.5,
            'Coursera': 1.2,
            'YouTube': 0.6,
            'GitHub': 0.5,
            'Udemy': 0.8
        }
        
        # Calculate final score with social validation
        validation_score = base_score + source_bonus.get(source, 0.3) + boost + social_boost - penalty
        validation_score = max(1.0, min(10.0, validation_score))  # Clamp between 1-10
        
        # Build pros and cons from social data
        pros = []
        cons = []
        
        # Add social proof to pros if available
        if reddit_data['mention_count'] > 0:
            pros.append(f"Mentioned {reddit_data['mention_count']}x on Reddit")
            if reddit_data['sentiment_score'] > 0.3:
                pros.append("Positive Reddit community feedback")
        
        if twitter_data['mention_count'] > 0:
            pros.append(f"Mentioned {twitter_data['mention_count']}x on Twitter")
            if twitter_data['sentiment_score'] > 0.3:
                pros.append("Positive Twitter sentiment")
        
        # Add generic pros based on keywords
        if any(kw in title for kw in boost_keywords[:5]):
            pros.append("Beginner-friendly content")
        
        if source in ['FreeCodeCamp', 'Coursera', 'FreeCodeCamp YouTube']:
            pros.append("Trusted educational platform")
        
        # Add cons based on social data
        if reddit_data['sentiment_score'] < -0.2:
            cons.append("Some negative Reddit feedback")
        
        if twitter_data['sentiment_score'] < -0.2:
            cons.append("Mixed Twitter reviews")
        
        if any(kw in title for kw in penalty_keywords[:5]):
            cons.append("May be too technical for beginners")
        
        # Default cons if none found
        if not cons:
            cons.append("Time commitment required")
        
        # Determine confidence based on score
        if validation_score >= 8.5:
            confidence = "High"
        elif validation_score >= 7.0:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        # Add validation data with real social proof
        resource['social_validation'] = {
            'community_rating': validation_score,
            'pros': pros[:5],  # Limit to top 5
            'cons': cons[:3],  # Limit to top 3
            'recommendation_confidence': confidence,
            'best_for': 'Beginners to Intermediate learners' if validation_score >= 7.5 else 'Intermediate to Advanced learners',
            'social_proof': f'Validated via Reddit ({reddit_data["mention_count"]} mentions) and Twitter ({twitter_data["mention_count"]} mentions)',
            'reddit_mentions': reddit_data['mention_count'],
            'twitter_mentions': twitter_data['mention_count'],
            'reddit_sentiment': reddit_data['sentiment_score'],
            'twitter_sentiment': twitter_data['sentiment_score']
        }
        resource['social_verified'] = True
        resource['validation_score'] = validation_score
        
        # Add sample comments/tweets if available
        if reddit_data['comments']:
            resource['reddit_comments'] = reddit_data['comments']
        if twitter_data['tweets']:
            resource['twitter_mentions_sample'] = twitter_data['tweets']
        
        return resource
    
    def scrape_and_validate(self, skills: List[str], validate: bool = True) -> List[Dict[str, Any]]:
        """
        Complete pipeline: Search resources and optionally validate them.
        
        Args:
            skills: List of skills to search for
            validate: Whether to perform social validation (slower but more accurate)
        
        Returns:
            List of all resources with validation data
        """
        all_resources = []
        
        for skill in skills:
            logger.info(f"Scraping resources for: {skill}")
            resources = self.search_learning_resources(skill)
            
            if validate:
                logger.info(f"Validating {len(resources)} resources for {skill}...")
                validated_resources = []
                for resource in resources:
                    validated = self.validate_with_social_sentiment(resource)
                    validated_resources.append(validated)
                all_resources.extend(validated_resources)
            else:
                all_resources.extend(resources)
        
        # Sort by quality scores
        all_resources.sort(key=lambda x: x.get('validation_score', x.get('estimated_quality_score', 0)), reverse=True)
        
        return all_resources
    
    def save_resources(self, resources: List[Dict[str, Any]], output_file: str = 'learning_resources.json'):
        """Save scraped resources to JSON file."""
        try:
            # Load existing resources if file exists
            existing_resources = []
            if os.path.exists(output_file):
                with open(output_file, 'r', encoding='utf-8') as f:
                    existing_resources = json.load(f)
            
            # Merge new resources (avoid duplicates by URL)
            existing_urls = {r.get('url') for r in existing_resources}
            new_resources = [r for r in resources if r.get('url') not in existing_urls]
            
            combined = existing_resources + new_resources
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(combined, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(new_resources)} new resources to {output_file}")
            logger.info(f"Total resources: {len(combined)}")
            
            return len(combined)
            
        except Exception as e:
            logger.error(f"Error saving resources: {e}")
            return 0


if __name__ == "__main__":
    # Test the scraper
    logging.basicConfig(level=logging.INFO)
    
    api_key = os.getenv("GEMINI_API_KEY", "AIzaSyDrYDZjDEbzR8i1spINBanwVH74FWFhFCY")
    scraper = GeminiSmartScraper(api_key)
    
    # Test scraping
    print("\n=== Testing Web Scraper ===")
    test_skill = "Python"
    resources = scraper.search_learning_resources(test_skill)
    
    print(f"\nScraped {len(resources)} resources for {test_skill}:")
    for i, resource in enumerate(resources[:5], 1):
        print(f"{i}. {resource.get('title')} ({resource.get('source')})")
        print(f"   {resource.get('url')}")
