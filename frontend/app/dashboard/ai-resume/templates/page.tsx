"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/lib/config";
import { Download, Loader2, Check } from "lucide-react";

interface AIResumeData {
  personal_info: any;
  summary: string;
  skills: any[];
  experience: any[];
  projects: any[];
  education: any[];
  certifications?: any[];
  awards?: string[];
  languages?: string[];
}

const templates = [
  { id: "modern", name: "Modern", description: "Clean and contemporary design" },
  { id: "classic", name: "Classic", description: "Traditional professional layout" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
  { id: "creative", name: "Creative", description: "Bold and eye-catching" },
  { id: "professional", name: "Professional", description: "Corporate and formal" },
  { id: "tech", name: "Tech", description: "Designed for tech roles" },
];

export default function TemplatesPage() {
  const [aiResumeData, setAiResumeData] = useState<AIResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.AI_RESUME.GET_DATA, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAiResumeData(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to load resume data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleDownloadPDF = async () => {
    if (!selectedTemplate || !aiResumeData) return;

    setDownloading(true);
    try {
      // TODO: Implement PDF generation with selected template
      // For now, open preview in new window
      const previewUrl = `/dashboard/ai-resume/preview?template=${selectedTemplate}`;
      window.open(previewUrl, '_blank');
      
      setTimeout(() => {
        alert("PDF download will be implemented with template rendering");
      }, 500);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!aiResumeData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-foreground/60">No resume data found. Please generate a resume first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">Choose Your Resume Template</h1>
        <p className="text-black/60 dark:text-white/60 mt-1">
          Select a template to preview and download your AI-generated resume
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate === template.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                : "border-black/20 dark:border-white/20 bg-white dark:bg-black hover:border-blue-300"
            }`}
          >
            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3 p-1 bg-blue-500 rounded-full">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            
            {/* Template Preview */}
            <div className="aspect-[8.5/11] bg-white border-2 border-black/20 dark:border-white/20 rounded-lg mb-4 overflow-hidden shadow-inner">
              <div className="w-full h-full p-6 space-y-3">
                {/* Header */}
                <div className="space-y-2">
                  <div className="h-6 bg-black/80 rounded w-2/3"></div>
                  <div className="h-3 bg-black/60 rounded w-1/2"></div>
                  <div className="h-3 bg-black/60 rounded w-2/3"></div>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-black/20 my-4"></div>
                
                {/* Section 1 */}
                <div className="space-y-2">
                  <div className="h-4 bg-blue-600 rounded w-1/3"></div>
                  <div className="space-y-1">
                    <div className="h-2 bg-black/50 rounded w-full"></div>
                    <div className="h-2 bg-black/50 rounded w-5/6"></div>
                    <div className="h-2 bg-black/50 rounded w-4/5"></div>
                  </div>
                </div>
                
                {/* Section 2 */}
                <div className="space-y-2">
                  <div className="h-4 bg-blue-600 rounded w-1/3"></div>
                  <div className="space-y-1">
                    <div className="h-2 bg-black/50 rounded w-full"></div>
                    <div className="h-2 bg-black/50 rounded w-3/4"></div>
                  </div>
                </div>
                
                {/* Skills pills */}
                <div className="flex flex-wrap gap-1 mt-3">
                  <div className="h-3 w-12 bg-black/30 rounded-full"></div>
                  <div className="h-3 w-16 bg-black/30 rounded-full"></div>
                  <div className="h-3 w-14 bg-black/30 rounded-full"></div>
                  <div className="h-3 w-10 bg-black/30 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <h3 className="font-semibold text-black dark:text-white mb-1">{template.name}</h3>
            <p className="text-sm text-black/60 dark:text-white/60">{template.description}</p>
          </div>
        ))}
      </div>

      {/* Download Button */}
      {selectedTemplate && (
        <div className="flex justify-center py-6">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-white text-black border-2 border-black/20 text-lg font-semibold rounded-xl hover:bg-white/80 dark:hover:bg-white/90 transition-all disabled:opacity-50 shadow-lg"
          >
            {downloading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Download Resume as PDF
              </>
            )}
          </button>
        </div>
      )}

      {!selectedTemplate && (
        <p className="text-center text-sm text-black/60 dark:text-white/60">
          Select a template above to preview and download your resume
        </p>
      )}
    </div>
  );
}
