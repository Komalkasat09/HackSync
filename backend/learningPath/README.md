# Learning Path Module

## Overview
AI-powered personalized learning path generator integrated into HackSync.

## Core Components

### 1. NLP & Skill Parsing (`nlp/`)
- **skill_parser.py**: Extracts skills from resume text using spaCy
- **skill_taxonomy.json**: Standardized skill names and mappings
- **role_requirements.json**: Maps job roles to required skills

### 2. Logic (`logic/`)
- **gap_analysis.py**: Identifies skill gaps and proficiency levels
- **path_generator.py**: Creates week-by-week learning roadmaps
- **recommender.py**: AI-powered resource recommendations using Sentence Transformers
- **prerequisites.py**: Manages skill dependencies
- **evaluation.py**: Tracks and evaluates learning progress
- **explainability.py**: Provides natural language explanations for recommendations

### 3. AI Integration (`ai/`)
- **gemini_service.py**: Google Gemini API for advanced AI features

### 4. Content Scraping (`scraper/`)
- **scraper.py**: Multi-source content aggregation
  - YouTube videos
  - freeCodeCamp articles
  - Coursera courses
  - GitHub repositories

### 5. Data Models (`models/`)
- **user_profile.py**: User profile and skill data structures

## API Routes

All routes are registered under `/api/learning-path/` prefix:

- `GET /health` - Health check
- `POST /parse-resume` - Extract skills from text
- `POST /analyze-gaps` - Identify skill gaps
- `POST /generate-path` - Generate full learning roadmap
- `GET /recommend` - Get AI recommendations for a topic
- `POST /scrape` - Trigger content scraper for new topics

## Key Features

### Intelligent Gap Analysis
```python
# Detects two types of gaps:
# 1. MISSING - Skill not present at all
# 2. PROFICIENCY_LOW - Skill exists but needs improvement

gaps = [
    SkillGap(
        skill_name="React",
        gap_type="MISSING",
        current_proficiency="None",
        required_proficiency="Intermediate",
        priority="HIGH"
    )
]
```

### Smart Scheduling
- Respects skill dependencies (e.g., JavaScript before React)
- Distributes learning over weeks based on available hours
- Balances topic difficulty and time allocation

### Semantic Search
- Uses Sentence Transformers for meaning-based matching
- Goes beyond keyword matching
- Example: "AI" matches "Machine Learning" content

### Resource Verification
- Social proof through view counts
- Reddit/Twitter mention tracking
- Trusted source indicators

## Usage

### Initialize Models
```python
from learningPath.nlp.skill_parser import SkillMapper
from learningPath.logic.gap_analysis import GapAnalyzer
from learningPath.logic.path_generator import PathGenerator

skill_mapper = SkillMapper()
gap_analyzer = GapAnalyzer(skill_mapper=skill_mapper)
path_generator = PathGenerator()
```

### Parse Resume
```python
resume_text = "Experienced Python developer with React and Node.js skills"
skills = skill_mapper.process_resume(resume_text)
# Returns: ["Python", "React", "Node.js"]
```

### Generate Learning Path
```python
from learningPath.models.user_profile import UserProfile

user = UserProfile(
    user_id="user_123",
    name="John Doe",
    current_skills=[
        {"name": "Python", "proficiency": "Intermediate"}
    ],
    goals={
        "target_role": "Full Stack Developer",
        "target_skills": ["Python", "JavaScript", "React", "Node.js"]
    }
)

gaps = gap_analyzer.analyze(user, target_skills)
path = path_generator.generate_path(
    user_id=user.user_id,
    role="Full Stack Developer",
    gaps=gaps,
    hours_per_week=10
)
```

## Data Files

### learning_resources.json
Curated database of learning resources with structure:
```json
{
  "resources": [
    {
      "title": "React Tutorial",
      "url": "https://...",
      "type": "video",
      "verified": true,
      "source": "YouTube",
      "duration_minutes": 45,
      "skill_tags": ["React", "Frontend"]
    }
  ]
}
```

### skill_taxonomy.json
Maps variations to standard names:
```json
{
  "JavaScript": ["JS", "Javascript", "ECMAScript"],
  "Python": ["python", "py"],
  "React": ["ReactJS", "React.js"]
}
```

### role_requirements.json
Role-to-skill mappings with proficiency levels:
```json
{
  "Full Stack Developer": {
    "JavaScript": "Advanced",
    "React": "Intermediate",
    "Node.js": "Intermediate",
    "SQL": "Intermediate"
  }
}
```

## Dependencies

Required packages (already installed):
- sentence-transformers: AI embeddings
- torch: ML framework
- spacy: NLP
- scikit-learn: ML algorithms
- networkx: Graph algorithms for dependencies
- google-generativeai: Gemini API
- beautifulsoup4: HTML parsing
- youtube-search-python: YouTube API

## Performance

- **First request**: ~5-10 seconds (model loading)
- **Subsequent requests**: 50-200ms
- **Memory usage**: ~2GB for ML models
- **Disk space**: ~500MB for models and data

## Lazy Loading

Models are loaded on first API call to optimize startup time:
```python
def get_models():
    """Lazy load ML models on first request"""
    if not _ml_models:
        # Load models here
        pass
    return _ml_models
```

## Error Handling

All endpoints return proper HTTP status codes:
- 200: Success
- 422: Validation error
- 500: Server error

Example error response:
```json
{
  "detail": "Model initialization failed: ..."
}
```

## Extension Points

### Adding New Roles
Edit `nlp/role_requirements.json`:
```json
{
  "New Role Name": {
    "Skill1": "Intermediate",
    "Skill2": "Advanced"
  }
}
```

### Adding Resources
Edit `learning_resources.json`:
```json
{
  "resources": [
    {
      "title": "New Course",
      "url": "https://...",
      "type": "video",
      "skill_tags": ["Python"]
    }
  ]
}
```

### Custom Scraper
Extend `scraper/scraper.py`:
```python
class LearningScraper:
    def scrape_custom_source(self, topic: str):
        # Add your custom scraping logic
        pass
```

## Testing

Run tests:
```bash
# Test skill parsing
python -m learningPath.nlp.skill_parser

# Test path generation
python -m learningPath.logic.path_generator

# Test API
curl http://localhost:8000/api/learning-path/health
```

## Integration with HackSync

- Registered in `main.py` as separate router
- Uses existing MongoDB connection (optional)
- Matches HackSync UI theme
- Accessible from dashboard sidebar
- No modifications to existing modules

## License

Integrated into HackSync project.
