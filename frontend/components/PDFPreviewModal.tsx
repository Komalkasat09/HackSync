"use client"

import { X, Download } from "lucide-react"
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer"
import ReportPDF from "./ReportPDF"
import type { ClaimVerdict, AgentRecord } from "@/types/claims"
import type { AnalyzeNewsPayload } from "@/types/news"

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  payload: AnalyzeNewsPayload | null
  verdict: ClaimVerdict | null
  agents: AgentRecord[]
  elapsedMs: number
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  payload,
  verdict,
  agents,
  elapsedMs,
}: PDFPreviewModalProps) {
  if (!isOpen || !payload || !verdict) return null

  const fileName = `aletheia-report-${payload.title?.substring(0, 30).replace(/[^a-z0-9]/gi, "-") || "claim"}-${Date.now()}.pdf`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Report Preview</h2>
            <p className="text-sm text-gray-600 mt-1">Review your analysis report before downloading</p>
          </div>
          <div className="flex items-center gap-3">
            <PDFDownloadLink
              document={<ReportPDF payload={payload} verdict={verdict} agents={agents} elapsedMs={elapsedMs} />}
              fileName={fileName}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              {({ loading }) => (
                <>
                  <Download className="w-4 h-4" />
                  {loading ? "Preparing..." : "Download PDF"}
                </>
              )}
            </PDFDownloadLink>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* PDF Viewer - Scrollable */}
        <div className="flex-1 overflow-auto bg-gray-100">
          <PDFViewer width="100%" height="100%" className="border-0">
            <ReportPDF payload={payload} verdict={verdict} agents={agents} elapsedMs={elapsedMs} />
          </PDFViewer>
        </div>
      </div>
    </div>
  )
}
