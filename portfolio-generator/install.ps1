# Installation Script for Portfolio Generator

Write-Host "=== Portfolio Generator - Installation Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Installing Backend Dependencies ===" -ForegroundColor Cyan
Set-Location backend

Write-Host "Installing Python packages..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Installing Frontend Dependencies ===" -ForegroundColor Cyan
Set-Location ..\frontend

Write-Host "Installing npm packages..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "  1. Backend:  cd backend && python main.py" -ForegroundColor White
Write-Host "  2. Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use the start script: .\start.ps1" -ForegroundColor Yellow
Write-Host ""
