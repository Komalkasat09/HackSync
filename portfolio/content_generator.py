"""
Portfolio content generation using Gemini AI.

Generates professional portfolio content with strict quality constraints:
- About sections
- Project summaries
- Experience summaries
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from gemini_service import GeminiClient, GeminiClientError


class ProjectSummary(BaseModel):
    """Generated project summary with problem/solution/impact."""
    problem: str = Field(description="The problem or need addressed")
    solution: str = Field(description="The technical solution implemented")
    impact: str = Field(description="The measurable impact or outcome")
    
    @field_validator('problem', 'solution', 'impact')
    @classmethod
    def validate_no_empty(cls, v):
        """Ensure fields are not empty."""
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class ExperienceSummary(BaseModel):
    """Generated experience summary focused on impact."""
    summary: str = Field(description="Impact-focused summary of the role")
    
    @field_validator('summary')
    @classmethod
    def validate_summary(cls, v):
        """Validate summary content."""
        if not v or not v.strip():
            raise ValueError("Summary cannot be empty")
        v = v.strip()
        if len(v) < 20:
            raise ValueError("Summary too short (minimum 20 characters)")
        return v


class AboutSection(BaseModel):
    """Generated about section."""
    about: str = Field(description="Professional about section (80-120 words)")
    
    @field_validator('about')
    @classmethod
    def validate_about(cls, v):
        """Validate about section length."""
        if not v or not v.strip():
            raise ValueError("About section cannot be empty")
        v = v.strip()
        word_count = len(v.split())
        if word_count < 80 or word_count > 120:
            raise ValueError(f"About section must be 80-120 words, got {word_count}")
        return v


class PortfolioContent(BaseModel):
    """Complete portfolio content."""
    about: str
    projects: List[ProjectSummary]
    experiences: List[ExperienceSummary]


class ContentGenerationError(Exception):
    """Exception raised when content generation fails."""
    pass


def generate_about_section(
    name: str,
    domain: str,
    skills: List[str],
    current_role: Optional[str] = None,
    gemini_client: Optional[GeminiClient] = None
) -> str:
    """
    Generate professional about section (80-120 words).
    
    Args:
        name: Person's name.
        domain: Core professional domain.
        skills: List of key skills.
        current_role: Optional current job title.
        gemini_client: Optional GeminiClient instance.
    
    Returns:
        Generated about section text.
    
    Raises:
        ContentGenerationError: If generation fails.
    """
    if not gemini_client:
        try:
            gemini_client = GeminiClient()
        except GeminiClientError as e:
            raise ContentGenerationError(f"Failed to initialize Gemini client: {str(e)}")
    
    # Build context
    context = f"Name: {name}\nDomain: {domain}\n"
    if current_role:
        context += f"Current Role: {current_role}\n"
    context += f"Key Skills: {', '.join(skills[:10])}"  # Limit to top 10 skills
    
    # Define JSON schema
    response_schema = {
        "type": "object",
        "properties": {
            "about": {
                "type": "string",
                "description": "Professional about section in 80-120 words"
            }
        },
        "required": ["about"]
    }
    
    # System instruction
    system_instruction = """You are a professional portfolio content writer.

STRICT REQUIREMENTS:
1. Output ONLY valid JSON with an "about" field
2. About section MUST be 80-120 words (count carefully)
3. Professional tone throughout
4. NO emojis or special characters
5. NO buzzwords (synergy, rockstar, ninja, guru, disruptive, passionate, etc.)
6. NO hallucinated metrics or achievements
7. Write in third person
8. Focus on expertise, experience, and technical capabilities
9. Be specific and concrete, not vague or generic

AVOID: "passionate", "enthusiastic", "driven", "dynamic", "innovative" (unless backed by specifics)
PREFER: Clear statements about technical expertise and experience"""

    prompt = f"""Write a professional about section for a portfolio based on this information:

{context}

Requirements:
- Exactly 80-120 words
- Professional and straightforward tone
- Focus on technical expertise and professional background
- No buzzwords, no emojis, no unsupported claims
- Third person perspective

Return JSON with the about field."""

    try:
        result = gemini_client.generate_with_schema(
            prompt=prompt,
            schema=response_schema,
            system_instruction=system_instruction,
            temperature=0.3
        )
        
        about_data = AboutSection(**result)
        return about_data.about
        
    except Exception as e:
        raise ContentGenerationError(f"Failed to generate about section: {str(e)}")


def generate_project_summary(
    project_name: str,
    description: Optional[str],
    tech_stack: List[str],
    highlights: Optional[List[str]] = None,
    gemini_client: Optional[GeminiClient] = None
) -> ProjectSummary:
    """
    Generate project summary with problem/solution/impact.
    
    Args:
        project_name: Name of the project.
        description: Optional project description.
        tech_stack: Technologies used.
        highlights: Optional key highlights or features.
        gemini_client: Optional GeminiClient instance.
    
    Returns:
        ProjectSummary object.
    
    Raises:
        ContentGenerationError: If generation fails.
    """
    if not gemini_client:
        try:
            gemini_client = GeminiClient()
        except GeminiClientError as e:
            raise ContentGenerationError(f"Failed to initialize Gemini client: {str(e)}")
    
    # Build context
    context = f"Project: {project_name}\n"
    if description:
        context += f"Description: {description}\n"
    if tech_stack:
        context += f"Tech Stack: {', '.join(tech_stack)}\n"
    if highlights:
        context += f"Highlights: {', '.join(highlights)}\n"
    
    # Define JSON schema
    response_schema = {
        "type": "object",
        "properties": {
            "problem": {
                "type": "string",
                "description": "The problem or need this project addresses"
            },
            "solution": {
                "type": "string",
                "description": "The technical solution implemented"
            },
            "impact": {
                "type": "string",
                "description": "The measurable impact or outcome"
            }
        },
        "required": ["problem", "solution", "impact"]
    }
    
    # System instruction
    system_instruction = """You are a professional technical writer.

STRICT REQUIREMENTS:
1. Output ONLY valid JSON with problem, solution, and impact fields
2. Each field should be 1-2 sentences
3. Professional and technical tone
4. NO emojis or special characters
5. NO buzzwords or marketing language
6. NO fabricated metrics or made-up statistics
7. Base content ONLY on provided information
8. If metrics are mentioned in the input, use them; otherwise, describe impact qualitatively
9. Be specific about technical approaches

AVOID: Exaggeration, speculation, made-up numbers
PREFER: Clear technical descriptions based on facts provided"""

    prompt = f"""Based on the following project information, generate a structured summary:

{context}

Create a JSON response with:
- problem: What problem or need did this project address?
- solution: What technical solution was implemented? (mention key technologies)
- impact: What was the outcome or impact? (use only provided information, no fabrication)

Keep each field concise (1-2 sentences). Be specific and factual."""

    try:
        result = gemini_client.generate_with_schema(
            prompt=prompt,
            schema=response_schema,
            system_instruction=system_instruction,
            temperature=0.3
        )
        
        return ProjectSummary(**result)
        
    except Exception as e:
        raise ContentGenerationError(f"Failed to generate project summary: {str(e)}")


def generate_experience_summary(
    company: str,
    role: str,
    start_date: Optional[str],
    end_date: Optional[str],
    bullets: Optional[List[str]] = None,
    gemini_client: Optional[GeminiClient] = None
) -> ExperienceSummary:
    """
    Generate impact-focused experience summary.
    
    Args:
        company: Company name.
        role: Job role/title.
        start_date: Start date.
        end_date: End date.
        bullets: Optional achievement bullets.
        gemini_client: Optional GeminiClient instance.
    
    Returns:
        ExperienceSummary object.
    
    Raises:
        ContentGenerationError: If generation fails.
    """
    if not gemini_client:
        try:
            gemini_client = GeminiClient()
        except GeminiClientError as e:
            raise ContentGenerationError(f"Failed to initialize Gemini client: {str(e)}")
    
    # Build context
    context = f"Company: {company}\nRole: {role}\n"
    if start_date and end_date:
        context += f"Duration: {start_date} - {end_date}\n"
    if bullets:
        context += f"Key Achievements:\n"
        for bullet in bullets[:5]:  # Limit to top 5
            context += f"- {bullet}\n"
    
    # Define JSON schema
    response_schema = {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "Impact-focused summary of the role (2-3 sentences)"
            }
        },
        "required": ["summary"]
    }
    
    # System instruction
    system_instruction = """You are a professional resume writer.

STRICT REQUIREMENTS:
1. Output ONLY valid JSON with a summary field
2. Summary should be 2-3 sentences
3. Focus on impact and technical contributions
4. Professional and concrete tone
5. NO emojis or special characters
6. NO buzzwords or vague language
7. NO fabricated metrics
8. Use only information provided in the input
9. Highlight technical skills and concrete achievements

AVOID: Generic descriptions, buzzwords, made-up numbers
PREFER: Specific technical contributions and factual outcomes"""

    prompt = f"""Based on the following work experience, generate an impact-focused summary:

{context}

Create a JSON response with a summary field containing 2-3 sentences that highlight:
- Technical contributions and responsibilities
- Key impacts or achievements (use only provided information)
- Technologies or methodologies used

Be specific and factual. No buzzwords or fabrication."""

    try:
        result = gemini_client.generate_with_schema(
            prompt=prompt,
            schema=response_schema,
            system_instruction=system_instruction,
            temperature=0.3
        )
        
        return ExperienceSummary(**result)
        
    except Exception as e:
        raise ContentGenerationError(f"Failed to generate experience summary: {str(e)}")


def generate_portfolio_content(
    resume_data: Dict[str, Any],
    project_data: Optional[List[Dict[str, Any]]] = None,
    domain: Optional[str] = None,
    gemini_client: Optional[GeminiClient] = None
) -> PortfolioContent:
    """
    Generate complete portfolio content from resume and project data.
    
    Args:
        resume_data: Parsed resume data with name, skills, experience, etc.
        project_data: Optional enriched project data from project merger.
        domain: Optional inferred professional domain.
        gemini_client: Optional GeminiClient instance.
    
    Returns:
        PortfolioContent object with all generated content.
    
    Raises:
        ContentGenerationError: If generation fails.
    """
    if not gemini_client:
        try:
            gemini_client = GeminiClient()
        except GeminiClientError as e:
            raise ContentGenerationError(f"Failed to initialize Gemini client: {str(e)}")
    
    # Generate about section
    name = resume_data.get('name', 'Professional')
    skills = resume_data.get('skills', [])
    current_role = resume_data.get('current_role')
    
    if not domain:
        domain = "Software Development"  # Default fallback
    
    about = generate_about_section(
        name=name,
        domain=domain,
        skills=skills,
        current_role=current_role,
        gemini_client=gemini_client
    )
    
    # Generate project summaries
    project_summaries = []
    if project_data:
        for project in project_data[:6]:  # Limit to 6 projects
            try:
                summary = generate_project_summary(
                    project_name=project.get('name', 'Project'),
                    description=project.get('description'),
                    tech_stack=project.get('tech_stack', []),
                    highlights=project.get('highlights'),
                    gemini_client=gemini_client
                )
                project_summaries.append(summary)
            except Exception:
                # Skip failed projects
                continue
    
    # Generate experience summaries
    experience_summaries = []
    experiences = resume_data.get('experience', [])
    if experiences:
        for exp in experiences:
            if isinstance(exp, dict):
                try:
                    summary = generate_experience_summary(
                        company=exp.get('company', 'Company'),
                        role=exp.get('role', 'Role'),
                        start_date=exp.get('start_date'),
                        end_date=exp.get('end_date'),
                        bullets=exp.get('bullets'),
                        gemini_client=gemini_client
                    )
                    experience_summaries.append(summary)
                except Exception:
                    # Skip failed experiences
                    continue
    
    return PortfolioContent(
        about=about,
        projects=project_summaries,
        experiences=experience_summaries
    )


# Example usage
if __name__ == "__main__":
    import json
    
    # Example resume data
    resume_data = {
        "name": "Alex Johnson",
        "current_role": "Senior Software Engineer",
        "skills": ["Python", "JavaScript", "React", "Node.js", "PostgreSQL", "AWS"],
        "experience": [
            {
                "company": "Tech Corp",
                "role": "Senior Software Engineer",
                "start_date": "2020",
                "end_date": "Present",
                "bullets": [
                    "Led development of microservices architecture",
                    "Improved API response time by 40%",
                    "Mentored 5 junior developers"
                ]
            }
        ]
    }
    
    # Example project data
    project_data = [
        {
            "name": "E-commerce Platform",
            "description": "Full-stack web application",
            "tech_stack": ["React", "Node.js", "PostgreSQL"],
            "highlights": ["Real-time inventory updates", "Payment integration"]
        }
    ]
    
    try:
        # Generate about section
        about = generate_about_section(
            name=resume_data["name"],
            domain="Web Development",
            skills=resume_data["skills"],
            current_role=resume_data["current_role"]
        )
        print("About Section:")
        print(about)
        print(f"\nWord count: {len(about.split())}")
        
        # Generate project summary
        print("\n" + "="*50)
        project_summary = generate_project_summary(
            project_name=project_data[0]["name"],
            description=project_data[0]["description"],
            tech_stack=project_data[0]["tech_stack"],
            highlights=project_data[0]["highlights"]
        )
        print("\nProject Summary:")
        print(json.dumps(project_summary.model_dump(), indent=2))
        
    except ContentGenerationError as e:
        print(f"Error: {e}")
