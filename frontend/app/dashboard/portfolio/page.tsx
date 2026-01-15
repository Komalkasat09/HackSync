"use client";

import { useState } from "react";
import { Globe, Share2, Eye, ExternalLink, Loader2, Terminal, Sparkles, Briefcase } from "lucide-react";
import { PortfolioTemplate } from "@/components/PortfolioTemplate";

interface PortfolioData {
  user_id: string;
  name: string;
  email: string;
  location: string;
  bio: string;
  links: Array<{ id: string; type: string; value: string }>;
  skills: Array<{ id: string; name: string }>;
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string;
    link?: string;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
  }>;
  interests: Array<{ id: string; name: string }>;
}

type DesignType = "terminal" | "minimal" | "professional";

export default function PortfolioPage() {
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [selectedDesign, setSelectedDesign] = useState<DesignType | null>(null);

  const generatePortfolio = async () => {
    if (!selectedDesign) {
      setError("Please select a design first");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/portfolio/data", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate portfolio");
      }

      const data = await response.json();
      
      // Check if user has sufficient data
      const hasData = data.skills.length > 0 || data.experiences.length > 0 || data.projects.length > 0 || data.education.length > 0;
      
      if (!hasData) {
        setError("Please add your skills, experiences, projects, or education in Your Profile section before generating portfolio.");
        setLoading(false);
        return;
      }
      
      setPortfolioData(data);
      setSelectedDesign(selectedDesign); // Keep the selected design
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate portfolio");
    } finally {
      setLoading(false);
    }
  };

  const deployPortfolio = async () => {
    if (!selectedDesign) {
      setError("Please select a design first");
      return;
    }

    setDeploying(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/portfolio/deploy", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          design_type: selectedDesign
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to deploy portfolio");
      }

      const data = await response.json();
      setDeployedUrl(data.portfolio_url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deploy portfolio");
    } finally {
      setDeploying(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deployedUrl);
    alert("Portfolio URL copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-foreground rounded-lg">
              <Globe className="w-6 h-6 text-background" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Portfolio Generator</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Generate and deploy your professional portfolio from your profile data
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            {error.includes("add your") && (
              <a 
                href="/dashboard/your-profile" 
                className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
              >
                Go to Profile →
              </a>
            )}
          </div>
        )}

        {/* Design Selection - Show only when no portfolio is generated */}
        {!portfolioData && !loading && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Choose Your Portfolio Design</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Terminal Design */}
              <div
                onClick={() => setSelectedDesign("terminal")}
                className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all hover:scale-105 ${
                  selectedDesign === "terminal" 
                    ? "border-green-400 ring-4 ring-green-400/20" 
                    : "border-border hover:border-green-400/50"
                }`}
              >
                {/* Visual Preview - Terminal Theme */}
                <div className="bg-black p-6 min-h-[300px] flex flex-col items-center justify-center">
                  <div className="space-y-4 w-full">
                    {/* Terminal Header - just dots */}
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    {/* Terminal Content - green shapes */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="flex gap-2 mb-3">
                        <div className="h-2 w-16 bg-green-400 rounded" />
                        <div className="h-2 w-12 bg-green-400/50 rounded" />
                      </div>
                      <div className="flex gap-2 mb-3">
                        <div className="h-2 w-20 bg-green-400/70 rounded" />
                        <div className="h-2 w-14 bg-green-400/40 rounded" />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <div className="h-2 w-16 bg-green-400 rounded" />
                        <div className="h-2 w-12 bg-green-400/50 rounded" />
                        <div className="h-2 w-20 bg-green-400/30 rounded" />
                      </div>
                    </div>
                    {/* Green accent shapes */}
                    <div className="flex justify-center gap-2">
                      <div className="w-8 h-8 border-2 border-green-400/30 rounded" />
                      <div className="w-8 h-8 border-2 border-green-400/30 rounded" />
                    </div>
                  </div>
                </div>
                {/* Card Footer */}
                <div className="bg-card p-4 border-t border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Terminal className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-foreground">Hacker Terminal</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Dark terminal with green text</p>
                </div>
              </div>

              {/* Minimal Design */}
              <div
                onClick={() => setSelectedDesign("minimal")}
                className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all hover:scale-105 ${
                  selectedDesign === "minimal" 
                    ? "border-blue-400 ring-4 ring-blue-400/20" 
                    : "border-border hover:border-blue-400/50"
                }`}
              >
                {/* Visual Preview - Minimal Theme */}
                <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6 min-h-[300px] flex flex-col items-center justify-center">
                  <div className="space-y-4 w-full">
                    {/* Large circle - purple accent */}
                    <div className="w-24 h-24 rounded-full bg-purple-500/30 mx-auto border border-purple-400/30" />
                    {/* Horizontal lines - purple gradient */}
                    <div className="space-y-2">
                      <div className="h-2 bg-purple-400/40 rounded w-3/4 mx-auto" />
                      <div className="h-2 bg-purple-400/30 rounded w-2/3 mx-auto" />
                    </div>
                    {/* Small squares grid - purple accents */}
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      <div className="h-12 bg-purple-500/20 rounded border border-purple-400/20" />
                      <div className="h-12 bg-purple-500/20 rounded border border-purple-400/20" />
                      <div className="h-12 bg-purple-500/20 rounded border border-purple-400/20" />
                    </div>
                  </div>
                </div>
                {/* Card Footer */}
                <div className="bg-card p-4 border-t border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-foreground">Minimal</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Clean white space design</p>
                </div>
              </div>

              {/* Professional Design */}
              <div
                onClick={() => setSelectedDesign("professional")}
                className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all hover:scale-105 ${
                  selectedDesign === "professional" 
                    ? "border-purple-400 ring-4 ring-purple-400/20" 
                    : "border-border hover:border-purple-400/50"
                }`}
              >
                {/* Visual Preview - Professional Theme */}
                <div className="bg-amber-50 p-6 min-h-[300px] flex flex-col items-center justify-center">
                  <div className="space-y-3 w-full">
                    {/* Header bar - amber accent */}
                    <div className="h-12 bg-amber-800 rounded-lg" />
                    {/* Card shapes */}
                    <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-800/30 shadow-sm">
                      <div className="h-4 bg-amber-700 rounded w-1/3 mb-2" />
                      <div className="h-2 bg-amber-600/30 rounded w-full" />
                    </div>
                    <div className="bg-amber-900/20 rounded-lg p-4 border border-amber-800/30 shadow-sm">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="h-8 bg-amber-700/40 rounded" />
                        <div className="h-8 bg-amber-700/40 rounded" />
                        <div className="h-8 bg-amber-700/40 rounded" />
                        <div className="h-8 bg-amber-700/40 rounded" />
                      </div>
                    </div>
                    {/* Bottom accent */}
                    <div className="h-3 bg-amber-600 rounded w-2/3 mx-auto" />
                  </div>
                </div>
                {/* Card Footer */}
                <div className="bg-card p-4 border-t border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-foreground">Professional</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Corporate structured layout</p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={generatePortfolio}
                disabled={loading || !selectedDesign}
                className="flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Generate Portfolio
                  </>
                )}
              </button>
            </div>
            {!selectedDesign && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Please select a design above to continue
              </p>
            )}
          </div>
        )}

        {/* Deployed URL */}
        {deployedUrl && (
          <div className="mb-8 p-6 bg-card border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-foreground">
              🎉 Portfolio Deployed Successfully!
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={deployedUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition"
              >
                Copy
              </button>
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#0a7fff] text-white rounded-lg hover:bg-[#0966d9] transition flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </div>
          </div>
        )}

        {/* Preview */}
        {portfolioData && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="bg-foreground text-background px-6 py-3 font-semibold flex items-center justify-between">
              <span>Portfolio Preview - {selectedDesign === "terminal" ? "Hacker Terminal" : selectedDesign === "minimal" ? "Minimal" : "Professional"}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPortfolioData(null);
                    setSelectedDesign(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-background text-foreground rounded-lg hover:opacity-90 transition text-sm"
                >
                  Change Design
                </button>
                <button
                  onClick={deployPortfolio}
                  disabled={deploying}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0a7fff] text-white rounded-lg hover:bg-[#0966d9] transition disabled:opacity-50 text-sm"
                >
                  {deploying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Deploy Portfolio
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className={`max-h-[calc(100vh-200px)] overflow-y-auto ${
              selectedDesign === "terminal" ? "bg-black" : selectedDesign === "minimal" ? "bg-white" : "bg-gray-50"
            }`}>
              <PortfolioTemplate data={portfolioData} isPreview={true} designType={selectedDesign || "terminal"} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

