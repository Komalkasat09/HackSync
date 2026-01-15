"""
Portfolio generation pipeline orchestrator.

Coordinates the full pipeline from resume to deployed HTML portfolio:
1. Resume extraction and parsing
2. GitHub data enrichment
3. Skill normalization and clustering
4. Domain inference
5. Graph generation
6. Content generation
7. HTML rendering

Includes timing and error logging for each stage.
"""

import time
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

# Import all pipeline components
from resume_parser import parse_resume, ResumeParseError
from project_merger import merge_projects, GitHubRepo
from skill_normalizer import normalize_skills, categorize_skills
from skill_clusterer import SkillClusterer
from domain_inference import infer_domain_from_resume_data, DomainInferenceError
from graph_builder import build_skill_graph_from_clusterer_output, export_graph_to_json
from content_generator import generate_portfolio_content, ContentGenerationError
from portfolio_renderer import PortfolioRenderer
from gemini_service import GeminiClient, GeminiClientError


@dataclass
class StageResult:
    """Result of a pipeline stage."""
    stage_name: str
    success: bool
    duration: float  # seconds
    error: Optional[str] = None
    data: Optional[Any] = None


class PipelineLogger:
    """Logger for pipeline execution."""
    
    def __init__(self, log_file: Optional[str] = None):
        """
        Initialize pipeline logger.
        
        Args:
            log_file: Optional path to log file.
        """
        self.log_file = log_file
        self.results: List[StageResult] = []
        
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler(log_file) if log_file else logging.NullHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log_stage_start(self, stage_name: str) -> float:
        """Log start of a pipeline stage."""
        self.logger.info(f"Starting stage: {stage_name}")
        return time.time()
    
    def log_stage_end(
        self,
        stage_name: str,
        start_time: float,
        success: bool,
        error: Optional[str] = None,
        data: Optional[Any] = None
    ) -> StageResult:
        """Log end of a pipeline stage."""
        duration = time.time() - start_time
        
        if success:
            self.logger.info(f"Completed stage: {stage_name} ({duration:.2f}s)")
        else:
            self.logger.error(f"Failed stage: {stage_name} ({duration:.2f}s) - {error}")
        
        result = StageResult(
            stage_name=stage_name,
            success=success,
            duration=duration,
            error=error,
            data=data
        )
        self.results.append(result)
        return result
    
    def get_summary(self) -> Dict[str, Any]:
        """Get pipeline execution summary."""
        total_duration = sum(r.duration for r in self.results)
        successful = sum(1 for r in self.results if r.success)
        failed = sum(1 for r in self.results if not r.success)
        
        return {
            'total_stages': len(self.results),
            'successful': successful,
            'failed': failed,
            'total_duration': total_duration,
            'stages': [
                {
                    'name': r.stage_name,
                    'success': r.success,
                    'duration': r.duration,
                    'error': r.error
                }
                for r in self.results
            ]
        }


class PortfolioPipeline:
    """Full portfolio generation pipeline."""
    
    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        log_file: Optional[str] = None,
        similarity_threshold: float = 0.5
    ):
        """
        Initialize the portfolio pipeline.
        
        Args:
            gemini_api_key: Optional Gemini API key.
            log_file: Optional path to log file.
            similarity_threshold: Similarity threshold for skill clustering.
        """
        self.logger = PipelineLogger(log_file)
        self.similarity_threshold = similarity_threshold
        
        # Initialize Gemini client
        try:
            self.gemini_client = GeminiClient(api_key=gemini_api_key)
        except GeminiClientError as e:
            self.logger.logger.warning(f"Gemini client initialization failed: {e}")
            self.gemini_client = None
    
    def run(
        self,
        resume_text: str,
        github_repos: Optional[List[Dict[str, Any]]] = None,
        output_path: str = "portfolio.html"
    ) -> Dict[str, Any]:
        """
        Run the complete portfolio generation pipeline.
        
        Args:
            resume_text: Raw resume text.
            github_repos: Optional list of GitHub repository data.
            output_path: Path to save the generated HTML portfolio.
        
        Returns:
            Dictionary with pipeline results and metadata.
        """
        pipeline_start = time.time()
        self.logger.logger.info("="*60)
        self.logger.logger.info("Starting Portfolio Generation Pipeline")
        self.logger.logger.info("="*60)
        
        # Stage 1: Parse resume with Gemini
        resume_data = self._parse_resume(resume_text)
        if not resume_data:
            return self._create_error_result("Resume parsing failed")
        
        # Stage 2: Merge GitHub data with projects
        project_data = self._merge_github_data(resume_data, github_repos)
        
        # Stage 3: Normalize skills
        normalized_skills = self._normalize_skills(resume_data)
        if not normalized_skills:
            return self._create_error_result("Skill normalization failed")
        
        # Update resume data with normalized skills
        resume_data['skills'] = normalized_skills
        
        # Stage 4: Cluster skills
        skill_clusters = self._cluster_skills(normalized_skills)
        if not skill_clusters:
            return self._create_error_result("Skill clustering failed")
        
        # Stage 5: Infer professional domain
        domain = self._infer_domain(resume_data)
        if not domain:
            domain = "Software Development"  # Fallback
        
        # Stage 6: Generate skill graph
        graph_data = self._generate_graph(domain, skill_clusters)
        if not graph_data:
            return self._create_error_result("Graph generation failed")
        
        # Stage 7: Generate portfolio content
        portfolio_content = self._generate_content(resume_data, project_data, domain)
        if not portfolio_content:
            return self._create_error_result("Content generation failed")
        
        # Stage 8: Render HTML
        html_output = self._render_html(
            portfolio_content,
            graph_data,
            resume_data,
            project_data,
            domain,
            output_path
        )
        if not html_output:
            return self._create_error_result("HTML rendering failed")
        
        # Pipeline complete
        total_duration = time.time() - pipeline_start
        
        self.logger.logger.info("="*60)
        self.logger.logger.info(f"Pipeline Completed Successfully ({total_duration:.2f}s)")
        self.logger.logger.info(f"Output: {output_path}")
        self.logger.logger.info("="*60)
        
        return {
            'success': True,
            'output_file': output_path,
            'total_duration': total_duration,
            'summary': self.logger.get_summary(),
            'data': {
                'name': resume_data.get('name'),
                'domain': domain,
                'skills_count': len(normalized_skills),
                'clusters_count': len(skill_clusters),
                'projects_count': len(project_data) if project_data else 0
            }
        }
    
    def _parse_resume(self, resume_text: str) -> Optional[Dict[str, Any]]:
        """Stage 1: Parse resume with Gemini."""
        stage_name = "Resume Parsing"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            resume_data = parse_resume(resume_text, self.gemini_client)
            # Convert Pydantic model to dict
            if hasattr(resume_data, 'model_dump'):
                resume_dict = resume_data.model_dump()
            else:
                resume_dict = dict(resume_data)
            
            self.logger.log_stage_end(stage_name, start_time, True, data=resume_dict)
            return resume_dict
            
        except ResumeParseError as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=f"Unexpected error: {str(e)}")
            return None
    
    def _merge_github_data(
        self,
        resume_data: Dict[str, Any],
        github_repos: Optional[List[Dict[str, Any]]]
    ) -> Optional[List[Dict[str, Any]]]:
        """Stage 2: Merge GitHub data with resume projects."""
        stage_name = "GitHub Data Enrichment"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            if not github_repos:
                self.logger.logger.info("No GitHub repos provided, skipping enrichment")
                project_data = None
            else:
                # Convert to GitHubRepo objects
                repo_objects = []
                for repo in github_repos:
                    repo_objects.append(GitHubRepo(
                        name=repo.get('name', ''),
                        description=repo.get('description'),
                        url=repo.get('url', ''),
                        languages=repo.get('languages', {}),
                        stars=repo.get('stars', 0),
                        readme_content=repo.get('readme_content')
                    ))
                
                # Merge with resume projects
                resume_projects = resume_data.get('projects')
                merged_projects = merge_projects(repo_objects, resume_projects)
                
                # Convert back to dicts
                project_data = [
                    {
                        'name': p.name,
                        'description': p.description,
                        'url': p.url,
                        'tech_stack': p.tech_stack,
                        'highlights': p.highlights,
                        'stars': p.stars,
                        'source': p.source
                    }
                    for p in merged_projects
                ]
            
            self.logger.log_stage_end(stage_name, start_time, True, data=project_data)
            return project_data
            
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
    
    def _normalize_skills(self, resume_data: Dict[str, Any]) -> Optional[List[str]]:
        """Stage 3: Normalize skills."""
        stage_name = "Skill Normalization"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            raw_skills = resume_data.get('skills', [])
            if not raw_skills:
                raise ValueError("No skills found in resume data")
            
            normalized = normalize_skills(raw_skills, deduplicate=True)
            
            self.logger.logger.info(f"Normalized {len(raw_skills)} skills to {len(normalized)}")
            self.logger.log_stage_end(stage_name, start_time, True, data=normalized)
            return normalized
            
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
    
    def _cluster_skills(self, skills: List[str]) -> Optional[List[Any]]:
        """Stage 4: Cluster skills."""
        stage_name = "Skill Clustering"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            clusterer = SkillClusterer(similarity_threshold=self.similarity_threshold)
            clusters, _ = clusterer.cluster_skills(skills)
            
            self.logger.logger.info(f"Clustered {len(skills)} skills into {len(clusters)} clusters")
            self.logger.log_stage_end(stage_name, start_time, True, data=clusters)
            return clusters
            
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
    
    def _infer_domain(self, resume_data: Dict[str, Any]) -> Optional[str]:
        """Stage 5: Infer professional domain."""
        stage_name = "Domain Inference"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            if not self.gemini_client:
                raise ValueError("Gemini client not initialized")
            
            domain = infer_domain_from_resume_data(resume_data, self.gemini_client)
            
            self.logger.logger.info(f"Inferred domain: {domain}")
            self.logger.log_stage_end(stage_name, start_time, True, data=domain)
            return domain
            
        except (DomainInferenceError, ValueError) as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=f"Unexpected error: {str(e)}")
            return None
    
    def _generate_graph(self, domain: str, skill_clusters: List[Any]) -> Optional[Dict[str, Any]]:
        """Stage 6: Generate skill graph."""
        stage_name = "Graph Generation"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            graph = build_skill_graph_from_clusterer_output(domain, skill_clusters)
            graph_data = graph.to_cytoscape_json()
            
            self.logger.logger.info(f"Generated graph with {len(graph.nodes)} nodes and {len(graph.edges)} edges")
            self.logger.log_stage_end(stage_name, start_time, True, data=graph_data)
            return graph_data
            
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
    
    def _generate_content(
        self,
        resume_data: Dict[str, Any],
        project_data: Optional[List[Dict[str, Any]]],
        domain: str
    ) -> Optional[Dict[str, Any]]:
        """Stage 7: Generate portfolio content."""
        stage_name = "Content Generation"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            if not self.gemini_client:
                raise ValueError("Gemini client not initialized")
            
            portfolio_content = generate_portfolio_content(
                resume_data,
                project_data,
                domain,
                self.gemini_client
            )
            
            # Convert to dict
            if hasattr(portfolio_content, 'model_dump'):
                content_dict = portfolio_content.model_dump()
            else:
                content_dict = {
                    'about': portfolio_content.about,
                    'projects': [
                        p.model_dump() if hasattr(p, 'model_dump') else p
                        for p in portfolio_content.projects
                    ],
                    'experiences': [
                        e.model_dump() if hasattr(e, 'model_dump') else e
                        for e in portfolio_content.experiences
                    ]
                }
            
            self.logger.logger.info(f"Generated content: {len(content_dict.get('projects', []))} projects, {len(content_dict.get('experiences', []))} experiences")
            self.logger.log_stage_end(stage_name, start_time, True, data=content_dict)
            return content_dict
            
        except (ContentGenerationError, ValueError) as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=f"Unexpected error: {str(e)}")
            return None
    
    def _render_html(
        self,
        portfolio_content: Dict[str, Any],
        graph_data: Dict[str, Any],
        resume_data: Dict[str, Any],
        project_data: Optional[List[Dict[str, Any]]],
        domain: str,
        output_path: str
    ) -> Optional[str]:
        """Stage 8: Render HTML portfolio."""
        stage_name = "HTML Rendering"
        start_time = self.logger.log_stage_start(stage_name)
        
        try:
            renderer = PortfolioRenderer()
            html = renderer.render_from_portfolio_data(
                portfolio_content,
                graph_data,
                resume_data,
                project_data,
                domain,
                output_path
            )
            
            self.logger.logger.info(f"Rendered HTML: {len(html)} characters")
            self.logger.log_stage_end(stage_name, start_time, True, data=output_path)
            return html
            
        except Exception as e:
            self.logger.log_stage_end(stage_name, start_time, False, error=str(e))
            return None
    
    def _create_error_result(self, error_message: str) -> Dict[str, Any]:
        """Create an error result."""
        self.logger.logger.error(f"Pipeline failed: {error_message}")
        return {
            'success': False,
            'error': error_message,
            'summary': self.logger.get_summary()
        }


# Convenience function
def generate_portfolio(
    resume_text: str,
    github_repos: Optional[List[Dict[str, Any]]] = None,
    output_path: str = "portfolio.html",
    gemini_api_key: Optional[str] = None,
    log_file: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a portfolio from resume text and optional GitHub data.
    
    Args:
        resume_text: Raw resume text.
        github_repos: Optional list of GitHub repository data.
        output_path: Path to save the generated HTML portfolio.
        gemini_api_key: Optional Gemini API key.
        log_file: Optional path to log file.
    
    Returns:
        Dictionary with pipeline results.
    """
    pipeline = PortfolioPipeline(
        gemini_api_key=gemini_api_key,
        log_file=log_file
    )
    return pipeline.run(resume_text, github_repos, output_path)


# Example usage
if __name__ == "__main__":
    # Example resume text
    sample_resume = """
    John Doe
    Senior Software Engineer
    
    Skills: Python, JavaScript, React, Node.js, PostgreSQL, Docker, AWS, Git
    
    Experience:
    
    Tech Corp - Senior Software Engineer
    Jan 2020 - Present
    - Led development of microservices architecture serving 1M+ users
    - Improved API response time by 40% through optimization
    - Mentored 5 junior developers
    
    StartupXYZ - Software Engineer
    Jun 2018 - Dec 2019
    - Built real-time data processing pipeline handling 100K events/sec
    - Implemented CI/CD pipeline reducing deployment time by 60%
    
    Projects:
    - Open source web framework with 5K+ stars
    - Personal blog with technical tutorials
    
    Education:
    - BS Computer Science, MIT, 2018
    """
    
    # Example GitHub repos
    sample_repos = [
        {
            'name': 'awesome-framework',
            'description': 'Modern web framework',
            'url': 'https://github.com/user/awesome-framework',
            'languages': {'Python': 15000, 'JavaScript': 5000},
            'stars': 5200,
            'readme_content': 'A modern web framework built with Python and FastAPI'
        }
    ]
    
    # Generate portfolio
    result = generate_portfolio(
        resume_text=sample_resume,
        github_repos=sample_repos,
        output_path="test_portfolio.html",
        log_file="pipeline.log"
    )
    
    if result['success']:
        print("\n✓ Portfolio generated successfully!")
        print(f"  Output: {result['output_file']}")
        print(f"  Duration: {result['total_duration']:.2f}s")
        print(f"  Domain: {result['data']['domain']}")
        print(f"  Skills: {result['data']['skills_count']}")
        print(f"  Clusters: {result['data']['clusters_count']}")
    else:
        print(f"\n✗ Pipeline failed: {result['error']}")
        print("\nStage Summary:")
        for stage in result['summary']['stages']:
            status = "✓" if stage['success'] else "✗"
            print(f"  {status} {stage['name']}: {stage['duration']:.2f}s")
            if stage['error']:
                print(f"    Error: {stage['error']}")
