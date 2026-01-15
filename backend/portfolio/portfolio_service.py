"""
Portfolio Service - Aggregates user data and generates portfolio HTML
"""
from typing import Dict, Any
from datetime import datetime
import os
from jinja2 import Template
from bson import ObjectId

class PortfolioService:
    
    @staticmethod
    async def fetch_user_portfolio_data(db, user_id: str) -> Dict[str, Any]:
        """
        Fetch all user data from various collections
        """
        # Get user basic info - convert string ID to ObjectId
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            user = None
        
        # Get profile data
        profile = await db.user_profiles.find_one({"user_id": user_id})
        
        if not profile:
            profile = {
                "links": [],
                "skills": [],
                "experiences": [],
                "projects": [],
                "education": [],
                "interests": []
            }
        
        # Aggregate all data
        portfolio_data = {
            "user_id": user_id,
            "name": user.get("full_name", "User") if user else "User",
            "email": user.get("email", "") if user else "",
            "location": profile.get("location", ""),
            "bio": profile.get("bio", ""),
            "links": profile.get("links", []),
            "skills": profile.get("skills", []),
            "experiences": profile.get("experiences", []),
            "projects": profile.get("projects", []),
            "education": profile.get("education", []),
            "interests": profile.get("interests", [])
        }
        
        return portfolio_data
    
    @staticmethod
    def generate_portfolio_html(portfolio_data: Dict[str, Any], template_name: str = "modern") -> str:
        """
        Generate HTML portfolio from user data using template
        """
        template_path = os.path.join(
            os.path.dirname(__file__), 
            "templates", 
            f"{template_name}.html"
        )
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            template = Template(template_content)
            html_content = template.render(**portfolio_data)
            
            return html_content
        except FileNotFoundError:
            # Fallback to default template if specified template not found
            return PortfolioService._generate_default_html(portfolio_data)
    
    @staticmethod
    def _generate_default_html(data: Dict[str, Any]) -> str:
        """
        Generate a default HTML portfolio if template not found
        """
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{data['name']} - Portfolio</title>
        </head>
        <body>
            <h1>{data['name']}</h1>
            <p>{data['email']}</p>
            <p>{data['location']}</p>
        </body>
        </html>
        """
    
    @staticmethod
    async def save_deployed_portfolio(db, user_id: str, html_content: str) -> str:
        """
        Save deployed portfolio to database and return deployment URL
        """
        deployment_data = {
            "user_id": user_id,
            "html_content": html_content,
            "deployed_at": datetime.utcnow(),
            "is_active": True
        }
        
        # Check if portfolio already exists
        existing = await db.deployed_portfolios.find_one({"user_id": user_id})
        
        if existing:
            # Update existing deployment
            await db.deployed_portfolios.update_one(
                {"user_id": user_id},
                {"$set": deployment_data}
            )
        else:
            # Create new deployment
            await db.deployed_portfolios.insert_one(deployment_data)
        
        # Generate deployment URL
        portfolio_url = f"/portfolio/{user_id}/deployed"
        
        return portfolio_url
