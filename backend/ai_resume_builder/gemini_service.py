import google.generativeai as genai
from PyPDF2 import PdfReader
import io
import json
import sys
sys.path.append('..')
from config import settings

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)

def extract_resume_text(pdf_content: bytes) -> str:
    """
    Extract text from PDF resume bytes.
    """
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

async def analyze_resume_with_gemini(resume_text: str, profile_data: dict) -> dict:
    """
    Send resume text and profile data to Gemini for AI-powered analysis.
    Returns structured JSON resume data.
    """
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Construct the prompt
        prompt = f"""
You are an expert resume analyzer and career consultant. Analyze the following resume and additional profile information, then return a comprehensive, well-structured resume in JSON format.

**RESUME TEXT:**
{resume_text}

**ADDITIONAL PROFILE DATA:**
- Skills: {', '.join(profile_data.get('skills', []))}
- Interests: {', '.join(profile_data.get('interests', []))}
- Experiences: {json.dumps(profile_data.get('experiences', []), indent=2)}
- Projects: {json.dumps(profile_data.get('projects', []), indent=2)}
- Education: {json.dumps(profile_data.get('education', []), indent=2)}

**INSTRUCTIONS:**
1. Extract and organize all information from the resume text
2. Enhance it with the additional profile data provided
3. Create a professional summary that highlights key strengths
4. Categorize skills into logical groups (e.g., Programming Languages, Frameworks, Tools, Soft Skills)
5. Format experiences with clear bullet points highlighting achievements
6. Include quantifiable metrics where possible
7. Ensure all dates are in consistent format
8. Return ONLY valid JSON with NO markdown formatting, NO code blocks, NO extra text

**REQUIRED JSON STRUCTURE:**
{{
  "personal_info": {{
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "linkedin.com/in/username",
    "github": "github.com/username",
    "portfolio": "portfolio-url.com"
  }},
  "summary": "A compelling 2-3 sentence professional summary highlighting expertise and value proposition",
  "skills": [
    {{
      "category": "Programming Languages",
      "skills": ["Python", "JavaScript", "Java"]
    }},
    {{
      "category": "Frameworks & Libraries",
      "skills": ["React", "FastAPI", "Node.js"]
    }}
  ],
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "start_date": "Jan 2023",
      "end_date": "Present",
      "description": [
        "Achievement-focused bullet point with metrics",
        "Another impactful contribution",
        "Technical accomplishment"
      ]
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Brief project description",
      "technologies": ["React", "Python", "MongoDB"],
      "link": "github.com/user/project",
      "highlights": [
        "Key achievement or feature",
        "Impact or result"
      ]
    }}
  ],
  "education": [
    {{
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "location": "City, Country",
      "graduation_date": "May 2023",
      "gpa": "3.8/4.0",
      "achievements": ["Dean's List", "Honors Program"]
    }}
  ],
  "certifications": [
    {{
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Jan 2024",
      "credential_id": "ABC123"
    }}
  ],
  "awards": ["Award 1", "Award 2"],
  "languages": ["English (Native)", "Spanish (Fluent)"]
}}

Return ONLY the JSON object, nothing else.
"""
        
        # Generate response
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean up response - remove markdown code blocks if present
        if result_text.startswith("```json"):
            result_text = result_text[7:]  # Remove ```json
        if result_text.startswith("```"):
            result_text = result_text[3:]  # Remove ```
        if result_text.endswith("```"):
            result_text = result_text[:-3]  # Remove trailing ```
        result_text = result_text.strip()
        
        # Parse JSON response
        resume_data = json.loads(result_text)
        
        return resume_data
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse Gemini response as JSON: {str(e)}\nResponse: {result_text[:500]}")
    except Exception as e:
        raise Exception(f"Failed to analyze resume with Gemini: {str(e)}")
