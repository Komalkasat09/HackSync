"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { API_ENDPOINTS } from "@/lib/config"
import { claimProcessingService } from "@/lib/claimProcessingService"
import type { AgentRecord, ClaimVerdict } from "@/types/claims"

const MAX_CLAIM_LENGTH = 1000
const MAX_POLL_ATTEMPTS = 75  // 5 minutes at 4s intervals (75 * 4 = 300 seconds = 5 minutes)
const POLL_INTERVAL_MS = 4000

const sleep = async (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface MediaItem {
  type: string
  data_base64: string
  mime_type: string
  filename: string
}

export interface AnalyzeClaimParams {
  claimText: string
  useWebSearch?: boolean
  forcedAgents?: string[]
  media?: MediaItem[]
}

export function useClaimAnalysis(token: string | null) {
  const [verdict, setVerdict] = useState<ClaimVerdict | null>(null)
  const [agents, setAgents] = useState<AgentRecord[]>([])
  const [processingStage, setProcessingStage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef<number | null>(null)

  const authHeaders = useMemo(() => {
    if (!token) return null
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }, [token])

  const fetchWithAuth = useCallback(
    async <T,>(url: string, options?: RequestInit): Promise<T> => {
      if (!authHeaders) {
        throw new Error("You must be logged in to analyze news.")
      }
      const response = await fetch(url, {
        ...options,
        headers: {
          ...authHeaders,
          ...(options?.headers || {}),
        },
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.detail || "Request failed")
      }
      return payload as T
    },
    [authHeaders]
  )

  const pollForVerdict = useCallback(
    async (claimId: string): Promise<ClaimVerdict> => {
      return new Promise((resolve, reject) => {
        // Use background service for polling
        claimProcessingService.startPolling(
          claimId,
          token || "",
          {
            onStageUpdate: async (stage: string | null) => {
              setProcessingStage(stage)
            },
            onComplete: async (verdict: ClaimVerdict) => {
              setProcessingStage(null)
              resolve(verdict)
            },
            onError: async (error: string) => {
              setProcessingStage(null)
              reject(new Error(error))
            },
            onAgentsUpdate: async (agents: AgentRecord[]) => {
              setAgents(agents)
            },
          }
        )
      })
    },
    [token]
  )

  const fetchAgents = useCallback(
    async (claimId: string): Promise<AgentRecord[]> => {
      const data = await fetchWithAuth<{ agents: AgentRecord[] }>(
        API_ENDPOINTS.CLAIMS.AGENTS(claimId)
      )
      return data.agents
    },
    [fetchWithAuth]
  )

  const analyzeClaim = useCallback(
    async ({ claimText, useWebSearch = true, forcedAgents = [], media = [] }: AnalyzeClaimParams): Promise<void> => {
      if (!claimText.trim() && media.length === 0) {
        setError("No content provided to analyze.")
        return
      }

      try {
        setLoading(true)
        setError(null)
        setVerdict(null)
        setAgents([])
        setProcessingStage("Queued")
        setElapsedMs(0)
        startTimeRef.current = performance.now()

        const sanitizedClaim = claimText.slice(0, MAX_CLAIM_LENGTH)

        const analyzeResp = await fetchWithAuth<{ claimId: string }>(
          API_ENDPOINTS.CLAIMS.ANALYZE,
          {
            method: "POST",
            body: JSON.stringify({
              claim_text: sanitizedClaim,
              use_web_search: useWebSearch,
              forced_agents: forcedAgents,
              media,
            }),
          }
        )

        // Start background polling
        const finalVerdict = await pollForVerdict(analyzeResp.claimId)
        setVerdict(finalVerdict)

        // Agents are already fetched by the background service, but fetch again to be sure
        try {
          const agentOutputs = await fetchAgents(analyzeResp.claimId)
          setAgents(agentOutputs)
        } catch (err) {
          console.error("Failed to fetch agents:", err)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.")
        setProcessingStage(null)
      } finally {
        setLoading(false)
      }
    },
    [fetchWithAuth, fetchAgents, pollForVerdict, token]
  )

  const reset = useCallback(async (): Promise<void> => {
    // Stop any active polling
    const activeClaim = claimProcessingService.getActiveClaim()
    if (activeClaim) {
      claimProcessingService.stopPolling(activeClaim.claimId)
    }
    
    setVerdict(null)
    setAgents([])
    setProcessingStage(null)
    setError(null)
    setElapsedMs(0)
    startTimeRef.current = null
  }, [])

  // Resume polling if there's an active claim when component mounts
  useEffect(() => {
    if (!token) return

    const activeClaim = claimProcessingService.getActiveClaim()
    if (activeClaim && activeClaim.claimId) {
      // Resume polling
      claimProcessingService.resumePolling({
        onStageUpdate: async (stage: string | null) => {
          setProcessingStage(stage)
        },
        onComplete: async (verdict: ClaimVerdict) => {
          setProcessingStage(null)
          setVerdict(verdict)
          setLoading(false)
        },
        onError: async (error: string) => {
          setProcessingStage(null)
          setError(error)
          setLoading(false)
        },
        onAgentsUpdate: async (agents: AgentRecord[]) => {
          setAgents(agents)
        },
      })
      setLoading(true)
      setProcessingStage("Resuming...")
    }
  }, [token])

  useEffect(() => {
    if (!loading) {
      // When loading stops, calculate final elapsed time
      if (startTimeRef.current !== null) {
        const finalTime = performance.now() - startTimeRef.current
        setElapsedMs(finalTime)
        startTimeRef.current = null
      }
      return
    }

    // Start tracking when loading begins
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now()
    }

    const interval = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedMs(performance.now() - startTimeRef.current)
      }
    }, 100)

    return () => {
      window.clearInterval(interval)
    }
  }, [loading])

  return {
    analyzeClaim,
    verdict,
    agents,
    processingStage,
    loading,
    error,
    elapsedMs,
    reset,
  }
}

