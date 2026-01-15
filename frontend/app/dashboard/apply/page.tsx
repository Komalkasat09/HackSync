"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Briefcase, Loader2, Save, Trash2, Download } from "lucide-react";
import ClassicTemplate from "@/components/templates/ClassicTemplate";

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

export default function ApplyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobData, setJobData] = useState({
    job_id: searchParams.get("job_id") || "",
    title: searchParams.get("title") || "",
    company: searchParams.get("company") || "",
    description: searchParams.get("description") || "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);

  useEffect(() => {
    if (jobData.job_id && jobData.description) {
      generateApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateApplication = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/job-application/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: jobData.job_id,
          job_title: jobData.title,
          company: jobData.company,
          job_description: jobData.description,
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
      setLoading(false);
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
          job_id: jobData.job_id,
          job_title: jobData.title,
          company: jobData.company,
          job_description: jobData.description,
          tailored_resume: tailoredResume,
          cover_letter: coverLetter,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Application saved successfully!");
        router.push("/dashboard/applications");
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

  // Transform resume data to ClassicTemplate format
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Jobs
      </button>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Job Application</h1>

        {/* Job Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="text-blue-600" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{jobData.title}</h2>
              <p className="text-lg text-gray-600 mb-4">{jobData.company}</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Job Description:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{jobData.description}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-gray-600">Generating tailored resume and cover letter...</p>
          </div>
        ) : (
          <>
            {tailoredResume && coverLetter && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Resume Preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Tailored Resume</h2>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="scale-75 origin-top-left w-[133%]">
                      <ClassicTemplate data={transformResumeData(tailoredResume)} />
                    </div>
                  </div>
                </div>

                {/* Cover Letter - Editable */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Cover Letter (Editable)</h2>
                    <button
                      onClick={saveApplication}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      Save Application
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Greeting</label>
                      <input
                        type="text"
                        value={coverLetter.greeting}
                        onChange={(e) => updateCoverLetterField("greeting", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Opening Paragraph</label>
                      <textarea
                        value={coverLetter.opening_paragraph}
                        onChange={(e) => updateCoverLetterField("opening_paragraph", e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {coverLetter.body_paragraphs.map((para, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Body Paragraph {index + 1}
                        </label>
                        <textarea
                          value={para}
                          onChange={(e) => updateBodyParagraph(index, e.target.value)}
                          rows={5}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Closing Paragraph</label>
                      <textarea
                        value={coverLetter.closing_paragraph}
                        onChange={(e) => updateCoverLetterField("closing_paragraph", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                      <input
                        type="text"
                        value={coverLetter.signature}
                        onChange={(e) => updateCoverLetterField("signature", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
