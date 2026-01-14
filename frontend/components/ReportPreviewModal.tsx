"use client"

import { X, Download } from "lucide-react"
import type { ClaimVerdict, AgentRecord } from "@/types/claims"
import type { AnalyzeNewsPayload } from "@/types/news"

interface ReportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  payload: AnalyzeNewsPayload | null
  verdict: ClaimVerdict | null
  agents: AgentRecord[]
  elapsedMs: number
  onGenerate: () => void
  isGenerating?: boolean
}

export default function ReportPreviewModal({
  isOpen,
  onClose,
  payload,
  verdict,
  agents,
  elapsedMs,
  onGenerate,
  isGenerating = false,
}: ReportPreviewModalProps) {
  if (!isOpen || !payload || !verdict) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6 backdrop-blur-xl shadow-2xl max-w-md w-full mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-foreground/10 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-foreground/70" />
        </button>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Generate Report</h2>
            <p className="text-sm text-foreground/60">
              Create a professional PDF report of your analysis with charts and detailed findings.
            </p>
          </div>

          {/* Info */}
          <div className="bg-foreground/5 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/60">Verdict:</span>
              <span className="text-foreground font-medium capitalize">{verdict.verdict || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Confidence:</span>
              <span className="text-foreground font-medium">
                {((verdict.confidence ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Analysis Time:</span>
              <span className="text-foreground font-medium">{(elapsedMs / 1000).toFixed(1)}s</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[var(--glass-border)] rounded-lg text-foreground/70 hover:bg-foreground/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-200 rounded-lg hover:from-amber-500/30 hover:to-yellow-500/30 transition-all backdrop-blur-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
