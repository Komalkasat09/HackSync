"use client";

import { useState } from "react";
import { Mail, Search, Loader2, CheckCircle2, XCircle, Send, FileText, Settings, Sparkles, CheckSquare, Square, Plus } from "lucide-react";

interface Company {
  company_name: string;
  website: string;
  description?: string;
  emails: string[];
  status: string;
}

export default function ColdMailPage() {
  const [companyType, setCompanyType] = useState("");
  const [searching, setSearching] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSearch = async () => {
    if (!companyType.trim()) {
      setError("Please enter a company type");
      return;
    }

    setSearching(true);
    setError("");
    setSuccess("");
    setCompanies([]);
    setSelectedCompanies(new Set());

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/cold-mail/search-companies", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ company_type: companyType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to search companies");
      }

      const data = await response.json();
      setCompanies(data.companies || []);
      setSuccess(`Found ${data.companies?.length || 0} companies with emails`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to search companies");
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateTemplate = async () => {
    if (!smtpEmail || !selectedCompanies.size) {
      setError("Please configure SMTP email and select at least one company");
      return;
    }

    const firstSelected = Array.from(selectedCompanies)[0];
    const company = companies[firstSelected];
    if (!company) return;

    setGeneratingTemplate(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      // Get user profile data
      const profileResponse = await fetch("http://localhost:8000/api/profile", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const profileData = await profileResponse.json();
      
      const skills = profileData.skills?.map((s: any) => s.name || s) || [];
      
      const response = await fetch("http://localhost:8000/api/cold-mail/generate-template", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: company.company_name,
          user_name: profileData.name || "Candidate",
          user_email: smtpEmail,
          user_bio: profileData.bio || "",
          user_skills: skills,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate template");
      }

      const data = await response.json();
      setEmailSubject(data.subject);
      // Replace \n with actual line breaks
      setEmailBody(data.body.replace(/\\n/g, '\n'));
      setSuccess("Email template generated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate template");
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleSendEmails = async () => {
    if (!smtpEmail || !smtpPassword) {
      setError("Please configure SMTP settings");
      return;
    }
    if (!emailSubject || !emailBody) {
      setError("Please generate or enter email subject and body");
      return;
    }
    if (selectedCompanies.size === 0) {
      setError("Please select at least one company");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      
      // Convert resume to base64 if provided
      let resumeBase64 = null;
      if (resumeFile) {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        resumeBase64 = base64;
      }

      // Prepare companies list
      const companiesToSend = Array.from(selectedCompanies)
        .map((index) => {
          const company = companies[index];
          return {
            company_name: company.company_name,
            company_email: company.emails[0] || "N/A",
            company_website: company.website,
          };
        })
        .filter((c) => c.company_email !== "N/A");

      if (companiesToSend.length === 0) {
        throw new Error("No companies with valid email addresses selected");
      }

      const response = await fetch("http://localhost:8000/api/cold-mail/bulk-send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companies: companiesToSend,
          subject: emailSubject,
          body: emailBody,
          smtp_email: smtpEmail,
          smtp_password: smtpPassword,
          resume_file: resumeBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send emails");
      }

      const data = await response.json();
      setSuccess(`Successfully sent ${data.sent} emails. ${data.failed} failed.`);
      
      // Update company statuses
      const updatedCompanies = [...companies];
      data.results.forEach((result: any, idx: number) => {
        const companyIndex = companiesToSend.findIndex(
          (c) => c.company_name === result.company_name
        );
        if (companyIndex !== -1) {
          const originalIndex = Array.from(selectedCompanies)[companyIndex];
          if (originalIndex !== undefined) {
            updatedCompanies[originalIndex].status = result.status;
          }
        }
      });
      setCompanies(updatedCompanies);
      setSelectedCompanies(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  const toggleCompanySelection = (index: number) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCompanies(newSelected);
  };

  const selectAll = () => {
    const allWithEmails = companies
      .map((c, i) => (c.emails.length > 0 ? i : -1))
      .filter((i) => i !== -1);
    setSelectedCompanies(new Set(allWithEmails));
  };

  const deselectAll = () => {
    setSelectedCompanies(new Set());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "email_found":
        return <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs">Email Found</span>;
      case "no_email":
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs">No Email</span>;
      case "scraping_failed":
        return <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs">Failed</span>;
      case "sent":
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs">Sent</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-foreground rounded-lg">
              <Mail className="w-6 h-6 text-background" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Cold Mail Outreach</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Find companies, extract emails, and send personalized cold emails with your resume
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Company Search */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Companies
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Type
                  </label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    disabled={searching}
                  >
                    <option value="">Select company type...</option>
                    <option value="AI startups">AI Startups</option>
                    <option value="Fintech companies">Fintech Companies</option>
                    <option value="SaaS startups">SaaS Startups</option>
                    <option value="Healthcare tech">Healthcare Tech</option>
                    <option value="EdTech companies">EdTech Companies</option>
                    <option value="E-commerce startups">E-commerce Startups</option>
                    <option value="Blockchain companies">Blockchain Companies</option>
                    <option value="Cybersecurity startups">Cybersecurity Startups</option>
                    <option value="Biotech companies">Biotech Companies</option>
                    <option value="CleanTech startups">CleanTech Startups</option>
                    <option value="Robotics companies">Robotics Companies</option>
                    <option value="Gaming startups">Gaming Startups</option>
                    <option value="Media tech companies">Media Tech Companies</option>
                    <option value="Real estate tech">Real Estate Tech</option>
                    <option value="Food tech startups">Food Tech Startups</option>
                    <option value="Travel tech companies">Travel Tech Companies</option>
                  </select>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !companyType.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0a7fff] text-white rounded-lg hover:bg-[#0966d9] transition disabled:opacity-50"
                >
                  {searching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search Companies
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SMTP Configuration */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  SMTP Settings
                </h2>
                <button
                  onClick={() => {
                    setSmtpEmail("kavish17shah@gmail.com");
                    setSmtpPassword("iwgd fbvl xxfj ojty");
                  }}
                  className="p-2 bg-[#0a7fff] text-white rounded-lg hover:bg-[#0966d9] transition"
                  title="Auto-fill SMTP credentials"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={smtpEmail}
                    onChange={(e) => setSmtpEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    SMTP Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="App password or SMTP password"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For Gmail, use an App Password
                  </p>
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Resume (Optional)
              </h2>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-foreground file:text-background hover:file:opacity-90"
                />
                {resumeFile && (
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {resumeFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Companies & Email */}
          <div className="lg:col-span-2 space-y-6">
            {/* Companies List */}
            {companies.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Companies ({companies.length})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="px-3 py-1 text-sm bg-foreground/10 text-foreground rounded hover:bg-foreground/20 transition"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="px-3 py-1 text-sm bg-foreground/10 text-foreground rounded hover:bg-foreground/20 transition"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {companies.map((company, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg transition ${
                        selectedCompanies.has(index)
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleCompanySelection(index)}
                          className="mt-1"
                        >
                          {selectedCompanies.has(index) ? (
                            <CheckSquare className="w-5 h-5 text-foreground" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{company.company_name}</h3>
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                              >
                                {company.website}
                              </a>
                            </div>
                            {getStatusBadge(company.status)}
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-foreground">
                              <span className="font-medium">Emails:</span>{" "}
                              {company.emails.join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Template */}
            {companies.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Email Template</h2>
                  <button
                    onClick={handleGenerateTemplate}
                    disabled={generatingTemplate || selectedCompanies.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0a7fff] text-white rounded-lg hover:bg-[#0966d9] transition disabled:opacity-50"
                  >
                    {generatingTemplate ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject line"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Body
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Email body..."
                      rows={10}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Use {"{"}company_name{"}"} as placeholder for company name
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            {companies.length > 0 && selectedCompanies.size > 0 && emailSubject && emailBody && (
              <button
                onClick={handleSendEmails}
                disabled={sending || !smtpEmail || !smtpPassword}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#0a7fff] text-white rounded-lg hover:bg-[#0966d9] transition disabled:opacity-50 text-lg font-semibold"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Emails...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send to {selectedCompanies.size} Selected Companies
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

