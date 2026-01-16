"""
Pydantic schemas for code execution requests and responses
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from enum import Enum


class LanguageEnum(str, Enum):
    """Supported programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    GO = "go"
    RUST = "rust"
    RUBY = "ruby"
    PHP = "php"
    SWIFT = "swift"
    KOTLIN = "kotlin"


class CodeExecutionRequest(BaseModel):
    """Request to execute code"""
    language: LanguageEnum = Field(..., description="Programming language")
    code: str = Field(..., description="Source code to execute", min_length=1, max_length=1000000)
    stdin: Optional[str] = Field(None, description="Standard input for the program")
    use_wasm: bool = Field(False, description="Use WASM fallback if Piston fails")

    @validator("code")
    def code_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Code cannot be empty")
        return v


class CodeExecutionResponse(BaseModel):
    """Response from code execution"""
    success: bool = Field(..., description="Whether execution was successful")
    language: str = Field(..., description="Programming language used")
    output: str = Field(default="", description="Standard output")
    error: str = Field(default="", description="Standard error output")
    exit_code: int = Field(default=0, description="Process exit code")
    compile_output: Optional[str] = Field(None, description="Compiler output (if applicable)")
    compile_error: Optional[str] = Field(None, description="Compiler error (if applicable)")
    execution_time: str = Field(..., description="ISO format timestamp of execution")
    execution_method: str = Field("piston", description="Execution method used (piston/wasm)")
    execution_duration_ms: Optional[int] = Field(None, description="Execution duration in milliseconds")


class WasmExecutionContext(BaseModel):
    """WASM execution context for browser-side execution"""
    type: str = Field("wasm-fallback", description="Execution context type")
    language: str = Field(..., description="Programming language")
    timestamp: str = Field(..., description="ISO format timestamp")
    code: str = Field(..., description="Code to execute")
    stdin: str = Field(default="", description="Standard input")
    execution_script: str = Field(..., description="JavaScript execution script")
    sandbox_config: Dict[str, Any] = Field(..., description="Sandbox configuration")


class CodeValidationRequest(BaseModel):
    """Request to validate code"""
    language: LanguageEnum = Field(..., description="Programming language")
    code: str = Field(..., description="Code to validate")


class CodeValidationResponse(BaseModel):
    """Response from code validation"""
    is_valid: bool = Field(..., description="Whether code is valid")
    error_message: Optional[str] = Field(None, description="Validation error message")


class LanguageInfo(BaseModel):
    """Information about a supported language"""
    name: str = Field(..., description="Language name")
    version: str = Field(..., description="Runtime version")
    extension: str = Field(..., description="File extension")
    supported_on_wasm: bool = Field(..., description="Supported via WASM fallback")


class AvailableLanguagesResponse(BaseModel):
    """Response listing all available languages"""
    languages: Dict[str, LanguageInfo] = Field(..., description="Available languages")


class CodeExecutionHistoryItem(BaseModel):
    """Individual code execution history item"""
    id: str = Field(..., description="Unique execution ID")
    language: str = Field(..., description="Programming language")
    code: str = Field(..., description="Executed code")
    output: str = Field(..., description="Execution output")
    error: str = Field(..., description="Execution error")
    exit_code: int = Field(..., description="Exit code")
    execution_time: str = Field(..., description="Execution timestamp")
    execution_method: str = Field(..., description="Execution method (piston/wasm)")


class CodeExecutionHistory(BaseModel):
    """Code execution history for a user"""
    user_id: str = Field(..., description="User ID")
    executions: List[CodeExecutionHistoryItem] = Field(..., description="Execution history")
    total_count: int = Field(..., description="Total number of executions")
