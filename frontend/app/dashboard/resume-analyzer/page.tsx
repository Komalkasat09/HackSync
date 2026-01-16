"use client";

import { useState } from "react";
import { FileSearch, Upload, Loader2, CheckCircle2, XCircle, TrendingUp, AlertCircle, Lightbulb, Target, BarChart3 } from "lucide-react";

interface AnalysisResult {
  ats_score: number;
  readiness_score: number;
  match_percentage: number;
  tips: string[];
  gaps: string[];
  strengths: string[];
  recommendations: string[];
}

export default function ResumeAnalyzerPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      setResumeFile(file);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Please upload a resume file");
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError("Please enter a job description (at least 20 characters)");
      return;
    }

    setAnalyzing(true);
    setError("");
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_description", jobDescription);

      const response = await fetch("http://localhost:8000/api/resume-analyzer/analyze", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze resume");
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-foreground rounded-lg">
              <FileSearch className="w-6 h-6 text-background" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Resume Analyzer</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Upload your resume and job description to get AI-powered analysis with ATS score, readiness score, and improvement tips
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Input Section */}
        {!analysisResult && (
          <div className="bg-card border border-border rounded-xl p-8 mb-8">
            <div className="space-y-6">
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Upload Resume (PDF) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-foreground/50 transition">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                    disabled={analyzing}
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div>
                      <span className="text-foreground font-medium">Click to upload</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </div>
                    <p className="text-sm text-muted-foreground">PDF only (Max 10MB)</p>
                  </label>
                  {resumeFile && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{resumeFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-48 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                  disabled={analyzing}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {jobDescription.length} characters
                </p>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !resumeFile || !jobDescription.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-foreground text-background rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <FileSearch className="w-5 h-5" />
                    Analyze Resume
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setResumeFile(null);
                  setJobDescription("");
                }}
                className="px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-foreground/5 transition"
              >
                Analyze Another Resume
              </button>
            </div>

            {/* Scores Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ATS Score */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold text-foreground">ATS Score</h3>
                </div>
                <div className="relative">
                  <div className="text-5xl font-bold mb-2">
                    <span className={getScoreColor(analysisResult.ats_score)}>
                      {analysisResult.ats_score}
                    </span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBgColor(analysisResult.ats_score)} transition-all duration-500`}
                      style={{ width: `${analysisResult.ats_score}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    How well your resume passes ATS systems
                  </p>
                </div>
              </div>

              {/* Readiness Score */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-purple-500" />
                  <h3 className="text-lg font-semibold text-foreground">Readiness Score</h3>
                </div>
                <div className="relative">
                  <div className="text-5xl font-bold mb-2">
                    <span className={getScoreColor(analysisResult.readiness_score)}>
                      {analysisResult.readiness_score}
                    </span>
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBgColor(analysisResult.readiness_score)} transition-all duration-500`}
                      style={{ width: `${analysisResult.readiness_score}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    How ready you are for this role
                  </p>
                </div>
              </div>

              {/* Match Percentage */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-foreground">Match Percentage</h3>
                </div>
                <div className="relative">
                  <div className="text-5xl font-bold mb-2">
                    <span className={getScoreColor(analysisResult.match_percentage)}>
                      {Math.round(analysisResult.match_percentage)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBgColor(analysisResult.match_percentage)} transition-all duration-500`}
                      style={{ width: `${analysisResult.match_percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Overall match with job requirements
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {analysisResult.strengths.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <h3 className="text-xl font-semibold text-foreground">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {analysisResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {analysisResult.gaps.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <h3 className="text-xl font-semibold text-foreground">Gaps & Missing Elements</h3>
                </div>
                <ul className="space-y-2">
                  {analysisResult.gaps.map((gap, index) => (
                    <li key={index} className="flex items-start gap-3 text-foreground">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {analysisResult.tips.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-xl font-semibold text-foreground">Improvement Tips</h3>
                </div>
                <ul className="space-y-2">
                  {analysisResult.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3 text-foreground">
                      <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-blue-500" />
                  <h3 className="text-xl font-semibold text-foreground">Recommendations</h3>
                </div>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 text-foreground">
                      <Target className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

