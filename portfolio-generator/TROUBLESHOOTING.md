# Troubleshooting Guide

## Common Issues and Solutions

### 1. Import Errors (Cannot find module)

**Issue:** TypeScript/Python shows "Cannot find module" errors

**Solution:**
- **Backend:** Install Python dependencies
  ```powershell
  cd backend
  pip install -r requirements.txt
  ```
  
- **Frontend:** Install Node dependencies
  ```powershell
  cd frontend
  npm install
  ```

### 2. Port Already in Use

**Issue:** Error: "Port 8001 (or 5174) is already in use"

**Solution:**
```powershell
# Find process using the port
netstat -ano | findstr :8001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change the port in the config file
```

### 3. Python Not Found

**Issue:** 'python' is not recognized as an internal or external command

**Solution:**
1. Install Python from https://www.python.org/
2. Make sure to check "Add Python to PATH" during installation
3. Restart your terminal after installation

### 4. Node/npm Not Found

**Issue:** 'node' or 'npm' is not recognized

**Solution:**
1. Install Node.js from https://nodejs.org/
2. Restart your terminal after installation
3. Verify: `node --version` and `npm --version`

### 5. CORS Errors

**Issue:** Browser console shows CORS errors

**Solution:**
- Verify backend is running on port 8001
- Check CORS middleware in `backend/main.py`
- Make sure frontend proxy is configured in `frontend/vite.config.ts`

### 6. GitHub API Rate Limit

**Issue:** "API rate limit exceeded" when fetching GitHub data

**Solution:**
1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `public_repo`, `read:user`
2. Create `.env` file in backend directory:
   ```
   GITHUB_TOKEN=your_token_here
   ```
3. Restart backend server

### 7. Module Import Errors in Python

**Issue:** `ModuleNotFoundError` or `ImportError`

**Solution:**
```powershell
# Reinstall all dependencies
cd backend
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

### 8. TypeScript Compilation Errors

**Issue:** TypeScript errors in VS Code

**Solution:**
1. Delete node_modules:
   ```powershell
   cd frontend
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   ```
2. Reinstall:
   ```powershell
   npm install
   ```
3. Reload VS Code window: Ctrl+Shift+P → "Reload Window"

### 9. Vite Build Errors

**Issue:** Build fails with various errors

**Solution:**
```powershell
cd frontend
npm run build
# If errors persist, clear cache:
Remove-Item -Recurse -Force node_modules/.vite
npm run dev
```

### 10. Database/Storage Errors

**Issue:** Error saving portfolios

**Solution:**
- Ensure `backend/data` directories exist
- Check file permissions
- Verify disk space

### 11. Template Rendering Errors

**Issue:** Portfolio preview is blank or has errors

**Solution:**
- Check browser console for JavaScript errors
- Verify template file exists in `backend/templates/`
- Check Jinja2 syntax in template

### 12. File Upload Issues

**Issue:** Resume upload fails

**Solution:**
- Check file size (max 10MB)
- Verify file format (PDF or JSON)
- Check `backend/data/uploads` directory exists

## Quick Checks

### Verify Backend is Running
```powershell
curl http://localhost:8001/health
# Should return: {"status":"healthy"}
```

### Verify Frontend is Running
Open http://localhost:5174 in your browser

### Check Backend Logs
Look at the terminal where backend is running for error messages

### Check Frontend Console
Open browser DevTools (F12) → Console tab

## Environment Variables

Create `backend/.env` file:
```
GITHUB_TOKEN=your_github_token_here
ENVIRONMENT=development
```

## Useful Commands

### Reset Everything
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force __pycache__
Remove-Item -Recurse -Force data/portfolios/*.json

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### Check Installed Packages
```powershell
# Python
pip list

# Node
npm list --depth=0
```

### Update Dependencies
```powershell
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm update
```

## Still Having Issues?

1. Check the logs in both terminal windows
2. Look for error messages in browser console (F12)
3. Verify all prerequisites are installed:
   - Python 3.8+
   - Node.js 16+
   - pip and npm

4. Try the installation script:
   ```powershell
   .\install.ps1
   ```

5. Read the documentation:
   - README.md
   - QUICK_START.md
   - TESTING_GUIDE.md

## Get Help

If you're still stuck:
1. Check the error message carefully
2. Search for the error online
3. Review the code in the file mentioned in the error
4. Create a GitHub issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Python version, Node version)
