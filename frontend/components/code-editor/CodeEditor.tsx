/**
 * Monaco Code Editor Component
 * Provides a professional code editing interface without auto-completion
 * Supports multiple programming languages
 * 
 * Features:
 * - No auto-completion (configured)
 * - Syntax highlighting
 * - Theme support (light/dark)
 * - Line numbers, word wrap
 * - Minimap
 * - Multiple languages
 */

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play, Copy, X, Download } from "lucide-react";

interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string) => void;
  onExecute?: (code: string, language: string) => void;
  isExecuting?: boolean;
  theme?: "light" | "dark";
  readOnly?: boolean;
  height?: string;
  showLanguageSelector?: boolean;
  showExecuteButton?: boolean;
  defaultLanguage?: string;
}

const SUPPORTED_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
];

const CODE_SAMPLES: Record<string, string> = {
  python: '# Python Example\nprint("Hello, World!")\nfor i in range(5):\n    print(i)',
  javascript: '// JavaScript Example\nconsole.log("Hello, World!");\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}',
  typescript: '// TypeScript Example\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);',
  java: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
  c: '#include <stdio.h>\nint main() {\n    printf("Hello, World!");\n    return 0;\n}',
  csharp: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
  go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
  rust: 'fn main() {\n    println!("Hello, World!");\n}',
  ruby: 'puts "Hello, World!"\n(0..4).each { |i| puts i }',
  php: '<?php\necho "Hello, World!";\nfor ($i = 0; $i < 5; $i++) {\n    echo $i;\n}\n?>',
  swift: 'import Foundation\nprint("Hello, World!")',
  kotlin: 'fun main() {\n    println("Hello, World!")\n    for (i in 0..4) {\n        println(i)\n    }\n}',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language = "python",
  value = CODE_SAMPLES.python || "",
  onChange,
  onExecute,
  isExecuting = false,
  theme = "dark",
  readOnly = false,
  height = "600px",
  showLanguageSelector = true,
  showExecuteButton = true,
  defaultLanguage = "python",
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [codeValue, setCodeValue] = useState(value);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco with NO auto-completion
    monaco.languages.registerCompletionItemProvider("*", {
      provideCompletionItems: () => ({
        suggestions: [],
      }),
    });

    // Disable all editor IntelliSense/AutoComplete features
    editor.updateOptions({
      quickSuggestions: {
        other: false,
        comments: false,
        strings: false,
      },
      parameterHints: {
        enabled: false,
      },
      hover: {
        enabled: false,
      },
      acceptSuggestionOnCommitCharacter: false,
    });
  };

  const handleCodeChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      setCodeValue(newValue);
      onChange?.(newValue);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    const sample = CODE_SAMPLES[newLanguage as keyof typeof CODE_SAMPLES];
    if (sample) {
      setCodeValue(sample);
      onChange?.(sample);
    }
  };

  const handleExecute = () => {
    if (onExecute && codeValue.trim()) {
      onExecute(codeValue, currentLanguage);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeValue);
  };

  const handleReset = () => {
    const sample = CODE_SAMPLES[currentLanguage as keyof typeof CODE_SAMPLES];
    if (sample) {
      setCodeValue(sample);
      onChange?.(sample);
    }
  };

  const handleDownloadCode = () => {
    const extension = getFileExtension(currentLanguage);
    const filename = `code.${extension}`;
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(codeValue));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col h-full gap-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-4 border border-slate-700">
      {/* Header with controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300">Language:</span>
          {showLanguageSelector && (
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value} className="text-white hover:bg-slate-700">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
            title="Copy code to clipboard"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
            title="Reset to sample code"
          >
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCode}
            className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </Button>

          {showExecuteButton && (
            <Button
              onClick={handleExecute}
              disabled={isExecuting || !codeValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 rounded-md border border-slate-600 overflow-hidden bg-slate-950">
        <Editor
          height={height}
          language={currentLanguage}
          value={codeValue}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            fontFamily: '"Fira Code", "Consolas", monospace',
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            readOnly: readOnly,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "blink",
            formatOnPaste: true,
            formatOnType: false,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoIndent: "keep",
            tabSize: 4,
            insertSpaces: true,
            rulers: [80, 120],
            // DISABLE AUTO-COMPLETE AND INTELLISENSE
            quickSuggestions: false,
            parameterHints: {
              enabled: false,
            },
            hover: {
              enabled: false,
            },
            acceptSuggestionOnCommitCharacter: false,
            acceptSuggestionOnEnter: "off",
            wordBasedSuggestions: "off",
            codeLens: false,
          }}
        />
      </div>

      {/* Info footer */}
      <div className="text-xs text-slate-400 flex justify-between">
        <span>Language: {currentLanguage.toUpperCase()}</span>
        <span>Lines: {codeValue.split("\n").length}</span>
        <span>Characters: {codeValue.length}</span>
      </div>
    </div>
  );
};

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: "py",
    javascript: "js",
    typescript: "ts",
    java: "java",
    cpp: "cpp",
    c: "c",
    csharp: "cs",
    go: "go",
    rust: "rs",
    ruby: "rb",
    php: "php",
    swift: "swift",
    kotlin: "kt",
  };
  return extensions[language] || "txt";
}

export default CodeEditor;
