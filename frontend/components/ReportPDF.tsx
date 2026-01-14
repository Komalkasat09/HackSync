"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { ClaimVerdict, AgentRecord } from "@/types/claims"
import type { AnalyzeNewsPayload } from "@/types/news"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333",
    backgroundColor: "#ffffff",
  },
  header: {
    fontSize: 28,
    marginBottom: 5,
    textAlign: "center",
    color: "#1a1a1a",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#666",
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  divider: {
    borderBottom: "1px solid #e5e5e5",
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
    padding: 18,
    border: "1px solid #e5e5e5",
    borderRadius: 4,
    backgroundColor: "#fafafa",
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
    borderBottom: "1px solid #e5e5e5",
    paddingBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  claimBox: {
    padding: 18,
    border: "1px solid #e5e5e5",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },
  claimText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  metadata: {
    fontSize: 9,
    color: "#666",
    marginTop: 4,
  },
  verdictBox: {
    padding: 25,
    border: "2px solid #1a1a1a",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  verdictText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 10,
    letterSpacing: 1,
  },
  confidenceText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "normal",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
    gap: 10,
  },
  statBox: {
    width: "48%",
    marginBottom: 10,
    padding: 14,
    border: "1px solid #e5e5e5",
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  statLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  summaryText: {
    fontSize: 10,
    color: "#333",
    lineHeight: 1.7,
  },
  sourcesList: {
    marginTop: 12,
  },
  sourceItem: {
    fontSize: 9,
    color: "#333",
    marginBottom: 8,
    paddingLeft: 12,
    lineHeight: 1.5,
  },
  urlText: {
    fontSize: 9,
    color: "#2563eb",
    textDecoration: "underline",
  },
  keywordsBox: {
    padding: 15,
    border: "1px solid #e5e5e5",
    borderRadius: 4,
    backgroundColor: "#f9f9f9",
    marginBottom: 18,
  },
  keywordsText: {
    fontSize: 10,
    color: "#333",
    lineHeight: 1.6,
  },
  sentimentEmotionBox: {
    padding: 18,
    border: "1px solid #e5e5e5",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },
  distributionItem: {
    fontSize: 10,
    color: "#333",
    marginBottom: 5,
    paddingLeft: 12,
    lineHeight: 1.4,
  },
  primaryLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 10,
    marginTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#999",
    fontSize: 9,
    borderTop: "1px solid #e5e5e5",
    paddingTop: 10,
  },
  chartPlaceholder: {
    padding: 30,
    border: "1px dashed #e5e5e5",
    borderRadius: 4,
    textAlign: "center",
    color: "#999",
    fontSize: 9,
    marginBottom: 15,
    backgroundColor: "#fafafa",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    color: "#666",
    fontSize: 10,
  },
  value: {
    fontWeight: "bold",
    color: "#1a1a1a",
    fontSize: 10,
  },
})

interface ReportPDFProps {
  payload: AnalyzeNewsPayload
  verdict: ClaimVerdict
  agents: AgentRecord[]
  elapsedMs: number
}

const ReportPDF = ({ payload, verdict, agents, elapsedMs }: ReportPDFProps) => {
  const claimText = payload.title || payload.content || "N/A"
  const verdictValue = (verdict.verdict || "Unknown").toUpperCase()
  const confidence = (verdict.confidence ?? 0) * 100
  const summary = verdict.summary || "No summary available."
  const category = verdict.category || "N/A"
  const subCategory = verdict.sub_category || "N/A"
  const keywords = verdict.keywords || []
  const sources = verdict.sources_used || []
  const sentiment = verdict.sentiment_analysis
  const emotion = verdict.emotion_analysis
  const elapsedSeconds = (elapsedMs / 1000).toFixed(1)

  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>ALETHEIA</Text>
        <Text style={styles.subtitle}>Misinformation Detection System</Text>
        <View style={styles.divider} />

        {/* Claim/Title */}
        <View style={styles.claimBox}>
          <Text style={styles.claimText}>{claimText}</Text>
          {payload.sourceName && (
            <Text style={styles.metadata}>Source: {payload.sourceName}</Text>
          )}
          <Text style={styles.metadata}>Generated on {reportDate}</Text>
        </View>

        {/* Verdict */}
        <View style={styles.verdictBox}>
          <Text style={styles.verdictText}>{verdictValue}</Text>
          <Text style={styles.confidenceText}>Confidence: {confidence.toFixed(1)}%</Text>
        </View>

        {/* Statistics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.value}>{category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Sub-Category:</Text>
            <Text style={styles.value}>{subCategory}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Analysis Time:</Text>
            <Text style={styles.value}>{elapsedSeconds}s</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>

        {/* Keywords */}
        {keywords.length > 0 && (
          <View style={styles.keywordsBox}>
            <Text style={styles.sectionTitle}>Keywords</Text>
            <Text style={styles.keywordsText}>{keywords.slice(0, 15).join(" • ")}</Text>
          </View>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sources Used</Text>
            <View style={styles.sourcesList}>
              {sources.slice(0, 10).map((source, idx) => (
                <Text key={idx} style={styles.sourceItem}>
                  {idx + 1}. {source.source_name || "Unknown"}:{" "}
                  <Text style={styles.urlText}>{source.url}</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by ALETHEIA • Page 1
        </Text>
      </Page>

      {/* Page 2: Sentiment & Emotion */}
      {(sentiment || emotion) && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Sentiment & Emotion Analysis</Text>
          <View style={styles.divider} />

          {/* Sentiment Analysis */}
          {sentiment && (
            <View style={styles.sentimentEmotionBox}>
              <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
              <View style={styles.chartPlaceholder}>
                <Text>Sentiment Distribution Chart</Text>
              </View>
              <Text style={styles.primaryLabel}>
                Primary Sentiment: {sentiment.primary_sentiment.toUpperCase()}
              </Text>
              {sentiment.sentiment_distribution &&
                Object.entries(sentiment.sentiment_distribution).map(([key, value]) => (
                  <Text key={key} style={styles.distributionItem}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                    {typeof value === "number" ? value.toFixed(1) : value}%
                  </Text>
                ))}
            </View>
          )}

          {/* Emotion Analysis */}
          {emotion && (
            <View style={styles.sentimentEmotionBox}>
              <Text style={styles.sectionTitle}>Emotion Analysis</Text>
              <View style={styles.chartPlaceholder}>
                <Text>Emotion Distribution Chart</Text>
              </View>
              <Text style={styles.primaryLabel}>
                Primary Emotion: {emotion.primary_emotion.toUpperCase()}
              </Text>
              {emotion.emotion_distribution &&
                Object.entries(emotion.emotion_distribution).map(([key, value]) => (
                  <Text key={key} style={styles.distributionItem}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                    {typeof value === "number" ? value.toFixed(1) : value}%
                  </Text>
                ))}
            </View>
          )}

          {/* Footer */}
          <Text style={styles.footer}>
            Generated by ALETHEIA • Page 2
          </Text>
        </Page>
      )}
    </Document>
  )
}

export default ReportPDF

