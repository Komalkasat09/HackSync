"""
Resume parser using Gemini AI with strict JSON output and Pydantic validation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator
from gemini_service import GeminiClient, GeminiClientError


class ExperienceEntry(BaseModel):
    """Single work experience entry with strict validation."""
    company: Optional[str] = Field(default=None, description="Company name")
    role: Optional[str] = Field(default=None, description="Job role/title")
    start_date: Optional[str] = Field(default=None, description="Start date")
    end_date: Optional[str] = Field(default=None, description="End date or 'Present'")
    bullets: Optional[List[str]] = Field(default=None, description="Achievement bullets")
    
    @field_validator('company', 'role', 'start_date', 'end_date', mode='before')
    @classmethod
    def trim_and_reject_empty(cls, v):
        """Trim whitespace and reject empty strings."""
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            # Return None instead of empty string
            return v if v else None
        return v
    
    @field_validator('bullets', mode='before')
    @classmethod
    def validate_bullets(cls, v):
        """Trim whitespace, reject empty strings, and limit bullet length."""
        if v is None:
            return None
        if not isinstance(v, list):
            return None
        
        cleaned_bullets = []
        for bullet in v:
            if isinstance(bullet, str):
                bullet = bullet.strip()
                # Reject empty bullets
                if bullet:
                    # Limit bullet length to 500 characters
                    if len(bullet) > 500:
                        bullet = bullet[:497] + "..."
                    cleaned_bullets.append(bullet)
        
        return cleaned_bullets if cleaned_bullets else None


class ResumeData(BaseModel):
    """Structured resume data with strict validation. Only skills is required."""
    name: Optional[str] = Field(default=None, description="Full name")
    current_role: Optional[str] = Field(default=None, description="Current job title")
    skills: List[str] = Field(description="Technical skills (required)")
    experience: Optional[List[ExperienceEntry]] = Field(default=None, description="Work experience")
    projects: Optional[List[str]] = Field(default=None, description="Projects")
    education: Optional[List[str]] = Field(default=None, description="Education history")
    
    @field_validator('name', 'current_role', mode='before')
    @classmethod
    def trim_and_reject_empty_strings(cls, v):
        """Trim whitespace and reject empty strings."""
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            return v if v else None
        return v
    
    @field_validator('skills', mode='before')
    @classmethod
    def validate_skills(cls, v):
        """Trim whitespace and reject empty skills."""
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        
        cleaned_skills = []
        for skill in v:
            if isinstance(skill, str):
                skill = skill.strip()
                if skill:  # Only add non-empty skills
                    cleaned_skills.append(skill)
        
        return cleaned_skills
    
    @field_validator('projects', 'education', mode='before')
    @classmethod
    def validate_string_lists(cls, v):
        """Trim whitespace and reject empty strings in lists."""
        if v is None:
            return None
        if not isinstance(v, list):
            return None
        
        cleaned_list = []
        for item in v:
            if isinstance(item, str):
                item = item.strip()
                if item:  # Only add non-empty items
                    # Limit length to 500 characters
                    if len(item) > 500:
                        item = item[:497] + "..."
                    cleaned_list.append(item)
        
        return cleaned_list if cleaned_list else None


class ResumeParseError(Exception):
    """Exception raised when resume parsing fails."""
    pass


def parse_resume(
    resume_text: str,
    gemini_client: Optional[GeminiClient] = None,
    max_retries: int = 1
) -> ResumeData:
    """
    Parse resume text using Gemini AI with strict JSON output.
    
    Args:
        resume_text: Cleaned resume text to parse.
        gemini_client: Optional GeminiClient instance. If None, creates a new one.
        max_retries: Number of retries with stricter instructions (default: 1).
    
    Returns:
        ResumeData: Validated, structured resume data.
    
    Raises:
        ResumeParseError: If parsing fails after all retries.
    """
    if not gemini_client:
        try:
            gemini_client = GeminiClient()
        except GeminiClientError as e:
            raise ResumeParseError(f"Failed to initialize Gemini client: {str(e)}")
    
    # Define JSON schema for Gemini
    response_schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "current_role": {"type": "string"},
            "skills": {
                "type": "array",
                "items": {"type": "string"}
            },
            "experience": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "company": {"type": "string"},
                        "role": {"type": "string"},
                        "start_date": {"type": "string"},
                        "end_date": {"type": "string"},
                        "bullets": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["company", "role", "start_date", "end_date", "bullets"]
                }
            },
            "projects": {
                "type": "array",
                "items": {"type": "string"}
            },
            "education": {
                "type": "array",
                "items": {"type": "string"}
            }
        },
        "required": ["name", "current_role", "skills", "experience", "projects", "education"]
    }
    
    base_system_instruction = """You are a resume parser that extracts structured data from resumes.

CRITICAL RULES:
1. Output ONLY valid JSON matching the exact schema provided
2. NO markdown formatting, NO code blocks, NO explanations
3. Do NOT fabricate or invent data that is not in the resume
4. If information is missing, use empty strings "" or empty arrays []
5. Extract ONLY what is explicitly stated in the resume text
6. Be precise and accurate with dates, company names, and roles"""

    strict_system_instruction = """You are a strict JSON-only resume parser.

ABSOLUTE REQUIREMENTS:
1. Output MUST be valid JSON with NO additional text
2. NO markdown (no ```json or ``` markers)
3. NO comments, NO explanations, NO preamble
4. ONLY extract data that is explicitly present in the resume
5. Use empty strings "" for missing text fields
6. Use empty arrays [] for missing list fields
7. Follow the exact schema structure provided
8. Return ONLY the JSON object, nothing else"""

    prompt_template = """Parse the following resume and extract structured information.

Resume text:
{resume_text}

Extract and return ONLY a JSON object with the following structure:
- name: person's full name
- current_role: most recent or current job title
- skills: list of technical skills, tools, languages
- experience: array of work experiences with company, role, dates, and achievement bullets
- projects: list of notable projects mentioned
- education: list of education entries (degree, institution, year)

Remember: Output ONLY valid JSON. Do not fabricate missing information."""

    last_error = None
    
    for attempt in range(max_retries + 1):
        try:
            # Use stricter instructions on retry
            system_instruction = strict_system_instruction if attempt > 0 else base_system_instruction
            
            # Generate response
            result = gemini_client.generate_with_schema(
                prompt=prompt_template.format(resume_text=resume_text),
                schema=response_schema,
                system_instruction=system_instruction,
                temperature=0.1  # Low temperature for consistent, factual output
            )
            
            # Validate with Pydantic
            resume_data = ResumeData(**result)
            return resume_data
            
        except ValidationError as e:
            last_error = e
            error_details = str(e)
            
            if attempt < max_retries:
                # Retry with stricter instructions
                continue
            else:
                raise ResumeParseError(
                    f"Failed to validate resume data after {max_retries + 1} attempts. "
                    f"Validation error: {error_details}"
                )
                
        except GeminiClientError as e:
            last_error = e
            
            if attempt < max_retries:
                continue
            else:
                raise ResumeParseError(
                    f"Gemini API error after {max_retries + 1} attempts: {str(e)}"
                )
                
        except Exception as e:
            last_error = e
            
            if attempt < max_retries:
                continue
            else:
                raise ResumeParseError(
                    f"Unexpected error during resume parsing: {str(e)}"
                )
    
    # Should not reach here, but just in case
    raise ResumeParseError(f"Resume parsing failed: {str(last_error)}")


def parse_resume_from_file(
    file_path: str,
    gemini_client: Optional[GeminiClient] = None
) -> ResumeData:
    """
    Parse resume from a text file.
    
    Args:
        file_path: Path to the resume text file.
        gemini_client: Optional GeminiClient instance.
    
    Returns:
        ResumeData: Validated, structured resume data.
    
    Raises:
        ResumeParseError: If file reading or parsing fails.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            resume_text = f.read()
    except Exception as e:
        raise ResumeParseError(f"Failed to read resume file: {str(e)}")
    
    return parse_resume(resume_text, gemini_client)


# Example usage
if __name__ == "__main__":
    # Example resume text
    sample_resume = """
    John Doe
    Senior Software Engineer
    
    Skills: Python, JavaScript, React, Node.js, AWS, Docker, PostgreSQL
    
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
    - Open source contribution to React ecosystem (5K+ stars)
    - Personal blog with 50K monthly visitors
    
    Education:
    - BS Computer Science, MIT, 2018
    """
    
    try:
        result = parse_resume(sample_resume)
        print("Parsed Resume Data:")
        print(result.model_dump_json(indent=2))
    except ResumeParseError as e:
        print(f"Error: {e}")
