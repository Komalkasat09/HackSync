/**
 * Code Execution Output Component
 * Displays execution results, errors, and performance metrics
 */

"use client";

import React from "react";
import { AlertCircle, CheckCircle, Clock, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface CodeExecutionOutputProps {
  output: CodeOutput | null;
  isLoading?: boolean;
  error?: string;
}

export const CodeExecutionOutput: React.FC<CodeExecutionOutputProps> = ({
  output,
  isLoading = false,
  error,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 min-h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-300">Executing code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 border border-red-700 bg-red-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-500">Execution Error</h3>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 min-h-32 flex items-center justify-center text-slate-500">
        <span>Execute code to see output</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <Tabs defaultValue="output" className="w-full">
        <TabsList className="bg-slate-800 border-b border-slate-700 rounded-none w-full justify-start">
          <TabsTrigger value="output" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500">
            Output
          </TabsTrigger>
          {output.error && (
            <TabsTrigger value="error" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-red-500">
              Error
            </TabsTrigger>
          )}
          {output.compile_error && (
            <TabsTrigger value="compile-error" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-yellow-500">
              Compile Error
            </TabsTrigger>
          )}
          <TabsTrigger value="details" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 ml-auto">
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {output.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={output.success ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
                {output.success ? "Success" : "Failed"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(output.output)}
              className="text-slate-400 hover:text-slate-200"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="bg-slate-950 rounded p-3 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-auto max-h-64 border border-slate-700">
            {output.output || "(No output)"}
          </div>
        </TabsContent>

        {output.error && (
          <TabsContent value="error" className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-red-500 font-semibold">Standard Error</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(output.error)}
                className="text-slate-400 hover:text-slate-200"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="bg-slate-950 rounded p-3 font-mono text-sm text-red-400 whitespace-pre-wrap overflow-auto max-h-64 border border-red-700/30">
              {output.error}
            </div>
          </TabsContent>
        )}

        {output.compile_error && (
          <TabsContent value="compile-error" className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-yellow-500 font-semibold">Compilation Error</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(output.compile_error || "")}
                className="text-slate-400 hover:text-slate-200"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="bg-slate-950 rounded p-3 font-mono text-sm text-yellow-400 whitespace-pre-wrap overflow-auto max-h-64 border border-yellow-700/30">
              {output.compile_error}
            </div>
          </TabsContent>
        )}

        <TabsContent value="details" className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded p-3">
              <span className="text-slate-400 text-xs">Exit Code</span>
              <p className="text-2xl font-mono font-bold text-slate-200 mt-1">{output.exit_code}</p>
            </div>
            <div className="bg-slate-800 rounded p-3">
              <span className="text-slate-400 text-xs">Execution Method</span>
              <p className="text-lg font-semibold text-blue-400 mt-1 uppercase">{output.execution_method}</p>
            </div>
            {output.execution_duration_ms && (
              <div className="bg-slate-800 rounded p-3 col-span-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400 text-xs">Execution Time</span>
                </div>
                <p className="text-lg font-mono font-bold text-slate-200 mt-1">{output.execution_duration_ms}ms</p>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-slate-800 rounded text-xs text-slate-400">
            <span>Executed at: {new Date(output.execution_time).toLocaleString()}</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodeExecutionOutput;
