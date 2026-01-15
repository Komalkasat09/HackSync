from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from models.schemas import ExportRequest, ExportFormat
from services.generator_service import portfolio_generator
import os
from datetime import datetime

router = APIRouter()

@router.post("/{portfolio_id}/html")
async def export_html(portfolio_id: str):
    """Export portfolio as standalone HTML file"""
    try:
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"portfolio_{portfolio_id}_{timestamp}.html"
        output_path = os.path.join("data/exports", filename)
        
        # Export HTML
        await portfolio_generator.export_html(portfolio_id, output_path)
        
        # Return file
        return FileResponse(
            output_path,
            media_type="text/html",
            filename=f"portfolio_{timestamp}.html"
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{portfolio_id}/zip")
async def export_zip(portfolio_id: str):
    """Export portfolio as ZIP file with assets"""
    try:
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"portfolio_{portfolio_id}_{timestamp}"
        output_path = os.path.join("data/exports", filename)
        
        # Export ZIP
        zip_path = await portfolio_generator.export_zip(portfolio_id, output_path + ".zip")
        
        # Return file
        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename=f"portfolio_{timestamp}.zip"
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{portfolio_id}/download")
async def download_portfolio(portfolio_id: str, format: str = "html"):
    """Download portfolio in specified format"""
    try:
        if format == "html":
            return await export_html(portfolio_id)
        elif format == "zip":
            return await export_zip(portfolio_id)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
            
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
