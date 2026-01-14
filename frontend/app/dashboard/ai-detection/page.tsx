"use client";
import { useState, useCallback, useRef } from "react";
import { Scan, Upload, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";

interface DetectionResult {
  detection_id: string;
  ai_score: number;
  is_ai_generated: boolean;
  confidence_level: string;
  sightengine_result: any;
  timestamp: string;
}

export default function AIDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video">("image");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSetFile = useCallback((selectedFile: File) => {
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
    const imageTypes = ["jpg", "jpeg", "png", "webp", "gif"];
    const videoTypes = ["mp4", "mov", "mkv", "webm"];

    if (imageTypes.includes(fileExtension || "")) {
      if (fileType === "image") {
        setFile(selectedFile);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setResult(null);
        setError(null);
      } else {
        setError("Selected file is an image, but video mode is selected.");
      }
    } else if (videoTypes.includes(fileExtension || "")) {
      if (fileType === "video") {
        setFile(selectedFile);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        setResult(null);
        setError(null);
      } else {
        setError("Selected file is a video, but image mode is selected.");
      }
    } else {
      setError("Unsupported file type. Please upload an image or video.");
    }
  }, [fileType, previewUrl]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    validateAndSetFile(selectedFile);
  }, [validateAndSetFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, [validateAndSetFile]);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated. Please log in.");
      setAnalyzing(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        fileType === "image"
          ? API_ENDPOINTS.AI_DETECTION.ANALYZE_IMAGE
          : API_ENDPOINTS.AI_DETECTION.ANALYZE_VIDEO;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to analyze file" }));
        throw new Error(errorData.detail || "Failed to analyze file");
      }

      const data = (await response.json()) as DetectionResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze file");
    } finally {
      setAnalyzing(false);
    }
  }, [file, fileType]);

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "High":
        return "text-red-400 border-red-400/30 bg-red-400/10";
      case "Medium":
        return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
      case "Low":
        return "text-green-400 border-green-400/30 bg-green-400/10";
      default:
        return "text-foreground/60 border-foreground/20 bg-foreground/5";
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case "High":
        return <AlertCircle className="w-5 h-5" />;
      case "Medium":
        return <Info className="w-5 h-5" />;
      case "Low":
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1.5 flex items-center gap-2">
          <Scan className="w-6 h-6 text-[#00a8ff]" />
          AI Content Detector
        </h1>
        <p className="text-sm text-foreground/50">
          Analyze images and videos to detect AI-generated content using Sightengine
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upload File</h2>
          
          {/* Improved Toggle UI */}
          <div className="inline-flex bg-foreground/5 border border-foreground/10 rounded-lg p-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setFileType("image");
                setFile(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                setResult(null);
                setError(null);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                fileType === "image"
                  ? "bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/40 shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => {
                setFileType("video");
                setFile(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                setResult(null);
                setError(null);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                fileType === "video"
                  ? "bg-[#00a8ff]/20 text-[#00a8ff] border border-[#00a8ff]/40 shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Video
            </button>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? "border-[#00a8ff] bg-[#00a8ff]/10"
              : "border-foreground/20 hover:border-[#00a8ff]/40"
          }`}
        >
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            accept={fileType === "image" ? "image/*" : "video/*"}
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-3"
          >
            <Upload className={`w-10 h-10 transition-colors ${isDragging ? "text-[#00a8ff]" : "text-foreground/40"}`} />
            <span className={`text-sm transition-colors ${isDragging ? "text-[#00a8ff]" : "text-foreground/60"}`}>
              {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
            </span>
            <span className="text-xs text-foreground/40">
              {fileType === "image"
                ? "JPG, PNG, WEBP, GIF"
                : "MP4, MOV, MKV, WEBM"}
            </span>
          </label>
        </div>

        {previewUrl && file && (
          <div className="mt-4">
            {fileType === "image" ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-96 rounded-lg border border-foreground/10"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="max-w-full max-h-96 rounded-lg border border-foreground/10"
              />
            )}
          </div>
        )}

        {file && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="mt-4 w-full bg-[#00a8ff]/20 hover:bg-[#00a8ff]/30 border border-[#00a8ff]/40 text-[#00a8ff] font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Scan className="w-5 h-5" />
                Analyze Content
              </>
            )}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* AI Score Card */}
          <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Analysis Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-4">
                <div className="text-sm text-foreground/50 mb-1">AI Score</div>
                <div className="text-2xl font-bold text-foreground">
                  {(result.ai_score * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-4">
                <div className="text-sm text-foreground/50 mb-1">Status</div>
                <div className="text-lg font-semibold text-foreground">
                  {result.is_ai_generated ? "AI Generated" : "Human Generated"}
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${getConfidenceColor(result.confidence_level)}`}>
                <div className="text-sm mb-1 flex items-center gap-2">
                  {getConfidenceIcon(result.confidence_level)}
                  Confidence
                </div>
                <div className="text-lg font-semibold">{result.confidence_level}</div>
              </div>
            </div>

            {/* Interpretation */}
            <div className="mt-4 p-4 bg-foreground/5 border border-foreground/10 rounded-lg">
              <h3 className="text-sm font-semibold text-foreground mb-2">Interpretation</h3>
              <p className="text-sm text-foreground/80">
                {result.confidence_level === "High" && (
                  <span className="text-red-400">High probability of AI-generated content detected.</span>
                )}
                {result.confidence_level === "Medium" && (
                  <span className="text-yellow-400">Medium probability - content may be AI-generated.</span>
                )}
                {result.confidence_level === "Low" && (
                  <span className="text-green-400">Low probability - content appears to be human-generated.</span>
                )}
              </p>
            </div>
          </div>

          {/* Raw JSON Result (Collapsible) */}
          <details className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-4">
            <summary className="cursor-pointer text-sm font-semibold text-foreground mb-2">
              Raw Sightengine Result
            </summary>
            <pre className="text-xs text-foreground/60 bg-foreground/5 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(result.sightengine_result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

