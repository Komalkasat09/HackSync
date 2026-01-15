# AI Interview Module - Frontend

Production-ready Next.js frontend for AI-powered mock interviews.

## 🎨 Features

- **Interview Setup**: Resume upload with drag-and-drop
- **Live Interview**: Webcam integration with AI avatar
- **Real-time Feedback**: Question timer and progress tracking
- **Comprehensive Results**: Detailed scoring with visualizations
- **Responsive Design**: Works on desktop and tablet
- **Dark Mode**: Sleek, modern UI with Tailwind CSS
- **Smooth Animations**: Framer Motion for delightful UX

## 📁 Structure

```
frontend/interview/
├── setup/
│   └── page.tsx              # Interview setup & resume upload
├── live/
│   └── page.tsx              # Live interview interface
├── result/
│   └── [id]/
│       └── page.tsx          # Results & feedback
├── components/
│   ├── AIInterviewerAvatar.tsx
│   ├── ScoreRadarChart.tsx
│   └── CategoryScoreBar.tsx
├── types.ts                  # TypeScript interfaces
├── api.ts                    # API client
├── utils.ts                  # Helper functions
└── README.md
```

## 🚀 Quick Start

### 1. Environment Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_INTERVIEW_API=http://localhost:3001
```

### 2. Install Dependencies

```bash
cd frontend
npm install framer-motion lucide-react
```

### 3. Run Development Server

```bash
npm run dev
```

Navigate to: `http://localhost:3000/interview/setup`

## 🎯 User Flow

1. **Setup** (`/interview/setup`)
   - Select interview type (General/Technical/Project-Heavy)
   - Upload resume PDF OR use profile resume
   - Start interview

2. **Live Interview** (`/interview/live?session={id}`)
   - Webcam automatically enables
   - AI avatar appears
   - Questions asked one by one
   - Answer in text area
   - Timer counts down
   - Submit or skip each question

3. **Results** (`/interview/result/{id}`)
   - Overall score (0-100)
   - Category-wise breakdown
   - Radar chart visualization
   - Strengths & weaknesses
   - Improvement suggestions
   - Recommended study topics
   - Question-by-question feedback

## 🎨 Components

### AIInterviewerAvatar
Animated robot avatar with:
- Blinking eyes
- Moving mouth (when asking)
- Glowing effect
- Sound wave indicators

### ScoreRadarChart
SVG-based radar chart showing:
- 4 category scores
- Gradient fills
- Animated data points
- Responsive layout

### CategoryScoreBar
Animated progress bars with:
- Smooth animations
- Color-coded scores
- Shine effect

## 🎬 Animations

Using Framer Motion:
- Page transitions
- Score reveal animations
- Progress bar fills
- Avatar movements
- Fade-in effects

## 📱 Responsive Design

Breakpoints:
- Mobile: Full-width layout
- Tablet: 2-column grid
- Desktop: Optimized 3-column layout

## 🔧 Configuration

Edit component defaults in respective files:
- Timer colors: `live/page.tsx`
- Chart colors: `components/ScoreRadarChart.tsx`
- Score thresholds: `utils.ts`

## 🎥 Media Permissions

Handles:
- Camera access
- Microphone access
- Graceful fallbacks
- Error states

## 📊 Data Visualization

Charts:
- Radar chart (SVG)
- Horizontal bars (Framer Motion)
- Real-time progress (CSS transitions)

## 🌐 API Integration

All API calls in `api.ts`:
- `startInterview()`
- `submitAnswer()`
- `endInterview()`
- `getResults()`
- `updateMetadata()`

Error handling:
- Retry logic for processing state
- User-friendly error messages
- Loading states

## 🎨 Styling

Tailwind CSS classes:
- Gradient backgrounds
- Glassmorphism effects
- Custom animations
- Dark mode optimized

Color palette:
- Primary: Purple (`#A78BFA`)
- Secondary: Pink (`#F472B6`)
- Success: Green (`#4ADE80`)
- Warning: Orange (`#FB923C`)
- Error: Red (`#F87171`)

## 🧪 Testing

Test scenarios:
1. Upload PDF resume
2. Use profile resume
3. Complete full interview
4. Skip questions
5. View results
6. Handle camera denied
7. Handle API errors

## 📦 Dependencies

Required packages:
- `framer-motion` - Animations
- `lucide-react` - Icons
- `next` - Framework
- `react` - UI library
- `tailwindcss` - Styling

## 🚀 Deployment

Build:
```bash
npm run build
```

Environment variables:
- `NEXT_PUBLIC_INTERVIEW_API` - Backend URL

## 💡 Tips

**Performance:**
- Lazy load result charts
- Optimize video stream
- Use React.memo for heavy components

**UX:**
- Clear CTAs
- Loading indicators
- Error boundaries
- Keyboard shortcuts

**Accessibility:**
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast

## 🐛 Troubleshooting

**Camera not working:**
- Check browser permissions
- Ensure HTTPS (required for camera)
- Test different browsers

**Results not loading:**
- Backend still processing
- Check API endpoint
- Verify session ID

**Animations laggy:**
- Reduce motion settings
- Check GPU acceleration
- Optimize Framer Motion settings

## 🔮 Future Enhancements

- Voice input for answers
- Real-time transcription
- Video recording
- Interview replay
- Performance trends
- Peer comparison
- Practice mode
