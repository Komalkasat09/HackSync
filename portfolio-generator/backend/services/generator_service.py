from jinja2 import Environment, FileSystemLoader, select_autoescape
from models.schemas import Portfolio, TemplateType
import os
import json
from datetime import datetime
import uuid
import shutil
from pathlib import Path

class PortfolioGeneratorService:
    """Service for generating portfolio HTML from templates"""
    
    def __init__(self):
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        self.data_dir = "data/portfolios"
        self.export_dir = "data/exports"
        
        # Ensure directories exist
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.export_dir, exist_ok=True)
    
    async def create_portfolio(self, portfolio_data: Portfolio) -> Portfolio:
        """Create and save a new portfolio"""
        # Generate ID if not provided
        if not portfolio_data.id:
            portfolio_data.id = str(uuid.uuid4())
        
        # Set timestamps
        portfolio_data.created_at = datetime.now()
        portfolio_data.updated_at = datetime.now()
        
        # Save portfolio data
        await self.save_portfolio(portfolio_data)
        
        return portfolio_data
    
    async def save_portfolio(self, portfolio: Portfolio):
        """Save portfolio data to JSON file"""
        portfolio_file = os.path.join(self.data_dir, f"{portfolio.id}.json")
        
        with open(portfolio_file, 'w', encoding='utf-8') as f:
            json.dump(portfolio.model_dump(mode='json'), f, indent=2, default=str)
    
    async def load_portfolio(self, portfolio_id: str) -> Portfolio:
        """Load portfolio data from JSON file"""
        portfolio_file = os.path.join(self.data_dir, f"{portfolio_id}.json")
        
        if not os.path.exists(portfolio_file):
            raise FileNotFoundError(f"Portfolio {portfolio_id} not found")
        
        with open(portfolio_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return Portfolio(**data)
    
    async def generate_html(self, portfolio_id: str) -> str:
        """Generate HTML for portfolio"""
        portfolio = await self.load_portfolio(portfolio_id)
        
        # Select template based on config
        template_name = self._get_template_name(portfolio.config.template)
        template = self.env.get_template(template_name)
        
        # Prepare data for template
        context = self._prepare_template_context(portfolio)
        
        # Render HTML
        html = template.render(**context)
        
        return html
    
    def _get_template_name(self, template_type: TemplateType) -> str:
        """Get template filename from template type"""
        template_map = {
            TemplateType.MODERN: "modern.html",
            TemplateType.CREATIVE: "creative.html",
            TemplateType.PROFESSIONAL: "professional.html",
            TemplateType.DEVELOPER: "developer.html"
        }
        return template_map.get(template_type, "modern.html")
    
    def _prepare_template_context(self, portfolio: Portfolio) -> dict:
        """Prepare context data for template rendering"""
        
        # Combine projects from different sources
        all_projects = portfolio.projects.copy()
        
        # Add GitHub repos as projects if configured
        if portfolio.config.show_github and portfolio.github_profile:
            for repo in portfolio.github_profile.repositories[:6]:
                all_projects.append({
                    'name': repo.name,
                    'description': repo.description,
                    'technologies': [repo.language] if repo.language else [],
                    'url': repo.url,
                    'github_url': repo.url,
                    'stars': repo.stars,
                    'forks': repo.forks
                })
        
        # Combine experience from LinkedIn and resume
        all_experience = []
        if portfolio.linkedin_profile:
            all_experience.extend(portfolio.linkedin_profile.experience)
        if portfolio.resume_data:
            all_experience.extend(portfolio.resume_data.experience)
        
        # Combine education
        all_education = []
        if portfolio.linkedin_profile:
            all_education.extend(portfolio.linkedin_profile.education)
        if portfolio.resume_data:
            all_education.extend(portfolio.resume_data.education)
        
        # Combine skills
        all_skills = portfolio.skills.copy()
        if portfolio.linkedin_profile:
            all_skills.extend([{'name': s} for s in portfolio.linkedin_profile.skills])
        if portfolio.resume_data:
            all_skills.extend(portfolio.resume_data.skills)
        
        # Remove duplicates
        unique_skills = []
        seen_skills = set()
        for skill in all_skills:
            skill_name = skill.get('name') if isinstance(skill, dict) else skill.name
            if skill_name not in seen_skills:
                unique_skills.append(skill)
                seen_skills.add(skill_name)
        
        context = {
            'portfolio': portfolio,
            'personal': portfolio.personal_info,
            'github': portfolio.github_profile,
            'linkedin': portfolio.linkedin_profile,
            'projects': all_projects,
            'experience': all_experience,
            'education': all_education,
            'skills': unique_skills,
            'certifications': portfolio.linkedin_profile.certifications if portfolio.linkedin_profile else [],
            'config': portfolio.config,
            'generated_date': datetime.now().strftime('%B %d, %Y')
        }
        
        return context
    
    async def export_html(self, portfolio_id: str, output_path: str):
        """Export portfolio as standalone HTML file"""
        html = await self.generate_html(portfolio_id)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        return output_path
    
    async def export_zip(self, portfolio_id: str, output_path: str):
        """Export portfolio as ZIP with assets"""
        # Generate HTML
        html = await self.generate_html(portfolio_id)
        portfolio = await self.load_portfolio(portfolio_id)
        
        # Create temporary directory
        temp_dir = os.path.join(self.export_dir, f"temp_{portfolio_id}")
        os.makedirs(temp_dir, exist_ok=True)
        
        try:
            # Save HTML
            html_path = os.path.join(temp_dir, "index.html")
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            
            # Copy assets (CSS, JS, images)
            assets_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'assets')
            if os.path.exists(assets_dir):
                shutil.copytree(assets_dir, os.path.join(temp_dir, 'assets'))
            
            # Create ZIP
            shutil.make_archive(output_path.replace('.zip', ''), 'zip', temp_dir)
            
        finally:
            # Cleanup temp directory
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        
        return output_path
    
    async def list_portfolios(self) -> list:
        """List all saved portfolios"""
        portfolios = []
        
        for filename in os.listdir(self.data_dir):
            if filename.endswith('.json'):
                portfolio_id = filename.replace('.json', '')
                try:
                    portfolio = await self.load_portfolio(portfolio_id)
                    portfolios.append({
                        'id': portfolio.id,
                        'name': portfolio.personal_info.full_name,
                        'title': portfolio.personal_info.title,
                        'template': portfolio.config.template,
                        'created_at': portfolio.created_at,
                        'updated_at': portfolio.updated_at
                    })
                except Exception as e:
                    print(f"Error loading portfolio {portfolio_id}: {e}")
        
        return sorted(portfolios, key=lambda x: x['updated_at'], reverse=True)
    
    async def delete_portfolio(self, portfolio_id: str):
        """Delete a portfolio"""
        portfolio_file = os.path.join(self.data_dir, f"{portfolio_id}.json")
        
        if os.path.exists(portfolio_file):
            os.remove(portfolio_file)
        else:
            raise FileNotFoundError(f"Portfolio {portfolio_id} not found")

# Create singleton instance
portfolio_generator = PortfolioGeneratorService()
