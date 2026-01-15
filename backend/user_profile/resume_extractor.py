import PyPDF2
import io
import json
import re
import sys
sys.path.append('..')
from shared.gemini_service import gemini_service
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


async def extract_profile_from_resume(pdf_content: bytes) -> dict:
    """
    Extract comprehensive profile data from resume using Gemini AI.
    Returns structured JSON with all profile fields.
    Uses shared gemini service with automatic key rotation.
    """
    # Extract text from PDF
    resume_text = extract_text_from_pdf(pdf_content)
    
    if not resume_text:
        raise Exception("No text could be extracted from the resume")
    
    # Use shared gemini service (handles key rotation automatically)
    return await _extract_with_gemini(resume_text)


async def _extract_with_gemini(resume_text: str) -> dict:
    """
    Internal function to extract data using Gemini.
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
        # Call Gemini API using shared service
        response = await gemini_service.generate_content(prompt)
        
        # Check if response is an error message (gemini_service returns error strings)
        if not response or response.startswith("AI service unavailable") or response.startswith("All API keys failed") or response.startswith("Unable to generate") or response.startswith("I apologize"):
            raise Exception(f"Gemini API Error: {response}")
        
        # Extract and parse JSON from response
        response_text = response.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)
        
        # Try to find JSON object in response (in case there's extra text)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        # Parse JSON
        try:
            profile_data = json.loads(response_text)
        except json.JSONDecodeError as json_err:
            print(f"❌ JSON Parse Error. Response text (first 500 chars): {response_text[:500]}")
            raise Exception(f"Failed to parse AI response as JSON: {str(json_err)}. Response: {response_text[:200]}")
        
        return profile_data
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Decode Error: {str(e)}")
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        print(f"❌ Resume extraction error: {str(e)}")
        raise Exception(f"Failed to analyze resume with AI: {str(e)}")
