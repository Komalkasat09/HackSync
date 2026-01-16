"""
Piston API service for code execution with fallback to WASM
Supports multiple programming languages
"""

import aiohttp
import asyncio
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Piston API configuration
PISTON_API_URL = "https://api.piston.codes/v1/execute"

# Language runtime mappings
LANGUAGE_RUNTIMES = {
    "python": {"language": "python", "version": "3.10.0"},
    "javascript": {"language": "javascript", "version": "18.15.0"},
    "typescript": {"language": "typescript", "version": "5.0.3"},
    "java": {"language": "java", "version": "15.0.6"},
    "cpp": {"language": "cpp", "version": "10.2.0"},
    "c": {"language": "c", "version": "10.2.0"},
    "csharp": {"language": "csharp", "version": "10.2.0"},
    "go": {"language": "go", "version": "1.16.2"},
    "rust": {"language": "rust", "version": "1.56.1"},
    "ruby": {"language": "ruby", "version": "3.0.1"},
    "php": {"language": "php", "version": "7.4.15"},
    "swift": {"language": "swift", "version": "5.3.3"},
    "kotlin": {"language": "kotlin", "version": "1.6.255"},
}

TIMEOUT = 30  # seconds


class CodeExecutionError(Exception):
    """Custom exception for code execution errors"""
    pass


class PistonService:
    """Service to execute code using Piston API"""

    @staticmethod
    async def execute_code(
        language: str,
        code: str,
        stdin: Optional[str] = None,
        timeout: int = TIMEOUT,
    ) -> Dict[str, Any]:
        """
        Execute code using Piston API with proper error handling

        Args:
            language: Programming language (python, javascript, etc.)
            code: Source code to execute
            stdin: Standard input for the program
            timeout: Execution timeout in seconds

        Returns:
            Dict containing output, error, exit_code, and execution_time

        Raises:
            CodeExecutionError: If execution fails
        """
        if language not in LANGUAGE_RUNTIMES:
            raise CodeExecutionError(
                f"Unsupported language: {language}. "
                f"Supported: {', '.join(LANGUAGE_RUNTIMES.keys())}"
            )

        try:
            runtime = LANGUAGE_RUNTIMES[language]

            payload = {
                "language": runtime["language"],
                "version": runtime["version"],
                "files": [{"name": f"main.{PistonService._get_file_extension(language)}", "content": code}],
                "stdin": stdin or "",
            }

            logger.info(f"Executing {language} code via Piston API")

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    PISTON_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Piston API error: {response.status} - {error_text}")
                        raise CodeExecutionError(f"Piston API error: {error_text}")

                    result = await response.json()

                    return {
                        "success": True,
                        "language": language,
                        "output": result.get("run", {}).get("stdout", ""),
                        "error": result.get("run", {}).get("stderr", ""),
                        "exit_code": result.get("run", {}).get("code", 0),
                        "compile_output": result.get("compile", {}).get("stdout", ""),
                        "compile_error": result.get("compile", {}).get("stderr", ""),
                        "execution_time": datetime.now().isoformat(),
                    }

        except aiohttp.ClientError as e:
            logger.error(f"Network error connecting to Piston API: {str(e)}")
            raise CodeExecutionError(f"Network error: {str(e)}")
        except asyncio.TimeoutError:
            logger.error(f"Piston API execution timeout after {timeout}s")
            raise CodeExecutionError(f"Code execution timeout after {timeout}s")
        except Exception as e:
            logger.error(f"Unexpected error during code execution: {str(e)}")
            raise CodeExecutionError(f"Execution error: {str(e)}")

    @staticmethod
    def _get_file_extension(language: str) -> str:
        """Get file extension for a given language"""
        extensions = {
            "python": "py",
            "javascript": "js",
            "typescript": "ts",
            "java": "java",
            "cpp": "cpp",
            "c": "c",
            "csharp": "cs",
            "go": "go",
            "rust": "rs",
            "ruby": "rb",
            "php": "php",
            "swift": "swift",
            "kotlin": "kt",
        }
        return extensions.get(language, "txt")

    @staticmethod
    async def get_runtimes() -> Dict[str, Any]:
        """
        Fetch available runtimes from Piston API

        Returns:
            Dict of available languages and versions
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://api.piston.codes/v1/runtimes", timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.warning("Failed to fetch runtimes from Piston API")
                        return {"runtimes": []}
        except Exception as e:
            logger.error(f"Error fetching runtimes: {str(e)}")
            return {"runtimes": []}

    @staticmethod
    def validate_code(language: str, code: str) -> tuple[bool, Optional[str]]:
        """
        Basic code validation

        Args:
            language: Programming language
            code: Source code

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not code or not code.strip():
            return False, "Code cannot be empty"

        if len(code) > 1000000:  # 1MB limit
            return False, "Code size exceeds maximum limit (1MB)"

        # Basic syntax check for obvious issues
        if language == "python":
            if code.count("'''") % 2 != 0 or code.count('"""') % 2 != 0:
                return False, "Unclosed multi-line string in Python code"

        return True, None
