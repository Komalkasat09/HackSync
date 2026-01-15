from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExecutionRequest(BaseModel):
    language: str
    version: str
    source: str
    stdin: Optional[str] = ""
    args: Optional[List[str]] = []

class ExecutionResponse(BaseModel):
    stdout: str
    stderr: str
    output: str
    code: int
    signal: Optional[str] = None
    execution_time: Optional[float] = None

class FileCreate(BaseModel):
    name: str
    content: str
    language: str

class FileUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None

class FileResponse(BaseModel):
    id: str
    name: str
    content: str
    language: str
    created_at: datetime
    updated_at: datetime

class ExecutionHistoryItem(BaseModel):
    id: str
    language: str
    version: str
    source: str
    stdin: str
    stdout: str
    stderr: str
    code: int
    executed_at: datetime
    execution_time: Optional[float] = None
