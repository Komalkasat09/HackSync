"use client";

import { useState } from "react";
import { Globe, Share2, Eye, ExternalLink, Loader2 } from "lucide-react";
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

export default function PortfolioPage() {
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const generatePortfolio = async () => {
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
    } catch (err: any) {
      setError(err.message || "Failed to generate portfolio");
    } finally {
      setLoading(false);
    }
  };

  const deployPortfolio = async () => {
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
      });

      if (!response.ok) {
        throw new Error("Failed to deploy portfolio");
      }

      const data = await response.json();
      setDeployedUrl(data.portfolio_url);
    } catch (err: any) {
      setError(err.message || "Failed to deploy portfolio");
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

        {/* Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={generatePortfolio}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                {portfolioData ? 'Refresh Preview' : 'GeneratePortfolio'}
              </>
            )}
          </button>
        </div>

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
              <span>Portfolio Preview</span>
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
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto bg-black">
              <PortfolioTemplate data={portfolioData} isPreview={true} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!portfolioData && !loading && (
          <div className="text-center py-20 bg-card border border-border rounded-lg">
            <Globe className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              No Portfolio Generated Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Click "Generate Portfolio" to generate your portfolio from your profile data
            </p>
            <div className="max-w-md mx-auto text-left bg-background border border-border rounded-lg p-6 mt-6">
              <h4 className="font-semibold mb-3 text-foreground">📝 Before generating, make sure you have added:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-[#0a7fff] mt-1">•</span>
                  <span>Your skills in the Profile section</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0a7fff] mt-1">•</span>
                  <span>Work experiences or internships</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0a7fff] mt-1">•</span>
                  <span>Projects you've worked on</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0a7fff] mt-1">•</span>
                  <span>Educational background</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0a7fff] mt-1">•</span>
                  <span>Contact links (GitHub, LinkedIn, etc.)</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
