import * as Cesium from 'cesium'

export interface NewsMarker {
  id: string
  title: string
  description: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  position: Cesium.Cartesian3 | { longitude: number; latitude: number; height?: number }
}

export interface MediaAttachment {
  id: string
  type: "image" | "video" | "audio"
  dataUrl: string
  mimeType: string
  filename: string
}

export interface AnalyzableNews {
  id: string
  title: string
  summary?: string
  content?: string
  sourceName?: string
  sourceType?: string
  url?: string
  imageUrl?: string | null
  publishedAt?: string | null
  sentiment?: string | null
  metadata?: Record<string, unknown>
  mediaAttachments?: MediaAttachment[]
}

export interface AnalyzeNewsPayload extends AnalyzableNews {
  createdAt: number
  options?: {
    useWebSearch?: boolean
    forcedAgents?: string[]
  }
}

