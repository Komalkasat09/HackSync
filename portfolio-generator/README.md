# Portfolio Generator

A full-stack application that automatically generates professional portfolio websites by compiling data from your resume, GitHub profile, and LinkedIn profile.

## Features

- 🎨 **Multiple Templates**: Choose from Modern, Creative, Professional, or Developer-focused designs
- 💻 **GitHub Integration**: Automatically fetch repositories, stats, and contributions
- 📄 **Resume Parsing**: Upload PDF or JSON resumes for automatic data extraction
- 🔗 **LinkedIn Support**: Integrate your professional experience and education
- ⚡ **Live Preview**: See changes in real-time before exporting
- 📦 **Multiple Export Formats**: Download as HTML or ZIP with assets
- 🎨 **Customization**: Customize colors, fonts, and layout options

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **PyGithub** - GitHub API integration
- **Jinja2** - HTML templating
- **PyPDF2** - PDF parsing

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Axios** - HTTP client

## Project Structure

```
portfolio-generator/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── services/
│   │   ├── github_service.py   # GitHub API integration
│   │   ├── resume_parser.py    # Resume parsing logic
│   │   └── generator_service.py# Portfolio generation
│   ├── routes/
│   │   ├── portfolio.py        # Portfolio CRUD endpoints
│   │   └── export.py           # Export endpoints
│   ├── templates/
│   │   └── modern.html         # HTML templates
│   └── data/
│       ├── portfolios/         # Saved portfolios
│       ├── uploads/            # Uploaded resumes
│       └── exports/            # Generated exports
├── frontend/
│   ├── src/
│   │   ├── pages/              # React pages
│   │   ├── components/         # React components
│   │   ├── store/              # Zustand stores
│   │   ├── lib/                # API client
│   │   └── types/              # TypeScript types
│   └── package.json
└── IMPLEMENTATION_PLAN.md
```

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```powershell
cd portfolio-generator/backend
```

2. Create a virtual environment (optional but recommended):
```powershell
python -m venv venv
.\venv\Scripts\Activate
```

3. Install dependencies:
```powershell
pip install -r requirements.txt
```

4. Create a `.env` file (optional for GitHub API):
```
GITHUB_TOKEN=your_github_personal_access_token
```

5. Run the backend server:
```powershell
python main.py
```

The API will be available at `http://localhost:8001`

### Frontend Setup

1. Navigate to the frontend directory:
```powershell
cd portfolio-generator/frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Run the development server:
```powershell
npm run dev
```

The frontend will be available at `http://localhost:5174`

## Usage

1. **Create Portfolio**: Click "Create Portfolio" and enter your basic information
2. **Add GitHub Profile**: Enter your GitHub username to fetch repositories and stats
3. **Upload Resume**: Upload a PDF or JSON resume for automatic parsing
4. **Add LinkedIn Data**: Manually add LinkedIn information (or wait for integration)
5. **Customize**: Choose a template and customize colors
6. **Preview**: View your portfolio in real-time
7. **Export**: Download as HTML or ZIP file

## API Endpoints

### Portfolio Management
- `POST /api/portfolio/create` - Create new portfolio
- `GET /api/portfolio/{id}` - Get portfolio by ID
- `PUT /api/portfolio/{id}` - Update portfolio
- `DELETE /api/portfolio/{id}` - Delete portfolio
- `GET /api/portfolio/` - List all portfolios

### Integrations
- `POST /api/portfolio/{id}/github` - Fetch GitHub profile
- `POST /api/portfolio/{id}/resume/upload` - Upload resume file
- `POST /api/portfolio/{id}/resume/json` - Add resume data as JSON

### Export
- `POST /api/export/{id}/html` - Export as HTML
- `POST /api/export/{id}/zip` - Export as ZIP
- `GET /api/export/{id}/download?format={html|zip}` - Download portfolio

## Configuration

### GitHub Token
To increase API rate limits and access private repos:
1. Create a GitHub Personal Access Token
2. Add it to `.env` file in backend directory
3. Restart the backend server

### Template Customization
Edit template files in `backend/templates/` to customize the HTML output.

## Development

### Adding New Templates
1. Create a new HTML template in `backend/templates/`
2. Add template type to `models/schemas.py`
3. Update `_get_template_name()` in `generator_service.py`
4. Add template option to frontend `TemplateSelector` component

### Adding New Features
1. Update Pydantic models in `models/schemas.py`
2. Add service logic in `services/`
3. Create API endpoints in `routes/`
4. Update frontend types in `types/portfolio.ts`
5. Add UI components in `components/`

## Troubleshooting

### Backend Issues
- **Port already in use**: Change port in `main.py`
- **Module not found**: Reinstall dependencies with `pip install -r requirements.txt`
- **GitHub API rate limit**: Add a GitHub token to `.env`

### Frontend Issues
- **Port already in use**: Change port in `vite.config.ts`
- **API connection failed**: Ensure backend is running on port 8001
- **Build errors**: Delete `node_modules` and run `npm install` again

## Future Enhancements

- [ ] Direct LinkedIn API integration
- [ ] More template options
- [ ] Blog section support
- [ ] Custom domain deployment
- [ ] Analytics integration
- [ ] PDF export
- [ ] Video/media embedding
- [ ] Multi-language support
- [ ] SEO optimization tools
- [ ] Contact form integration

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT License

## Support

For issues and questions, please open an issue on the GitHub repository.

---

**Generated with ❤️ for HackSync**
