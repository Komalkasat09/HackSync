# Portfolio Generator - Quick Start Guide

## Getting Started in 5 Minutes

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Step 1: Start Backend
```powershell
cd portfolio-generator/backend
pip install -r requirements.txt
python main.py
```

### Step 2: Start Frontend
```powershell
# In a new terminal
cd portfolio-generator/frontend
npm install
npm run dev
```

### Step 3: Use the Application
1. Open http://localhost:5174 in your browser
2. Click "Create Portfolio"
3. Fill in your basic information
4. Add your GitHub username (e.g., "torvalds")
5. Click "Preview" to see your portfolio
6. Click "Export" to download

## Example Resume JSON Format

If you want to upload a JSON resume, use this format:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Full Stack Developer",
  "bio": "Passionate developer with 5 years of experience",
  "location": "San Francisco, CA",
  "github": "johndoe",
  "linkedin": "linkedin.com/in/johndoe",
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Senior Developer",
      "start_date": "2020-01",
      "end_date": "2024-01",
      "current": false,
      "description": "Led development of key features",
      "achievements": ["Improved performance by 50%", "Mentored 5 junior developers"]
    }
  ],
  "education": [
    {
      "institution": "University of Technology",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "start_date": "2015-09",
      "end_date": "2019-05"
    }
  ],
  "skills": ["JavaScript", "Python", "React", "Node.js", "Docker"],
  "projects": [
    {
      "name": "Awesome App",
      "description": "A productivity tool for developers",
      "technologies": ["React", "TypeScript", "FastAPI"],
      "github_url": "https://github.com/johndoe/awesome-app"
    }
  ]
}
```

## Common Issues

### Backend won't start
- Make sure port 8001 is free
- Check Python version: `python --version` (should be 3.8+)
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Make sure port 5174 is free
- Check Node version: `node --version` (should be 16+)
- Delete node_modules and reinstall: `rm -r node_modules && npm install`

### GitHub fetch fails
- Check username is correct
- Add GitHub token to .env for higher rate limits
- Wait a minute if you hit rate limit

## Next Steps

1. Customize your portfolio with different templates
2. Add projects and skills manually
3. Upload your resume for automatic parsing
4. Export and deploy to GitHub Pages or Vercel

Enjoy building your portfolio! 🚀
