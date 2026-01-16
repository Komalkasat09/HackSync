/**
 * Code Editor Utilities
 * Helper functions for code execution and validation
 */

import axios from "axios";
import { CodeOutput } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Execute code on the backend using Piston API
 */
export async function executeCodeOnServer(
  code: string,
  language: string,
  stdin?: string,
  useWasm: boolean = true
): Promise<CodeOutput> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/code/execute`, {
      language,
      code,
      stdin,
      use_wasm: useWasm,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || error.message || "Failed to execute code"
    );
  }
}

/**
 * Get list of available languages
 */
export async function getAvailableLanguages() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/code/languages`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch available languages:", error);
    return { languages: {} };
  }
}

/**
 * Validate code before execution
 */
export async function validateCode(language: string, code: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/code/validate`, {
      language,
      code,
    });

    return response.data;
  } catch (error: any) {
    return {
      is_valid: false,
      error_message: error.message,
    };
  }
}

/**
 * Get WASM execution context for browser-side execution
 */
export async function getWasmExecutionContext(
  language: string,
  code: string,
  stdin?: string
) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/code/wasm-context`, {
      language,
      code,
      stdin,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || error.message || "Failed to get WASM context"
    );
  }
}

/**
 * Execute code in browser using WASM (QuickJS for JS, Pyodide for Python)
 */
export async function executeCodeInBrowser(
  code: string,
  language: string
): Promise<{ output: string; error: string; exitCode: number }> {
  if (language === "javascript") {
    return executeJavaScriptInBrowser(code);
  } else if (language === "python") {
    return executePythonInBrowser(code);
  } else {
    throw new Error(`WASM execution not supported for ${language}`);
  }
}

/**
 * Execute JavaScript using QuickJS in browser
 */
async function executeJavaScriptInBrowser(code: string) {
  try {
    // Capture console output
    let output = "";
    const originalLog = console.log;
    console.log = (...args) => {
      output += args.join(" ") + "\n";
    };

    // Execute code in try-catch
    try {
      const result = eval(code);
      if (result !== undefined) {
        output += String(result) + "\n";
      }
    } catch (e: any) {
      return {
        output,
        error: e.message || String(e),
        exitCode: 1,
      };
    } finally {
      console.log = originalLog;
    }

    return {
      output,
      error: "",
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      output: "",
      error: error.message,
      exitCode: 1,
    };
  }
}

/**
 * Execute Python using Pyodide in browser
 */
async function executePythonInBrowser(code: string) {
  try {
    // Check if Pyodide is available
    if (typeof (window as any).pyodide === "undefined") {
      throw new Error("Pyodide not loaded. Please ensure the script is available.");
    }

    const pyodide = (window as any).pyodide;
    let output = "";
    let error = "";

    try {
      // Wrap code to capture output
      const wrappedCode = `
import sys
from io import StringIO

old_stdout = sys.stdout
old_stderr = sys.stderr
sys.stdout = mystdout = StringIO()
sys.stderr = mystderr = StringIO()

try:
    ${code.split("\n").join("\n    ")}
except Exception as e:
    print(f"Error: {{e}}", file=sys.stderr)

sys.stdout = old_stdout
sys.stderr = old_stderr
stdout_output = mystdout.getvalue()
stderr_output = mystderr.getvalue()
print("__STDOUT__")
print(stdout_output)
print("__STDERR__")
print(stderr_output)
`;

      const result = await pyodide.runPythonAsync(wrappedCode);
      const parts = result.split("__STDOUT__\n");
      if (parts.length > 1) {
        const stdoutPart = parts[1].split("__STDERR__\n");
        output = stdoutPart[0].trim();
        error = stdoutPart[1]?.trim() || "";
      }
    } catch (e: any) {
      error = e.message || String(e);
    }

    return {
      output,
      error,
      exitCode: error ? 1 : 0,
    };
  } catch (error: any) {
    return {
      output: "",
      error: error.message,
      exitCode: 1,
    };
  }
}

/**
 * Format execution result for display
 */
export function formatExecutionResult(result: CodeOutput): string {
  let formatted = "";

  if (result.output) {
    formatted += "OUTPUT:\n" + result.output + "\n";
  }

  if (result.error) {
    formatted += "ERROR:\n" + result.error + "\n";
  }

  if (result.compile_error) {
    formatted += "COMPILE ERROR:\n" + result.compile_error + "\n";
  }

  formatted += `\nExit Code: ${result.exit_code}`;
  formatted += `\nExecution Method: ${result.execution_method}`;

  return formatted;
}

/**
 * Check if code is too large
 */
export function isCodeTooLarge(code: string, maxSize: number = 1000000): boolean {
  return code.length > maxSize;
}

/**
 * Get memory usage warning if code is large
 */
export function getCodeSizeWarning(code: string): string | null {
  const size = code.length;
  const megabyte = 1024 * 1024;

  if (size > 500000) {
    return `Code size is ${(size / 1024).toFixed(1)}KB - execution might be slow`;
  }

  if (size > 1000000) {
    return `Code size exceeds 1MB limit`;
  }

  return null;
}
