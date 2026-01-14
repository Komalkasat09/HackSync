/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    ME: `${API_BASE_URL}/auth/me`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback`,
  },
  CLAIMS: {
    BASE: `${API_BASE_URL}/claims`,
    ANALYZE: `${API_BASE_URL}/claims/analyze`,
    LIST: `${API_BASE_URL}/claims`,
    VERDICT: (claimId: string) => `${API_BASE_URL}/claims/${claimId}`,
    AGENTS: (claimId: string) => `${API_BASE_URL}/claims/${claimId}/agents`,
    DELETE: (claimId: string) => `${API_BASE_URL}/claims/${claimId}`,
    TRANSCRIBE: `${API_BASE_URL}/claims/transcribe`,
    STATS: `${API_BASE_URL}/claims/stats`,
    TOP_MISINFORMATION: `${API_BASE_URL}/claims/top-misinformation`,
    TRENDING_TOPICS: `${API_BASE_URL}/claims/trending-topics`,
  },
  TRENDS: {
    REDDIT: `${API_BASE_URL}/trends/reddit`,
    REDDIT_STATUS: `${API_BASE_URL}/trends/reddit/status`,
    NEWS: `${API_BASE_URL}/trends/news`,
    NEWS_STATUS: `${API_BASE_URL}/trends/news/status`,
    TELEGRAM: `${API_BASE_URL}/trends/telegram`,
    TELEGRAM_STATUS: `${API_BASE_URL}/trends/telegram/status`,
  },
  GLOBE: {
    NEWS: `${API_BASE_URL}/globe/news`,
  },
  SOCIAL_GRAPH: {
    REDDIT: `${API_BASE_URL}/social-graph/reddit`,
    HISTORY: `${API_BASE_URL}/social-graph/graphs`,
    GRAPH: (graphId: number) => `${API_BASE_URL}/social-graph/graphs/${graphId}`,
  },
  TTS: {
    SPEAK: `${API_BASE_URL}/tts/speak`,
  },
  AI_DETECTION: {
    ANALYZE_IMAGE: `${API_BASE_URL}/ai-detection/analyze-image`,
    ANALYZE_VIDEO: `${API_BASE_URL}/ai-detection/analyze-video`,
    STATS: `${API_BASE_URL}/ai-detection/stats`,
  },
  PROFILE: {
    GET: `${API_BASE_URL}/profile`,
    UPDATE: `${API_BASE_URL}/profile`,
    UPLOAD_RESUME: `${API_BASE_URL}/profile/resume/upload`,
    GET_RESUME: `${API_BASE_URL}/profile/resume`,
    DELETE_RESUME: `${API_BASE_URL}/profile/resume`,
  },
  CHATBOT: {
    CHAT: `${API_BASE_URL}/chatbot/chat`,
    CONVERSATIONS: `${API_BASE_URL}/chatbot/conversations`,
    CONVERSATION: (id: string) => `${API_BASE_URL}/chatbot/conversations/${id}`,
    TRANSCRIBE: `${API_BASE_URL}/chatbot/transcribe`,
    MCP_GRAPH: `${API_BASE_URL}/chatbot/mcp/graph`,
  },
  DEEPFAKE: {
    PREDICT: `${API_BASE_URL}/deepfake/predict`,
    HISTORY: `${API_BASE_URL}/deepfake/history`,
    STATUS: `${API_BASE_URL}/deepfake/status`,
    GET: (id: string) => `${API_BASE_URL}/deepfake/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/deepfake/${id}`,
  },
} as const;

