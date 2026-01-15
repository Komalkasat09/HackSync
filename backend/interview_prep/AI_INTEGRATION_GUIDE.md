# AI Interview Module - Integration Guide

## Current State (Mock Implementation)

Your Python backend currently returns **dummy/mock data** without any real AI processing:

### What's Working (Mock):
✅ Interview session creation with hardcoded questions
✅ Basic API endpoints (`/start-session`, `/submit-feedback`)
✅ Mock feedback scores (always returns 8.2 overall)

### What's NOT Working (No AI):
❌ **Question Generation** - Returns same 3 hardcoded questions for everyone
❌ **Speech-to-Text (STT)** - No audio processing
❌ **Text-to-Speech (TTS)** - No AI voice generation
❌ **Answer Evaluation** - No AI scoring (returns fixed scores)
❌ **Resume Analysis** - Not parsing resume to generate personalized questions

---

## Required API Keys for Full AI Features

### 1. **Gemini API** (Question Generation & Answer Evaluation)
- **Purpose**: Generate personalized questions based on resume/skills
- **Get Key**: https://makersuite.google.com/app/apikey
- **Free Tier**: 60 requests/minute
- **Add to backend/.env**:
  ```env
  GEMINI_API_KEY=your_key_here
  ```

### 2. **AssemblyAI** (Speech-to-Text)
- **Purpose**: Convert user's spoken answers to text
- **Get Key**: https://www.assemblyai.com/dashboard/signup
- **Free Tier**: 5 hours/month
- **Add to backend/.env**:
  ```env
  ASSEMBLYAI_API_KEY=your_key_here
  ```

### 3. **ElevenLabs or OpenAI TTS** (Text-to-Speech)
- **Purpose**: AI interviewer voice
- **Options**:
  - ElevenLabs: https://elevenlabs.io/ (10k characters/month free)
  - OpenAI TTS: $0.015 per 1K characters
- **Add to backend/.env**:
  ```env
  ELEVENLABS_API_KEY=your_key_here
  # OR
  OPENAI_API_KEY=your_key_here
  ```

---

## How to Add Real AI Features

### Step 1: Install Required Packages
```bash
cd /Users/komalkasat09/Desktop/hacksync/HackSync/backend
source venv/bin/activate
pip install google-generativeai assemblyai elevenlabs openai python-multipart
```

### Step 2: Update `routes.py` with AI Integration

Replace the dummy questions in `/start-session` with:

```python
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

@router.post("/start-session", response_model=InterviewPrepResponse)
async def start_mock_interview(request: InterviewPrepRequest):
    """Generate personalized questions using Gemini"""
    
    # Create prompt for question generation
    prompt = f"""
    Generate 10 interview questions for a {request.role} position.
    Experience level: {request.experience_level}
    Skills: {', '.join(request.skills)}
    Company: {request.company or 'Tech Company'}
    
    Return 10 questions in this JSON format:
    [
        {{"question": "...", "type": "technical/behavioral", "difficulty": "easy/medium/hard", "hints": ["...", "..."]}}
    ]
    
    Mix of:
    - 4 technical questions about their skills
    - 3 behavioral questions (STAR method)
    - 2 problem-solving/situational questions
    - 1 company/role-specific question
    """
    
    # Generate questions with Gemini
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    
    # Parse response and create questions
    import json
    questions_data = json.loads(response.text)
    
    questions = [
        InterviewQuestion(
            question=q['question'],
            type=q['type'],
            difficulty=q['difficulty'],
            hints=q['hints'],
            sample_answer=None
        ) for q in questions_data
    ]
    
    mock_session = MockInterviewSession(
        session_id=str(uuid.uuid4()),
        questions=questions,
        duration_minutes=45,
        created_at=datetime.utcnow()
    )
    
    return InterviewPrepResponse(
        mock_session=mock_session,
        feedback=None,
        recommended_practice=[
            "Practice STAR method for behavioral questions",
            "Review your project portfolio",
            "Research the company culture"
        ],
        timestamp=datetime.utcnow()
    )
```

### Step 3: Add Answer Evaluation with AI

Update `/submit-feedback` to evaluate answers:

```python
@router.post("/submit-feedback")
async def submit_interview_feedback(
    session_id: str, 
    question_id: str,
    user_answer: str
):
    """Evaluate answer using Gemini"""
    
    # Get the original question from storage
    # (You'll need to store questions in MongoDB or cache)
    
    prompt = f"""
    Evaluate this interview answer:
    
    Question: {original_question}
    Answer: {user_answer}
    
    Rate on scale 1-10 and provide:
    1. Technical accuracy
    2. Communication clarity
    3. Structure/organization
    4. Specific feedback
    
    Return JSON: {{"technical_score": 8.5, "communication_score": 9.0, "feedback": "..."}}
    """
    
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    evaluation = json.loads(response.text)
    
    return evaluation
```

### Step 4: Add Resume Parser

Create `backend/interview_prep/resume_parser.py`:

```python
import PyPDF2
import docx
from pathlib import Path

def extract_text_from_pdf(file_path):
    """Extract text from PDF resume"""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    return text

def parse_resume(file_content: bytes, filename: str):
    """Parse resume and extract skills, experience, projects"""
    
    # Save temporarily
    temp_path = f"/tmp/{filename}"
    with open(temp_path, 'wb') as f:
        f.write(file_content)
    
    # Extract text
    if filename.endswith('.pdf'):
        text = extract_text_from_pdf(temp_path)
    elif filename.endswith('.docx'):
        doc = docx.Document(temp_path)
        text = '\n'.join([para.text for para in doc.paragraphs])
    else:
        text = file_content.decode('utf-8')
    
    # Use Gemini to extract structured data
    prompt = f"""
    Extract from this resume:
    {text}
    
    Return JSON with:
    - skills: [list of technical skills]
    - experience_years: number
    - projects: [list of project names]
    - education: highest degree
    """
    
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    
    return json.loads(response.text)
```

---

## Testing Without API Keys

The current mock implementation will work for **UI testing** but won't provide:
- Personalized questions
- Real scoring
- Speech processing

**Current Behavior**:
- Always returns same 3 questions
- Always gives scores around 8.0-8.5
- No speech features work

---

## Cost Estimates (with APIs)

### Free Tier Usage:
- **Gemini**: 60 interviews/hour (free forever)
- **AssemblyAI**: ~30 interviews/month (5 hours free)
- **ElevenLabs**: ~50 questions spoken (10k chars/month)

### Paid Usage (if needed):
- **Gemini**: $0.0001 per 1K tokens (~$0.001 per interview)
- **AssemblyAI**: $0.25 per hour (~$0.02 per interview)
- **ElevenLabs**: $0.30 per 1K characters (~$0.05 per interview)

**Total cost per interview**: ~$0.07 with all AI features

---

## Next Steps

1. **Get API Keys** from the services above
2. **Add to `.env` file** in backend directory
3. **Install packages**: `pip install google-generativeai assemblyai`
4. **Update routes.py** with AI integration code
5. **Test** with real interviews

Need help with any of these steps? Let me know!
