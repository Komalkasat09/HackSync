# Interview Code Editor - Quick Reference Card

## 🚀 One-Minute Setup

### Backend
```python
# In backend/main.py
from backend.interview_code.routes import router as code_router
app.include_router(code_router)
```

### Frontend
```tsx
// In any page
import { CodeInterviewInterface } from "@/components/code-editor";

export default function Challenge() {
  return <CodeInterviewInterface defaultLanguage="python" />;
}
```

**That's it!** ✅

---

## 📝 Common Usage Patterns

### 1. Basic Editor
```tsx
<CodeEditor language="python" />
```

### 2. With Execution
```tsx
<CodeEditor 
  onExecute={(code, lang) => console.log(code, lang)} 
/>
```

### 3. Complete Interview Interface
```tsx
<CodeInterviewInterface
  defaultLanguage="python"
  onCodeSubmit={(code, lang, result) => {
    // Save to database
  }}
/>
```

### 4. Read-Only (For Review)
```tsx
<CodeEditor readOnly={true} value={userCode} />
```

### 5. Full-Page Interview
```tsx
export default function CodingInterview() {
  return (
    <div className="h-screen">
      <CodeInterviewInterface 
        defaultLanguage="cpp"
        onCodeSubmit={handleSubmit}
      />
    </div>
  );
}
```

---

## 🎮 UI Controls

| Action | Button | Shortcut |
|--------|--------|----------|
| Execute | Play ▶️ | Ctrl+Enter |
| Copy Code | 📋 | - |
| Reset | 🔄 | - |
| Download | ⬇️ | - |
| Change Language | Dropdown | - |

---

## 📊 Result Object Structure

```javascript
{
  success: true,
  language: "python",
  output: "Hello, World!\n",
  error: "",
  exit_code: 0,
  execution_time: "2024-01-16T10:30:00Z",
  execution_method: "piston",    // or "wasm"
  execution_duration_ms: 250,
  compile_output: "",            // optional
  compile_error: ""              // optional
}
```

---

## 💻 Supported Languages

| Language | Piston | WASM |
|----------|--------|------|
| Python | ✅ | ✅ |
| JavaScript | ✅ | ✅ |
| TypeScript | ✅ | ❌ |
| Java | ✅ | ❌ |
| C++ | ✅ | ❌ |
| C | ✅ | ❌ |
| C# | ✅ | ❌ |
| Go | ✅ | ❌ |
| Rust | ✅ | ❌ |
| Ruby | ✅ | ❌ |
| PHP | ✅ | ❌ |
| Swift | ✅ | ❌ |
| Kotlin | ✅ | ❌ |

---

## 🔌 API Quick Reference

### Execute Code
```bash
POST /api/code/execute
{
  "language": "python",
  "code": "print('test')",
  "use_wasm": true
}
```

### List Languages
```bash
GET /api/code/languages
```

### Validate Code
```bash
POST /api/code/validate
{
  "language": "python",
  "code": "print('test')"
}
```

### Health Check
```bash
GET /api/code/health
```

---

## ⚙️ Configuration

### Theme
```tsx
<CodeEditor theme="dark" />    // or "light"
```

### Height
```tsx
<CodeEditor height="500px" />
```

### Read-Only
```tsx
<CodeEditor readOnly={true} />
```

### Hide Elements
```tsx
<CodeEditor 
  showLanguageSelector={false}
  showExecuteButton={false}
/>
```

---

## 🛠️ Helper Functions

```typescript
import { 
  executeCodeOnServer,
  getAvailableLanguages,
  validateCode,
  executeCodeInBrowser,
  formatExecutionResult
} from "@/components/code-editor/utils";

// Execute on server
const result = await executeCodeOnServer(code, "python");

// Get available languages
const langs = await getAvailableLanguages();

// Validate code
const validation = await validateCode("python", code);

// Format result for display
const formatted = formatExecutionResult(result);
```

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Auto-complete showing | Use our CodeEditor component (has it disabled) |
| Piston API timeout | Increase code timeout or use simpler code |
| WASM not loading | Check internet, verify CDN accessibility |
| Component not displaying | Ensure @monaco-editor/react is installed |
| Routes not working | Add router include to main.py |
| TypeScript errors | Install @monaco-editor/react types |

---

## 📦 File Locations

```
Backend:
  backend/interview_code/
    ├── __init__.py
    ├── piston_service.py      (Code execution)
    ├── wasm_executor.py        (Browser fallback)
    ├── schema.py               (Validation)
    ├── routes.py               (API endpoints)
    └── README.md               (Full docs)

Frontend:
  frontend/components/code-editor/
    ├── CodeEditor.tsx          (Editor)
    ├── CodeExecutionOutput.tsx (Output)
    ├── CodeInterviewInterface.tsx (Complete)
    ├── utils.ts                (Helpers)
    ├── types.ts                (Types)
    └── index.ts                (Exports)

Docs:
  ├── INTERVIEW_CODE_INTEGRATION.md   (Setup guide)
  ├── INTERVIEW_CODE_MANIFEST.md      (File summary)
  └── backend/interview_code/README.md (Full docs)
```

---

## ✨ Key Features Checklist

- ✅ No auto-completion (by design)
- ✅ 13+ programming languages
- ✅ Piston API (cloud execution)
- ✅ WASM fallback (browser execution)
- ✅ Real-time output display
- ✅ Syntax highlighting
- ✅ Dark/light themes
- ✅ Code statistics
- ✅ Copy/Download buttons
- ✅ Error handling
- ✅ Timeout protection
- ✅ Full TypeScript support

---

## 🎯 Performance Limits

| Limit | Value |
|-------|-------|
| Code Size | 1 MB |
| Execution Time | 30 seconds |
| Memory (WASM) | 256 MB |
| Batch Limit | 10 codes |
| Timeout | 35 seconds |

---

## 📚 Documentation Quick Links

1. **Quick Start** → `INTERVIEW_CODE_INTEGRATION.md`
2. **Full Documentation** → `backend/interview_code/README.md`
3. **File Summary** → `INTERVIEW_CODE_MANIFEST.md`
4. **This Guide** → `INTERVIEW_CODE_QUICKREF.md`

---

## 💡 Example: Complete Interview Page

```tsx
"use client";

import { CodeInterviewInterface } from "@/components/code-editor";
import { useState } from "react";

export default function InterviewPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (code, language, result) => {
    console.log("Code submitted:", { code, language, result });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          Coding Interview
        </h1>
        
        {submitted && (
          <div className="bg-green-900 text-green-200 p-4 rounded mb-4">
            ✅ Code submitted successfully!
          </div>
        )}
        
        <CodeInterviewInterface
          defaultLanguage="python"
          onCodeSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
```

---

## 🔒 Security Summary

- ✅ Sandboxed execution
- ✅ 30-second timeout
- ✅ No file access
- ✅ No network access
- ✅ Input validation
- ✅ Memory limits

---

## 📞 Support Resources

- Check README files in each directory
- Review component props (TypeScript definitions)
- Look at example usage patterns
- Check API endpoints documentation

---

## 📈 Status

✅ **Complete & Production Ready**

- 2,400+ lines of code
- 800+ lines of documentation
- 13+ languages supported
- Piston API + WASM fallback
- Full error handling
- Type-safe (TypeScript)

---

**Last Updated:** January 16, 2026

**Version:** 1.0

**Status:** Production Ready ✅
