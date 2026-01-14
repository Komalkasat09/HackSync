import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type { ClaimVerdict, AgentRecord } from "@/types/claims"
import type { AnalyzeNewsPayload } from "@/types/news"

interface GenerateReportOptions {
  payload: AnalyzeNewsPayload
  verdict: ClaimVerdict
  agents: AgentRecord[]
  elapsedMs: number
  sentimentChartElement?: HTMLElement | null
  emotionChartElement?: HTMLElement | null
  confidenceChartElement?: HTMLElement | null
}

export async function generatePDFReport({
  payload,
  verdict,
  agents,
  elapsedMs,
  sentimentChartElement,
  emotionChartElement,
  confidenceChartElement,
}: GenerateReportOptions): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let yPos = margin

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }


  // ========== PAGE 1: COVER & SUMMARY ==========
  
  // Header Box with gradient effect
  doc.setFillColor(15, 23, 42) // Dark blue-gray
  doc.roundedRect(margin - 5, margin - 5, contentWidth + 10, 50, 3, 3, "F")
  
  // ALETHEIA Branding (Top)
  doc.setFontSize(36)
  doc.setTextColor(251, 191, 36) // Gold/amber
  doc.setFont("helvetica", "bold")
  doc.text("ALETHEIA", margin + 5, margin + 15)
  
  // Subtitle
  doc.setFontSize(11)
  doc.setTextColor(203, 213, 225) // Light gray
  doc.setFont("helvetica", "normal")
  doc.text("Misinformation Detection System", margin + 5, margin + 25)
  yPos = margin + 55

  // Report Title Box
  doc.setFillColor(249, 250, 251) // Light gray background
  doc.roundedRect(margin, yPos, contentWidth, 35, 4, 4, "F")
  doc.setDrawColor(229, 231, 235) // Border
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, yPos, contentWidth, 35, 4, 4, "S")
  
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39) // Dark gray
  doc.setFont("helvetica", "bold")
  const claimText = payload.title || payload.content || "Analysis Report"
  const titleLines = doc.splitTextToSize(claimText, contentWidth - 10)
  doc.text(titleLines, margin + 5, yPos + 12)
  yPos += 42

  // Report Metadata Box
  doc.setFillColor(241, 245, 249) // Very light blue-gray
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, "F")
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, "S")
  
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139) // Medium gray
  doc.setFont("helvetica", "normal")
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.text(`Generated on ${reportDate}`, margin + 5, yPos + 8)
  if (payload.sourceName) {
    doc.text(`Source: ${payload.sourceName}`, margin + 5, yPos + 15)
  }
  yPos += 32

  // Verdict Box (Highlighted with gradient effect)
  checkNewPage(50)
  const verdictValue = (verdict.verdict || "Unknown").toUpperCase()
  const confidence = (verdict.confidence ?? 0) * 100
  
  // Determine verdict color
  let verdictColor: [number, number, number]
  if (verdictValue === "TRUE") {
    verdictColor = [34, 197, 94] // Green
  } else if (verdictValue === "FALSE") {
    verdictColor = [239, 68, 68] // Red
  } else if (verdictValue === "MIXED") {
    verdictColor = [251, 191, 36] // Amber
  } else {
    verdictColor = [107, 114, 128] // Gray
  }
  
  // Verdict background box with shadow effect
  doc.setFillColor(verdictColor[0], verdictColor[1], verdictColor[2])
  doc.roundedRect(margin, yPos, contentWidth, 42, 5, 5, "F")
  
  // Inner highlight
  doc.setFillColor(255, 255, 255, 20) // White with transparency
  doc.roundedRect(margin + 2, yPos + 2, contentWidth - 4, 15, 3, 3, "F")
  
  // Verdict text
  doc.setFontSize(32)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(verdictValue, margin + 12, yPos + 20)
  
  // Confidence badge
  doc.setFillColor(255, 255, 255, 30)
  doc.roundedRect(margin + contentWidth - 80, yPos + 25, 70, 12, 3, 3, "F")
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(`${confidence.toFixed(1)}% Confidence`, margin + contentWidth - 75, yPos + 32)
  yPos += 50

  // Confidence Chart (if available)
  if (confidenceChartElement) {
    checkNewPage(60)
    try {
      const canvas = await html2canvas(confidenceChartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Remove any elements with oklab colors or unsupported CSS
          const allElements = clonedDoc.querySelectorAll("*")
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            const style = window.getComputedStyle(htmlEl)
            if (style.color && style.color.includes("oklab")) {
              htmlEl.style.color = "#000000"
            }
            if (style.backgroundColor && style.backgroundColor.includes("oklab")) {
              htmlEl.style.backgroundColor = "#ffffff"
            }
          })
        },
      })
      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 60
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      doc.addImage(imgData, "PNG", margin + (contentWidth - imgWidth) / 2, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 10
    } catch (error) {
      console.error("Failed to capture confidence chart:", error)
    }
  }

  // Summary Section with Box
  checkNewPage(60)
  doc.setFillColor(255, 251, 235) // Warm white/cream
  doc.roundedRect(margin, yPos, contentWidth, 50, 4, 4, "F")
  doc.setDrawColor(251, 191, 36) // Gold border
  doc.setLineWidth(1)
  doc.roundedRect(margin, yPos, contentWidth, 50, 4, 4, "S")
  
  doc.setFontSize(13)
  doc.setTextColor(180, 83, 9) // Dark amber
  doc.setFont("helvetica", "bold")
  doc.text("Executive Summary", margin + 8, yPos + 10)
  
  doc.setDrawColor(251, 191, 36, 100)
  doc.setLineWidth(0.5)
  doc.line(margin + 8, yPos + 13, margin + contentWidth - 8, yPos + 13)
  
  const summary = verdict.summary || "No summary available."
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59) // Dark slate
  doc.setFont("helvetica", "normal")
  const summaryLines = doc.splitTextToSize(summary, contentWidth - 16)
  doc.text(summaryLines, margin + 8, yPos + 20)
  yPos += Math.max(50, summaryLines.length * 5 + 20) + 10

  // Key Statistics Boxes (Grid Layout)
  checkNewPage(60)
  const statBoxWidth = (contentWidth - 10) / 2
  const statBoxHeight = 28
  
  // Category Box
  doc.setFillColor(59, 130, 246) // Blue
  doc.roundedRect(margin, yPos, statBoxWidth, statBoxHeight, 4, 4, "F")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255, 200)
  doc.setFont("helvetica", "normal")
  doc.text("CATEGORY", margin + 8, yPos + 8)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(verdict.category || "N/A", margin + 8, yPos + 18)
  
  // Sub-category Box
  doc.setFillColor(139, 92, 246) // Purple
  doc.roundedRect(margin + statBoxWidth + 10, yPos, statBoxWidth, statBoxHeight, 4, 4, "F")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255, 200)
  doc.setFont("helvetica", "normal")
  doc.text("SUB-CATEGORY", margin + statBoxWidth + 18, yPos + 8)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(verdict.sub_category || "N/A", margin + statBoxWidth + 18, yPos + 18)
  
  yPos += statBoxHeight + 8
  
  // Analysis Time Box
  doc.setFillColor(236, 72, 153) // Pink
  doc.roundedRect(margin, yPos, statBoxWidth, statBoxHeight, 4, 4, "F")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255, 200)
  doc.setFont("helvetica", "normal")
  doc.text("ANALYSIS TIME", margin + 8, yPos + 8)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(`${(elapsedMs / 1000).toFixed(1)}s`, margin + 8, yPos + 18)
  
  // Agents Used Box
  doc.setFillColor(14, 165, 233) // Cyan
  doc.roundedRect(margin + statBoxWidth + 10, yPos, statBoxWidth, statBoxHeight, 4, 4, "F")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255, 200)
  doc.setFont("helvetica", "normal")
  doc.text("AGENTS USED", margin + statBoxWidth + 18, yPos + 8)
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(`${agents.length}`, margin + statBoxWidth + 18, yPos + 18)
  
  yPos += statBoxHeight + 15

  // Sources Section
  const sources = verdict.sources_used || []
  if (sources.length > 0) {
    checkNewPage(30 + sources.length * 8)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "bold")
    doc.text("Sources Used", margin, yPos)
    yPos += 8

    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    doc.setFont("helvetica", "normal")
    sources.forEach((source, idx) => {
      if (idx < 10) { // Limit to 10 sources
        const sourceText = `${idx + 1}. ${source.source_name || "Unknown"}: ${source.url}`
        const sourceLines = doc.splitTextToSize(sourceText, contentWidth)
        doc.text(sourceLines, margin, yPos)
        yPos += sourceLines.length * 4 + 2
      }
    })
    yPos += 10
  }

  // Keywords (if available) with Box
  const keywords = verdict.keywords || []
  if (keywords.length > 0) {
    checkNewPage(30)
    doc.setFillColor(243, 244, 246) // Light gray
    doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, "F")
    doc.setDrawColor(209, 213, 219)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, "S")
    
    doc.setFontSize(11)
    doc.setTextColor(55, 65, 81) // Gray
    doc.setFont("helvetica", "bold")
    doc.text("Keywords", margin + 8, yPos + 8)
    
    doc.setFontSize(9)
    doc.setTextColor(75, 85, 99)
    doc.setFont("helvetica", "normal")
    const keywordText = keywords.slice(0, 15).join(" • ")
    const keywordLines = doc.splitTextToSize(keywordText, contentWidth - 16)
    doc.text(keywordLines, margin + 8, yPos + 16)
    yPos += 30
  }

  // ========== PAGE 2: SENTIMENT & EMOTION ==========
  
  doc.addPage()
  yPos = margin

  // Page 2 Header Box
  doc.setFillColor(15, 23, 42) // Dark blue-gray
  doc.roundedRect(margin - 5, margin - 5, contentWidth + 10, 40, 3, 3, "F")
  
  doc.setFontSize(20)
  doc.setTextColor(251, 191, 36) // Gold
  doc.setFont("helvetica", "bold")
  doc.text("Sentiment & Emotion Analysis", margin + 5, margin + 15)
  
  doc.setFontSize(10)
  doc.setTextColor(203, 213, 225) // Light gray
  doc.setFont("helvetica", "normal")
  doc.text("Detailed psychological analysis of the claim", margin + 5, margin + 25)
  yPos = margin + 45

  // Sentiment Chart
  if (sentimentChartElement && verdict.sentiment_analysis) {
    try {
      const canvas = await html2canvas(sentimentChartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll("*")
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            const style = window.getComputedStyle(htmlEl)
            if (style.color && style.color.includes("oklab")) {
              htmlEl.style.color = "#000000"
            }
            if (style.backgroundColor && style.backgroundColor.includes("oklab")) {
              htmlEl.style.backgroundColor = "#ffffff"
            }
          })
        },
      })
      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 80
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Center the chart
      const chartX = margin + (contentWidth - imgWidth) / 2
      doc.addImage(imgData, "PNG", chartX, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 10

      // Sentiment details in a box
      checkNewPage(50)
      doc.setFillColor(239, 246, 255) // Light blue
      doc.roundedRect(margin, yPos, contentWidth, 45, 4, 4, "F")
      doc.setDrawColor(59, 130, 246) // Blue border
      doc.setLineWidth(1)
      doc.roundedRect(margin, yPos, contentWidth, 45, 4, 4, "S")
      
      doc.setFontSize(12)
      doc.setTextColor(30, 64, 175) // Dark blue
      doc.setFont("helvetica", "bold")
      doc.text("Sentiment Distribution", margin + 8, yPos + 10)
      
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      doc.setFont("helvetica", "normal")
      const sentiment = verdict.sentiment_analysis
      doc.setFont("helvetica", "bold")
      doc.text(`Primary: ${sentiment.primary_sentiment.toUpperCase()}`, margin + 8, yPos + 20)
      doc.setFont("helvetica", "normal")
      yPos += 25

      if (sentiment.sentiment_distribution) {
        Object.entries(sentiment.sentiment_distribution).forEach(([key, value]) => {
          const val = typeof value === "number" ? value.toFixed(1) : value
          doc.setFillColor(59, 130, 246, 20)
          doc.roundedRect(margin + 8, yPos - 3, (contentWidth - 16) * (Number(val) / 100), 4, 1, 1, "F")
          doc.text(
            `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}%`,
            margin + 10,
            yPos
          )
          yPos += 6
        })
      }
      yPos += 15
    } catch (error) {
      console.error("Failed to capture sentiment chart:", error)
    }
  }

  // Emotion Chart
  if (emotionChartElement && verdict.emotion_analysis) {
    checkNewPage(100)
    try {
      const canvas = await html2canvas(emotionChartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll("*")
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            const style = window.getComputedStyle(htmlEl)
            if (style.color && style.color.includes("oklab")) {
              htmlEl.style.color = "#000000"
            }
            if (style.backgroundColor && style.backgroundColor.includes("oklab")) {
              htmlEl.style.backgroundColor = "#ffffff"
            }
          })
        },
      })
      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 80
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Center the chart
      const chartX = margin + (contentWidth - imgWidth) / 2
      doc.addImage(imgData, "PNG", chartX, yPos, imgWidth, imgHeight)
      yPos += imgHeight + 10

      // Emotion details in a box
      checkNewPage(60)
      doc.setFillColor(253, 244, 255) // Light purple
      doc.roundedRect(margin, yPos, contentWidth, 55, 4, 4, "F")
      doc.setDrawColor(139, 92, 246) // Purple border
      doc.setLineWidth(1)
      doc.roundedRect(margin, yPos, contentWidth, 55, 4, 4, "S")
      
      doc.setFontSize(12)
      doc.setTextColor(88, 28, 135) // Dark purple
      doc.setFont("helvetica", "bold")
      doc.text("Emotion Distribution", margin + 8, yPos + 10)
      
      doc.setFontSize(10)
      doc.setTextColor(30, 41, 59)
      doc.setFont("helvetica", "normal")
      const emotion = verdict.emotion_analysis
      doc.setFont("helvetica", "bold")
      doc.text(`Primary: ${emotion.primary_emotion.toUpperCase()}`, margin + 8, yPos + 20)
      doc.setFont("helvetica", "normal")
      yPos += 28

      if (emotion.emotion_distribution) {
        Object.entries(emotion.emotion_distribution).forEach(([key, value]) => {
          const val = typeof value === "number" ? value.toFixed(1) : value
          doc.setFillColor(139, 92, 246, 20)
          doc.roundedRect(margin + 8, yPos - 3, (contentWidth - 16) * (Number(val) / 100), 4, 1, 1, "F")
          doc.text(
            `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}%`,
            margin + 10,
            yPos
          )
          yPos += 6
        })
      }
    } catch (error) {
      console.error("Failed to capture emotion chart:", error)
    }
  }

  // Footer on last page
  // Using cast to any because some jsPDF type definitions don't include getNumberOfPages
  const pageCount = (doc as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Page ${i} of ${pageCount} - Generated by ALETHEIA`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    )
  }

  // Return PDF as blob instead of downloading
  const pdfBlob = doc.output("blob")
  return pdfBlob
}

