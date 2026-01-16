# Interview Code Editor - Complete Setup Guide

## Overview

This is a professional code editor interface for coding interviews built for HackSync. It features:

- **Monaco Code Editor** - Professional, VS Code-like editor without auto-completion
- **Piston API Integration** - Execute code in 13+ programming languages
- **WASM Fallback** - Browser-side execution using QuickJS (JavaScript) and Pyodide (Python)
- **Real-time Output** - Immediate code execution with detailed results
- **Multiple Languages** - Python, JavaScript, Java, C++, Go, Rust, and more

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React/TypeScript)         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         CodeInterviewInterface                   │  │
│  │  ┌────────────────────┐ ┌─────────────────────┐  │  │
│  │  │  Monaco Editor     │ │ Execution Output    │  │  │
│  │  │  (No AutoComplete) │ │ & Console           │  │  │
│  │  └────────────────────┘ └─────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                    HTTP Requests                        │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┴────────────────┐
          │                                │
    ┌─────▼────────────────┐    ┌──────────▼─────────┐
    │   Piston API         │    │  WASM (Fallback)   │
    │  (api.piston.codes)  │    │ QuickJS / Pyodide  │
    └──────────────────────┘    └────────────────────┘
          │
          │
    ┌─────▼─────────────────────────────────────┐
    │   Backend (Python/FastAPI)                │
    ├─────────────────────────────────────────────┤
    │                                            │
    │  ┌──────────────────────────────────────┐ │
    │  │  interview_code/routes.py            │ │
    │  │  - /api/code/execute                 │ │
    │  │  - /api/code/validate                │ │
    │  │  - /api/code/languages               │ │
    │  │  - /api/code/wasm-context            │ │
    │  └──────────────────────────────────────┘ │
    │                                            │
    │  ┌──────────────────────────────────────┐ │
    │  │  interview_code/piston_service.py    │ │
    │  │  - PistonService class               │ │
    │  │  - API key rotation                  │ │
    │  │  - Error handling                    │ │
    │  └──────────────────────────────────────┘ │
    │                                            │
    │  ┌──────────────────────────────────────┐ │
    │  │  interview_code/wasm_executor.py     │ │
    │  │  - WasmExecutor class                │ │
    │  │  - Browser execution scripts         │ │
    │  └──────────────────────────────────────┘ │
    │                                            │
    └─────────────────────────────────────────────┘
```

## Installation

### Backend Setup

1. **Add to main.py**

```python
from backend.interview_code.routes import router as code_router

app.include_router(code_router, tags=["Code Execution"])
```

2. **Install Dependencies**

The Piston API is cloud-based, no installation needed. For WASM, the frontend loads libraries from CDN.

3. **Verify Configuration**

Check that your `config.py` doesn't need additional setup (Piston API is public).

### Frontend Setup

1. **Install Monaco Editor**

```bash
cd frontend
npm install @monaco-editor/react
```

2. **Verify Imports**

Ensure you have:
```bash
npm install lucide-react  # for icons
```

3. **Use the Component**

```tsx
import { CodeInterviewInterface } from "@/components/code-editor";

export default function InterviewPage() {
  return (
    <CodeInterviewInterface
      defaultLanguage="python"
      showLanguageSelector={true}
    />
  );
}
```

## File Structure

### Backend
```
backend/interview_code/
├── __init__.py                 # Module initialization
├── piston_service.py           # Piston API client
├── wasm_executor.py            # WASM execution handler
├── schema.py                   # Pydantic request/response schemas
└── routes.py                   # FastAPI routes
```

### Frontend
```
frontend/components/code-editor/
├── CodeEditor.tsx              # Monaco editor component
├── CodeExecutionOutput.tsx      # Output display component
├── CodeInterviewInterface.tsx   # Complete interface
├── utils.ts                     # Helper functions
├── types.ts                     # TypeScript types
└── index.ts                     # Barrel export
```

## Usage

### Basic Usage

```tsx
import { CodeInterviewInterface } from "@/components/code-editor";

export default function CodingChallenge() {
  const handleSubmit = (code, language, result) => {
    console.log("Code submitted:", { code, language, result });
    // Save to database, send to interviewer, etc.
  };

  return (
    <CodeInterviewInterface
      defaultLanguage="python"
      onCodeSubmit={handleSubmit}
    />
  );
}
```

### Just the Editor

```tsx
import { CodeEditor } from "@/components/code-editor";

export default function Editor() {
  return (
    <CodeEditor
      language="javascript"
      onExecute={async (code, language) => {
        // Execute code
      }}
    />
  );
}
```

### Custom Integration

```tsx
import { executeCodeOnServer } from "@/components/code-editor/utils";

async function runCode() {
  try {
    const result = await executeCodeOnServer(
      "print('Hello, World!')",
      "python"
    );
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

## API Endpoints

### POST /api/code/execute
Execute code using Piston API with WASM fallback

**Request:**
```json
{
  "language": "python",
  "code": "print('Hello, World!')",
  "stdin": "",
  "use_wasm": true
}
```

**Response:**
```json
{
  "success": true,
  "language": "python",
  "output": "Hello, World!\n",
  "error": "",
  "exit_code": 0,
  "execution_time": "2024-01-16T10:30:00.000Z",
  "execution_method": "piston",
  "execution_duration_ms": 250
}
```

### POST /api/code/validate
Validate code syntax

**Request:**
```json
{
  "language": "python",
  "code": "print('test')"
}
```

**Response:**
```json
{
  "is_valid": true,
  "error_message": null
}
```

### GET /api/code/languages
Get available languages

**Response:**
```json
{
  "languages": {
    "python": {
      "name": "Python",
      "version": "3.10.0",
      "extension": "py",
      "supported_on_wasm": true
    },
    ...
  }
}
```

### POST /api/code/wasm-context
Get WASM execution context for browser-side execution

**Request:**
```json
{
  "language": "javascript",
  "code": "console.log('test')",
  "stdin": ""
}
```

**Response:**
```json
{
  "type": "wasm-fallback",
  "language": "javascript",
  "timestamp": "2024-01-16T10:30:00.000Z",
  "code": "console.log('test')",
  "stdin": "",
  "execution_script": "...",
  "sandbox_config": {
    "timeout": 30000,
    "memory_limit": 268435456,
    "network_access": false,
    "file_system_access": false
  }
}
```

## Supported Languages

| Language   | Version   | WASM | Piston |
|-----------|-----------|------|--------|
| Python    | 3.10.0    | ✓    | ✓      |
| JavaScript| 18.15.0   | ✓    | ✓      |
| TypeScript| 5.0.3     | ✗    | ✓      |
| Java      | 15.0.6    | ✗    | ✓      |
| C++       | 10.2.0    | ✗    | ✓      |
| C         | 10.2.0    | ✗    | ✓      |
| C#        | 10.2.0    | ✗    | ✓      |
| Go        | 1.16.2    | ✗    | ✓      |
| Rust      | 1.56.1    | ✗    | ✓      |
| Ruby      | 3.0.1     | ✗    | ✓      |
| PHP       | 7.4.15    | ✗    | ✓      |
| Swift     | 5.3.3     | ✗    | ✓      |
| Kotlin    | 1.6.255   | ✗    | ✓      |

## Features

### Monaco Editor
- ✓ Professional VS Code-like interface
- ✓ **Auto-completion disabled** (configurable)
- ✓ Syntax highlighting for 13+ languages
- ✓ Line numbers and code folding
- ✓ Minimap
- ✓ Word wrap and multi-cursor
- ✓ Theme support (light/dark)

### Code Execution
- ✓ Piston API for most languages
- ✓ WASM fallback (QuickJS for JS, Pyodide for Python)
- ✓ 30-second timeout
- ✓ Automatic error handling
- ✓ Standard input/output capture

### Output Display
- ✓ Tabbed interface (Output, Error, Details)
- ✓ Syntax-highlighted error messages
- ✓ Execution time and performance metrics
- ✓ Copy-to-clipboard buttons
- ✓ Execution history tracking

### UI Components
- ✓ Language selector dropdown
- ✓ Execute button with loading state
- ✓ Copy, Reset, Download buttons
- ✓ Code statistics (lines, characters)
- ✓ Toast notifications

## Configuration

### Editor Options

```tsx
<CodeEditor
  language="python"
  value={code}
  onChange={setCode}
  theme="dark"                    // 'light' | 'dark'
  height="600px"                  // custom height
  readOnly={false}                // readonly mode
  showLanguageSelector={true}     // show language dropdown
  showExecuteButton={true}        // show execute button
  defaultLanguage="python"        // initial language
/>
```

### Disabling Auto-Completion

Auto-completion is **already disabled** in the component. To customize:

```tsx
editor.updateOptions({
  "editor.suggest.enabled": false,
  "editor.quickSuggestions": false,
  "editor.parameterHints.enabled": false,
  "editor.hover.enabled": false,
});
```

## Performance & Limits

- **Max code size:** 1 MB
- **Max execution time:** 30 seconds
- **Memory limit (WASM):** 256 MB
- **Network access:** Disabled (sandbox)
- **File system access:** Disabled (sandbox)

## Error Handling

All errors are handled gracefully:

```
1. Code Validation → User feedback
2. Piston API Fails → Attempt WASM fallback
3. WASM Not Available → Error message + suggestion
4. Timeout → User receives timeout error
5. Network Error → Retry with detailed error
```

## WASM Fallback Mechanism

For JavaScript and Python, if Piston API fails, the system attempts WASM execution:

1. **JavaScript:** Uses QuickJS (lightweight JS engine in WASM)
2. **Python:** Uses Pyodide (Python runtime compiled to WASM)

Both run in a sandboxed environment in the browser.

### Loading WASM Libraries

The components automatically load required libraries from CDN. You can customize URLs in `wasm_executor.py`:

```python
QUICKJS_URL = "https://cdn.jsdelivr.net/npm/@wasmer/quickjs/lib/index.js"
PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.24.0/full/pyodide.js"
```

## Troubleshooting

### "Piston API Unavailable"
- Check internet connection
- Verify `api.piston.codes` is accessible
- Use WASM fallback (set `use_wasm: true`)

### "Auto-complete still showing"
- Ensure you're using the provided `CodeEditor` component
- Verify Monaco editor is correctly configured
- Clear browser cache

### "WASM execution failed"
- Ensure CDN URLs are accessible
- Check browser console for errors
- Verify Pyodide/QuickJS are loaded

### "Code execution timeout"
- Reduce code complexity
- Check for infinite loops
- Increase timeout (max 30s)

## Integration with HackSync

### Adding to Interview Module

In `backend/interview_prep/routes.py`:

```python
from backend.interview_code.routes import router as code_router

router.include_router(code_router)
```

### Adding to Dashboard

In `frontend/app/dashboard/code-interview/page.tsx`:

```tsx
import { CodeInterviewInterface } from "@/components/code-editor";

export default function CodeInterview() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Coding Interview</h1>
      <CodeInterviewInterface onCodeSubmit={handleSubmit} />
    </div>
  );
}
```

## Security Considerations

✓ **Sandbox Execution:** All code runs in isolated containers (Piston) or browser sandbox (WASM)
✓ **No File Access:** Code cannot access file system
✓ **No Network:** Code cannot make external requests
✓ **Time Limits:** 30-second execution timeout
✓ **Memory Limits:** 256 MB WASM, unlimited Piston (but monitored)
✓ **Input Validation:** All inputs validated on backend

## Performance Optimization

- Monaco editor is lazy-loaded
- WASM libraries are cached
- Code execution results are memoized
- API requests debounced
- Output virtualized for large results

## Future Enhancements

- [ ] Collaborative editing (multiple users)
- [ ] Debugging interface with breakpoints
- [ ] Performance profiling tools
- [ ] Custom test cases and assertions
- [ ] Code snippets library
- [ ] AI code review/suggestions
- [ ] WebSocket for real-time collaboration

## Dependencies

### Backend
```
fastapi
pydantic
aiohttp
asyncio
```

### Frontend
```
@monaco-editor/react
lucide-react
axios
```

## Support & Contributing

For issues or feature requests:
1. Check existing GitHub issues
2. Review this documentation
3. Create detailed issue with reproducible example
4. Submit pull requests with tests

## License

Part of HackSync project - AI-powered career platform
