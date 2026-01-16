"""
WASM-based code execution fallback for browser-side execution
Supports Python and JavaScript using QuickJS and Pyodide
"""

import json
import logging
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


class WasmLanguage(Enum):
    """Supported WASM execution languages"""
    JAVASCRIPT = "javascript"
    PYTHON = "python"


class WasmExecutor:
    """
    WASM executor for fallback code execution
    This provides JavaScript/Python execution instructions for browser-side execution
    using QuickJS for JS and Pyodide for Python
    """

    # WASM module URLs (CDN hosted)
    QUICKJS_URL = "https://cdn.jsdelivr.net/npm/@wasmer/quickjs/lib/index.js"
    PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.24.0/full/pyodide.js"

    @staticmethod
    def get_js_executor_code(code: str, stdin: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate JavaScript executor code for WASM execution

        Args:
            code: JavaScript code to execute
            stdin: Standard input

        Returns:
            Dict with executor configuration for browser
        """
        return {
            "type": "wasm",
            "language": "javascript",
            "executor": "quickjs",
            "module_url": WasmExecutor.QUICKJS_URL,
            "code": code,
            "stdin": stdin or "",
            "execution_context": {
                "timeout": 30000,  # 30 seconds in ms
                "memory_limit": 268435456,  # 256MB
            },
            "instructions": """
// Load QuickJS via WASM
import { newQuickJSAsyncRuntime } from '{module_url}';

async function executeCode() {
    const runtime = await newQuickJSAsyncRuntime();
    const result = runtime.evalCode(`
        let __output = '';
        const console_log = console.log;
        console.log = function(...args) {
            __output += args.join(' ') + '\\n';
        };
        ${code}
        __output;
    `);
    runtime.dispose();
    return result;
}
            """,
        }

    @staticmethod
    def get_python_executor_code(code: str, stdin: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate Python executor code for WASM execution using Pyodide

        Args:
            code: Python code to execute
            stdin: Standard input

        Returns:
            Dict with executor configuration for browser
        """
        return {
            "type": "wasm",
            "language": "python",
            "executor": "pyodide",
            "module_url": WasmExecutor.PYODIDE_URL,
            "code": code,
            "stdin": stdin or "",
            "execution_context": {
                "timeout": 30000,  # 30 seconds in ms
                "memory_limit": 268435456,  # 256MB
            },
            "instructions": """
// Load Pyodide for Python execution
async function executePythonCode() {
    let pyodide = await loadPyodide();
    
    const wrappedCode = `
import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

try:
    ${code}
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)

sys.stdout = old_stdout
output = mystdout.getvalue()
print(output)
    `;
    
    const result = await pyodide.runPythonAsync(wrappedCode);
    return result;
}
            """,
        }

    @staticmethod
    def get_fallback_executor(language: str, code: str, stdin: Optional[str] = None) -> Dict[str, Any]:
        """
        Get appropriate WASM executor configuration based on language

        Args:
            language: Programming language (javascript, python)
            code: Source code
            stdin: Standard input

        Returns:
            Dict with executor configuration

        Raises:
            ValueError: If language is not supported
        """
        if language == "javascript":
            return WasmExecutor.get_js_executor_code(code, stdin)
        elif language == "python":
            return WasmExecutor.get_python_executor_code(code, stdin)
        else:
            raise ValueError(f"WASM execution not supported for {language}")

    @staticmethod
    def get_browser_execution_script(language: str) -> str:
        """
        Get browser-executable script for code execution
        This script is meant to be sent to frontend for execution

        Args:
            language: Programming language

        Returns:
            JavaScript code for browser execution
        """
        if language == "javascript":
            return """
(async function() {
    try {
        const { newQuickJSAsyncRuntime } = await import('https://cdn.jsdelivr.net/npm/@wasmer/quickjs');
        const runtime = await newQuickJSAsyncRuntime();
        
        let output = '';
        const originalLog = console.log;
        console.log = (...args) => {
            output += args.join(' ') + '\\n';
        };
        
        const result = await runtime.evalCode(userCode);
        console.log = originalLog;
        
        return { success: true, output, error: null };
    } catch (error) {
        return { success: false, output: '', error: error.message };
    }
})();
            """
        elif language == "python":
            return """
(async function() {
    try {
        const pyodide = await loadPyodide();
        
        const code = `
import sys
from io import StringIO

captured_output = StringIO()
sys.stdout = captured_output

${userCode}

sys.stdout = sys.__stdout__
print(captured_output.getvalue())
        `;
        
        const result = await pyodide.runPythonAsync(code);
        return { success: true, output: result, error: null };
    } catch (error) {
        return { success: false, output: '', error: error.message };
    }
})();
            """
        else:
            raise ValueError(f"WASM script not supported for {language}")

    @staticmethod
    def create_execution_context(
        language: str, code: str, stdin: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create complete execution context for browser

        Args:
            language: Programming language
            code: Source code
            stdin: Standard input

        Returns:
            Complete execution context
        """
        return {
            "type": "wasm-fallback",
            "language": language,
            "timestamp": datetime.now().isoformat(),
            "code": code,
            "stdin": stdin or "",
            "execution_script": WasmExecutor.get_browser_execution_script(language),
            "sandbox_config": {
                "timeout": 30000,
                "memory_limit": 256 * 1024 * 1024,  # 256MB
                "network_access": False,
                "file_system_access": False,
            },
        }
