import PyPDF2
import io
import json
import re
import google.generativeai as genai
from config import settings

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def extract_profile_from_resume(pdf_content: bytes) -> dict:
    """
    Extract comprehensive profile data from resume using Gemini AI.
    Returns structured JSON with all profile fields.
    Uses fallback mechanism to try multiple API keys if one fails.
    """
    # Extract text from PDF
    resume_text = extract_text_from_pdf(pdf_content)
    
    if not resume_text:
        raise Exception("No text could be extracted from the resume")
    
    # Get all available API keys from config
    api_keys = settings.get_gemini_api_keys()
    
    if not api_keys:
        raise Exception("No Gemini API keys configured")
    
    # Try each API key until one succeeds
    last_error = None
    for i, api_key in enumerate(api_keys, 1):
        try:
            print(f"Trying Gemini API key {i}/{len(api_keys)}...")
            genai.configure(api_key=api_key)
            return _extract_with_gemini(resume_text)
        except Exception as e:
            print(f"API key {i} failed: {str(e)}")
            last_error = e
            continue
    
    # If all keys failed, raise the last error
    raise Exception(f"All API keys failed. Last error: {str(last_error)}")


def _extract_with_gemini(resume_text: str) -> dict:
    """
    Internal function to extract data using Gemini.
    Separated for retry logic.
    """
    # Create comprehensive prompt for Gemini
    prompt = f"""
You are a professional resume parser. Extract ALL information from the following resume and return it in STRICT JSON format.

IMPORTANT RULES:
1. Return ONLY valid JSON, no additional text or explanations
2. Use the EXACT field names and structure shown below
3. If information is missing, use empty strings or empty arrays
4. Extract ALL skills mentioned (technical, soft skills, tools, frameworks, languages)
5. For links, identify GitHub, LinkedIn, personal website, email, phone
6. Extract ALL projects with details
7. For experience, extract bullet points as description
8. Dates should be in format "Month Year" (e.g., "January 2023")

REQUIRED JSON STRUCTURE:
{{
  "personal_info": {{
    "phone": "extracted phone number with country code",
    "location": "City, State/Country",
    "github": "GitHub URL if found",
    "linkedin": "LinkedIn URL if found",
    "website": "Personal website URL if found",
    "email": "email address if found",
    "portfolio": "Portfolio URL if different from website"
  }},
  "skills": [
    {{"id": "1", "name": "skill name"}}
  ],
  "links": [
    {{"id": "1", "type": "github|linkedin|website|email|phone|portfolio", "value": "the URL or value"}}
  ],
  "experience": [
    {{
      "id": "1",
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "2023-01",
      "endDate": "2024-12 or Present",
      "currentlyWorking": false,
      "description": "Comprehensive bullet points combined into paragraph format. Include all achievements, technologies used, and impact."
    }}
  ],
  "projects": [
    {{
      "id": "1",
      "name": "Project Name",
      "description": "Detailed project description including what it does and your role",
      "technologies": "React, Node.js, MongoDB",
      "link": "Project URL if available"
    }}
  ],
  "education": [
    {{
      "id": "1",
      "degree": "Degree name and major",
      "institution": "University/School name",
      "year": "2020 - 2024 or graduation year"
    }}
  ],
  "interests": [
    {{"id": "1", "name": "interest or hobby"}}
  ]
}}

RESUME TEXT:
{resume_text}

Return ONLY the JSON object, nothing else:
"""
    
    try:
        # Call Gemini API
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        # Extract and parse JSON from response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)
        
        # Parse JSON
        profile_data = json.loads(response_text)
        
        return profile_data
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to analyze resume with AI: {str(e)}")
