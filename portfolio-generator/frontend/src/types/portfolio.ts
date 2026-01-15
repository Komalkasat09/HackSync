export type TemplateType = 'modern' | 'creative' | 'professional' | 'developer';

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  email?: string;
}

export interface PersonalInfo {
  full_name: string;
  title: string;
  bio: string;
  location?: string;
  phone?: string;
  email: string;
  social_links: SocialLinks;
  profile_image?: string;
}

export interface GitHubRepo {
  name: string;
  description?: string;
  url: string;
  stars: number;
  forks: number;
  language?: string;
  topics: string[];
  homepage?: string;
}

export interface GitHubProfile {
  username: string;
  name?: string;
  bio?: string;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  repositories: GitHubRepo[];
  top_languages: Record<string, number>;
  total_stars: number;
  total_contributions: number;
}

export interface WorkExperience {
  company: string;
  position: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date?: string;
  gpa?: string;
  description?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github_url?: string;
  image?: string;
  highlights: string[];
}

export interface Skill {
  name: string;
  level?: string;
  category?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  credential_id?: string;
  credential_url?: string;
}

export interface LinkedInProfile {
  profile_url: string;
  headline?: string;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
}

export interface ResumeData {
  personal_info: PersonalInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
}

export interface PortfolioConfig {
  template: TemplateType;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  dark_mode: boolean;
  show_github: boolean;
  show_experience: boolean;
  show_education: boolean;
  show_projects: boolean;
  show_skills: boolean;
  show_certifications: boolean;
}

export interface Portfolio {
  id: string;
  user_id?: string;
  personal_info: PersonalInfo;
  github_profile?: GitHubProfile;
  linkedin_profile?: LinkedInProfile;
  resume_data?: ResumeData;
  projects: Project[];
  skills: Skill[];
  config: PortfolioConfig;
  created_at: string;
  updated_at: string;
}

export interface PortfolioCreate {
  personal_info: PersonalInfo;
  config?: PortfolioConfig;
}

export interface GitHubFetchRequest {
  username: string;
  include_repos: boolean;
  max_repos: number;
}

export type ExportFormat = 'html' | 'zip' | 'pdf';
