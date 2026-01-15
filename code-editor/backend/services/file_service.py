import json
import os
from typing import List, Optional
from datetime import datetime
import uuid

DATA_DIR = "data"
FILES_JSON = os.path.join(DATA_DIR, "files.json")
HISTORY_JSON = os.path.join(DATA_DIR, "history.json")

class FileService:
    @staticmethod
    def _ensure_data_dir():
        """Ensure data directory exists"""
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)
    
    @staticmethod
    def _load_files() -> List[dict]:
        """Load files from JSON"""
        FileService._ensure_data_dir()
        if not os.path.exists(FILES_JSON):
            return []
        with open(FILES_JSON, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    @staticmethod
    def _save_files(files: List[dict]):
        """Save files to JSON"""
        FileService._ensure_data_dir()
        with open(FILES_JSON, 'w', encoding='utf-8') as f:
            json.dump(files, f, indent=2, ensure_ascii=False)
    
    @staticmethod
    def create_file(name: str, content: str, language: str) -> dict:
        """Create a new file"""
        files = FileService._load_files()
        file_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        new_file = {
            "id": file_id,
            "name": name,
            "content": content,
            "language": language,
            "created_at": now,
            "updated_at": now
        }
        
        files.append(new_file)
        FileService._save_files(files)
        return new_file
    
    @staticmethod
    def get_file(file_id: str) -> Optional[dict]:
        """Get a file by ID"""
        files = FileService._load_files()
        for file in files:
            if file["id"] == file_id:
                return file
        return None
    
    @staticmethod
    def get_all_files() -> List[dict]:
        """Get all files"""
        return FileService._load_files()
    
    @staticmethod
    def update_file(file_id: str, name: Optional[str] = None, 
                   content: Optional[str] = None, language: Optional[str] = None) -> Optional[dict]:
        """Update a file"""
        files = FileService._load_files()
        for i, file in enumerate(files):
            if file["id"] == file_id:
                if name is not None:
                    file["name"] = name
                if content is not None:
                    file["content"] = content
                if language is not None:
                    file["language"] = language
                file["updated_at"] = datetime.utcnow().isoformat()
                files[i] = file
                FileService._save_files(files)
                return file
        return None
    
    @staticmethod
    def delete_file(file_id: str) -> bool:
        """Delete a file"""
        files = FileService._load_files()
        new_files = [f for f in files if f["id"] != file_id]
        if len(new_files) < len(files):
            FileService._save_files(new_files)
            return True
        return False

class HistoryService:
    @staticmethod
    def _load_history() -> List[dict]:
        """Load execution history from JSON"""
        FileService._ensure_data_dir()
        if not os.path.exists(HISTORY_JSON):
            return []
        with open(HISTORY_JSON, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    @staticmethod
    def _save_history(history: List[dict]):
        """Save execution history to JSON"""
        FileService._ensure_data_dir()
        # Keep only last 100 executions
        with open(HISTORY_JSON, 'w', encoding='utf-8') as f:
            json.dump(history[-100:], f, indent=2, ensure_ascii=False)
    
    @staticmethod
    def add_execution(language: str, version: str, source: str, stdin: str,
                     stdout: str, stderr: str, code: int, execution_time: float = None) -> dict:
        """Add an execution to history"""
        history = HistoryService._load_history()
        history_id = str(uuid.uuid4())
        
        item = {
            "id": history_id,
            "language": language,
            "version": version,
            "source": source,
            "stdin": stdin,
            "stdout": stdout,
            "stderr": stderr,
            "code": code,
            "executed_at": datetime.utcnow().isoformat(),
            "execution_time": execution_time
        }
        
        history.append(item)
        HistoryService._save_history(history)
        return item
    
    @staticmethod
    def get_history(limit: int = 50) -> List[dict]:
        """Get execution history"""
        history = HistoryService._load_history()
        return history[-limit:][::-1]  # Return last N items in reverse order
