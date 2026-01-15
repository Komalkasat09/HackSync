import json
import sys
sys.path.append('..')
from shared.gemini_service import gemini_service
from config import settings
from ai_resume_builder.schema import AIResumeData
from .schema import CoverLetter

async def generate_tailored_application(job_description: str, job_title: str, company: str, user_profile: dict) -> dict:
    """
    Generate JD-tailored resume and cover letter using Gemini AI.
    Returns dict with tailored_resume and cover_letter.
    """
    try:
        # Prepare user data summary
        user_skills = ', '.join([skill.get('name', '') for skill in user_profile.get('skills', [])])
        user_experiences = user_profile.get('experiences', [])
        user_projects = user_profile.get('projects', [])
        user_education = user_profile.get('education', [])
        user_name = user_profile.get('name', 'Applicant')
        user_email = user_profile.get('email', '')
        user_phone = user_profile.get('phone', '')
        user_location = user_profile.get('location', '')
        
        # Extract links
        links = user_profile.get('links', [])
        linkedin = github = portfolio = ""
        for link in links:
            link_type = link.get('type', '')
            link_value = link.get('value', '')
            if link_type == 'linkedin':
                linkedin = link_value
            elif link_type == 'github':
                github = link_value
            elif link_type == 'website' or link_type == 'portfolio':
                portfolio = link_value
            elif link_type == 'phone' and not user_phone:
                user_phone = link_value
            elif link_type == 'email' and not user_email:
                user_email = link_value
        
        # Construct the prompt
        prompt = f"""
You are an expert career consultant and resume writer. Generate a JOB-TAILORED resume and cover letter for the following job application.

**JOB DETAILS:**
- Position: {job_title}
- Company: {company}
- Job Description: {job_description}

**CANDIDATE PROFILE:**
- Name: {user_name}
- Email: {user_email}
- Phone: {user_phone}
- Location: {user_location}
- LinkedIn: {linkedin}
- GitHub: {github}
- Portfolio: {portfolio}
- Skills: {user_skills}
- Experiences: {json.dumps(user_experiences, indent=2)}
- Projects: {json.dumps(user_projects, indent=2)}
- Education: {json.dumps(user_education, indent=2)}

**INSTRUCTIONS:**
1. Analyze the job description carefully to identify key requirements, skills, and qualifications
2. Create a TAILORED resume that:
   - Emphasizes relevant skills that match the job requirements
   - Rewrites experience bullet points to highlight achievements relevant to this role
   - Prioritizes projects that demonstrate applicable skills
   - Includes a compelling summary tailored to this specific position
   - Uses keywords from the job description naturally
3. Create a professional cover letter that:
   - Opens with enthusiasm for the specific role and company
   - Highlights 2-3 most relevant experiences/projects that match job requirements
   - Demonstrates understanding of company/role needs
   - Shows personality while maintaining professionalism
   - Includes a strong call to action
4. Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text

**REQUIRED JSON STRUCTURE:**
{{
  "tailored_resume": {{
    "personal_info": {{
      "name": "{user_name}",
      "email": "{user_email}",
      "phone": "{user_phone}",
      "location": "{user_location}",
      "linkedin": "{linkedin}",
      "github": "{github}",
      "portfolio": "{portfolio}"
    }},
    "summary": "A compelling 2-3 sentence summary TAILORED to this specific job, highlighting most relevant qualifications",
    "skills": [
      {{
        "category": "Most Relevant Skills (from JD)",
        "skills": ["skill1", "skill2", "skill3"]
      }},
      {{
        "category": "Technical Skills",
        "skills": ["skill1", "skill2"]
      }},
      {{
        "category": "Tools & Technologies",
        "skills": ["tool1", "tool2"]
      }}
    ],
    "experience": [
      {{
        "title": "Job Title",
        "company": "Company Name",
        "location": "City, State",
        "start_date": "Mon YYYY",
        "end_date": "Mon YYYY or Present",
        "description": [
          "TAILORED bullet point emphasizing relevant achievement with metrics",
          "Another achievement highlighting skills from job description",
          "Technical accomplishment relevant to the target role"
        ]
      }}
    ],
    "projects": [
      {{
        "name": "Most Relevant Project Name",
        "description": "Description emphasizing relevance to target role",
        "technologies": ["tech1", "tech2", "tech3"],
        "link": "project-url",
        "highlights": [
          "Key achievement relevant to job requirements",
          "Impact or result that demonstrates required skills"
        ]
      }}
    ],
    "education": [
      {{
        "degree": "Degree Name",
        "institution": "Institution Name",
        "location": "City, State",
        "graduation_date": "Mon YYYY",
        "gpa": "X.X/4.0",
        "achievements": ["Relevant achievement 1", "Relevant achievement 2"]
      }}
    ],
    "certifications": [
      {{
        "name": "Relevant Certification",
        "issuer": "Issuing Organization",
        "date": "Mon YYYY",
        "credential_id": "ID if available"
      }}
    ],
    "awards": ["Relevant award or achievement"],
    "languages": ["Language 1", "Language 2"]
  }},
  "cover_letter": {{
    "greeting": "Dear Hiring Manager," or "Dear [Name] if known,",
    "opening_paragraph": "Express enthusiasm for the specific role at {company}. Mention how you found the position and why you're excited about it. Hook their interest.",
    "body_paragraphs": [
      "Paragraph 1: Highlight your most relevant experience/project that directly addresses a key job requirement. Use specific examples and metrics.",
      "Paragraph 2: Discuss another relevant skill or achievement. Show understanding of the company's needs and how you can contribute.",
      "Paragraph 3 (optional): Address any unique qualifications or experiences that set you apart for this specific role."
    ],
    "closing_paragraph": "Express enthusiasm for next steps. Mention availability for interview. Thank them for consideration.",
    "signature": "Sincerely,\\n{user_name}"
  }}
}}

CRITICAL: Return ONLY the JSON object. No markdown, no code blocks, no explanations. Just pure JSON.
"""
        
        # Call Gemini API
        response = await gemini_service.generate_content(prompt)
        
        # Check for API key quota errors
        if "Unable to generate response" in response or "All API keys failed" in response or "AI service unavailable" in response:
            raise Exception(f"API quota exceeded: {response}")
        
        # Clean response
        response_text = response.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        # Parse JSON
        result = json.loads(response_text)
        
        return {
            "success": True,
            "tailored_resume": result.get("tailored_resume"),
            "cover_letter": result.get("cover_letter")
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {str(e)}")
        print(f"Response text: {response[:500] if response else 'No response'}")
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        print(f"Error generating tailored application: {str(e)}")
        raise Exception(f"Failed to generate application materials: {str(e)}")
