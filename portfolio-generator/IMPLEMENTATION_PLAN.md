# Portfolio Generator - Implementation Plan

## Overview
A feature that compiles resume details, GitHub profile, and LinkedIn profile to generate a professional portfolio website.

## Architecture

### Backend (FastAPI)
- Python-based API service
- Data aggregation from multiple sources
- Template rendering/generation engine

### Frontend (React + TypeScript)
- User-friendly form interface
- Real-time preview
- Export functionality

### External Integrations
- GitHub API
- LinkedIn Scraper (or manual input)
- Resume parser

## Implementation Steps

### Phase 1: Project Setup
- [x] Create portfolio-generator directory structure
- [ ] Setup backend with FastAPI
- [ ] Setup frontend with React/Vite
- [ ] Configure dependencies

### Phase 2: Backend Development

#### 2.1 Data Models (schemas)
- User profile schema (personal info, contact)
- GitHub integration schema
- LinkedIn profile schema
- Resume data schema
- Portfolio configuration schema

#### 2.2 Services
- GitHub service (fetch repos, stats, contributions)
- LinkedIn service (profile data extraction)
- Resume parser service (PDF/JSON parsing)
- Portfolio generator service (HTML/CSS generation)
- Template engine service

#### 2.3 API Routes
- POST `/api/portfolio/create` - Initialize portfolio
- POST `/api/portfolio/github` - Fetch GitHub data
- POST `/api/portfolio/linkedin` - Add LinkedIn data
- POST `/api/portfolio/resume` - Upload/parse resume
- POST `/api/portfolio/generate` - Generate portfolio site
- GET `/api/portfolio/{id}` - Get portfolio data
- GET `/api/portfolio/{id}/preview` - Preview portfolio
- GET `/api/portfolio/{id}/export` - Export as HTML/ZIP

### Phase 3: Frontend Development

#### 3.1 Components
- PortfolioForm (main form component)
- PersonalInfoSection
- GithubProfileSection
- LinkedInProfileSection
- ResumeUploadSection
- TemplateSelector
- LivePreview
- ExportOptions

#### 3.2 Pages
- Portfolio Builder page
- Preview page
- Gallery page (saved portfolios)

#### 3.3 State Management
- Portfolio store (Zustand)
- Form state management
- Preview state

### Phase 4: Portfolio Templates

#### 4.1 Template Designs
- Modern/Minimal template
- Creative/Colorful template
- Professional/Corporate template
- Developer-focused template

#### 4.2 Template Features
- Responsive design
- Dark/Light mode
- Customizable colors
- Section reordering
- Social links integration

### Phase 5: Data Processing

#### 5.1 GitHub Integration
- Fetch user profile
- Get repositories (with filters)
- Contribution stats
- Top languages
- Pinned repositories
- Recent activity

#### 5.2 LinkedIn Data
- Manual input form
- Profile summary
- Work experience
- Education
- Skills & endorsements
- Certifications

#### 5.3 Resume Processing
- PDF upload & parsing
- JSON format support
- Extract: education, experience, skills, projects
- Field mapping to portfolio

### Phase 6: Portfolio Generation

#### 6.1 Generation Engine
- Combine all data sources
- Apply selected template
- Generate static HTML/CSS/JS
- Optimize assets
- Generate responsive design

#### 6.2 Export Options
- Single HTML file
- ZIP with assets
- GitHub Pages ready
- Vercel/Netlify ready
- PDF export

### Phase 7: Additional Features
- Portfolio analytics tracking
- Custom domain support
- SEO optimization
- Social media preview cards
- Contact form integration
- Blog section (optional)

## Technology Stack

### Backend
- FastAPI
- Pydantic (validation)
- Jinja2 (templating)
- PyGithub (GitHub API)
- BeautifulSoup4 (web scraping)
- python-multipart (file upload)
- pypdf2 (PDF parsing)

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Zustand (state)
- React Hook Form
- Monaco Editor (for code preview)
- Axios (API calls)

### External APIs
- GitHub REST API
- LinkedIn (manual or unofficial API)

## File Structure
```
portfolio-generator/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── models/
│   │   ├── schemas.py
│   │   └── portfolio.py
│   ├── services/
│   │   ├── github_service.py
│   │   ├── linkedin_service.py
│   │   ├── resume_parser.py
│   │   └── generator_service.py
│   ├── routes/
│   │   ├── portfolio.py
│   │   └── export.py
│   ├── templates/
│   │   ├── modern.html
│   │   ├── creative.html
│   │   ├── professional.html
│   │   └── developer.html
│   └── utils/
│       ├── validators.py
│       └── helpers.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── PortfolioBuilder.tsx
│   │   │   ├── Preview.tsx
│   │   │   └── Gallery.tsx
│   │   ├── components/
│   │   │   ├── PersonalInfoForm.tsx
│   │   │   ├── GitHubSection.tsx
│   │   │   ├── LinkedInSection.tsx
│   │   │   ├── ResumeUpload.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   ├── LivePreview.tsx
│   │   │   └── ExportPanel.tsx
│   │   ├── store/
│   │   │   └── portfolioStore.ts
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── portfolio.ts
│   └── public/
│       └── templates/
├── data/
│   └── portfolios/
└── README.md
```

## Development Timeline
- Day 1: Setup & Backend scaffolding
- Day 2: GitHub & data services
- Day 3: Frontend setup & forms
- Day 4: Template creation
- Day 5: Generation engine & export
- Day 6: Testing & refinements
- Day 7: Documentation & deployment

## Next Steps
1. Create directory structure
2. Setup backend with FastAPI
3. Create data models
4. Implement GitHub service
5. Build frontend components
6. Create portfolio templates
7. Implement generation logic
8. Add export functionality
