"use client";

import { useState, useEffect } from "react";
import { Briefcase, MapPin, TrendingUp, ExternalLink, Bookmark, CheckCircle, Filter, Building2 } from "lucide-react";

interface Job {
  job_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  required_skills: string[];
  url: string;
  salary?: string;
  job_type?: string;
  experience_level?: string;
  source: string;
  posted_date?: string;
}

interface JobMatch {
  job: Job;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRelevantJobs();
    fetchSavedJobs();
  }, []);

  const fetchRelevantJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/jobs/relevant?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        setUserSkills(data.user_skills);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/jobs/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        const saved = new Set(data.jobs.map((j: any) => j.job_id));
        setSavedJobs(saved);
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  };

  const saveJob = async (jobId: string, status: string = "saved") => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:8000/api/jobs/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_id: jobId, status }),
      });

      setSavedJobs((prev) => new Set(prev).add(jobId));
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      linkedin: "bg-blue-100 text-blue-800",
      indeed: "bg-red-100 text-red-800",
      internshala: "bg-purple-100 text-purple-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  const filteredJobs = filterSource === "all" 
    ? jobs 
    : jobs.filter((j) => j.job.source === filterSource);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Job Opportunities</h1>
          <p className="text-muted-foreground">
            {jobs.length} jobs matched to your {userSkills.length} skills
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm p-4 mb-6 flex items-center gap-4 border border-border">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Sources</option>
            <option value="linkedin">LinkedIn</option>
            <option value="indeed">Indeed</option>
            <option value="internshala">Internshala</option>
          </select>
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredJobs.length} jobs
          </div>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {filteredJobs.map((jobMatch) => {
            const { job, match_score, matched_skills, missing_skills } = jobMatch;
            const isSaved = savedJobs.has(job.job_id);

            return (
              <div
                key={job.job_id}
                className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border"
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getSourceBadge(job.source)}`}>
                          {job.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        {job.job_type && (
                          <span className="px-2 py-1 bg-muted rounded text-xs">
                            {job.job_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className={`flex flex-col items-center px-4 py-3 rounded-lg border-2 ${getMatchColor(match_score)}`}>
                      <TrendingUp className="w-5 h-5 mb-1" />
                      <span className="text-2xl font-bold">{match_score}%</span>
                      <span className="text-xs">Match</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

                  {/* Skills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {matched_skills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                      {missing_skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded-full border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    {matched_skills.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {matched_skills.length} of {job.required_skills.length} skills matched
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Job
                    </a>
                    <button
                      onClick={() => saveJob(job.job_id, "saved")}
                      disabled={isSaved}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isSaved
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {isSaved ? <CheckCircle className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      {isSaved ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={() => saveJob(job.job_id, "applied")}
                      className="px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                    >
                      Mark Applied
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Jobs Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or add more skills to your profile
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
