# Hackathon Coding Interface Guide

A comprehensive guide for building a multi-language code editor with Monaco Editor and Piston API/WASM runtime execution. This document provides step-by-step instructions for VS Code Copilot to implement the coding interface for your hackathon project.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Supported Languages](#supported-languages)
4. [Project File Structure](#project-file-structure)
5. [Implementation Steps](#implementation-steps)

---

## Overview

This project creates a web-based code editor that:
- Allows users to write code in 18+ programming languages
- Executes code on **Piston API** (cloud-based sandboxed execution)
- Falls back to **WebAssembly** for languages with WASM support
- Provides syntax highlighting, error detection, and code suggestions
- Runs entirely in the browser with a local backend server

**Key Features:**
- Multi-language support with proper syntax highlighting
- Real-time code execution with stdin/stdout capture
- Error diagnostics and analysis
- File management system
- Clean, responsive UI

---

## Tech Stack

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool (fast development server)
- **Monaco Editor** (@monaco-editor/react 4.7.0) - Code editor component
- **Zustand** - State management
- **Tailwind CSS** - Styling

### Backend/Execution
- **Piston API** (https://emkc.org/api/v2/piston) - Primary code execution service
- **WebAssembly** (WASM) - Alternative execution for supported languages
- **Node.js/Bun** - Native JavaScript/TypeScript execution

### Dependencies
```json
{
  "@monaco-editor/react": "^4.7.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "zustand": "^4.4.0",
  "tailwindcss": "^3.4.18"
}
```

---

## Supported Languages

### Scripting Languages
| Language | Version | Extension | Piston Support | WASM Support |
|----------|---------|-----------|-----------------|--|
| Python | 3.10.0 | .py | ✅ | ✅ |
| JavaScript | 18.15.0 | .js | ✅ | ❌ |
| TypeScript | 5.0.3 | .ts | ✅ | ❌ |
| Ruby | 3.0.1 | .rb | ✅ | ✅ |
| PHP | 8.2.3 | .php | ✅ | ✅ |
| Perl | 5.36.0 | .pl | ✅ | ❌ |
| Lua | 5.4.4 | .lua | ✅ | ✅ |

### Compiled Languages
| Language | Version | Extension | Piston Support | WASM Support |
|----------|---------|-----------|-----------------|---|
| Java | 15.0.2 | .java | ✅ | ❌ |
| C | 10.2.0 | .c | ✅ | ❌ |
| C++ | 10.2.0 | .cpp | ✅ | ❌ |
| C# | 6.12.0 | .cs | ✅ | ❌ |
| Go | 1.16.2 | .go | ✅ | ✅ |
| Rust | 1.68.2 | .rs | ✅ | ✅ |
| Swift | 5.3.3 | .swift | ✅ | ❌ |
| Kotlin | 1.8.20 | .kt | ✅ | ❌ |

### Other Languages
| Language | Version | Extension | Piston Support | WASM Support |
|----------|---------|-----------|-----------------|---|
| R | 4.1.1 | .r | ✅ | ❌ |
| HTML5 | 5 | .html | ✅ | N/A |
| CSS3 | 3 | .css | ✅ | N/A |

---

## How Languages Run

### Primary Execution Method: Piston API

**Piston API** is a free, open-source code execution service. It provides isolated containers for safe code execution.

#### API Endpoint
```
https://emkc.org/api/v2/piston
```

#### Request Format
```typescript
interface PistonExecutionRequest {
  language: string;           // Language identifier (e.g., 'python', 'javascript')
  version: string;            // Language version (e.g., '3.10.0')
  source: string;             // Your source code
  args?: string[];            // Command-line arguments
  stdin?: string;             // Standard input for the program
}
```

#### Response Format
```typescript
interface PistonExecutionResponse {
  run: {
    stdout: string;           // Program output
    stderr: string;           // Error output
    output: string;           // Combined stdout + stderr
    code: number;             // Exit code
    signal: string | null;    // Signal if process was terminated
  };
}
```

#### Example: Running Python Code
```bash
POST https://emkc.org/api/v2/piston/execute

{
  "language": "python",
  "version": "3.10.0",
  "source": "print('Hello, World!')",
  "stdin": ""
}

Response:
{
  "run": {
    "stdout": "Hello, World!\n",
    "stderr": "",
    "output": "Hello, World!\n",
    "code": 0,
    "signal": null
  }
}
```

### Alternative Method: WebAssembly (WASM)

For supported languages, you can also use WebAssembly for faster, client-side execution without network latency.

**Supported Languages for WASM:**
- Python (with Pyodide)
- Go
- Rust
- PHP
- Ruby
- Lua

#### WASM Setup Example (Python with Pyodide)
```javascript
// Load Pyodide library
importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");

async function executePython(code, stdin = "") {
  let pyodide = await loadPyodide();
  
  // Set stdin
  pyodide.FS.writeFile("/dev/stdin", stdin);
  
  // Run code
  try {
    let output = await pyodide.runPythonAsync(code);
    return { stdout: output, stderr: "", code: 0 };
  } catch (error) {
    return { stdout: "", stderr: error.message, code: 1 };
  }
}
```

---

## Project File Structure

```
hackathon-code-editor/
├── src/
│   ├── components/
│   │   ├── Editor.tsx                 # Monaco Editor wrapper component
│   │   ├── ExecutionPanel.tsx         # Output/execution results display
│   │   ├── FileManager.tsx            # File tree and file operations
│   │   ├── RunnerPanel.tsx            # Run controls and buttons
│   │   ├── StdinBox.tsx               # Standard input for programs
│   │   ├── ErrorModal.tsx             # Error display modal
│   │   └── TopBar.tsx                 # Top navigation and menus
│   │
│   ├── config/
│   │   ├── runtimes.ts                # Language runtime configurations
│   │   ├── monacoLanguages.ts         # Monaco Editor language setup
│   │   ├── extensions.ts              # File extension mappings
│   │   └── executionProfiles.ts       # Execution environment settings
│   │
│   ├── executors/
│   │   ├── PistonExecutor.ts          # Piston API integration
│   │   ├── WasmExecutor.ts            # WebAssembly execution
│   │   └── ExecutionManager.ts        # Handles execution routing
│   │
│   ├── analyzers/
│   │   ├── pythonAnalyzer.ts          # Python syntax/semantic analysis
│   │   ├── javascriptAnalyzer.ts      # JavaScript analysis
│   │   ├── javaAnalyzer.ts            # Java analysis
│   │   ├── goAnalyzer.ts              # Go analysis
│   │   ├── rubyAnalyzer.ts            # Ruby analysis
│   │   ├── phpAnalyzer.ts             # PHP analysis
│   │   └── index.ts                   # Analyzer router
│   │
│   ├── diagnostics/
│   │   ├── DiagnosticsManager.ts      # Error/warning management
│   │   ├── types.ts                   # Diagnostic type definitions
│   │   └── adapters/                  # Language-specific error adapters
│   │
│   ├── hooks/
│   │   ├── useExecution.ts            # Hook for code execution
│   │   ├── useExecutor.ts             # Hook for executor selection
│   │   ├── useFiles.ts                # Hook for file management
│   │   └── useFileTree.ts             # Hook for file tree state
│   │
│   ├── store/
│   │   ├── editorStore.ts             # Editor state (Zustand)
│   │   ├── fileStore.ts               # File management state
│   │   └── executionStore.ts          # Execution state
│   │
│   ├── utils/
│   │   ├── errorParser.ts             # Parse execution errors
│   │   ├── codeActions.ts             # Code action implementations
│   │   └── fileUtils.ts               # File utility functions
│   │
│   ├── App.tsx                        # Root component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
│
├── public/
│   ├── index.html                     # HTML template
│   └── favicon.ico
│
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
├── tailwind.config.js                 # Tailwind CSS config
├── vite.config.ts                     # Vite build config
└── README.md
```

---

## Implementation Steps

### Step 1: Setup Project Structure
**Prompt for Copilot:**
```
Create a new React + TypeScript + Vite project with the following directory structure:
- src/components (for React components)
- src/config (for configuration files)
- src/executors (for code execution logic)
- src/analyzers (for language-specific code analysis)
- src/hooks (for custom React hooks)
- src/store (for Zustand state management)
- src/utils (for utility functions)
```

### Step 2: Install Dependencies
**Prompt for Copilot:**
```
Install the following npm packages:
- @monaco-editor/react (v4.7.0) for the code editor
- zustand (v4.4.0) for state management
- axios for HTTP requests to Piston API
- tailwindcss and postcss for styling

Create package.json scripts for:
- "dev" to start development server
- "build" to compile TypeScript and bundle with Vite
- "lint" for ESLint checks
```

### Step 3: Configure Monaco Editor
**Prompt for Copilot:**
```
Create src/config/monacoLanguages.ts that:
1. Maps language identifiers to Monaco Editor language IDs
2. Supports 18+ languages (Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, PHP, Ruby, Kotlin, Swift, Lua, R, Perl, C#, HTML, CSS)
3. Provides helper function getMonacoLanguageId(lang: string)
4. Registers custom tokenizers for unsupported languages
5. Supports common aliases (e.g., 'py' -> 'python', 'js' -> 'javascript')
```

### Step 4: Define Runtime Configurations
**Prompt for Copilot:**
```
Create src/config/runtimes.ts with:
1. RuntimeConfig interface containing: language, version, extension, displayName, and optional aliases
2. RUNTIMES object mapping language identifiers to their configurations
3. Helper functions:
   - getRuntime(lang: string): RuntimeConfig | undefined
   - getRuntimeVersion(lang: string): string
   - getFileExtension(lang: string): string
   - getSupportedLanguages(): string[]
   - isLanguageSupported(lang: string): boolean
   - getPistonConfig(lang: string): { language: string; version: string } | null

Include all 18+ languages with accurate version numbers.
```

### Step 5: Implement Piston API Executor
**Prompt for Copilot:**
```
Create src/executors/PistonExecutor.ts that:
1. Defines PistonExecutionRequest and PistonExecutionResponse interfaces
2. Implements executeCode(language, version, source, stdin?) async function
3. Makes POST requests to https://emkc.org/api/v2/piston/execute
4. Handles timeout (15 seconds max)
5. Parses and returns stdout, stderr, and exit code
6. Implements error handling for network failures and invalid responses
7. Supports all 18+ languages via Piston API
```

### Step 6: Implement WebAssembly Executor
**Prompt for Copilot:**
```
Create src/executors/WasmExecutor.ts that:
1. Implements WASM execution for languages: Python, Go, Rust, PHP, Ruby, Lua
2. For Python: Uses Pyodide (https://cdn.jsdelivr.net/pyodide/)
3. For Go, Rust: Uses Wasm runtime builds
4. Implements executePythonWasm(code, stdin) function
5. Handles module loading and caching for performance
6. Returns { stdout, stderr, code } in same format as Piston
7. Gracefully falls back to Piston for unsupported languages
```

### Step 7: Create Execution Manager
**Prompt for Copilot:**
```
Create src/executors/ExecutionManager.ts that:
1. Routes execution to appropriate executor (Piston or WASM)
2. Implements executeCode(language, source, stdin) async function
3. Prefers WASM for supported languages (faster, no network latency)
4. Falls back to Piston for all languages
5. Has configurable preference via ExecutionConfig
6. Handles error cases and returns standardized ExecutionResult
```

### Step 8: Create Editor Component
**Prompt for Copilot:**
```
Create src/components/Editor.tsx that:
1. Imports and wraps Monaco Editor (@monaco-editor/react)
2. Accepts props: currentFile, onSave, onClose, onChange, executionError
3. Sets up Monaco instance with:
   - Proper language detection based on file extension
   - Dark/light theme support
   - Font size and line number settings
   - Tab size of 2 spaces
4. Enables auto-save functionality (debounced every 2 seconds)
5. Shows syntax errors and diagnostics from analyzers
6. Provides keyboard shortcuts (Ctrl+S to save, Ctrl+Shift+P for commands)
```

### Step 9: Create Execution Panel Component
**Prompt for Copilot:**
```
Create src/components/ExecutionPanel.tsx that:
1. Displays execution results in two sections: stdout and stderr
2. Shows output in scrollable containers with monospace font
3. Displays exit code prominently
4. Shows execution time
5. Has buttons to:
   - Clear output
   - Copy output to clipboard
   - Rerun code
6. Color-codes stderr in red, stdout in default color
```

### Step 10: Create File Manager Component
**Prompt for Copilot:**
```
Create src/components/FileManager.tsx that:
1. Displays file tree structure with collapsible folders
2. Shows all open files as tabs
3. Allows:
   - Creating new files (default name: untitled-N.ext)
   - Opening existing files
   - Saving files
   - Deleting files
   - Renaming files
4. Auto-detects language from file extension
5. Shows file status (unsaved with dot indicator)
6. Highlights currently active file
```

### Step 11: Create Standard Input Component
**Prompt for Copilot:**
```
Create src/components/StdinBox.tsx that:
1. Provides text input area for program stdin
2. Has placeholder text: "Enter standard input here (optional)"
3. Shows character count
4. Can be toggled to show/hide
5. Auto-resizes based on content
6. Integrates with execution flow
```

### Step 12: Create State Management
**Prompt for Copilot:**
```
Create Zustand stores in src/store/:
1. editorStore: Manages current file, unsaved changes, theme
2. fileStore: Manages open files, file tree, file operations
3. executionStore: Manages execution history, output, loading state

Each store should have:
- State interface
- Actions for CRUD operations
- Selectors for derived state
- Persistence (localStorage) for file content
```

### Step 13: Create Custom Hooks
**Prompt for Copilot:**
```
Create src/hooks/:
1. useExecution.ts - Hook for running code:
   - Takes language, source, stdin as parameters
   - Returns loading state, output, error, and execute function
   
2. useExecutor.ts - Hook for executor selection:
   - Returns current executor (Piston or WASM)
   - Can toggle between executors
   
3. useFiles.ts - Hook for file operations:
   - Create, read, update, delete files
   - Load from localStorage
   - Export/import files
   
4. useFileTree.ts - Hook for file tree state:
   - Expand/collapse folders
   - Navigate files
```

### Step 14: Implement Language Analyzers
**Prompt for Copilot:**
```
Create language-specific analyzers in src/analyzers/:
1. pythonAnalyzer.ts - Parse Python syntax errors
2. javascriptAnalyzer.ts - Parse JS/TS errors
3. javaAnalyzer.ts - Parse Java compilation errors
4. goAnalyzer.ts - Parse Go errors
5. rubyAnalyzer.ts - Parse Ruby errors
6. phpAnalyzer.ts - Parse PHP errors

Each analyzer should:
- Take source code as input
- Return array of diagnostics (line, column, message, severity)
- Support both static analysis and runtime errors
- Have interface: analyze(source: string): Diagnostic[]
```

### Step 15: Create Main App Component
**Prompt for Copilot:**
```
Create src/App.tsx that:
1. Combines all components into a layout:
   - TopBar (navigation and menu)
   - FileManager (left sidebar)
   - Editor (main area)
   - ExecutionPanel (bottom area)
   - StdinBox (collapsible input)
2. Manages component communication via state
3. Handles file operations and code execution flow
4. Supports dark/light theme toggle
5. Responsive layout that adapts to screen size
```

### Step 16: Setup Build Configuration
**Prompt for Copilot:**
```
Create vite.config.ts with:
1. React plugin for JSX support
2. TypeScript support
3. Proper module resolution
4. Optimized build settings:
   - Code splitting
   - Minification
   - Asset optimization

Create tsconfig.json with:
1. Target ES2020
2. Module ESNext
3. JSX: react-jsx
4. Strict type checking enabled
5. Path aliases for imports (e.g., @/components)
```

---

## Piston API Integration Details

### Complete Execution Flow

```typescript
// 1. Get language config
const config = getPistonConfig('python');
// { language: 'python', version: '3.10.0' }

// 2. Prepare code and input
const sourceCode = `
print("Enter your name:")
name = input()
print(f"Hello, {name}!")
`;
const stdin = "Alice\n";

// 3. Execute via Piston
const response = await fetch('https://emkc.org/api/v2/piston/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    language: config.language,
    version: config.version,
    source: sourceCode,
    stdin: stdin
  })
});

// 4. Parse response
const result = await response.json();
const { stdout, stderr, code } = result.run;
// stdout: "Enter your name:\nHello, Alice!\n"
// stderr: ""
// code: 0
```

### Error Handling

```typescript
// Compile-time errors (Java, C++, etc.)
// stderr contains compiler error messages
// code is non-zero

// Runtime errors
// stderr contains stack trace
// code indicates signal (e.g., 1 for normal error, 139 for segfault)

// Timeout errors
// Handle when request takes > 15 seconds
// Return: { stdout: '', stderr: 'Execution timeout', code: 124 }

// Network errors
// Fallback to browser cache or show error message
```

---

## Key Development Tips

### 1. Testing Piston API Locally

```bash
# Test Python execution
curl -X POST https://emkc.org/api/v2/piston/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.10.0",
    "source": "print(42)"
  }'

# Test with stdin
curl -X POST https://emkc.org/api/v2/piston/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "3.10.0",
    "source": "print(input())",
    "stdin": "Hello"
  }'
```

### 2. Performance Optimization

- Cache Monaco Editor instances per language
- Debounce auto-save (2-3 seconds)
- Lazy-load WebAssembly modules
- Limit output size to 1MB to prevent memory issues
- Set execution timeout to 15 seconds

### 3. Error Messages

Display helpful error messages:
- Compilation errors: Show exact line and column
- Runtime errors: Show stack trace
- Timeout: "Code execution took too long (>15s)"
- Network: "Unable to reach execution service. Check your internet connection."

### 4. File Format Support

- Support plain text file uploads
- Show appropriate file icons based on extension
- Auto-detect language from extension
- Default to 'plaintext' if unknown

---

## Deployment Notes (Non-Cloudflare)

Since this is for a hackathon and won't use Cloudflare:

1. **Frontend**: Deploy static build to:
   - GitHub Pages
   - Vercel
   - Netlify
   - Your own server

2. **Backend** (if needed): Use your own Node.js/Express server or serverless functions

3. **Piston API**: Use public API directly (no backend required for code execution)

4. **No KV Storage**: Store files in browser localStorage instead

5. **Build Command**:
   ```bash
   npm run build
   # Output in dist/ folder
   ```

---

## Quick Start Commands

```bash
# Create project
npm create vite@latest my-code-editor -- --template react-ts

# Install dependencies
npm install @monaco-editor/react zustand axios

# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

---

## References

- **Monaco Editor**: https://github.com/microsoft/monaco-editor
- **Piston API Docs**: https://emkc.org/api/v2/piston
- **Piston GitHub**: https://github.com/engineer-man/piston
- **React Documentation**: https://react.dev
- **Zustand Documentation**: https://github.com/pmndrs/zustand
- **Vite Documentation**: https://vitejs.dev

---

**Last Updated**: January 15, 2026
**For Hackathon Projects**: Use this guide as a blueprint for your implementation.
