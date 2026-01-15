# Testing Guide - Portfolio Generator

## Manual Testing Checklist

### Backend API Testing

#### 1. Test Server Startup
```powershell
cd backend
python main.py
```
✅ Expected: Server starts on port 8001
✅ Visit http://localhost:8001/docs for API documentation

#### 2. Test Health Endpoint
```powershell
curl http://localhost:8001/health
```
✅ Expected: `{"status": "healthy"}`

#### 3. Test Portfolio Creation
Using the API docs at http://localhost:8001/docs:
- Find "POST /api/portfolio/create"
- Click "Try it out"
- Use this JSON:
```json
{
  "personal_info": {
    "full_name": "Test User",
    "title": "Software Developer",
    "bio": "Test bio",
    "email": "test@example.com",
    "social_links": {}
  }
}
```
✅ Expected: Returns portfolio object with ID

#### 4. Test GitHub Integration
- Use endpoint: POST /api/portfolio/{id}/github
- Use payload:
```json
{
  "username": "torvalds",
  "include_repos": true,
  "max_repos": 5
}
```
✅ Expected: Returns GitHub profile with repos

### Frontend Testing

#### 1. Test Gallery Page
- Visit http://localhost:5174
- ✅ Should show empty state or list of portfolios
- ✅ "Create Portfolio" button should be visible

#### 2. Test Portfolio Creation
- Click "Create Portfolio"
- Fill in the form:
  - Full Name: "John Doe"
  - Title: "Full Stack Developer"
  - Email: "john@example.com"
- Click "Create Portfolio"
- ✅ Should redirect to builder page

#### 3. Test Personal Info
- ✅ Form should be pre-filled with entered data
- ✅ Changes should update the store

#### 4. Test GitHub Integration
- Click "GitHub" tab
- Enter username: "torvalds"
- Click "Fetch Profile"
- ✅ Should show profile with repos
- ✅ Stats should display (repos, stars, followers)

#### 5. Test Resume Upload
- Click "Resume" tab
- Upload a PDF file
- ✅ Should show upload progress
- ✅ Success message should appear

#### 6. Test Template Selection
- Click "Template" tab
- Select different templates
- ✅ Selected template should be highlighted
- ✅ Color picker should work

#### 7. Test Preview
- Click "Preview" button in header
- ✅ Should open preview page
- ✅ Portfolio should render in iframe

#### 8. Test Export
- In preview page, click "Export HTML"
- ✅ File should download
- ✅ Opening file in browser should show portfolio

### Integration Testing

#### Full Workflow Test
1. Start backend: `python main.py`
2. Start frontend: `npm run dev`
3. Create new portfolio
4. Add GitHub profile
5. Upload resume (optional)
6. Select template
7. Customize colors
8. Preview portfolio
9. Export as HTML
10. Export as ZIP

✅ All steps should work without errors

### Error Handling Testing

#### Test Invalid GitHub Username
- Enter "thisisnotarealuser123456789"
- Click fetch
- ✅ Should show error message

#### Test Missing Required Fields
- Try to create portfolio without email
- ✅ Should show validation error

#### Test Backend Offline
- Stop backend server
- Try any action in frontend
- ✅ Should show connection error

### Browser Testing

Test in multiple browsers:
- ✅ Chrome
- ✅ Firefox
- ✅ Edge
- ✅ Safari (if available)

### Responsive Testing

Test at different viewport sizes:
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

## Automated Testing (Future)

### Backend Tests
```python
# tests/test_portfolio.py
def test_create_portfolio():
    # Test portfolio creation
    pass

def test_github_integration():
    # Test GitHub API calls
    pass

def test_resume_parsing():
    # Test resume parsing
    pass
```

### Frontend Tests
```typescript
// tests/components/PersonalInfoForm.test.tsx
describe('PersonalInfoForm', () => {
  it('should render form fields', () => {
    // Test rendering
  });
  
  it('should validate email', () => {
    // Test validation
  });
});
```

## Performance Testing

### Backend Performance
- ✅ API response time < 200ms (simple queries)
- ✅ GitHub fetch < 3s
- ✅ PDF parsing < 5s
- ✅ HTML generation < 1s

### Frontend Performance
- ✅ Initial load < 2s
- ✅ Navigation between tabs instant
- ✅ Preview loads < 1s

## Common Issues & Solutions

### Issue: Port already in use
**Solution**: Change port in config or kill process
```powershell
# Find process on port 8001
netstat -ano | findstr :8001
# Kill process
taskkill /PID <PID> /F
```

### Issue: CORS errors
**Solution**: Check CORS middleware in main.py

### Issue: GitHub API rate limit
**Solution**: Add GitHub token to .env file

### Issue: Module not found
**Solution**: Reinstall dependencies
```powershell
pip install -r requirements.txt
# or
npm install
```

## Test Data

### Sample Resume JSON
See QUICK_START.md for example resume JSON format

### Test GitHub Users
- torvalds (Linus Torvalds - small account)
- gaearon (Dan Abramov - medium account)
- sindresorhus (Sindre Sorhus - large account)

## Reporting Issues

When reporting issues, include:
1. Browser/OS version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors (if any)
5. Network tab screenshots (if API related)

## Success Criteria

✅ All endpoints respond correctly
✅ No console errors
✅ UI is responsive
✅ Data persists correctly
✅ Export works as expected
✅ GitHub integration functional

---

**Happy Testing! 🧪**
