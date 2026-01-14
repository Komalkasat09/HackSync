"use client";

import { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Plus, 
  X, 
  Edit2, 
  Save, 
  Trash2,
  Briefcase,
  GraduationCap,
  Code,
  Heart,
  Download,
  Eye
} from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { SkillAutocomplete } from "@/components/SkillAutocomplete";
import { TECH_SKILLS, INTERESTS } from "@/lib/skillsSuggestions";

interface Skill {
  id: string;
  name: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
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

export default function YourProfilePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingExp, setEditingExp] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  
  const [education, setEducation] = useState<Education[]>([]);
  const [editingEdu, setEditingEdu] = useState<string | null>(null);
  
  const [interests, setInterests] = useState<Interest[]>([]);
  const [newInterest, setNewInterest] = useState("");

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
        setExperiences(data.experiences || []);
        setProjects(data.projects || []);
        setEducation(data.education || []);
        setInterests(data.interests || []);
        setHasResume(data.has_resume || false);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", resumeFile);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.PROFILE.UPLOAD_RESUME, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        setHasResume(true);
        setResumeFile(null);
      }
    } catch (error) {
      console.error("Failed to upload resume:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleResumeView = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.PROFILE.GET_RESUME, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Failed to view resume:", error);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    
    const skill: Skill = {
      id: Date.now().toString(),
      name: newSkill.trim()
    };
    
    const updatedSkills = [...skills, skill];
    setSkills(updatedSkills);
    setNewSkill("");
    
    await saveProfileData({ skills: updatedSkills });
  };

  const removeSkill = async (id: string) => {
    const updatedSkills = skills.filter(s => s.id !== id);
    setSkills(updatedSkills);
    await saveProfileData({ skills: updatedSkills });
  };

  const addInterest = async () => {
    if (!newInterest.trim()) return;
    
    const interest: Interest = {
      id: Date.now().toString(),
      name: newInterest.trim()
    };
    
    const updatedInterests = [...interests, interest];
    setInterests(updatedInterests);
    setNewInterest("");
    
    await saveProfileData({ interests: updatedInterests });
  };

  const removeInterest = async (id: string) => {
    const updatedInterests = interests.filter(i => i.id !== id);
    setInterests(updatedInterests);
    await saveProfileData({ interests: updatedInterests });
  };

  const saveProfileData = async (data: any) => {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
        <p className="text-foreground/60 mt-1">Manage your professional profile, resume, and skills</p>
      </div>

      {/* Resume Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Resume
        </h2>
        
        <div className="space-y-4">
          {hasResume ? (
            <div className="flex items-center gap-4">
              <div className="flex-1 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Resume uploaded</p>
              </div>
              <button
                onClick={handleResumeView}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-all duration-300 cursor-pointer">
                <Upload className="w-4 h-4" />
                Replace
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
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-foreground/40 mx-auto mb-3" />
              <p className="text-foreground/60 mb-4">Upload your resume (PDF format)</p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 cursor-pointer">
                <Upload className="w-4 h-4" />
                Choose File
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
            </div>
          )}
          
          {resumeFile && (
            <div className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="flex-1 text-sm text-foreground">{resumeFile.name}</span>
              <button
                onClick={handleResumeUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => setResumeFile(null)}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-500" />
          Skills
        </h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
            >
              {skill.name}
              <button
                onClick={() => removeSkill(skill.id)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        
        <SkillAutocomplete
          value={newSkill}
          onChange={setNewSkill}
          onAdd={addSkill}
          placeholder="Type to search or add a skill..."
          suggestions={TECH_SKILLS}
        />
      </div>

      {/* Interests Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-blue-500" />
          Interests
        </h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {interests.map((interest) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
            >
              {interest.name}
              <button
                onClick={() => removeInterest(interest.id)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        
        <SkillAutocomplete
          value={newInterest}
          onChange={setNewInterest}
          onAdd={addInterest}
          placeholder="Type to search or add an interest..."
          suggestions={INTERESTS}
        />
      </div>
    </div>
  );
}