"""
Professional domain inference using Gemini AI.

Infers a single core professional domain from skills, roles, and projects
with strict constraints on output format.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from gemini_service import GeminiClient, GeminiClientError


class DomainInference(BaseModel):
    """Professional domain inference result."""
    domain: str = Field(description="Core professional domain (max 3 words)")
    
    @field_validator('domain')
    @classmethod
    def validate_domain(cls, v):
        """Validate domain format."""
        if not v or not isinstance(v, str):
            raise ValueError("Domain must be a non-empty string")
        
        v = v.strip()
        
        # Count words
        words = v.split()
        if len(words) > 3:
            raise ValueError(f"Domain must be max 3 words, got {len(words)}")
        
        return v


class DomainInferenceError(Exception):
    """Exception raised when domain inference fails."""
    pass


def infer_domain(
    skills: List[str],
    roles: Optional[List[str]] = None,
    projects: Optional[List[str]] = None,
    gemini_client: Optional[GeminiClient] = None
) -> str:
    """
    Infer core professional domain using Gemini AI.
    
    Args:
        skills: List of technical skills.
        roles: Optional list of job roles/titles.
        projects: Optional list of project names/descriptions.
        gemini_client: Optional GeminiClient instance.
    
    Returns:
        Core professional domain as a string (max 3 words).
    
    Raises:
        DomainInferenceError: If inference fails or validation fails.
    """
    if not skills:
        raise DomainInferenceError("Skills list cannot be empty")
    
    if not gemini_client:
        try:
            gemini_client = GeminiClient()
        except GeminiClientError as e:
            raise DomainInferenceError(f"Failed to initialize Gemini client: {str(e)}")
    
    # Build input context
    context_parts = [f"Skills: {', '.join(skills)}"]
    
    if roles:
        context_parts.append(f"Roles: {', '.join(roles)}")
    
    if projects:
        context_parts.append(f"Projects: {', '.join(projects)}")
    
    context = "\n".join(context_parts)
    
    # Define strict JSON schema
    response_schema = {
        "type": "object",
        "properties": {
            "domain": {
                "type": "string",
                "description": "Core professional domain in maximum 3 words"
            }
        },
        "required": ["domain"]
    }
    
    # System instruction with strict constraints
    system_instruction = """You are a professional domain classifier.

ABSOLUTE REQUIREMENTS:
1. Output ONLY valid JSON with a single "domain" field
2. Domain MUST be maximum 3 words
3. Domain MUST be a noun phrase (no verbs, no adjectives like 'expert', 'senior')
4. Choose ONE core domain that best represents the professional focus
5. NO explanations, NO reasoning, NO additional text
6. Examples of valid domains: "Web Development", "Data Science", "Cloud Infrastructure", "Mobile Engineering"
7. Examples of INVALID domains: "Expert Developer", "Experienced Engineer", "Software Development Expert"

Output ONLY the JSON object."""

    # Prompt template
    prompt = f"""Based on the following professional information, identify the ONE core professional domain.

{context}

Return a JSON object with the domain field containing a concise noun phrase (maximum 3 words) that best describes this professional's core domain."""

    try:
        # Generate with strict schema
        result = gemini_client.generate_with_schema(
            prompt=prompt,
            schema=response_schema,
            system_instruction=system_instruction,
            temperature=0.1  # Low temperature for consistent output
        )
        
        # Validate with Pydantic
        domain_inference = DomainInference(**result)
        
        return domain_inference.domain
        
    except Exception as e:
        raise DomainInferenceError(f"Failed to infer domain: {str(e)}")


def infer_domain_from_resume_data(
    resume_data: Dict[str, Any],
    gemini_client: Optional[GeminiClient] = None
) -> str:
    """
    Infer domain from parsed resume data dictionary.
    
    Args:
        resume_data: Dictionary with 'skills', 'current_role', 'experience', 'projects'.
        gemini_client: Optional GeminiClient instance.
    
    Returns:
        Core professional domain as a string.
    
    Raises:
        DomainInferenceError: If inference fails.
    """
    skills = resume_data.get('skills', [])
    
    # Extract roles from experience and current_role
    roles = []
    if 'current_role' in resume_data and resume_data['current_role']:
        roles.append(resume_data['current_role'])
    
    if 'experience' in resume_data and resume_data['experience']:
        for exp in resume_data['experience']:
            if isinstance(exp, dict) and 'role' in exp and exp['role']:
                roles.append(exp['role'])
    
    # Extract projects
    projects = resume_data.get('projects', [])
    
    return infer_domain(
        skills=skills,
        roles=roles if roles else None,
        projects=projects if projects else None,
        gemini_client=gemini_client
    )


# Example usage
if __name__ == "__main__":
    # Example 1: Web developer
    skills1 = ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"]
    roles1 = ["Senior Frontend Engineer", "Full Stack Developer"]
    projects1 = ["E-commerce platform", "Real-time chat application"]
    
    try:
        domain1 = infer_domain(skills1, roles1, projects1)
        print(f"Domain 1: {domain1}")
    except DomainInferenceError as e:
        print(f"Error: {e}")
    
    # Example 2: Data scientist
    skills2 = ["Python", "TensorFlow", "PyTorch", "pandas", "scikit-learn"]
    roles2 = ["Machine Learning Engineer", "Data Scientist"]
    projects2 = ["Recommendation system", "Image classification model"]
    
    try:
        domain2 = infer_domain(skills2, roles2, projects2)
        print(f"Domain 2: {domain2}")
    except DomainInferenceError as e:
        print(f"Error: {e}")
    
    # Example 3: DevOps engineer
    skills3 = ["Docker", "Kubernetes", "AWS", "Terraform", "Python"]
    roles3 = ["DevOps Engineer", "Site Reliability Engineer"]
    projects3 = ["CI/CD pipeline", "Infrastructure automation"]
    
    try:
        domain3 = infer_domain(skills3, roles3, projects3)
        print(f"Domain 3: {domain3}")
    except DomainInferenceError as e:
        print(f"Error: {e}")
