"use client";

import { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  X,
  Plus,
  Loader2,
  Link as LinkIcon,
  Github,
  Linkedin,
  Globe,
  Phone,
  Mail,
  FolderGit2
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { useRouter } from "next/navigation";

interface Skill {
  id: string;
  name: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
}

interface NewExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
}

interface NewEducation {
  degree: string;
  institution: string;
  year: string;
}

interface Link {
  id: string;
  type: string;
  value: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link?: string;
}

interface NewProject {
  name: string;
  description: string;
  technologies: string;
  link: string;
}

interface NewLink {
  type: string;
  value: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

interface Interest {
  id: string;
  name: string;
}

export default function AIResumePage() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Profile data (editable)
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [newInterest, setNewInterest] = useState("");
  
  // Add/Edit states
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newExp, setNewExp] = useState<NewExperience>({ title: "", company: "", startDate: "", endDate: "", currentlyWorking: false, description: "" });
  const [newEdu, setNewEdu] = useState<NewEducation>({ degree: "", institution: "", year: "" });
  const [newLink, setNewLink] = useState<NewLink>({ type: "github", value: "" });
  const [newProject, setNewProject] = useState<NewProject>({ name: "", description: "", technologies: "", link: "" });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.PROFILE.GET, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
        setLinks(data.links || []);
        setExperiences(data.experiences || []);
        setProjects(data.projects || []);
        setEducation(data.education || []);
        setInterests(data.interests || []);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    const skill: Skill = {
      id: Date.now().toString(),
      name: newSkill.trim()
    };
    
    setSkills([...skills, skill]);
    setNewSkill("");
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
  };

  const addLink = async () => {
    if (!newLink.value.trim()) return;
    
    const link: Link = {
      id: Date.now().toString(),
      type: newLink.type,
      value: newLink.value.trim()
    };
    
    const updatedLinks = [...links, link];
    setLinks(updatedLinks);
    setNewLink({ type: "github", value: "" });
    setShowAddLink(false);
    
    // Save to MongoDB
    await saveProfileData({ links: updatedLinks });
  };

  const removeLink = async (id: string) => {
    const updatedLinks = links.filter(l => l.id !== id);
    setLinks(updatedLinks);
    await saveProfileData({ links: updatedLinks });
  };

  const getLinkIcon = (type: string) => {
    switch(type) {
      case "github": return <Github className="w-4 h-4" />;
      case "linkedin": return <Linkedin className="w-4 h-4" />;
      case "website": return <Globe className="w-4 h-4" />;
      case "phone": return <Phone className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "portfolio": return <FolderGit2 className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    
    const interest: Interest = {
      id: Date.now().toString(),
      name: newInterest.trim()
    };
    
    setInterests([...interests, interest]);
    setNewInterest("");
  };

  const removeInterest = (id: string) => {
    setInterests(interests.filter(i => i.id !== id));
  };

  const addExperience = async () => {
    if (!newExp.title.trim() || !newExp.company.trim() || !newExp.startDate) return;
    
    const experience: Experience = {
      id: Date.now().toString(),
      title: newExp.title.trim(),
      company: newExp.company.trim(),
      startDate: newExp.startDate,
      endDate: newExp.currentlyWorking ? "Present" : newExp.endDate,
      currentlyWorking: newExp.currentlyWorking,
      description: newExp.description.trim()
    };
    
    const updatedExperiences = [...experiences, experience];
    setExperiences(updatedExperiences);
    setNewExp({ title: "", company: "", startDate: "", endDate: "", currentlyWorking: false, description: "" });
    setShowAddExp(false);
    
    // Save to MongoDB
    await saveProfileData({ experiences: updatedExperiences });
  };

  const removeExperience = async (id: string) => {
    const updatedExperiences = experiences.filter(e => e.id !== id);
    setExperiences(updatedExperiences);
    await saveProfileData({ experiences: updatedExperiences });
  };

  const addEducation = async () => {
    if (!newEdu.degree.trim() || !newEdu.institution.trim()) return;
    
    const edu: Education = {
      id: Date.now().toString(),
      degree: newEdu.degree.trim(),
      institution: newEdu.institution.trim(),
      year: newEdu.year.trim()
    };
    
    const updatedEducation = [...education, edu];
    setEducation(updatedEducation);
    setNewEdu({ degree: "", institution: "", year: "" });
    setShowAddEdu(false);
    
    // Save to MongoDB
    await saveProfileData({ education: updatedEducation });
  };

  const removeEducation = async (id: string) => {
    const updatedEducation = education.filter(e => e.id !== id);
    setEducation(updatedEducation);
    await saveProfileData({ education: updatedEducation });
  };

  const addProject = async () => {
    if (!newProject.name.trim() || !newProject.description.trim()) return;
    
    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      technologies: newProject.technologies.trim(),
      link: newProject.link.trim() || undefined
    };
    
    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    setNewProject({ name: "", description: "", technologies: "", link: "" });
    setShowAddProject(false);
    
    // Save to MongoDB
    await saveProfileData({ projects: updatedProjects });
  };

  const removeProject = async (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    await saveProfileData({ projects: updatedProjects });
  };

  const saveProfileData = async (data: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(API_ENDPOINTS.PROFILE.UPDATE, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error("Failed to save profile data:", error);
    }
  };

  const handleAnalyzeResume = async () => {
    setAnalyzing(true);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      // Add resume file if uploaded (optional)
      if (resumeFile) {
        formData.append("file", resumeFile);
      }
      
      // Add profile data
      formData.append("skills", JSON.stringify(skills.map(s => s.name)));
      formData.append("links", JSON.stringify(links));
      formData.append("experiences", JSON.stringify(experiences));
      formData.append("projects", JSON.stringify(projects));
      formData.append("education", JSON.stringify(education));
      formData.append("interests", JSON.stringify(interests.map(i => i.name)));
      
      const response = await fetch(API_ENDPOINTS.AI_RESUME.ANALYZE, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        await response.json();
        // Navigate to preview page with resume data
        router.push("/dashboard/ai-resume/preview");
      } else {
        const error = await response.json();
        alert(`Failed to analyze: ${error.detail}`);
      }
    } catch (error) {
      console.error("Failed to analyze resume:", error);
      alert("Failed to analyze. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-500" />
          AI Resume Builder
        </h1>
        <p className="text-foreground/60 mt-1">
          Upload your resume (optional) and enhance it with AI using your profile data
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Upload Resume (Optional)
        </h2>

        <div className="border-2 border-black/30 dark:border-white/30 border-dashed rounded-lg p-6 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
          {!resumeFile ? (
            <label className="flex flex-col items-center justify-center gap-3 py-6 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all">
              <Upload className="w-12 h-12 text-blue-500" />
              <div className="text-center">
                <p className="text-black dark:text-white font-medium mb-1">Upload existing resume (PDF)</p>
                <p className="text-sm text-black/60 dark:text-white/60">or proceed without a resume to build from scratch</p>
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setResumeFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-blue-100 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-300 dark:border-blue-700 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="flex-1 text-black dark:text-white font-medium truncate">{resumeFile.name}</span>
              <button
                onClick={() => setResumeFile(null)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Skills</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
            >
              {skill.name}
              <button
                onClick={() => removeSkill(skill.id)}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            placeholder="Add a skill (e.g., Python, React)"
            className="flex-1 px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
          />
          <button
            onClick={addSkill}
            className="px-6 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">Links</h2>
          <button
            onClick={() => setShowAddLink(!showAddLink)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>
        
        {showAddLink && (
          <div className="mb-4 p-4 bg-black/5 dark:bg-white/5 backdrop-blur-sm border-2 border-black/20 dark:border-white/20 rounded-lg space-y-3">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Link Type</label>
              <select
                value={newLink.type}
                onChange={(e) => setNewLink({...newLink, type: e.target.value})}
                className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white"
              >
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="website">Website</option>
                <option value="portfolio">Portfolio</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <input
              type="text"
              value={newLink.value}
              onChange={(e) => setNewLink({...newLink, value: e.target.value})}
              placeholder={newLink.type === "phone" ? "+1 (555) 123-4567" : newLink.type === "email" ? "your@email.com" : "https://..."}
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <div className="flex gap-2">
              <button
                onClick={addLink}
                className="px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddLink(false);
                  setNewLink({ type: "github", value: "" });
                }}
                className="px-4 py-2 bg-black/10 dark:bg-white/10 border-2 border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {links.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <span
                key={link.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
              >
                {getLinkIcon(link.type)}
                <span className="capitalize">{link.type}</span>
                <span className="text-xs opacity-70 max-w-[150px] truncate">{link.value}</span>
                <button
                  onClick={() => removeLink(link.id)}
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-black/60 dark:text-white/60 text-sm">No links added yet. Click "Add Link" to begin.</p>
        )}
      </div>

      {/* Experience Section */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">Experience</h2>
          <button
            onClick={() => setShowAddExp(!showAddExp)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </div>
        
        {showAddExp && (
          <div className="mb-4 p-4 bg-black/5 dark:bg-white/5 backdrop-blur-sm border-2 border-black/20 dark:border-white/20 rounded-lg space-y-3">
            <input
              type="text"
              value={newExp.title}
              onChange={(e) => setNewExp({...newExp, title: e.target.value})}
              placeholder="Job Title"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <input
              type="text"
              value={newExp.company}
              onChange={(e) => setNewExp({...newExp, company: e.target.value})}
              placeholder="Company Name"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">Start Date</label>
                <input
                  type="month"
                  value={newExp.startDate}
                  onChange={(e) => setNewExp({...newExp, startDate: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-1">End Date</label>
                <input
                  type="month"
                  value={newExp.endDate}
                  onChange={(e) => setNewExp({...newExp, endDate: e.target.value})}
                  disabled={newExp.currentlyWorking}
                  className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newExp.currentlyWorking}
                onChange={(e) => setNewExp({...newExp, currentlyWorking: e.target.checked, endDate: e.target.checked ? "" : newExp.endDate})}
                className="w-4 h-4 rounded border-2 border-black/20 dark:border-white/20 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-black dark:text-white">I currently work here</span>
            </label>
            <textarea
              value={newExp.description}
              onChange={(e) => setNewExp({...newExp, description: e.target.value})}
              placeholder="Job Description"
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <div className="flex gap-2">
              <button
                onClick={addExperience}
                className="px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddExp(false);
                  setNewExp({ title: "", company: "", startDate: "", endDate: "", currentlyWorking: false, description: "" });
                }}
                className="px-4 py-2 bg-black/10 dark:bg-white/10 border-2 border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {experiences.length > 0 ? (
          <div className="space-y-3">
            {experiences.map((exp) => (
              <div key={exp.id} className="p-4 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg group relative">
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="absolute top-3 right-3 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-semibold text-black dark:text-white">{exp.title}</h3>
                <p className="text-sm text-black/70 dark:text-white/70">{exp.company} • {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.currentlyWorking ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-black/60 dark:text-white/60 text-sm">No experience added yet. Click "Add Experience" to begin.</p>
        )}
      </div>

      {/* Education Section */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">Education</h2>
          <button
            onClick={() => setShowAddEdu(!showAddEdu)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Education
          </button>
        </div>
        
        {showAddEdu && (
          <div className="mb-4 p-4 bg-black/5 dark:bg-white/5 backdrop-blur-sm border-2 border-black/20 dark:border-white/20 rounded-lg space-y-3">
            <input
              type="text"
              value={newEdu.degree}
              onChange={(e) => setNewEdu({...newEdu, degree: e.target.value})}
              placeholder="Degree (e.g., Bachelor of Science in Computer Science)"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <input
              type="text"
              value={newEdu.institution}
              onChange={(e) => setNewEdu({...newEdu, institution: e.target.value})}
              placeholder="Institution Name"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <input
              type="text"
              value={newEdu.year}
              onChange={(e) => setNewEdu({...newEdu, year: e.target.value})}
              placeholder="Year (e.g., 2020 - 2024)"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <div className="flex gap-2">
              <button
                onClick={addEducation}
                className="px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddEdu(false);
                  setNewEdu({ degree: "", institution: "", year: "" });
                }}
                className="px-4 py-2 bg-black/10 dark:bg-white/10 border-2 border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {education.length > 0 ? (
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="p-4 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg group relative">
                <button
                  onClick={() => removeEducation(edu.id)}
                  className="absolute top-3 right-3 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-semibold text-black dark:text-white">{edu.degree}</h3>
                <p className="text-sm text-black/70 dark:text-white/70">{edu.institution} • {edu.year}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-black/60 dark:text-white/60 text-sm">No education added yet. Click "Add Education" to begin.</p>
        )}
      </div>

      {/* Projects Section */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">Projects</h2>
          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>
        
        {showAddProject && (
          <div className="mb-4 p-4 bg-black/5 dark:bg-white/5 backdrop-blur-sm border-2 border-black/20 dark:border-white/20 rounded-lg space-y-3">
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              placeholder="Project Name"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              placeholder="Project Description"
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <input
              type="text"
              value={newProject.technologies}
              onChange={(e) => setNewProject({...newProject, technologies: e.target.value})}
              placeholder="Technologies (e.g., React, Node.js, MongoDB)"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <input
              type="text"
              value={newProject.link}
              onChange={(e) => setNewProject({...newProject, link: e.target.value})}
              placeholder="Project Link (optional, e.g., https://github.com/...)"
              className="w-full px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
            />
            <div className="flex gap-2">
              <button
                onClick={addProject}
                className="px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddProject(false);
                  setNewProject({ name: "", description: "", technologies: "", link: "" });
                }}
                className="px-4 py-2 bg-black/10 dark:bg-white/10 border-2 border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg group relative">
                <button
                  onClick={() => removeProject(proj.id)}
                  className="absolute top-3 right-3 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-semibold text-black dark:text-white flex items-center gap-2">
                  {proj.name}
                  {proj.link && (
                    <a 
                      href={proj.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </a>
                  )}
                </h3>
                <p className="text-sm text-black/70 dark:text-white/70 mt-1">{proj.description}</p>
                {proj.technologies && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {proj.technologies.split(',').map((tech, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-black/60 dark:text-white/60 text-sm">No projects added yet. Click "Add Project" to begin.</p>
        )}
      </div>

      {/* Interests Section */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Interests</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {interests.map((interest) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
            >
              {interest.name}
              <button
                onClick={() => removeInterest(interest.id)}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addInterest()}
            placeholder="Add an interest (e.g., Machine Learning)"
            className="flex-1 px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50"
          />
          <button
            onClick={addInterest}
            className="px-6 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Analyze Button - Only show when no forms are open */}
      {!showAddExp && !showAddEdu && !showAddLink && !showAddProject && (
        <div className="flex justify-end py-6">
          <button
            onClick={handleAnalyzeResume}
            disabled={analyzing || (skills.length === 0 && !resumeFile)}
            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-white text-black border-2 border-black/20 text-lg font-semibold rounded-xl hover:bg-white/80 dark:hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate AI Resume
              </>
            )}
          </button>
        </div>
      )}

      {(skills.length === 0 && !resumeFile) && (
        <p className="text-center text-sm text-black/60 dark:text-white/60">
          Add at least one skill or upload a resume to generate your AI-powered resume
        </p>
      )}
    </div>
  );
}
