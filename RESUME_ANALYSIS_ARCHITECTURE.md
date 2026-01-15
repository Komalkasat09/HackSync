# AI Resume Analysis - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Resume Analysis Dashboard Page                  │   │
│  │  - Resume upload/paste component                         │   │
│  │  - Job description input field                           │   │
│  │  - Analysis type selector (ATS/Gap/Both)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────┘
                               │ HTTP POST
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (FastAPI)                         │
│                 /api/resume-analysis/*                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    routes.py                            │    │
│  │  • POST /ats-check                                     │    │
│  │  • POST /gap-analysis                                  │    │
│  │  • POST /comprehensive-analysis                        │    │
│  └────────────────────────────────────────────────────────┘    │
│           │                              │                        │
│           ▼                              ▼                        │
│  ┌─────────────────┐          ┌─────────────────────┐          │
│  │  ats_checker.py │          │  gap_analyzer.py    │          │
│  │                 │          │                     │          │
│  │  - Score calc   │          │  - Keyword extract  │          │
│  │  - Suggestions  │          │  - Gap identify     │          │
│  │  - Strengths    │          │  - Resource fetch   │          │
│  │  - Weaknesses   │          │  - Recommendations  │          │
│  └─────────────────┘          └─────────────────────┘          │
│           │                              │                        │
└───────────┼──────────────────────────────┼─────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────┐        ┌─────────────────────┐
│   Gemini AI 2.5     │        │   yt-dlp Library    │
│   (google-genai)    │        │   (YouTube search)  │
│                     │        │                     │
│  - ATS analysis     │        │  - Fetch tutorials  │
│  - Keyword matching │        │  - Resource links   │
│  - Recommendations  │        │  - Video metadata   │
└─────────────────────┘        └─────────────────────┘
```

## Data Flow - ATS Check

```
User Input (Resume + Optional JD)
        │
        ▼
┌──────────────────────────┐
│  ATSChecker Service      │
│  _build_ats_prompt()    │
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│  Gemini AI Prompt        │
│  - Analyze formatting    │
│  - Check keywords        │
│  - Evaluate content      │
│  - Score ATS elements    │
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│  Parse JSON Response     │
│  _parse_ats_response()  │
└──────────────────────────┘
        │
        ▼
┌──────────────────────────┐
│  ATSCheckResponse        │
│  - score: 0-100          │
│  - suggestions: []       │
│  - strengths: []         │
│  - weaknesses: []        │
└──────────────────────────┘
        │
        ▼
    Return to Frontend
```

## Data Flow - Gap Analysis

```
User Input (Resume + Job Description)
        │
        ▼
┌──────────────────────────────┐
│  GapAnalyzer Service         │
│  _build_gap_analysis_prompt()│
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Gemini AI Prompt            │
│  - Extract keywords          │
│  - Compare overlap           │
│  - Identify gaps             │
│  - Categorize importance     │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  Parse Gap Response          │
│  _parse_gap_response()       │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  For each Critical Gap:      │
│  _fetch_resources_for_skill()│
│  - Search YouTube (yt-dlp)   │
│  - Get top 5 videos          │
│  - Extract metadata          │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│  GapAnalysisResponse         │
│  - score: 0-100              │
│  - matching_keywords: []     │
│  - missing_keywords: []      │
│  - skill_gaps: []            │
│  - gaps_with_resources: []   │
│  - recommendations: []       │
└──────────────────────────────┘
        │
        ▼
    Return to Frontend
```

## Scoring Algorithm

### ATS Score Calculation
```
Total Score = 100 points

Formatting & Structure:    25 points
├─ Standard headers:        8 points
├─ Clean layout:           8 points
└─ No complex elements:    9 points

Keywords & Optimization:   30 points
├─ Industry keywords:      10 points
├─ Job-specific terms:     10 points
└─ Quantified results:     10 points

Content Quality:           25 points
├─ Clear job titles:       8 points
├─ Measurable results:     9 points
└─ Education format:       8 points

ATS-Friendly Elements:     20 points
├─ Standard formats:       7 points
├─ No graphics:            7 points
└─ Date consistency:       6 points
```

### Gap Analysis Score Calculation
```
Score = (Matching Keywords / Total Keywords in JD) × 100

Components:
├─ Technical skills match:    40%
├─ Soft skills match:         20%
├─ Tools & tech match:        25%
└─ Certifications match:      15%

Example:
JD has 20 keywords
Resume matches 14 keywords
Score = (14/20) × 100 = 70
```

## Technology Stack

### Core Technologies
- **FastAPI**: Web framework for API endpoints
- **Pydantic**: Data validation and schemas
- **Google Gemini AI 2.5**: NLP analysis engine
- **yt-dlp**: YouTube resource fetching
- **Python asyncio**: Async processing

### Integration Points
- **Shared Gemini Service**: Automatic API key rotation
- **Learning Guide Infrastructure**: Resource fetching patterns
- **MongoDB**: (Optional) Store analysis history

## API Response Times

| Endpoint                    | Average Time | Operations              |
|-----------------------------|--------------|-------------------------|
| `/ats-check`                | 5-8 seconds  | 1 Gemini call           |
| `/gap-analysis`             | 10-15 sec    | 1 Gemini + 5 yt-dlp     |
| `/comprehensive-analysis`   | 15-20 sec    | 2 Gemini + 5 yt-dlp     |

*Note: Comprehensive analysis runs ATS + Gap in parallel*

## Error Handling Flow

```
API Request
    │
    ▼
Input Validation
    │
    ├─ Invalid? → 400 Bad Request
    │
    ▼
Service Call
    │
    ├─ Gemini Error? → Retry with key rotation
    │
    ├─ JSON Parse Error? → Fallback parser
    │
    ├─ Resource Fetch Error? → Continue with empty resources
    │
    ▼
Response Validation
    │
    ├─ Invalid? → 500 Internal Error
    │
    ▼
Return Success (200 OK)
```

## Future Enhancements

### Planned Features
1. **PDF/DOCX Upload Support**
   - Direct file upload
   - PyPDF2/python-docx parsing
   - Text extraction

2. **Multi-Platform Resources**
   - Udemy courses (via Tavily)
   - Coursera specializations
   - LinkedIn Learning

3. **Historical Tracking**
   - Save analysis results
   - Track score improvements
   - Version comparison

4. **Industry-Specific Scoring**
   - Tech vs. Business vs. Creative
   - Adjust criteria by field
   - Custom scoring weights

5. **AI-Powered Rewriting**
   - Auto-improve resume
   - Generate optimized bullets
   - Keyword injection

### Database Schema (Future)
```python
resume_analyses = {
    "_id": ObjectId,
    "user_id": str,
    "resume_text": str,
    "job_description": str,
    "ats_score": int,
    "gap_score": int,
    "suggestions": [],
    "skill_gaps": [],
    "created_at": datetime,
    "version": int
}
```
