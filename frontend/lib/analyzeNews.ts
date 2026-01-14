import type { AnalyzeNewsPayload, AnalyzableNews } from "@/types/news"

const STORAGE_PREFIX = "news-analysis"
const COUNTER_KEY = "news-analysis-counter"

const isBrowser = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"

const buildStorageKey = (sessionId: string) => `${STORAGE_PREFIX}:${sessionId}`

export const createNewsAnalysisSession = (
  news: AnalyzableNews,
  options?: { useWebSearch?: boolean; forcedAgents?: string[] }
) => {
  if (!isBrowser()) {
    throw new Error("News analysis sessions are only available in the browser.")
  }

  // Use a simple incremental counter for cleaner, human-readable IDs: 1,2,3,...
  let nextId = 1
  try {
    const raw = window.sessionStorage.getItem(COUNTER_KEY)
    if (raw) {
      const parsed = parseInt(raw, 10)
      if (!Number.isNaN(parsed) && parsed >= 1) {
        nextId = parsed + 1
      }
    }
  } catch {
    // Fallback to 1 if anything goes wrong
    nextId = 1
  }
  const sessionId = String(nextId)
  window.sessionStorage.setItem(COUNTER_KEY, sessionId)

  const payload: AnalyzeNewsPayload = {
    ...news,
    createdAt: Date.now(),
    options,
  }

  window.sessionStorage.setItem(buildStorageKey(sessionId), JSON.stringify(payload))

  return sessionId
}

export const getNewsAnalysisPayload = (sessionId: string): AnalyzeNewsPayload | null => {
  if (!isBrowser()) return null
  const raw = window.sessionStorage.getItem(buildStorageKey(sessionId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as AnalyzeNewsPayload
  } catch {
    return null
  }
}

export const clearNewsAnalysisPayload = (sessionId: string) => {
  if (!isBrowser()) return
  window.sessionStorage.removeItem(buildStorageKey(sessionId))
}

