# Hackathon Code Editor

A multi-language code editor with FastAPI backend and React frontend supporting 18+ programming languages.

## Features

- 🚀 Support for 18+ languages (Python, JavaScript, TypeScript, Java, C/C++, Go, Rust, Ruby, PHP, and more)
- 💻 Monaco Editor integration with syntax highlighting
- ⚡ Real-time code execution via Piston API
- 📁 File management system with backend storage
- 📊 Execution history tracking
- 🎨 Dark/Light theme support
- 📝 Standard input/output handling

## Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python
- **Execution**: Proxy to Piston API for sandboxed code execution
- **Storage**: JSON-based file storage (can be upgraded to database)
- **API Endpoints**:
  - `POST /api/execute` - Execute code
  - `GET /api/files` - List all files
  - `POST /api/files` - Create file
  - `PUT /api/files/{id}` - Update file
  - `DELETE /api/files/{id}` - Delete file
  - `GET /api/history` - Get execution history

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Editor**: Monaco Editor
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites
- Python 3.8+ 
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend will start on http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on http://localhost:5173

## Usage

1. Start both backend and frontend servers
2. Open http://localhost:5173 in your browser
3. Create a new file or use the default hello.py
4. Write your code in any supported language
5. Click "Run Code" to execute
6. View output in the bottom panel

## Supported Languages

Python • JavaScript • TypeScript • Java • C • C++ • C# • Go • Rust • Ruby • PHP • Swift • Kotlin • Perl • Lua • R

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Project Structure

```
code-editor/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── routes/              # API route handlers
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   └── requirements.txt     # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── config/          # Language configurations
    │   ├── hooks/           # Custom React hooks
    │   ├── lib/             # API client
    │   ├── store/           # Zustand stores
    │   └── App.tsx          # Main application
    └── package.json         # Node dependencies
```

## Technologies Used

### Backend
- FastAPI
- Piston API (code execution)
- httpx
- Pydantic

### Frontend
- React 18
- TypeScript
- Monaco Editor
- Zustand
- Tailwind CSS
- Axios
- Vite

## License

MIT License - Built for Hackathon Projects
