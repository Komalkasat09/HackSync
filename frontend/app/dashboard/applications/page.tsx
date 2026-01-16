"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Briefcase, Trash2, Eye, Calendar, Building2, Loader2, Save, Download, Sparkles } from "lucide-react";
import ClassicTemplate from "@/components/templates/ClassicTemplate";
import CoverLetterTemplate from "@/components/templates/CoverLetterTemplate";

interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

interface Skill {
  category: string;
  skills: string[];
}

interface Experience {
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date: string;
  description: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  highlights: string[];
}

interface Education {
  degree: string;
  institution: string;
  location?: string;
  graduation_date: string;
  gpa?: string;
  achievements?: string[];
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
  credential_id?: string;
}

interface TailoredResume {
  personal_info: PersonalInfo;
  summary: string;
  skills: Skill[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications?: Certification[];
  awards?: string[];
  languages?: string[];
}

interface CoverLetter {
  greeting: string;
  opening_paragraph: string;
  body_paragraphs: string[];
  closing_paragraph: string;
  signature: string;
}

interface Application {
  user_id: string;
  job_id: string;
  job_title: string;
  company: string;
  job_description: string;
  tailored_resume: TailoredResume;
  cover_letter: CoverLetter;
  created_at: string;
  updated_at: string;
  status: string;
  application_source?: string; // "job_application" or "cold_mail"
  company_email?: string; // For cold mail applications
  subject?: string; // For cold mail applications
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // New application generation state
  const [showGenerator, setShowGenerator] = useState(false);
  const [jobData, setJobData] = useState({
    job_id: "",
    title: "",
    company: "",
    description: "",
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);

  useEffect(() => {
    fetchApplications();

    // Check if redirected from Jobs page with job data
    const jobId = searchParams.get("job_id");
    const title = searchParams.get("title");
    const company = searchParams.get("company");
    const description = searchParams.get("description");

    if (jobId && title && company && description) {
      setJobData({ job_id: jobId, title, company, description });
      setShowGenerator(true);
      // Auto-generate
      generateApplication(jobId, title, company, description);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/job-application/my-applications?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/job-application/delete/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        alert("Application deleted successfully!");
        fetchApplications();
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      alert("Failed to delete application");
    }
  };

  const generateApplication = async (jobId?: string, jobTitle?: string, company?: string, jobDescription?: string) => {
    const jid = jobId || jobData.job_id;
    const jtitle = jobTitle || jobData.title;
    const jcompany = company || jobData.company;
    const jdesc = jobDescription || jobData.description;

    if (!jdesc) {
      alert("Please enter a job description");
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/job-application/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jid || `custom_${Date.now()}`,
          job_title: jtitle || "Custom Application",
          company: jcompany || "Company",
          job_description: jdesc,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTailoredResume(data.tailored_resume);
        setCoverLetter(data.cover_letter);
      } else {
        // Show specific error message from backend
        const errorMsg = data.detail || data.message || "Failed to generate application materials";
        
        if (errorMsg.includes("API quota") || errorMsg.includes("temporarily unavailable")) {
          alert("⚠️ AI Service Temporarily Unavailable\n\nOur AI service has exceeded its quota limits. Please try again later or contact support to increase limits.");
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error("Error generating application:", error);
      alert("❌ Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const saveApplication = async () => {
    if (!tailoredResume || !coverLetter) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/job-application/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobData.job_id || `custom_${Date.now()}`,
          job_title: jobData.title || "Custom Application",
          company: jobData.company || "Company",
          job_description: jobData.description,
          tailored_resume: tailoredResume,
          cover_letter: coverLetter,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Application saved successfully!");
        setShowGenerator(false);
        setTailoredResume(null);
        setCoverLetter(null);
        setJobData({ job_id: "", title: "", company: "", description: "" });
        fetchApplications();
      } else {
        alert(data.message || "Failed to save application");
      }
    } catch (error) {
      console.error("Error saving application:", error);
      alert("Failed to save application");
    } finally {
      setSaving(false);
    }
  };

  const updateCoverLetterField = (field: keyof CoverLetter, value: string) => {
    if (!coverLetter) return;
    setCoverLetter({ ...coverLetter, [field]: value });
  };

  const updateBodyParagraph = (index: number, value: string) => {
    if (!coverLetter) return;
    const newParagraphs = [...coverLetter.body_paragraphs];
    newParagraphs[index] = value;
    setCoverLetter({ ...coverLetter, body_paragraphs: newParagraphs });
  };

  const transformResumeData = (resume: TailoredResume) => {
    return {
      personal: {
        name: resume.personal_info.name || "",
        title: resume.summary.split('.')[0] || "",
        email: resume.personal_info.email || "",
        phone: resume.personal_info.phone || "",
        location: resume.personal_info.location || "",
        linkedin: resume.personal_info.linkedin,
        github: resume.personal_info.github,
        website: resume.personal_info.portfolio,
      },
      summary: resume.summary,
      experience: resume.experience.map((exp) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || "",
        startDate: exp.start_date,
        endDate: exp.end_date,
        bullets: exp.description,
      })),
      education: resume.education.map((edu) => ({
        degree: edu.degree,
        school: edu.institution,
        location: edu.location || "",
        graduationDate: edu.graduation_date,
        gpa: edu.gpa,
      })),
      skills: {
        languages: resume.skills.find((s) => s.category.toLowerCase().includes("language"))?.skills || [],
        frameworks: resume.skills.find((s) => s.category.toLowerCase().includes("framework"))?.skills || [],
        tools: resume.skills.find((s) => s.category.toLowerCase().includes("tool"))?.skills || [],
      },
      projects: resume.projects.map((proj) => ({
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies,
        link: proj.link,
      })),
    };
  };

  const transformCoverLetterData = (coverLetter: CoverLetter, resume: TailoredResume) => {
    return {
      personal: {
        name: resume.personal_info.name || "",
        email: resume.personal_info.email || "",
        phone: resume.personal_info.phone || "",
        location: resume.personal_info.location || "",
        linkedin: resume.personal_info.linkedin,
      },
      company: jobData.company,
      jobTitle: jobData.title,
      greeting: coverLetter.greeting,
      opening_paragraph: coverLetter.opening_paragraph,
      body_paragraphs: coverLetter.body_paragraphs,
      closing_paragraph: coverLetter.closing_paragraph,
      signature: coverLetter.signature,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
  };

  const viewApplication = (app: Application) => {
    // Cold mail applications don't have resume/cover letter, so skip viewing
    if (app.application_source === "cold_mail") {
      return;
    }
    setJobData({
      job_id: app.job_id,
      title: app.job_title,
      company: app.company,
      description: app.job_description,
    });
    setTailoredResume(app.tailored_resume);
    setCoverLetter(app.cover_letter);
    setShowGenerator(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Applications</h1>
            <p className="text-muted-foreground">
              {applications.length} {applications.length === 1 ? "application" : "applications"} saved
            </p>
          </div>
          {!showGenerator && (
            <button
              onClick={() => setShowGenerator(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg"
            >
              <Sparkles size={20} />
              Generate New Application
            </button>
          )}
        </div>

        {/* Generator Section */}
        {showGenerator && (
          <div className="mb-8 bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Generate Tailored Application</h2>
              <button
                onClick={() => {
                  setShowGenerator(false);
                  setTailoredResume(null);
                  setCoverLetter(null);
                  setJobData({ job_id: "", title: "", company: "", description: "" });
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            {!tailoredResume ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Job ID (Optional)</label>
                  <input
                    type="text"
                    value={jobData.job_id}
                    onChange={(e) => setJobData({ ...jobData, job_id: e.target.value })}
                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., job_123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Company</label>
                  <input
                    type="text"
                    value={jobData.company}
                    onChange={(e) => setJobData({ ...jobData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Job Description *</label>
                  <textarea
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Paste the complete job description here..."
                    required
                  />
                </div>

                <button
                  onClick={() => generateApplication()}
                  disabled={generating || !jobData.description}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Resume & Cover Letter
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* PDF Previews Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Resume Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Tailored Resume</h3>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="scale-75 origin-top-left w-[133%]">
                        <ClassicTemplate data={transformResumeData(tailoredResume)} />
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Cover Letter</h3>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="scale-75 origin-top-left w-[133%]">
                        <CoverLetterTemplate data={transformCoverLetterData(coverLetter, tailoredResume)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                  <button
                    onClick={saveApplication}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-medium shadow-lg"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Application
                  </button>
                </div>

                {/* Editable Cover Letter Section */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">Edit Cover Letter</h3>
                  <div className="bg-card rounded-lg shadow-md p-6 space-y-4 border border-border">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Greeting</label>
                      <input
                        type="text"
                        value={coverLetter?.greeting || ""}
                        onChange={(e) => updateCoverLetterField("greeting", e.target.value)}
                        className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Opening Paragraph</label>
                      <textarea
                        value={coverLetter?.opening_paragraph || ""}
                        onChange={(e) => updateCoverLetterField("opening_paragraph", e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {coverLetter?.body_paragraphs.map((para, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Body Paragraph {index + 1}
                        </label>
                        <textarea
                          value={para}
                          onChange={(e) => updateBodyParagraph(index, e.target.value)}
                          rows={5}
                          className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Closing Paragraph</label>
                      <textarea
                        value={coverLetter?.closing_paragraph || ""}
                        onChange={(e) => updateCoverLetterField("closing_paragraph", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Signature</label>
                      <input
                        type="text"
                        value={coverLetter?.signature || ""}
                        onChange={(e) => updateCoverLetterField("signature", e.target.value)}
                        className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Applications Grid */}
        {!showGenerator && (
          <>
            {applications.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-24 h-24 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start applying to jobs to see your tailored resumes and cover letters here
            </p>
            <button
              onClick={() => router.push("/dashboard/jobs")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div
                key={app.job_id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-300 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        app.status === "draft" 
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : app.status === "submitted"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}>
                        {app.status}
                      </span>
                      {app.application_source === "cold_mail" && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          via cold mail
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Info */}
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {app.job_title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Building2 className="w-4 h-4" />
                  <span className="line-clamp-1">{app.company}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>Updated: {new Date(app.updated_at).toLocaleDateString()}</span>
                </div>

                {/* Cold Mail Info */}
                {app.application_source === "cold_mail" && (
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      <div className="font-medium mb-1">Email Details:</div>
                      <div className="text-xs">
                        <div>To: {app.company_email || "N/A"}</div>
                        {app.subject && <div className="mt-1">Subject: {app.subject}</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {app.application_source !== "cold_mail" && (
                    <button
                      onClick={() => viewApplication(app)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  )}
                  <button
                    onClick={() => deleteApplication(app.job_id)}
                    className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
