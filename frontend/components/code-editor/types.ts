/**
 * Type definitions for code editor and execution
 */

export interface CodeOutput {
  success: boolean;
  language: string;
  output: string;
  error: string;
  exit_code: number;
  compile_output?: string;
  compile_error?: string;
  execution_time: string;
  execution_method: "piston" | "wasm";
  execution_duration_ms?: number;
}

export interface ExecutionResult {
  output: string;
  error: string;
  exitCode: number;
}

export interface LanguageInfo {
  name: string;
  version: string;
  extension: string;
  supported_on_wasm: boolean;
}

export interface WasmContext {
  type: string;
  language: string;
  timestamp: string;
  code: string;
  stdin: string;
  execution_script: string;
  sandbox_config: {
    timeout: number;
    memory_limit: number;
    network_access: boolean;
    file_system_access: boolean;
  };
}
