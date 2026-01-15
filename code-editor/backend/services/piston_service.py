import httpx
import os
import time
from typing import Dict, Any

PISTON_API_URL = os.getenv("PISTON_API_URL", "https://emkc.org/api/v2/piston")

class PistonService:
    @staticmethod
    async def execute_code(language: str, version: str, source: str, stdin: str = "", args: list = None) -> Dict[str, Any]:
        """Execute code using Piston API"""
        if args is None:
            args = []
        
        payload = {
            "language": language,
            "version": version,
            "files": [
                {
                    "content": source
                }
            ],
            "stdin": stdin,
            "args": args
        }
        
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(f"{PISTON_API_URL}/execute", json=payload)
                response.raise_for_status()
                result = response.json()
                
                execution_time = time.time() - start_time
                
                return {
                    "stdout": result.get("run", {}).get("stdout", ""),
                    "stderr": result.get("run", {}).get("stderr", ""),
                    "output": result.get("run", {}).get("output", ""),
                    "code": result.get("run", {}).get("code", 0),
                    "signal": result.get("run", {}).get("signal"),
                    "execution_time": execution_time
                }
        except httpx.TimeoutException:
            return {
                "stdout": "",
                "stderr": "Execution timeout (>30s)",
                "output": "Execution timeout (>30s)",
                "code": 124,
                "signal": None,
                "execution_time": time.time() - start_time
            }
        except httpx.HTTPError as e:
            return {
                "stdout": "",
                "stderr": f"API Error: {str(e)}",
                "output": f"API Error: {str(e)}",
                "code": 1,
                "signal": None,
                "execution_time": time.time() - start_time
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "output": f"Execution error: {str(e)}",
                "code": 1,
                "signal": None,
                "execution_time": time.time() - start_time
            }
    
    @staticmethod
    async def get_runtimes():
        """Get available runtimes from Piston API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{PISTON_API_URL}/runtimes")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            return {"error": str(e)}
