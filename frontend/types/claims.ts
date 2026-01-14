export interface SentimentAnalysis {
  primary_sentiment: string
  sentiment_distribution: {
    positive: number
    neutral: number
    negative: number
  }
  raw_scores?: Record<string, number>
  confidence?: number
  model?: string
  error?: string
}

export interface EmotionAnalysis {
  primary_emotion: string
  emotion_distribution: {
    joy: number
    anger: number
    sadness: number
    fear: number
    surprise: number
    disgust: number
  }
  raw_scores?: Record<string, number>
  confidence?: number
  model?: string
  error?: string
}

export interface ClaimVerdict {
  claimId: string
  verdict?: string
  confidence?: number
  summary?: string
  true_news?: string
  status: string
  category?: string
  sub_category?: string
  keywords?: string[]
  sources_used?: Array<{
    url: string
    source_name: string
    agent_name?: string
  }>
  sentiment_analysis?: SentimentAnalysis
  emotion_analysis?: EmotionAnalysis
  metadata?: Record<string, unknown>
  processing_stage?: string
  error?: {
    message?: string
  }
}

export interface AgentRecord {
  _id: string
  agent_key: string
  agent_name?: string
  agent_type?: string
  output: unknown
}

export interface ClaimAnalyzeResponse {
  claimId: string
  status: string
}

