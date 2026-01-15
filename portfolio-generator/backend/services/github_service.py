from github import Github, GithubException
from models.schemas import GitHubProfile, GitHubRepo
from typing import Optional, List, Dict
import os
from dotenv import load_dotenv
from collections import Counter

load_dotenv()

class GitHubService:
    def __init__(self):
        token = os.getenv("GITHUB_TOKEN")
        self.github = Github(token) if token else Github()
    
    async def fetch_profile(self, username: str, max_repos: int = 10) -> GitHubProfile:
        """Fetch GitHub profile data including repositories"""
        try:
            user = self.github.get_user(username)
            
            # Fetch repositories
            repos = []
            stars_count = 0
            languages = Counter()
            
            # Get all repos and sort by stars
            all_repos = list(user.get_repos(sort='updated', direction='desc'))
            
            for repo in all_repos[:max_repos]:
                if not repo.fork:  # Skip forked repos
                    repo_data = GitHubRepo(
                        name=repo.name,
                        description=repo.description or "",
                        url=repo.html_url,
                        stars=repo.stargazers_count,
                        forks=repo.forks_count,
                        language=repo.language,
                        topics=repo.get_topics(),
                        homepage=repo.homepage
                    )
                    repos.append(repo_data)
                    stars_count += repo.stargazers_count
                    
                    # Count languages
                    if repo.language:
                        languages[repo.language] += 1
            
            # Sort repos by stars
            repos.sort(key=lambda x: x.stars, reverse=True)
            
            # Get top languages (convert counter to dict)
            top_languages = dict(languages.most_common(5))
            
            # Try to get contribution count (this is approximate)
            try:
                contributions = self._get_contribution_count(username)
            except:
                contributions = 0
            
            profile = GitHubProfile(
                username=username,
                name=user.name,
                bio=user.bio,
                avatar_url=user.avatar_url,
                followers=user.followers,
                following=user.following,
                public_repos=user.public_repos,
                repositories=repos,
                top_languages=top_languages,
                total_stars=stars_count,
                total_contributions=contributions
            )
            
            return profile
            
        except GithubException as e:
            raise ValueError(f"GitHub API error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error fetching GitHub profile: {str(e)}")
    
    def _get_contribution_count(self, username: str) -> int:
        """Approximate contribution count from public events"""
        try:
            user = self.github.get_user(username)
            events = list(user.get_public_events()[:100])
            return len(events)
        except:
            return 0
    
    async def fetch_pinned_repos(self, username: str) -> List[GitHubRepo]:
        """Fetch pinned repositories (if available)"""
        # Note: PyGithub doesn't support pinned repos directly
        # This would require GraphQL API or web scraping
        # For now, return top repos by stars
        profile = await self.fetch_profile(username, max_repos=6)
        return profile.repositories[:6]
    
    async def validate_username(self, username: str) -> bool:
        """Check if GitHub username exists"""
        try:
            self.github.get_user(username)
            return True
        except GithubException:
            return False

# Create singleton instance
github_service = GitHubService()
