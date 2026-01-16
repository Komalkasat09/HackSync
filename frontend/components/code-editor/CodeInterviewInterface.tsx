/**
 * Complete Code Interview Interface
 * Combines Monaco editor with execution output and console
 */

"use client";

import React, { useState, useCallback } from "react";
import axios from "axios";
import { CodeEditor } from "./CodeEditor";
import { CodeExecutionOutput } from "./CodeExecutionOutput";
import { useToast } from "@/hooks/use-toast";

interface CodeOutput {
  success: boolean;
  output: string;
  error: string;
  exit_code: number;
  execution_time: string;
  execution_method: string;
  execution_duration_ms?: number;
  compile_output?: string;
  compile_error?: string;
}

interface CodeInterviewInterfaceProps {
  onCodeSubmit?: (code: string, language: string, result: CodeOutput) => void;
  defaultLanguage?: string;
  readOnly?: boolean;
  showLanguageSelector?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const CodeInterviewInterface: React.FC<CodeInterviewInterfaceProps> = ({
  onCodeSubmit,
  defaultLanguage = "python",
  readOnly = false,
  showLanguageSelector = true,
}) => {
  const [code, setCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [output, setOutput] = useState<CodeOutput | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExecuteCode = useCallback(
    async (sourceCode: string, language: string) => {
      setIsExecuting(true);
      setError(null);
      setOutput(null);

      try {
        const startTime = performance.now();

        const response = await axios.post(
          `${API_BASE_URL}/api/code/execute`,
          {
            language,
            code: sourceCode,
            use_wasm: true, // Enable WASM fallback
          },
          {
            timeout: 35000, // 35 second timeout (including 30s execution + overhead)
          }
        );

        const executionDuration = Math.round(performance.now() - startTime);

        const result: CodeOutput = {
          ...response.data,
          execution_duration_ms: executionDuration,
        };

        setOutput(result);
        setCurrentLanguage(language);

        if (result.success) {
          toast({
            title: "Code Executed Successfully",
            description: `Execution completed in ${executionDuration}ms using ${result.execution_method}`,
          });
        } else {
          toast({
            title: "Code Execution Error",
            description: result.error || "Unknown error occurred",
            variant: "destructive",
          });
        }

        onCodeSubmit?.(sourceCode, language, result);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || "Failed to execute code";
        setError(errorMessage);

        toast({
          title: "Execution Failed",
          description: errorMessage,
          variant: "destructive",
        });

        console.error("Code execution error:", err);
      } finally {
        setIsExecuting(false);
      }
    },
    [onCodeSubmit, toast]
  );

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      {/* Editor Section */}
      <div className="flex-1 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-slate-200">Code Editor</h3>
        <CodeEditor
          language={currentLanguage}
          value={code}
          onChange={handleCodeChange}
          onExecute={handleExecuteCode}
          isExecuting={isExecuting}
          readOnly={readOnly}
          showLanguageSelector={showLanguageSelector}
          showExecuteButton={true}
          defaultLanguage={defaultLanguage}
        />
      </div>

      {/* Output Section */}
      <div className="flex-1 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-slate-200">Output</h3>
        <CodeExecutionOutput output={output} isLoading={isExecuting} error={error} />
      </div>

      {/* Sidebar Info */}
      <div className="bg-slate-800 rounded p-3 text-sm text-slate-400 border border-slate-700">
        <p>
          <strong>Note:</strong> Code execution is powered by Piston API with WASM fallback for JavaScript and Python.
          Maximum execution time: 30 seconds.
        </p>
      </div>
    </div>
  );
};

export default CodeInterviewInterface;
