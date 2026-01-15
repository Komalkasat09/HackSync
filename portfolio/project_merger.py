"""
GitHub and resume data merger with tech stack inference.
"""

from typing import List, Dict, Any, Optional, Set
from pydantic import BaseModel, Field
import re


class ProjectData(BaseModel):
    """Unified project data from GitHub and resume."""
    name: str
    description: Optional[str] = None
    url: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    stars: Optional[int] = None
    source: str = Field(default="resume")  # "github", "resume", or "merged"


class GitHubRepo(BaseModel):
    """GitHub repository data."""
    name: str
    description: Optional[str] = None
    url: str
    languages: Dict[str, int] = Field(default_factory=dict)  # language: bytes
    stars: int = 0
    readme_content: Optional[str] = None


# Tech stack keywords for inference
TECH_KEYWORDS = {
    "python": ["flask", "django", "fastapi", "pytorch", "tensorflow", "pandas", "numpy", "scikit"],
    "javascript": ["react", "vue", "angular", "node", "express", "next", "svelte", "typescript"],
    "java": ["spring", "hibernate", "maven", "gradle", "junit"],
    "go": ["gin", "echo", "gorilla", "grpc"],
    "rust": ["actix", "rocket", "tokio", "async"],
    "typescript": ["angular", "nest", "prisma", "typeorm"],
    "c++": ["qt", "boost", "cmake"],
    "c#": ["asp.net", ".net", "unity", "xamarin"],
    "ruby": ["rails", "sinatra", "rspec"],
    "php": ["laravel", "symfony", "wordpress"],
    "swift": ["swiftui", "uikit", "vapor"],
    "kotlin": ["spring", "ktor", "compose"],
    "docker": ["container", "dockerfile", "compose", "k8s", "kubernetes"],
    "database": ["postgresql", "mysql", "mongodb", "redis", "sqlite", "dynamodb"],
    "cloud": ["aws", "azure", "gcp", "cloud", "lambda", "s3", "ec2"],
    "ml": ["machine learning", "deep learning", "neural network", "ai", "llm"],
    "web": ["rest", "api", "graphql", "websocket", "http"],
    "mobile": ["android", "ios", "react native", "flutter"],
}


def normalize_project_name(name: str) -> str:
    """Normalize project name for comparison."""
    # Remove special characters, convert to lowercase
    normalized = re.sub(r'[^a-z0-9]+', '', name.lower())
    return normalized


def infer_tech_stack(
    languages: Dict[str, int],
    readme_content: Optional[str] = None,
    description: Optional[str] = None
) -> List[str]:
    """
    Infer tech stack from repository languages and README keywords.
    
    Args:
        languages: Dictionary of language names to byte counts.
        readme_content: README file content.
        description: Repository description.
    
    Returns:
        List of inferred technologies.
    """
    tech_stack = set()
    
    # Add primary languages (more than 5% of codebase)
    if languages:
        total_bytes = sum(languages.values())
        for lang, bytes_count in languages.items():
            if total_bytes > 0 and bytes_count / total_bytes > 0.05:
                tech_stack.add(lang.lower())
    
    # Search for tech keywords in README and description
    search_text = ""
    if readme_content:
        search_text += readme_content.lower()
    if description:
        search_text += " " + description.lower()
    
    if search_text:
        # Check for framework/library keywords
        for tech_category, keywords in TECH_KEYWORDS.items():
            for keyword in keywords:
                # Use word boundaries to avoid false matches
                pattern = r'\b' + re.escape(keyword) + r'\b'
                if re.search(pattern, search_text):
                    tech_stack.add(keyword)
        
        # Also check for technology names in the text
        for tech in TECH_KEYWORDS.keys():
            pattern = r'\b' + re.escape(tech) + r'\b'
            if re.search(pattern, search_text):
                tech_stack.add(tech)
    
    return sorted(list(tech_stack))


def extract_highlights_from_readme(readme_content: Optional[str]) -> List[str]:
    """
    Extract key highlights from README content.
    
    Args:
        readme_content: README file content.
    
    Returns:
        List of extracted highlights.
    """
    if not readme_content:
        return []
    
    highlights = []
    
    # Look for features section
    features_pattern = r'##?\s*(?:Features?|Highlights?|Key Features?)\s*\n(.*?)(?=\n##|$)'
    features_match = re.search(features_pattern, readme_content, re.IGNORECASE | re.DOTALL)
    
    if features_match:
        features_text = features_match.group(1)
        # Extract bullet points
        bullet_pattern = r'[-*+]\s+(.+?)(?=\n|$)'
        bullets = re.findall(bullet_pattern, features_text)
        
        for bullet in bullets[:5]:  # Limit to 5 highlights
            bullet = bullet.strip()
            if bullet and len(bullet) > 10:  # Meaningful highlights only
                # Limit length
                if len(bullet) > 200:
                    bullet = bullet[:197] + "..."
                highlights.append(bullet)
    
    return highlights


def match_github_to_resume_projects(
    github_repos: List[GitHubRepo],
    resume_projects: List[str]
) -> Dict[str, Optional[GitHubRepo]]:
    """
    Match GitHub repositories to resume project names.
    
    Args:
        github_repos: List of GitHub repository data.
        resume_projects: List of project names/descriptions from resume.
    
    Returns:
        Dictionary mapping resume project to matched GitHub repo (or None).
    """
    matches = {}
    
    # Normalize GitHub repo names for matching
    github_map = {}
    for repo in github_repos:
        normalized = normalize_project_name(repo.name)
        github_map[normalized] = repo
    
    for resume_project in resume_projects:
        # Try to find matching GitHub repo
        normalized_project = normalize_project_name(resume_project)
        
        # Exact match
        if normalized_project in github_map:
            matches[resume_project] = github_map[normalized_project]
        else:
            # Partial match - check if repo name is in project description
            matched = None
            for repo_name, repo in github_map.items():
                if repo_name in normalized_project or normalized_project in repo_name:
                    matched = repo
                    break
            matches[resume_project] = matched
    
    return matches


def merge_projects(
    github_repos: List[GitHubRepo],
    resume_projects: Optional[List[str]] = None
) -> List[ProjectData]:
    """
    Merge GitHub repository data with resume projects.
    Prefer GitHub data when conflicts exist.
    Infer missing tech stack from languages and README.
    
    Args:
        github_repos: List of GitHub repository data.
        resume_projects: Optional list of project names/descriptions from resume.
    
    Returns:
        List of unified project data.
    """
    merged_projects = []
    used_github_repos = set()
    
    # If we have resume projects, try to match them with GitHub data
    if resume_projects:
        matches = match_github_to_resume_projects(github_repos, resume_projects)
        
        for resume_project, github_repo in matches.items():
            if github_repo:
                # Merge: prefer GitHub data
                tech_stack = infer_tech_stack(
                    github_repo.languages,
                    github_repo.readme_content,
                    github_repo.description
                )
                
                highlights = extract_highlights_from_readme(github_repo.readme_content)
                if not highlights:
                    # Use resume project as highlight if no README features found
                    highlights = [resume_project] if resume_project else []
                
                project = ProjectData(
                    name=github_repo.name,  # Prefer GitHub name
                    description=github_repo.description or resume_project,
                    url=github_repo.url,
                    tech_stack=tech_stack,
                    highlights=highlights,
                    stars=github_repo.stars,
                    source="merged"
                )
                merged_projects.append(project)
                used_github_repos.add(github_repo.name)
            else:
                # Resume project with no GitHub match
                project = ProjectData(
                    name=resume_project.split("-")[0].strip(),  # Use first part as name
                    description=resume_project,
                    tech_stack=[],
                    highlights=[resume_project],
                    source="resume"
                )
                merged_projects.append(project)
    
    # Add remaining GitHub repos that weren't matched
    for github_repo in github_repos:
        if github_repo.name not in used_github_repos:
            tech_stack = infer_tech_stack(
                github_repo.languages,
                github_repo.readme_content,
                github_repo.description
            )
            
            highlights = extract_highlights_from_readme(github_repo.readme_content)
            if not highlights and github_repo.description:
                highlights = [github_repo.description]
            
            project = ProjectData(
                name=github_repo.name,
                description=github_repo.description,
                url=github_repo.url,
                tech_stack=tech_stack,
                highlights=highlights,
                stars=github_repo.stars,
                source="github"
            )
            merged_projects.append(project)
    
    # Sort by stars (GitHub projects) and put resume-only projects at the end
    merged_projects.sort(key=lambda p: (p.source == "resume", -(p.stars or 0)))
    
    return merged_projects


# Example usage
if __name__ == "__main__":
    # Example GitHub repos
    github_repos = [
        GitHubRepo(
            name="awesome-web-app",
            description="A full-stack web application",
            url="https://github.com/user/awesome-web-app",
            languages={"TypeScript": 15000, "Python": 5000, "CSS": 2000},
            stars=120,
            readme_content="""
# Awesome Web App

## Features
- Real-time data synchronization
- RESTful API with FastAPI backend
- React frontend with TypeScript
- PostgreSQL database
            """
        ),
        GitHubRepo(
            name="ml-project",
            description="Machine learning model for prediction",
            url="https://github.com/user/ml-project",
            languages={"Python": 20000, "Jupyter Notebook": 3000},
            stars=45,
            readme_content="Uses TensorFlow and PyTorch for deep learning"
        )
    ]
    
    # Example resume projects
    resume_projects = [
        "Awesome Web App - Built scalable web application with 10K users",
        "Data Analysis Dashboard - Created analytics platform"
    ]
    
    # Merge projects
    merged = merge_projects(github_repos, resume_projects)
    
    for project in merged:
        print(f"\n{project.name} ({project.source})")
        print(f"  Tech: {', '.join(project.tech_stack)}")
        print(f"  Stars: {project.stars}")
        print(f"  Highlights: {project.highlights[:2]}")
