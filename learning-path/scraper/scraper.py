import requests
from bs4 import BeautifulSoup
import json
import time
import logging
import re
from urllib.parse import urljoin, urlparse
from duckduckgo_search import DDGS
from youtubesearchpython import VideosSearch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ResourceScraper')

class LearningScraper:
    def __init__(self, topic):
        self.topic = topic
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.resources = []
        self.verified_youtube_ids = set()

    def save_to_json(self, filename='learning_resources.json'):
        # Sort resources: Verified Videos first, then by source key
        self.resources.sort(key=lambda x: (x.get('social_verified', False) is False, x['source']))
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.resources, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(self.resources)} resources to {filename}")

    def scrape_freecodecamp(self):
        logger.info(f"Scraping freeCodeCamp for '{self.topic}'...")
        url = f"https://www.freecodecamp.org/news/tag/{self.topic.lower()}/"
        
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch FCC: {response.status_code}")
                return

            soup = BeautifulSoup(response.content, 'lxml')
            articles = soup.find_all('article', class_='post-card')
            
            for article in articles[:10]:
                try:
                    title_tag = article.find('h2', class_='post-card-title')
                    link_tag = article.find('a', class_='post-card-image-link')
                    
                    if title_tag and link_tag:
                        title = title_tag.get_text().strip()
                        link = urljoin("https://www.freecodecamp.org/news/", link_tag.get('href'))
                        
                        self.resources.append({
                            'source': 'freeCodeCamp',
                            'title': title,
                            'url': link,
                            'type': 'Article',
                            'topic': self.topic,
                            'social_verified': False
                        })
                except Exception as e:
                    continue
        except Exception as e:
            logger.error(f"Error scraping FCC: {str(e)}")

    def scrape_coursera_blogs(self):
        logger.info(f"Scraping Coursera (Simulated) for '{self.topic}'...")
        # Simulating Coursera search via DDG to find actual course pages
        # as the direct scraping of their React app is flaky without Selenium.
        
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(f"site:coursera.org future skills {self.topic}", max_results=5))
                
                for r in results:
                    self.resources.append({
                        'source': 'Coursera',
                        'title': r['title'],
                        'url': r['href'],
                        'type': 'Course',
                        'topic': self.topic,
                        'social_verified': False
                    })
        except Exception as e:
            logger.error(f"Error scraping Coursera via DDG: {str(e)}")

    def scrape_github_topics(self):
        logger.info(f"Scraping GitHub Topics for '{self.topic}'...")
        url = f"https://github.com/topics/{self.topic.lower()}"
        
        try:
            response = requests.get(url, headers=self.headers)
            soup = BeautifulSoup(response.content, 'lxml')
            repos = soup.find_all('article', class_='border')
            
            for repo in repos[:10]:
                try:
                    title_elem = repo.find('h3', class_='f3')
                    if title_elem:
                        link_tag = title_elem.find('a', class_='text-bold')
                        if link_tag:
                            repo_suffix = link_tag.get('href') 
                            repo_name = repo_suffix.strip("/")
                            full_url = f"https://github.com{repo_suffix}"
                            description_div = repo.find('div', class_='color-fg-muted')
                            description = description_div.get_text().strip() if description_div else "No description"

                            self.resources.append({
                                'source': 'GitHub',
                                'title': repo_name,
                                'url': full_url,
                                'description': description,
                                'type': 'Repository',
                                'topic': self.topic,
                                'social_verified': False
                            })
                except Exception as e:
                    continue
        except Exception as e:
            logger.error(f"Error scraping GitHub: {str(e)}")

    def scrape_youtube_with_social_proof(self):
        logger.info(f"Searching for YouTube videos via DuckDuckGo Videos for '{self.topic}'...")
        
        queries = [
            f"{self.topic} complete course",
            f"best {self.topic} tutorials"
        ]
        
        found_videos = 0
        try:
            with DDGS() as ddgs:
                for query in queries:
                    logger.info(f"Querying DDG Videos: {query}")
                    results = list(ddgs.videos(query, max_results=10))
                    logger.info(f"Received {len(results)} video results.")
                    
                    for r in results:
                        view_count = r.get('statistics', {}).get('viewCount', 0)
                        if int(view_count) > 5000:
                            self.resources.append({
                                'source': 'YouTube',
                                'title': r['title'],
                                'url': r['content'],
                                'type': 'Video',
                                'topic': self.topic,
                                'social_verified': True,
                                'views': str(view_count),
                                'uploader': r.get('uploader', 'Unknown')
                            })
                            found_videos += 1
                    time.sleep(1)
            logger.info(f"Total found {found_videos} YouTube videos.")
        except Exception as e:
            logger.error(f"Error scraping YouTube via DDG Videos: {str(e)}")

    def scrape_youtube_playlists(self):
        logger.info(f"Searching for YouTube Structured Content for '{self.topic}'...")
        # Simpler queries that are less likely to return 0 results from DDG
        queries = [
            f"{self.topic} course",
            f"{self.topic} complete tutorial"
        ]
        
        found_structured = 0
        try:
            ddgs = DDGS()
            # 1. Try Text Search for Playlists/Courses first
            for query in queries:
                logger.info(f"Querying DDG Text: {query}")
                results = list(ddgs.text(query, max_results=10))
                logger.info(f"Received {len(results)} text results.")
                for r in results:
                    url = r['href']
                    if 'youtube.com' in url:
                        is_playlist = 'list=' in url or '/playlist' in url
                        if any(res['url'] == url for res in self.resources): continue
                        self.resources.append({
                            'source': 'YouTube',
                            'title': r['title'].replace(" - YouTube", ""),
                            'url': url,
                            'type': 'Playlist' if is_playlist else 'Video',
                            'topic': self.topic,
                            'social_verified': True,
                            'description': r.get('body', "Comprehensive course content.")
                        })
                        found_structured += 1
                time.sleep(1)

            # 2. Try Video Search specifically for "playlist" as a fallback
            logger.info(f"Falling back to Video Search for playlists...")
            video_results = list(ddgs.videos(f"{self.topic} playlist", max_results=10))
            for r in video_results:
                url = r['content']
                if any(res['url'] == url for res in self.resources): continue
                self.resources.append({
                    'source': 'YouTube',
                    'title': r['title'],
                    'url': url,
                    'type': 'Playlist' if 'list=' in url else 'Video',
                    'topic': self.topic,
                    'social_verified': True,
                    'views': str(r.get('statistics', {}).get('viewCount', 0)),
                    'uploader': r.get('uploader', 'Unknown')
                })
                found_structured += 1

            logger.info(f"Total found {found_structured} YouTube structured resources.")
        except Exception as e:
            logger.error(f"Error scraping YouTube Structured Content: {str(e)}")

    def run_all(self, filename='learning_resources.json'):
        """Execute all scraping methods in sequence."""
        self.scrape_youtube_playlists()
        time.sleep(1)
        self.scrape_youtube_with_social_proof()
        time.sleep(1)
        self.scrape_freecodecamp()
        time.sleep(1)
        self.scrape_coursera_blogs()
        time.sleep(1)
        self.scrape_github_topics()
        self.save_to_json(filename)
        return len(self.resources)

if __name__ == "__main__":
    topic = "python"
    scraper = LearningScraper(topic)
    print(f"Starting Social Scrape for topic: {topic}")
    count = scraper.run_all()
    print(f"Done! Saved {count} resources to learning_resources.json")
