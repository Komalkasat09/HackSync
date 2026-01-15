from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import FileCreate, FileUpdate, FileResponse
from services.file_service import FileService

router = APIRouter()

@router.post("/files", response_model=FileResponse)
async def create_file(file: FileCreate):
    """Create a new file"""
    try:
        result = FileService.create_file(
            name=file.name,
            content=file.content,
            language=file.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files", response_model=List[FileResponse])
async def get_all_files():
    """Get all files"""
    return FileService.get_all_files()

@router.get("/files/{file_id}", response_model=FileResponse)
async def get_file(file_id: str):
    """Get a specific file"""
    file = FileService.get_file(file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@router.put("/files/{file_id}", response_model=FileResponse)
async def update_file(file_id: str, file_update: FileUpdate):
    """Update a file"""
    result = FileService.update_file(
        file_id=file_id,
        name=file_update.name,
        content=file_update.content,
        language=file_update.language
    )
    if not result:
        raise HTTPException(status_code=404, detail="File not found")
    return result

@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Delete a file"""
    success = FileService.delete_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted successfully"}
