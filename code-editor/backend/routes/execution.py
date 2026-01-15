from fastapi import APIRouter, HTTPException
from models.schemas import ExecutionRequest, ExecutionResponse
from services.piston_service import PistonService
from services.file_service import HistoryService

router = APIRouter()

@router.post("/execute", response_model=ExecutionResponse)
async def execute_code(request: ExecutionRequest):
    """Execute code using Piston API"""
    try:
        result = await PistonService.execute_code(
            language=request.language,
            version=request.version,
            source=request.source,
            stdin=request.stdin,
            args=request.args
        )
        
        # Save to history
        HistoryService.add_execution(
            language=request.language,
            version=request.version,
            source=request.source,
            stdin=request.stdin,
            stdout=result["stdout"],
            stderr=result["stderr"],
            code=result["code"],
            execution_time=result.get("execution_time")
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runtimes")
async def get_runtimes():
    """Get available runtimes from Piston API"""
    return await PistonService.get_runtimes()

@router.get("/history")
async def get_execution_history(limit: int = 50):
    """Get execution history"""
    return HistoryService.get_history(limit=limit)
