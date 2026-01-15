from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Optional
from pydantic import BaseModel
import sys
sys.path.append('..')
from auth.routes import get_current_user
from config import get_database
from .schema import PortfolioGenerateResponse, PortfolioDeployResponse
from .portfolio_service import PortfolioService

class DeployRequest(BaseModel):
    design_type: str = "terminal"

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/data")
async def get_portfolio_data(current_user: dict = Depends(get_current_user)):
    """
    Get portfolio data as JSON for preview
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Fetch all user data
        portfolio_data = await PortfolioService.fetch_user_portfolio_data(db, user_id)
        
        return JSONResponse(content=portfolio_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio data: {str(e)}")


@router.post("/deploy")
async def deploy_portfolio(
    request: DeployRequest = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Deploy user's portfolio and return public URL
    """
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Mark portfolio as deployed with design type
        deployment_data = {
            "user_id": user_id,
            "design_type": request.design_type,
            "deployed_at": __import__("datetime").datetime.utcnow(),
            "is_active": True
        }
        
        # Check if portfolio already exists
        existing = await db.deployed_portfolios.find_one({"user_id": user_id})
        
        if existing:
            await db.deployed_portfolios.update_one(
                {"user_id": user_id},
                {"$set": deployment_data}
            )
        else:
            await db.deployed_portfolios.insert_one(deployment_data)
        
        # Construct deployment URL
        portfolio_url = f"http://localhost:3000/portfolio/{user_id}/deployed"
        
        return {
            "success": True,
            "portfolio_url": portfolio_url,
            "message": "Portfolio deployed successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deploy portfolio: {str(e)}")


@router.get("/{user_id}/data")
async def get_user_portfolio_data(user_id: str):
    """
    Public route to get portfolio data (no authentication required)
    """
    try:
        db = await get_database()
        
        # Check if portfolio is deployed
        deployment = await db.deployed_portfolios.find_one(
            {"user_id": user_id, "is_active": True}
        )
        
        if not deployment:
            raise HTTPException(status_code=404, detail="Portfolio not found or not deployed")
        
        # Fetch portfolio data
        portfolio_data = await PortfolioService.fetch_user_portfolio_data(db, user_id)
        
        # Add design type to the response
        portfolio_data["design_type"] = deployment.get("design_type", "terminal")
        
        return JSONResponse(content=portfolio_data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load portfolio: {str(e)}")
