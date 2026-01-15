"use client";

import { useState } from "react";
import { 
  FileSearch, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  FileText,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play
} from "lucide-react";

interface ATSSuggestion {
  category: string;
  issue: string;
  suggestion: string;
  impact: string;
  priority: number;
}

interface ATSAnalysis {
  score: number;
  overall_assessment: string;
  keyword_match_rate?: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: ATSSuggestion[];
  timestamp: string;
}

interface SkillGap {
  skill: string;
  category: string;
  importance: string;
  found_in_jd: boolean;
  found_in_resume: boolean;
}

interface LearningResource {
  title: string;
  url: string;
  platform: string;
  thumbnail?: string;
  duration?: string;
  is_free: boolean;
  rating?: number;
  instructor?: string;
}

interface GapWithResources {
  skill: string;
  category: string;
  importance: string;
  resources: LearningResource[];
}

interface GapAnalysis {
  score: number;
  matched_percentage: number;
  matching_keywords: string[];
  missing_keywords: string[];
  skill_gaps: SkillGap[];
  gaps_with_resources: GapWithResources[];
  recommendations: string[];
  timestamp: string;
}

interface ComprehensiveAnalysis {
  ats_analysis: ATSAnalysis;
  gap_analysis: GapAnalysis;
  overall_recommendation: string;
  action_plan: string[];
  timestamp: string;
}

export default function ResumeAnalysisPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysisType, setAnalysisType] = useState<"ats" | "gap" | "comprehensive">("comprehensive");
  const [loading, setLoading] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [gapResult, setGapResult] = useState<GapAnalysis | null>(null);
  const [comprehensiveResult, setComprehensiveResult] = useState<ComprehensiveAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["suggestions", "gaps", "resources"]));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const analyzeResume = async () => {
    if (!resumeText || resumeText.length < 50) {
      setError("Please provide a complete resume (at least 50 characters)");
      return;
    }

    if (analysisType !== "ats" && (!jobDescription || jobDescription.length < 50)) {
      setError("Please provide a job description (at least 50 characters)");
      return;
    }

    setLoading(true);
    setError(null);
    setAtsResult(null);
    setGapResult(null);
    setComprehensiveResult(null);

    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      let body: any = { resume_text: resumeText };

      if (analysisType === "ats") {
        endpoint = "http://localhost:8000/api/resume-analysis/ats-check";
        if (jobDescription) body.job_description = jobDescription;
      } else if (analysisType === "gap") {
        endpoint = "http://localhost:8000/api/resume-analysis/gap-analysis";
        body.job_description = jobDescription;
      } else {
        endpoint = "http://localhost:8000/api/resume-analysis/comprehensive-analysis";
        body.job_description = jobDescription;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Analysis failed");
      }

      const data = await response.json();

      if (analysisType === "ats") {
        setAtsResult(data);
      } else if (analysisType === "gap") {
        setGapResult(data);
      } else {
        setComprehensiveResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 65) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getImpactColor = (impact: string) => {
    if (impact === "high") return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    if (impact === "medium") return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
  };

  const getImportanceColor = (importance: string) => {
    if (importance === "critical") return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700";
    if (importance === "high") return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700";
    if (importance === "medium") return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700";
    return "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-foreground/10 rounded-xl">
              <FileSearch className="w-7 h-7 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">AI Resume Analysis</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Get ATS compatibility scores and identify skill gaps with actionable improvement suggestions
          </p>
        </div>

        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Resume Input */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Your Resume
              </h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity text-sm">
                  <Upload className="w-4 h-4" />
                  Upload .txt
                </div>
              </label>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here or upload a .txt file..."
              className="w-full h-64 p-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {resumeText.length} characters {resumeText.length >= 50 ? "✓" : "(minimum 50)"}
            </p>
          </div>

          {/* Job Description Input */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Job Description
            </h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here (required for gap analysis)..."
              className="w-full h-64 p-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {jobDescription.length} characters {analysisType === "ats" ? "(optional)" : jobDescription.length >= 50 ? "✓" : "(minimum 50)"}
            </p>
          </div>
        </div>

        {/* Analysis Options */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Analysis Type</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => setAnalysisType("ats")}
              className={`p-4 rounded-lg border-2 transition-all ${
                analysisType === "ats"
                  ? "border-foreground bg-foreground/10"
                  : "border-border hover:border-foreground/50"
              }`}
            >
              <CheckCircle2 className={`w-6 h-6 mb-2 ${analysisType === "ats" ? "text-foreground" : "text-muted-foreground"}`} />
              <h4 className="font-semibold text-foreground mb-1">ATS Check</h4>
              <p className="text-sm text-muted-foreground">Analyze ATS compatibility and formatting</p>
            </button>

            <button
              onClick={() => setAnalysisType("gap")}
              className={`p-4 rounded-lg border-2 transition-all ${
                analysisType === "gap"
                  ? "border-foreground bg-foreground/10"
                  : "border-border hover:border-foreground/50"
              }`}
            >
              <TrendingUp className={`w-6 h-6 mb-2 ${analysisType === "gap" ? "text-foreground" : "text-muted-foreground"}`} />
              <h4 className="font-semibold text-foreground mb-1">Gap Analysis</h4>
              <p className="text-sm text-muted-foreground">Find skill gaps with learning resources</p>
            </button>

            <button
              onClick={() => setAnalysisType("comprehensive")}
              className={`p-4 rounded-lg border-2 transition-all ${
                analysisType === "comprehensive"
                  ? "border-foreground bg-foreground/10"
                  : "border-border hover:border-foreground/50"
              }`}
            >
              <FileSearch className={`w-6 h-6 mb-2 ${analysisType === "comprehensive" ? "text-foreground" : "text-muted-foreground"}`} />
              <h4 className="font-semibold text-foreground mb-1">Comprehensive</h4>
              <p className="text-sm text-muted-foreground">Complete ATS + Gap analysis</p>
            </button>
          </div>

          <button
            onClick={analyzeResume}
            disabled={loading}
            className="w-full mt-6 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileSearch className="w-5 h-5" />
                Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-red-800 dark:text-red-300">{error}</div>
          </div>
        )}

        {/* Comprehensive Results */}
        {comprehensiveResult && (
          <div className="space-y-6">
            {/* Overall Recommendation */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">Overall Recommendation</h3>
              <p className="text-foreground/80 text-lg leading-relaxed">{comprehensiveResult.overall_recommendation}</p>
            </div>

            {/* Scores */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">ATS Compatibility</h3>
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(comprehensiveResult.ats_analysis.score)}`}>
                  {comprehensiveResult.ats_analysis.score}<span className="text-2xl">/100</span>
                </div>
                <p className="text-muted-foreground">{comprehensiveResult.ats_analysis.overall_assessment}</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Keyword Match</h3>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(comprehensiveResult.gap_analysis.score)}`}>
                  {comprehensiveResult.gap_analysis.score}<span className="text-2xl">/100</span>
                </div>
                <p className="text-muted-foreground">{comprehensiveResult.gap_analysis.matched_percentage.toFixed(1)}% keyword overlap</p>
              </div>
            </div>

            {/* Action Plan */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Action Plan
              </h3>
              <div className="space-y-2">
                {comprehensiveResult.action_plan.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-foreground flex-1">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ATS Suggestions */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("suggestions")}
                className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
              >
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  ATS Improvement Suggestions ({comprehensiveResult.ats_analysis.suggestions.length})
                </h3>
                {expandedSections.has("suggestions") ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has("suggestions") && (
                <div className="p-6 pt-0 space-y-4">
                  {comprehensiveResult.ats_analysis.suggestions
                    .sort((a, b) => a.priority - b.priority)
                    .map((suggestion, idx) => (
                      <div key={idx} className="bg-background border border-border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {suggestion.priority}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-foreground">{suggestion.category}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                                {suggestion.impact} impact
                              </span>
                            </div>
                            <p className="text-muted-foreground mb-2"><strong>Issue:</strong> {suggestion.issue}</p>
                            <p className="text-foreground"><strong>Suggestion:</strong> {suggestion.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Skill Gaps */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("gaps")}
                className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
              >
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Identified Skill Gaps ({comprehensiveResult.gap_analysis.skill_gaps.filter(g => !g.found_in_resume).length})
                </h3>
                {expandedSections.has("gaps") ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has("gaps") && (
                <div className="p-6 pt-0">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Matching Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {comprehensiveResult.gap_analysis.matching_keywords.map((keyword, idx) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {comprehensiveResult.gap_analysis.missing_keywords.map((keyword, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {comprehensiveResult.gap_analysis.skill_gaps
                      .filter(gap => !gap.found_in_resume)
                      .map((gap, idx) => (
                        <div key={idx} className="bg-background border border-border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <span className="font-semibold text-foreground">{gap.skill}</span>
                              <span className="text-muted-foreground text-sm ml-2">({gap.category})</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImportanceColor(gap.importance)}`}>
                            {gap.importance}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Learning Resources */}
            {comprehensiveResult.gap_analysis.gaps_with_resources.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection("resources")}
                  className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Learning Resources ({comprehensiveResult.gap_analysis.gaps_with_resources.length} skills)
                  </h3>
                  {expandedSections.has("resources") ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedSections.has("resources") && (
                  <div className="p-6 pt-0 space-y-6">
                    {comprehensiveResult.gap_analysis.gaps_with_resources.map((gapRes, idx) => (
                      <div key={idx} className="bg-background border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-foreground">{gapRes.skill}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImportanceColor(gapRes.importance)}`}>
                            {gapRes.importance}
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {gapRes.resources.map((resource, resIdx) => (
                            <a
                              key={resIdx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:bg-foreground/5 transition-colors group"
                            >
                              {resource.thumbnail && (
                                <img src={resource.thumbnail} alt={resource.title} className="w-24 h-16 object-cover rounded flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-foreground group-hover:text-foreground/80 line-clamp-2">{resource.title}</h5>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs">
                                    {resource.platform}
                                  </span>
                                  {resource.duration && <span>{resource.duration}</span>}
                                  {resource.instructor && <span>• {resource.instructor}</span>}
                                </div>
                              </div>
                              <Play className="w-5 h-5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ATS Only Results */}
        {atsResult && !comprehensiveResult && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-foreground">ATS Compatibility Score</h3>
                <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className={`text-6xl font-bold mb-3 ${getScoreColor(atsResult.score)}`}>
                {atsResult.score}<span className="text-3xl">/100</span>
              </div>
              <p className="text-foreground/80 text-lg">{atsResult.overall_assessment}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Strengths</h3>
                <ul className="space-y-2">
                  {atsResult.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">Weaknesses</h3>
                <ul className="space-y-2">
                  {atsResult.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-red-700 dark:text-red-400">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Improvement Suggestions</h3>
              <div className="space-y-4">
                {atsResult.suggestions.sort((a, b) => a.priority - b.priority).map((suggestion, idx) => (
                  <div key={idx} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {suggestion.priority}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-foreground">{suggestion.category}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                            {suggestion.impact} impact
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-2"><strong>Issue:</strong> {suggestion.issue}</p>
                        <p className="text-foreground"><strong>Suggestion:</strong> {suggestion.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gap Only Results */}
        {gapResult && !comprehensiveResult && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-semibold text-foreground">Keyword Match Score</h3>
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className={`text-6xl font-bold mb-3 ${getScoreColor(gapResult.score)}`}>
                {gapResult.score}<span className="text-3xl">/100</span>
              </div>
              <p className="text-foreground/80 text-lg">{gapResult.matched_percentage.toFixed(1)}% keyword overlap with job description</p>
            </div>

            {/* Keywords */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Matching Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {gapResult.matching_keywords.map((keyword, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {gapResult.missing_keywords.map((keyword, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Skill Gaps to Address</h3>
              <div className="space-y-3">
                {gapResult.skill_gaps.filter(gap => !gap.found_in_resume).map((gap, idx) => (
                  <div key={idx} className="bg-background border border-border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <span className="font-semibold text-foreground">{gap.skill}</span>
                        <span className="text-muted-foreground text-sm ml-2">({gap.category})</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImportanceColor(gap.importance)}`}>
                      {gap.importance}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Resources */}
            {gapResult.gaps_with_resources.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Learning Resources
                </h3>
                <div className="space-y-6">
                  {gapResult.gaps_with_resources.map((gapRes, idx) => (
                    <div key={idx} className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-foreground">{gapRes.skill}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImportanceColor(gapRes.importance)}`}>
                          {gapRes.importance}
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {gapRes.resources.map((resource, resIdx) => (
                          <a
                            key={resIdx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:bg-foreground/5 transition-colors group"
                          >
                            {resource.thumbnail && (
                              <img src={resource.thumbnail} alt={resource.title} className="w-24 h-16 object-cover rounded flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-foreground group-hover:text-foreground/80 line-clamp-2">{resource.title}</h5>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs">
                                  {resource.platform}
                                </span>
                                {resource.duration && <span>{resource.duration}</span>}
                                {resource.instructor && <span>• {resource.instructor}</span>}
                              </div>
                            </div>
                            <Play className="w-5 h-5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">Recommendations</h3>
              <ul className="space-y-2">
                {gapResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                    <Target className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
