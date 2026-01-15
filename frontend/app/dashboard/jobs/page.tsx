"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MapPin, TrendingUp, ExternalLink, Bookmark, CheckCircle, Filter, Building2, RefreshCw, Search, X, Award, FileText } from "lucide-react";

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
  const router = useRouter();
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  
  // New filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterJobType, setFilterJobType] = useState<string>("all");
  const [filterMinSalary, setFilterMinSalary] = useState<string>("0");
  const [showFilters, setShowFilters] = useState(true);

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

      if (!response.ok) {
        // Silently fail if endpoint is not available
        return;
      }

      const data = await response.json();
      if (data.success) {
        const saved = new Set(data.jobs.map((j: any) => j.job_id));
        setSavedJobs(saved);
      }
    } catch (error) {
      // Silently fail - saved jobs feature is optional
      console.log("Saved jobs feature unavailable");
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

  const refreshJobs = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/jobs/trigger-scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setRefreshMessage(
          `✅ Successfully scraped ${data.stats?.total_scraped || 0} jobs! (${data.stats?.saved_new || 0} new, ${data.stats?.updated_existing || 0} updated)`
        );
        // Refresh the job list after 2 seconds
        setTimeout(() => {
          fetchRelevantJobs();
          setRefreshMessage(null);
        }, 2000);
      } else {
        setRefreshMessage(`❌ ${data.message || "Failed to refresh jobs"}`);
      }
    } catch (error) {
      console.error("Error refreshing jobs:", error);
      setRefreshMessage("❌ Failed to refresh jobs. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
    if (score >= 60) return "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700";
    if (score >= 40) return "text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700";
    return "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700";
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      linkedin: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700",
      indeed: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700",
      internshala: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700",
      zip_recruiter: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700",
      glassdoor: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700",
    };
    return colors[source] || "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700";
  };

  const handleApplyClick = (job: Job) => {
    const params = new URLSearchParams({
      job_id: job.job_id,
      title: job.title,
      company: job.company,
      description: job.description,
    });
    router.push(`/dashboard/applications?${params.toString()}`);
  };

  // Extract unique locations and job types from jobs
  const uniqueLocations = Array.from(new Set(jobs.map(j => j.job.location))).filter(Boolean).sort();
  const uniqueJobTypes = Array.from(new Set(jobs.map(j => j.job.job_type))).filter(Boolean).sort();

  // Parse salary from string (e.g., "$50,000 - $70,000 yearly")
  const parseSalary = (salaryStr?: string): number => {
    if (!salaryStr) return 0;
    const matches = salaryStr.match(/\$?([\d,]+)/g);
    if (!matches || matches.length === 0) return 0;
    const firstNum = matches[0].replace(/[^\d]/g, '');
    return parseInt(firstNum) || 0;
  };

  // Apply all filters
  const filteredJobs = jobs.filter((jobMatch) => {
    const job = jobMatch.job;
    const searchLower = searchQuery.toLowerCase();

    // Search filter (company or job title)
    if (searchQuery && !job.title.toLowerCase().includes(searchLower) && 
        !job.company.toLowerCase().includes(searchLower)) {
      return false;
    }

    // Source filter
    if (filterSource !== "all" && job.source !== filterSource) {
      return false;
    }

    // Location filter
    if (filterLocation !== "all" && job.location !== filterLocation) {
      return false;
    }

    // Job type filter
    if (filterJobType !== "all" && job.job_type?.toLowerCase() !== filterJobType.toLowerCase()) {
      return false;
    }

    // Salary filter
    const minSalaryNum = parseInt(filterMinSalary);
    if (minSalaryNum > 0) {
      const jobSalary = parseSalary(job.salary);
      if (jobSalary === 0 || jobSalary < minSalaryNum) {
        return false;
      }
    }

    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterSource("all");
    setFilterLocation("all");
    setFilterJobType("all");
    setFilterMinSalary("0");
  };

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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Job Opportunities</h1>
            <p className="text-muted-foreground">
              {jobs.length} jobs matched to your {userSkills.length} skills
            </p>
          </div>
          <button
            onClick={refreshJobs}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Scraping..." : "Refresh Jobs"}
          </button>
        </div>

        {/* Refresh Message */}
        {refreshMessage && (
          <div className={`mb-4 p-4 rounded-lg ${
            refreshMessage.startsWith('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {refreshMessage}
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-border mb-6">
          {/* Filter Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Filters</h3>
              <span className="text-sm text-muted-foreground">({filteredJobs.length} jobs)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {showFilters ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Filter Content */}
          {showFilters && (
            <div className="p-4 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by company or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Source
                  </label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Sources</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indeed">Indeed</option>
                    <option value="zip_recruiter">ZipRecruiter</option>
                    <option value="glassdoor">Glassdoor</option>
                    <option value="internshala">Internshala</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location
                  </label>
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Locations</option>
                    {uniqueLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Type
                  </label>
                  <select
                    value={filterJobType}
                    onChange={(e) => setFilterJobType(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                    {uniqueJobTypes.map((type) => {
                      if (["full-time", "part-time", "internship", "contract"].includes(type.toLowerCase())) return null;
                      return (
                        <option key={type} value={type.toLowerCase()}>
                          {type}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Salary Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Min Salary
                  </label>
                  <select
                    value={filterMinSalary}
                    onChange={(e) => setFilterMinSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="0">Any Salary</option>
                    <option value="90000">$90,000+</option>
                    <option value="120000">$120,000+</option>
                    <option value="150000">$150,000+</option>
                    <option value="180000">$180,000+</option>
                    <option value="210000">$210,000+</option>
                    <option value="240000">$240,000+</option>
                    <option value="270000">$270,000+</option>
                    <option value="300000">$300,000+</option>
                  </select>
                </div>
              </div>
            </div>
          )}
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
                        {/* Complete Data Badge - Only show for jobs with ALL fields */}
                        {job.salary && 
                         job.company && 
                         job.company.toLowerCase() !== 'nan' &&
                         job.company.toLowerCase() !== 'unknown company' &&
                         job.location && 
                         job.location.toLowerCase() !== 'nan' &&
                         job.location.toLowerCase() !== 'not specified' &&
                         job.job_type && 
                         job.job_type.toLowerCase() !== 'nan' && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Verified
                          </span>
                        )}
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
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                            {job.job_type}
                          </span>
                        )}
                        {job.salary && (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            {job.salary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className={`flex flex-col items-center px-4 py-3 rounded-lg border ${getMatchColor(match_score)}`}>
                      <TrendingUp className="w-5 h-5 mb-1" />
                      <span className="text-2xl font-bold">{Math.round(match_score)}</span>
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
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                      {missing_skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
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
                    <button
                      onClick={() => handleApplyClick(job)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Apply
                    </button>
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
