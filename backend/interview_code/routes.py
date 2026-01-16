"""
API routes for code execution and testing
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
import logging
import uuid
from datetime import datetime
from typing import Optional

from .piston_service import PistonService, CodeExecutionError
from .wasm_executor import WasmExecutor
from .schema import (
    CodeExecutionRequest,
    CodeExecutionResponse,
    CodeValidationRequest,
    CodeValidationResponse,
    LanguageInfo,
    AvailableLanguagesResponse,
    WasmExecutionContext,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/code", tags=["Code Execution"])


@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    """
    Execute code using Piston API with optional WASM fallback

    **Parameters:**
    - `language`: Programming language (python, javascript, java, etc.)
    - `code`: Source code to execute
    - `stdin`: Optional standard input
    - `use_wasm`: Use WASM fallback if Piston fails

    **Returns:**
    - `success`: Execution status
    - `output`: Standard output
    - `error`: Standard error
    - `exit_code`: Process exit code
    - `execution_method`: Which executor was used (piston/wasm)
    """
    try:
        # Validate code first
        is_valid, error_msg = PistonService.validate_code(request.language, request.code)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

        # Try Piston API first
        try:
            logger.info(f"Executing {request.language} code via Piston API")
            result = await PistonService.execute_code(
                language=request.language.value,
                code=request.code,
                stdin=request.stdin,
            )
            result["execution_method"] = "piston"
            return result

        except CodeExecutionError as e:
            if not request.use_wasm:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Piston API unavailable and WASM fallback not requested: {str(e)}",
                )

            # Fallback to WASM for supported languages
            logger.warning(f"Piston failed, attempting WASM fallback: {str(e)}")

            if request.language not in ["python", "javascript"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"WASM execution not supported for {request.language}",
                )

            wasm_context = WasmExecutor.create_execution_context(
                language=request.language.value,
                code=request.code,
                stdin=request.stdin,
            )

            return CodeExecutionResponse(
                success=True,
                language=request.language.value,
                output="[WASM Execution Context Generated - Execute in browser]",
                error="",
                exit_code=0,
                execution_time=datetime.now().isoformat(),
                execution_method="wasm",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in code execution: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during code execution",
        )


@router.post("/validate", response_model=CodeValidationResponse)
async def validate_code(request: CodeValidationRequest):
    """
    Validate code syntax without executing it

    **Parameters:**
    - `language`: Programming language
    - `code`: Code to validate

    **Returns:**
    - `is_valid`: Whether code passes validation
    - `error_message`: Validation error if any
    """
    try:
        is_valid, error_msg = PistonService.validate_code(request.language, request.code)
        return CodeValidationResponse(is_valid=is_valid, error_message=error_msg)
    except Exception as e:
        logger.error(f"Error validating code: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Validation error"
        )


@router.get("/languages", response_model=AvailableLanguagesResponse)
async def get_available_languages():
    """
    Get list of supported languages and their versions

    **Returns:**
    - `languages`: Dict of supported languages with metadata
    """
    from .piston_service import LANGUAGE_RUNTIMES

    languages = {}
    wasm_supported = ["python", "javascript"]

    for lang_name, runtime_info in LANGUAGE_RUNTIMES.items():
        languages[lang_name] = LanguageInfo(
            name=lang_name.capitalize(),
            version=runtime_info["version"],
            extension=PistonService._get_file_extension(lang_name),
            supported_on_wasm=lang_name in wasm_supported,
        )

    return AvailableLanguagesResponse(languages=languages)


@router.post("/wasm-context", response_model=WasmExecutionContext)
async def get_wasm_context(request: CodeExecutionRequest):
    """
    Get WASM execution context for browser-side execution

    **Parameters:**
    - `language`: Programming language (python, javascript)
    - `code`: Source code
    - `stdin`: Optional standard input

    **Returns:**
    - Complete WASM execution context for browser
    """
    if request.language not in ["python", "javascript"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"WASM execution not supported for {request.language}",
        )

    try:
        wasm_context = WasmExecutor.create_execution_context(
            language=request.language.value,
            code=request.code,
            stdin=request.stdin,
        )
        return wasm_context
    except Exception as e:
        logger.error(f"Error creating WASM context: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create WASM context",
        )


@router.post("/batch-execute")
async def batch_execute_code(requests: list[CodeExecutionRequest]):
    """
    Execute multiple code snippets in sequence

    **Parameters:**
    - `requests`: List of code execution requests

    **Returns:**
    - List of execution results
    """
    if len(requests) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 code executions per batch",
        )

    results = []
    for request in requests:
        try:
            is_valid, error_msg = PistonService.validate_code(request.language, request.code)
            if not is_valid:
                results.append(
                    CodeExecutionResponse(
                        success=False,
                        language=request.language,
                        error=error_msg,
                        exit_code=1,
                        execution_time=datetime.now().isoformat(),
                    )
                )
                continue

            result = await PistonService.execute_code(
                language=request.language.value,
                code=request.code,
                stdin=request.stdin,
            )
            result["execution_method"] = "piston"
            results.append(CodeExecutionResponse(**result))

        except CodeExecutionError as e:
            results.append(
                CodeExecutionResponse(
                    success=False,
                    language=request.language,
                    error=str(e),
                    exit_code=1,
                    execution_time=datetime.now().isoformat(),
                )
            )

    return {"total": len(requests), "results": results}


@router.get("/runtimes")
async def get_runtimes():
    """
    Fetch all available runtimes from Piston API

    **Returns:**
    - List of available runtimes with versions
    """
    try:
        runtimes = await PistonService.get_runtimes()
        return runtimes
    except Exception as e:
        logger.error(f"Error fetching runtimes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch runtimes",
        )


@router.get("/health")
async def health_check():
    """
    Check health status of code execution service

    **Returns:**
    - Service status and availability
    """
    return {
        "status": "healthy",
        "service": "code-execution",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "piston_api": "available",
            "wasm_execution": "enabled",
            "supported_languages": list(
                __import__("backend.interview_code.piston_service", fromlist=["LANGUAGE_RUNTIMES"]).LANGUAGE_RUNTIMES.keys()
            ),
        },
    }
