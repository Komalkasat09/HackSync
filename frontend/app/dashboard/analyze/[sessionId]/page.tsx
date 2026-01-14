"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, Loader2, ShieldQuestion, Volume2, Square, FileText } from "lucide-react"
import { getNewsAnalysisPayload } from "@/lib/analyzeNews"
import type { AnalyzeNewsPayload } from "@/types/news"
import { useClaimAnalysis } from "@/hooks/useClaimAnalysis"
import type { ClaimVerdict, AgentRecord } from "@/types/claims"
import { API_ENDPOINTS } from "@/lib/config"
import { ResponsivePie } from "@nivo/pie"
import PDFPreviewModal from "@/components/PDFPreviewModal"

const buildClaimText = (payload: AnalyzeNewsPayload) => {
  // For user claims, use only the content (actual claim text)
  // For news items, use title or content
  if (payload.sourceType === "claim") {
    // User-submitted claims: use content only (no title, no source metadata)
    return payload.content || payload.title || ""
  }
  
  // For news items: use title as primary, fallback to content
  return payload.title || payload.content || payload.summary || ""
}

const verdictColors: Record<string, string> = {
  true: "text-green-400",
  false: "text-red-400",
  mixed: "text-yellow-400",
  unknown: "text-foreground/60",
}

export default function AnalyzeNewsPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [payload, setPayload] = useState<AnalyzeNewsPayload | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)
  const [hasTriggered, setHasTriggered] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef<boolean>(false) // Synchronous ref to track playing state
  const audioEventHandlersRef = useRef<{ ended: (() => void) | null; error: ((e: Event) => void) | null }>({ ended: null, error: null })
  const currentAudioIdRef = useRef<string | null>(null) // Track which audio instance is currently playing
  const audioUrlRef = useRef<string | null>(null) // Store audio URL in ref for cleanup

  const token = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
  }, [])

  const {
    analyzeClaim,
    verdict,
    agents,
    processingStage,
    loading,
    error,
    elapsedMs,
  } = useClaimAnalysis(token)

  const [loadedAgents, setLoadedAgents] = useState<AgentRecord[]>([])
  const [loadedVerdict, setLoadedVerdict] = useState<ClaimVerdict | null>(null)

  useEffect(() => {
    if (!params?.sessionId) return
    const data = getNewsAnalysisPayload(params.sessionId)
    if (!data) {
      setStorageError("Unable to load the selected news item. Please try again from the source feed.")
      return
    }
    setPayload(data)
  }, [params?.sessionId])

  useEffect(() => {
    if (!payload || hasTriggered || !token) return

    // Check if this is a past claim (has claimId in metadata)
    const claimId = payload.metadata?.claimId as string | undefined
    if (claimId) {
      // Load existing verdict and agents for past claim
      const loadPastClaim = async () => {
        try {
          const response = await fetch(API_ENDPOINTS.CLAIMS.VERDICT(claimId), {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (response.ok) {
            const verdictData = (await response.json()) as ClaimVerdict
            setLoadedVerdict(verdictData)
            
            // Fetch agents
            const agentsResponse = await fetch(API_ENDPOINTS.CLAIMS.AGENTS(claimId), {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            if (agentsResponse.ok) {
              const agentsData = (await agentsResponse.json()) as { agents: AgentRecord[] }
              setLoadedAgents(agentsData.agents)
            }
          }
        } catch (err) {
          console.error("Failed to load past claim:", err)
        }
        setHasTriggered(true)
      }
      loadPastClaim()
      return
    }

    // New claim - run analysis
    const claimText = buildClaimText(payload)
    if (!claimText.trim() && !payload.mediaAttachments?.length) {
      setStorageError("Selected news does not contain enough content to analyze.")
      return
    }
    const useWeb = payload.options?.useWebSearch ?? true
    const forced = payload.options?.forcedAgents ?? []
    
    // Convert media attachments to API format
    const media = payload.mediaAttachments?.map((item: { dataUrl: string; type: string; mimeType: string; filename: string }) => {
      // Extract base64 from data URL (format: "data:image/png;base64,iVBORw0KG...")
      const base64Data = item.dataUrl.includes(",") 
        ? item.dataUrl.split(",")[1] 
        : item.dataUrl
      return {
        type: item.type,
        data_base64: base64Data,
        mime_type: item.mimeType,
        filename: item.filename,
      }
    }) || []
    
    analyzeClaim({ claimText, useWebSearch: useWeb, forcedAgents: forced, media })
    setHasTriggered(true)
  }, [payload, analyzeClaim, hasTriggered, token])

  // Cleanup audio on unmount ONLY (no dependencies to prevent premature cleanup)
  useEffect(() => {
    return () => {
      console.log("🧹 [CLEANUP] Component unmounting, cleaning up...")
      const currentAudio = audioRef.current
      if (currentAudio) {
        console.log("🧹 [CLEANUP] Cleaning up audio element...")
        try {
          // Remove event listeners
          const handlers = audioEventHandlersRef.current
          if (handlers.ended) {
            currentAudio.removeEventListener("ended", handlers.ended)
          }
          if (handlers.error) {
            currentAudio.removeEventListener("error", handlers.error)
          }
          audioEventHandlersRef.current = { ended: null, error: null }
          
          // Stop playback
          currentAudio.pause()
          currentAudio.currentTime = 0
          currentAudio.src = ""
          currentAudio.load()
        } catch (error) {
          console.error("🧹 [CLEANUP] Error cleaning up audio:", error)
        } finally {
          audioRef.current = null
          isPlayingRef.current = false
          currentAudioIdRef.current = null
        }
      }
      // Use ref instead of state to avoid dependency issues
      if (audioUrlRef.current) {
        console.log("🧹 [CLEANUP] Revoking audio URL...")
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
      console.log("🧹 [CLEANUP] Cleanup complete")
    }
  }, []) // Empty dependency array - only run on unmount

  // Use loaded verdict for past claims, or current verdict for new analysis
  const displayVerdict = loadedVerdict || verdict
  const displayAgents = loadedAgents.length > 0 ? loadedAgents : agents

  const verdictLabel = displayVerdict?.verdict?.toLowerCase() ?? "pending"
  const verdictColor =
    verdictColors[verdictLabel as keyof typeof verdictColors] ?? "text-foreground"

  const renderVerdictCard = (currentVerdict: ClaimVerdict) => {
    const confidence = currentVerdict.confidence ?? 0
    const confidencePercent = confidence * 100
    const remainingPercent = 100 - confidencePercent

    // Data for donut chart
    const scoreData = [
      { id: "Confidence", value: confidencePercent, color: "#10b981" },
      { id: "Remaining", value: remainingPercent, color: "rgba(255, 255, 255, 0.1)" },
    ]

    return (
      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-xl shadow-lg space-y-4">
        <div className="text-sm uppercase tracking-[0.2em] text-foreground/50">Verdict</div>
        <div className={`text-5xl font-bold capitalize ${verdictColor}`}>
          {currentVerdict.verdict ?? "Pending"}
        </div>
        <div className="space-y-3">
          <p className="text-sm text-foreground/60">Confidence Score</p>
          <div className="relative w-full h-64">
            <ResponsivePie
              data={scoreData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.65}
              padAngle={3}
              cornerRadius={6}
              activeOuterRadiusOffset={8}
              colors={{ datum: "data.color" }}
              borderWidth={2}
              borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
              enableArcLinkLabels={false}
              arcLabelsSkipAngle={90}
              isInteractive={true}
              tooltip={({ datum }) => (
                <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: datum.color }}
                    />
                    <div className="text-white text-sm font-medium">
                      {datum.id}: {datum.value.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
              theme={{
                background: "transparent",
                text: {
                  fontSize: 12,
                  fill: "var(--foreground)",
                },
                tooltip: {
                  container: {
                    background: "rgba(0, 0, 0, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  },
                },
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">{confidencePercent.toFixed(1)}%</p>
                <p className="text-xs text-foreground/50 mt-1">Confidence</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleStop = () => {
    console.log("🛑 [TTS STOP] handleStop called")
    console.log("🛑 [TTS STOP] audioRef.current:", audioRef.current)
    console.log("🛑 [TTS STOP] isPlayingRef.current:", isPlayingRef.current)
    console.log("🛑 [TTS STOP] isPlaying state:", isPlaying)
    console.log("🛑 [TTS STOP] currentAudioIdRef:", currentAudioIdRef.current)
    
    const currentAudio = audioRef.current
    
    if (currentAudio) {
      console.log("🛑 [TTS STOP] Audio element found, attempting to stop...")
      console.log("🛑 [TTS STOP] Audio paused state before stop:", currentAudio.paused)
      console.log("🛑 [TTS STOP] Audio currentTime before stop:", currentAudio.currentTime)
      
      try {
        // Remove event listeners FIRST to prevent them from firing
        const handlers = audioEventHandlersRef.current
        console.log("🛑 [TTS STOP] Removing event listeners:", { 
          hasEnded: !!handlers.ended, 
          hasError: !!handlers.error 
        })
        
        if (handlers.ended) {
          currentAudio.removeEventListener("ended", handlers.ended)
          console.log("🛑 [TTS STOP] Removed 'ended' listener")
        }
        if (handlers.error) {
          currentAudio.removeEventListener("error", handlers.error)
          console.log("🛑 [TTS STOP] Removed 'error' listener")
        }
        
        // Clear handlers immediately
        audioEventHandlersRef.current = { ended: null, error: null }
        console.log("🛑 [TTS STOP] Cleared event handlers ref")
        
        // AGGRESSIVE STOP: Multiple pause attempts
        console.log("🛑 [TTS STOP] Calling pause()...")
        currentAudio.pause()
        currentAudio.pause() // Call twice
        currentAudio.pause() // Call three times to be absolutely sure
        
        // Reset position
        console.log("🛑 [TTS STOP] Resetting currentTime to 0...")
        currentAudio.currentTime = 0
        
        // Stop all tracks if it's a MediaStream (though it shouldn't be)
        if (currentAudio.srcObject) {
          console.log("🛑 [TTS STOP] Found srcObject, stopping tracks...")
          const stream = currentAudio.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
          currentAudio.srcObject = null
        }
        
        // Clear source to stop any buffered playback
        console.log("🛑 [TTS STOP] Clearing audio source...")
        currentAudio.src = ""
        currentAudio.removeAttribute("src")
        
        // Force reload to clear any internal state
        console.log("🛑 [TTS STOP] Calling load() to reset audio element...")
        currentAudio.load()
        
        // Verify it's actually paused
        console.log("🛑 [TTS STOP] Verifying paused state after stop...")
        if (!currentAudio.paused) {
          console.warn("🛑 [TTS STOP] Audio still not paused! Forcing pause again...")
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
        
        console.log("🛑 [TTS STOP] Audio paused state after stop:", currentAudio.paused)
        console.log("🛑 [TTS STOP] Audio currentTime after stop:", currentAudio.currentTime)
        
      } catch (error) {
        console.error("🛑 [TTS STOP] Error stopping audio:", error)
      } finally {
        // Always clean up references, even if errors occurred
        console.log("🛑 [TTS STOP] Cleaning up references...")
        audioRef.current = null
        isPlayingRef.current = false
        currentAudioIdRef.current = null
        console.log("🛑 [TTS STOP] References cleared")
      }
    } else {
      console.log("🛑 [TTS STOP] No audio element found, cleaning up state only")
      // No audio element, but ensure state is clean
      isPlayingRef.current = false
      currentAudioIdRef.current = null
    }
    
    // Clean up URL if it exists
    if (audioUrl || audioUrlRef.current) {
      console.log("🛑 [TTS STOP] Revoking audio URL...")
      const urlToRevoke = audioUrl || audioUrlRef.current
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke)
      }
      setAudioUrl(null)
      audioUrlRef.current = null
    }
    
    // Update state
    console.log("🛑 [TTS STOP] Updating React state...")
    setIsPlaying(false)
    setTtsLoading(false)
    console.log("🛑 [TTS STOP] Stop complete!")
  }

  const handleSpeak = async (text: string) => {
    console.log("🔊 [TTS SPEAK] handleSpeak called with text length:", text?.length)
    
    if (!text || !text.trim()) {
      console.log("🔊 [TTS SPEAK] No text provided, returning")
      return
    }

    // If already playing, stop it first
    if (audioRef.current || isPlayingRef.current) {
      console.log("🔊 [TTS SPEAK] Audio already playing, stopping first...")
      handleStop()
      // Wait a bit for stop to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log("🔊 [TTS SPEAK] Stop complete, returning")
      return
    }

    // Prevent starting if already loading
    if (ttsLoading) {
      console.log("🔊 [TTS SPEAK] Already loading, returning")
      return
    }

    // Generate unique ID for this audio instance
    const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log("🔊 [TTS SPEAK] Generated audio ID:", audioId)
    currentAudioIdRef.current = audioId

    try {
      console.log("🔊 [TTS SPEAK] Setting loading state...")
      setTtsLoading(true)

      console.log("🔊 [TTS SPEAK] Calling TTS endpoint...")
      // Call TTS endpoint
      const response = await fetch(API_ENDPOINTS.TTS.SPEAK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, lang: "en" }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to generate speech" }))
        const errorMessage = errorData.detail || errorData.message || "Failed to generate speech"
        throw new Error(errorMessage)
      }

      console.log("🔊 [TTS SPEAK] TTS response received, creating blob...")
      // Create blob URL from audio response
      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      console.log("🔊 [TTS SPEAK] Blob URL created:", url.substring(0, 50) + "...")
      setAudioUrl(url)
      audioUrlRef.current = url // Also store in ref for cleanup

      // Clean up previous audio if exists (shouldn't happen, but just in case)
      if (audioRef.current) {
        console.warn("🔊 [TTS SPEAK] Previous audio still exists, cleaning up...")
        const previousAudio: HTMLAudioElement = audioRef.current
        try {
          previousAudio.pause()
          previousAudio.currentTime = 0
          previousAudio.src = ""
          previousAudio.load()
        } catch (err) {
          console.error("🔊 [TTS SPEAK] Error cleaning up previous audio:", err)
        }
        audioRef.current = null
      }

      console.log("🔊 [TTS SPEAK] Creating new Audio element...")
      // Play audio
      const audio = new Audio(url)
      audio.volume = 1.0 // Set volume to maximum
      audioRef.current = audio
      console.log("🔊 [TTS SPEAK] Audio element created and stored in ref")

      // Set up event handlers with audio ID check
      const handleEnded = () => {
        console.log("🔊 [TTS SPEAK] 'ended' event fired for audio ID:", audioId)
        console.log("🔊 [TTS SPEAK] currentAudioIdRef:", currentAudioIdRef.current)
        console.log("🔊 [TTS SPEAK] audioRef.current === audio:", audioRef.current === audio)
        
        // Only process if this is still the current audio
        if (currentAudioIdRef.current === audioId && audioRef.current === audio) {
          console.log("🔊 [TTS SPEAK] Processing 'ended' event...")
          isPlayingRef.current = false
          setIsPlaying(false)
          URL.revokeObjectURL(url)
          setAudioUrl(null)
          audioUrlRef.current = null
          audioRef.current = null
          currentAudioIdRef.current = null
          audioEventHandlersRef.current = { ended: null, error: null }
          console.log("🔊 [TTS SPEAK] 'ended' event processed, cleanup complete")
        } else {
          console.log("🔊 [TTS SPEAK] 'ended' event ignored - audio ID mismatch or ref mismatch")
        }
      }

      const handleError = (e: Event) => {
        console.error("🔊 [TTS SPEAK] 'error' event fired:", e)
        console.log("🔊 [TTS SPEAK] currentAudioIdRef:", currentAudioIdRef.current)
        console.log("🔊 [TTS SPEAK] audioRef.current === audio:", audioRef.current === audio)
        
        // Only process if this is still the current audio
        if (currentAudioIdRef.current === audioId && audioRef.current === audio) {
          console.log("🔊 [TTS SPEAK] Processing 'error' event...")
          isPlayingRef.current = false
          setIsPlaying(false)
          setTtsLoading(false)
          URL.revokeObjectURL(url)
          setAudioUrl(null)
          audioUrlRef.current = null
          audioRef.current = null
          currentAudioIdRef.current = null
          audioEventHandlersRef.current = { ended: null, error: null }
          alert("Failed to play audio. Please check your browser audio settings.")
          console.log("🔊 [TTS SPEAK] 'error' event processed, cleanup complete")
        } else {
          console.log("🔊 [TTS SPEAK] 'error' event ignored - audio ID mismatch or ref mismatch")
        }
      }

      // Store handlers in ref so they can be removed in handleStop
      audioEventHandlersRef.current = { ended: handleEnded, error: handleError }
      console.log("🔊 [TTS SPEAK] Event handlers created and stored")
      audio.addEventListener("ended", handleEnded)
      audio.addEventListener("error", handleError)
      console.log("🔊 [TTS SPEAK] Event listeners attached")

      // Wait for audio to be ready, then play
      try {
        console.log("🔊 [TTS SPEAK] Setting preload and waiting for audio to be ready...")
        // Preload the audio
        audio.preload = "auto"
        
        // Wait for the audio to be ready
        await new Promise<void>((resolve, reject) => {
          if (audio.readyState >= 2) {
            // Already loaded
            console.log("🔊 [TTS SPEAK] Audio already loaded (readyState >= 2)")
            resolve()
          } else {
            console.log("🔊 [TTS SPEAK] Waiting for 'canplaythrough' event...")
            const onCanPlay = () => {
              console.log("🔊 [TTS SPEAK] 'canplaythrough' event received")
              audio.removeEventListener("canplaythrough", onCanPlay)
              audio.removeEventListener("error", onError)
              resolve()
            }
            const onError = () => {
              console.error("🔊 [TTS SPEAK] Error loading audio")
              audio.removeEventListener("canplaythrough", onCanPlay)
              audio.removeEventListener("error", onError)
              reject(new Error("Audio failed to load"))
            }
            audio.addEventListener("canplaythrough", onCanPlay)
            audio.addEventListener("error", onError)
            audio.load()
          }
        })

        // Check if audio was stopped while loading
        if (currentAudioIdRef.current !== audioId || audioRef.current !== audio) {
          console.log("🔊 [TTS SPEAK] Audio was stopped while loading, aborting play")
          return
        }

        console.log("🔊 [TTS SPEAK] Audio ready, calling play()...")
        // Now play the audio
        await audio.play()
        
        // Double-check audio ID before updating state
        if (currentAudioIdRef.current === audioId && audioRef.current === audio) {
          console.log("🔊 [TTS SPEAK] Audio playing, updating state...")
          isPlayingRef.current = true
          setIsPlaying(true)
          setTtsLoading(false)
          console.log("🔊 [TTS SPEAK] State updated, audio should be playing now")
        } else {
          console.log("🔊 [TTS SPEAK] Audio ID mismatch after play, stopping...")
          audio.pause()
          audio.currentTime = 0
        }
      } catch (playError) {
        console.error("🔊 [TTS SPEAK] Play error:", playError)
        // AbortError is expected if play() is interrupted
        if (playError instanceof Error && playError.name !== "AbortError") {
          console.error("🔊 [TTS SPEAK] Non-abort play error:", playError)
          alert("Failed to play audio. Please check your browser audio settings.")
        } else {
          console.log("🔊 [TTS SPEAK] Play was aborted (expected)")
        }
        isPlayingRef.current = false
        setIsPlaying(false)
        setTtsLoading(false)
        // Remove event listeners
        const handlers = audioEventHandlersRef.current
        if (handlers.ended) {
          audio.removeEventListener("ended", handlers.ended)
          console.log("🔊 [TTS SPEAK] Removed 'ended' listener after play error")
        }
        if (handlers.error) {
          audio.removeEventListener("error", handlers.error)
          console.log("🔊 [TTS SPEAK] Removed 'error' listener after play error")
        }
        audioEventHandlersRef.current = { ended: null, error: null }
        // Clean up if audio was created but failed to play
        if (audioRef.current === audio) {
          audioRef.current = null
          currentAudioIdRef.current = null
          URL.revokeObjectURL(url)
          setAudioUrl(null)
          audioUrlRef.current = null
        }
      }
    } catch (error) {
      console.error("🔊 [TTS SPEAK] TTS error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate speech"
      alert(`TTS Error: ${errorMessage}`)
      isPlayingRef.current = false
      setTtsLoading(false)
      setIsPlaying(false)
      currentAudioIdRef.current = null
    }
  }

  const handleGenerateReport = () => {
    if (!payload || !displayVerdict) return
    setShowPreview(true)
  }

  const renderSummaryCard = (currentVerdict: ClaimVerdict) => (
    <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-xl shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm uppercase tracking-[0.2em] text-foreground/50">Summary</div>
        {currentVerdict.summary && (
          <button
            onClick={() => {
              console.log("🔘 [BUTTON] TTS button clicked")
              console.log("🔘 [BUTTON] isPlaying state:", isPlaying)
              console.log("🔘 [BUTTON] isPlayingRef.current:", isPlayingRef.current)
              console.log("🔘 [BUTTON] audioRef.current:", audioRef.current)
              console.log("🔘 [BUTTON] ttsLoading:", ttsLoading)
              
              if (isPlaying || isPlayingRef.current) {
                console.log("🔘 [BUTTON] Calling handleStop()...")
                handleStop()
              } else {
                console.log("🔘 [BUTTON] Calling handleSpeak()...")
                handleSpeak(currentVerdict.summary!)
              }
            }}
            disabled={ttsLoading}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-foreground/10 hover:bg-foreground/20 border border-foreground/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isPlaying ? "Stop playback" : "Read summary aloud"}
          >
            {ttsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground/70" />
            ) : isPlaying ? (
              <Square className="h-4 w-4 text-foreground/70" />
            ) : (
              <Volume2 className="h-4 w-4 text-foreground/70" />
            )}
          </button>
        )}
      </div>
      {currentVerdict.summary ? (
        <p className="text-foreground/80 leading-relaxed text-base">
          {currentVerdict.summary}
        </p>
      ) : (
        <p className="text-foreground/50 italic">No summary available yet.</p>
      )}
    </div>
  )

  if (storageError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition rounded-lg px-2 py-1"
          onClick={() => router.push("/dashboard/trends")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-200">
          {storageError}
        </div>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/50" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition rounded-lg px-2 py-1"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          {displayVerdict && (
            <button
              onClick={handleGenerateReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/50 text-primary rounded-lg hover:bg-primary/20 hover:border-primary transition-all shadow-lg"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>
          )}
          <div className="text-xs text-foreground/50 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {loading || processingStage
              ? `${processingStage || "Processing..."} • ${(elapsedMs / 1000).toFixed(1)}s`
              : displayVerdict
                ? `Completed • ${(elapsedMs / 1000).toFixed(1)}s`
                : "Completed"}
          </div>
        </div>
      </div>

      {/* News header - Only title */}
      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl p-6 backdrop-blur-xl shadow-lg">
        <h1 className="text-3xl font-semibold text-foreground">{payload.title}</h1>
      </div>

      {/* Verdict and Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Verdict and Score */}
        {displayVerdict ? (
          renderVerdictCard(displayVerdict)
        ) : (
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-xl shadow-lg flex flex-col items-start gap-3">
            <ShieldQuestion className="h-10 w-10 text-foreground/40" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-foreground/50">
                Verdict Pending
              </p>
              <p className="text-foreground/80">
                The misinformation pipeline is reviewing this article. This usually takes ~1–2 minutes.
              </p>
            </div>
          </div>
        )}

        {/* Right: Summary */}
        {displayVerdict ? (
          renderSummaryCard(displayVerdict)
        ) : (
          <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-xl shadow-lg flex flex-col items-start gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-foreground/50 mb-2">
                Summary
              </p>
              <p className="text-foreground/50 italic">
                Summary will appear once the analysis is complete.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sentiment and Emotion Graphs */}
      {(displayVerdict?.sentiment_analysis || displayVerdict?.emotion_analysis) && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Sentiment Pie Chart */}
          {displayVerdict.sentiment_analysis && (() => {
            const sentimentData = Object.entries(displayVerdict.sentiment_analysis.sentiment_distribution).map(([name, value]) => ({
              id: name.charAt(0).toUpperCase() + name.slice(1),
              value,
              color: name === "positive" ? "#10b981" : name === "negative" ? "#ef4444" : "#6b7280", // green, red, gray
            }))

            return (
              <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-xl shadow-lg">
                <div className="text-sm uppercase tracking-[0.2em] text-foreground/50 mb-4">
                  Sentiment Analysis
                </div>
                <div className="h-64">
                  <ResponsivePie
                    data={sentimentData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.5}
                    padAngle={3}
                    cornerRadius={6}
                    activeOuterRadiusOffset={8}
                    colors={{ datum: "data.color" }}
                    borderWidth={2}
                    borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                    enableArcLinkLabels={true}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="var(--foreground)"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                    tooltip={({ datum }) => (
                      <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: datum.color }}
                          />
                          <div className="text-white text-sm font-medium">
                            {datum.id}: {datum.value.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                    theme={{
                      background: "transparent",
                      text: {
                        fontSize: 12,
                        fill: "var(--foreground)",
                      },
                      tooltip: {
                        container: {
                          background: "rgba(0, 0, 0, 0.9)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        },
                      },
                    }}
                  />
                </div>
                <div className="mt-4 text-xs text-foreground/50 text-center">
                  Primary: <span className="capitalize font-medium text-foreground/70">{displayVerdict.sentiment_analysis.primary_sentiment}</span>
                </div>
              </div>
            )
          })()}

          {/* Emotion Pie Chart */}
          {displayVerdict.emotion_analysis && (() => {
            const emotionData = Object.entries(displayVerdict.emotion_analysis.emotion_distribution).map(([name, value]) => ({
              id: name.charAt(0).toUpperCase() + name.slice(1),
              value,
              color: 
                name === "joy" ? "#eab308" : // yellow-500
                name === "anger" ? "#dc2626" : // red-600
                name === "sadness" ? "#3b82f6" : // blue-500
                name === "fear" ? "#a855f7" : // purple-500
                name === "surprise" ? "#f97316" : // orange-500
                "#16a34a", // green-600 for disgust
            }))

            return (
              <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-xl shadow-lg">
                <div className="text-sm uppercase tracking-[0.2em] text-foreground/50 mb-4">
                  Emotion Analysis
                </div>
                <div className="h-64">
                  <ResponsivePie
                    data={emotionData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    innerRadius={0.5}
                    padAngle={3}
                    cornerRadius={6}
                    activeOuterRadiusOffset={8}
                    colors={{ datum: "data.color" }}
                    borderWidth={2}
                    borderColor={{ from: "color", modifiers: [["darker", 0.3]] }}
                    enableArcLinkLabels={true}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="var(--foreground)"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: "color" }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                    tooltip={({ datum }) => (
                      <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 shadow-xl">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: datum.color }}
                          />
                          <div className="text-white text-sm font-medium">
                            {datum.id}: {datum.value.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                    theme={{
                      background: "transparent",
                      text: {
                        fontSize: 12,
                        fill: "var(--foreground)",
                      },
                      tooltip: {
                        container: {
                          background: "rgba(0, 0, 0, 0.9)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        },
                      },
                    }}
                  />
                </div>
                <div className="mt-4 text-xs text-foreground/50 text-center">
                  Primary: <span className="capitalize font-medium text-foreground/70">{displayVerdict.emotion_analysis.primary_emotion}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Pipeline Status */}
      {(loading || processingStage || error) && (
        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-3">
          <div className="text-sm text-foreground/60">Pipeline Status</div>
          <div className="font-mono text-foreground text-lg">
            {processingStage ?? (loading ? "Processing…" : "Idle")}
          </div>
          <div className="text-xs text-foreground/50">
            Elapsed: {(elapsedMs / 1000).toFixed(1)}s
          </div>
          {error && (
            <div className="text-sm text-red-400 border border-red-500/30 rounded-xl p-3 bg-red-500/10">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Evidence */}
      {displayVerdict?.sources_used?.length ? (
        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 backdrop-blur-xl shadow-lg">
          <div className="text-sm text-foreground/60 mb-3">
            Supporting Evidence ({displayVerdict.sources_used.length})
          </div>
          <div className="space-y-3 max-h-80 overflow-auto pr-2">
            {displayVerdict.sources_used.map((source, idx) => (
              <a
                key={`${source.url}-${idx}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-[var(--glass-border)] rounded-xl px-4 py-3 hover:bg-foreground/5 transition-colors"
              >
                <div className="text-sm font-medium text-foreground">{source.source_name}</div>
                <div className="text-xs text-foreground/60 truncate">{source.url}</div>
                {source.agent_name && (
                  <div className="text-[11px] text-foreground/50 mt-1 uppercase tracking-wide">
                    Via {source.agent_name}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {/* Agent outputs */}
      {displayAgents.length > 0 && (
        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground/60">Agent Outputs</div>
            <span className="text-xs text-foreground/50">{displayAgents.length} modules</span>
          </div>
          <div className="space-y-3">
            {displayAgents.map(agent => (
              <details
                key={agent._id}
                className="border border-[var(--glass-border)] rounded-xl p-4 bg-background/30"
              >
                <summary className="cursor-pointer text-sm font-semibold text-foreground flex justify-between gap-2">
                  <span>
                    {agent.agent_name ?? agent.agent_key} ·{" "}
                    <span className="text-foreground/60 text-xs uppercase">
                      {agent.agent_type ?? "agent"}
                    </span>
                  </span>
                </summary>
                <pre className="mt-3 text-xs text-foreground/70 whitespace-pre-wrap overflow-auto max-h-72 bg-black/20 px-3 py-2 rounded-lg">
                  {JSON.stringify(agent.output, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        payload={payload}
        verdict={displayVerdict}
        agents={displayAgents}
        elapsedMs={elapsedMs}
      />
    </div>
  )
}

