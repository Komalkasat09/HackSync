from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import portfolio, export
import os

app = FastAPI(
    title="Portfolio Generator API",
    description="API for generating professional portfolio websites",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
os.makedirs("data/portfolios", exist_ok=True)
os.makedirs("data/uploads", exist_ok=True)
os.makedirs("data/exports", exist_ok=True)

# Include routers
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(export.router, prefix="/api/export", tags=["export"])

@app.get("/")
async def root():
    return {
        "message": "Portfolio Generator API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
