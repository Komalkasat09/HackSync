import React from 'react';
import { Mail, MapPin, Github, Linkedin, Globe, ExternalLink, Calendar, Briefcase, Code, GraduationCap, ArrowUpRight } from 'lucide-react';

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

interface MinimalPortfolioTemplateProps {
  data: PortfolioData;
  isPreview?: boolean;
}

export function MinimalPortfolioTemplate({ data, isPreview = false }: MinimalPortfolioTemplateProps) {
  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'github': return <Github className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'website': return <Globe className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white ${isPreview ? '' : 'overflow-x-hidden'}`}>
      {/* Hero Section with Gradient */}
      <section className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_50%)]"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        
        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm font-medium backdrop-blur-sm">
                Available for work
              </span>
            </div>
            <h1 className="text-7xl md:text-8xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              {data.name}
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 max-w-3xl leading-relaxed font-light">
              {data.bio}
            </p>
            <div className="flex flex-wrap items-center gap-6 text-gray-400 pt-4">
              {data.location && (
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                  <MapPin className="w-4 h-4" />
                  <span>{data.location}</span>
                </div>
              )}
              {data.email && (
                <a href={`mailto:${data.email}`} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                  <Mail className="w-4 h-4" />
                  <span>{data.email}</span>
                </a>
              )}
            </div>
            {data.links.length > 0 && (
              <div className="flex items-center gap-4 pt-4">
                {data.links.map(link => (
                  <a
                    key={link.id}
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300 group"
                  >
                    <div className="group-hover:scale-110 transition-transform">
                      {getLinkIcon(link.type)}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      {data.skills.length > 0 && (
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-16">
              <Code className="w-8 h-8 text-purple-400" />
              <h2 className="text-5xl font-bold">Skills & Expertise</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.skills.map((skill, idx) => (
                <div 
                  key={skill.id} 
                  className="group relative p-6 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-300"></div>
                  <span className="relative text-lg font-medium text-gray-200 group-hover:text-white transition-colors">
                    {skill.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Section */}
      {data.experiences.length > 0 && (
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-16">
              <Briefcase className="w-8 h-8 text-purple-400" />
              <h2 className="text-5xl font-bold">Experience</h2>
            </div>
            <div className="space-y-8">
              {data.experiences.map((exp, idx) => (
                <div 
                  key={exp.id} 
                  className="group relative p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 hover:border-purple-400/50 transition-all duration-300"
                >
                  <div className="absolute top-8 left-0 w-1 h-16 bg-gradient-to-b from-purple-500 to-blue-500 rounded-r-full"></div>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                        {exp.title}
                      </h3>
                      <p className="text-xl text-purple-300 font-medium">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 whitespace-nowrap">
                      <Calendar className="w-4 h-4" />
                      <span>{exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}</span>
                    </div>
                  </div>
                  <p className="text-lg text-gray-300 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects Section */}
      {data.projects.length > 0 && (
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-16">
              <Code className="w-8 h-8 text-purple-400" />
              <h2 className="text-5xl font-bold">Featured Projects</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {data.projects.map((project, idx) => (
                <div 
                  key={project.id} 
                  className="group relative p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 rounded-3xl transition-all duration-300"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {project.name}
                      </h3>
                      {project.link && (
                        <a 
                          href={project.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all group/link"
                        >
                          <ArrowUpRight className="w-5 h-5 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                        </a>
                      )}
                    </div>
                    <p className="text-gray-300 mb-4 leading-relaxed">{project.description}</p>
                    {project.technologies && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.split(',').map((tech, i) => (
                          <span 
                            key={i} 
                            className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Education Section */}
      {data.education.length > 0 && (
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-16">
              <GraduationCap className="w-8 h-8 text-purple-400" />
              <h2 className="text-5xl font-bold">Education</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {data.education.map(edu => (
                <div 
                  key={edu.id} 
                  className="p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 hover:border-purple-400/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-400/30">
                      <GraduationCap className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{edu.degree}</h3>
                      <p className="text-purple-300 font-medium mb-1">{edu.institution}</p>
                      <p className="text-gray-400">{edu.year}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 to-transparent"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h2 className="text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Let's Work Together
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Have a project in mind? Let's create something amazing together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {data.email && (
              <a 
                href={`mailto:${data.email}`} 
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                <span>Send Email</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </a>
            )}
            {data.links.map(link => (
              <a
                key={link.id}
                href={link.value}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 flex items-center gap-2"
              >
                {getLinkIcon(link.type)}
                <span className="capitalize">{link.type}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>© 2026 {data.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Demo data
const demoData: PortfolioData = {
  user_id: "1",
  name: "Alex Rivera",
  email: "alex@example.com",
  location: "San Francisco, CA",
  bio: "Full-stack developer & designer crafting digital experiences that blend creativity with cutting-edge technology",
  links: [
    { id: "1", type: "github", value: "https://github.com" },
    { id: "2", type: "linkedin", value: "https://linkedin.com" },
    { id: "3", type: "website", value: "https://example.com" }
  ],
  skills: [
    { id: "1", name: "React" },
    { id: "2", name: "TypeScript" },
    { id: "3", name: "Node.js" },
    { id: "4", name: "Python" },
    { id: "5", name: "UI/UX Design" },
    { id: "6", name: "GraphQL" },
    { id: "7", name: "AWS" },
    { id: "8", name: "Docker" }
  ],
  experiences: [
    {
      id: "1",
      title: "Senior Full-Stack Engineer",
      company: "Tech Innovations Inc",
      startDate: "Jan 2022",
      endDate: "",
      currentlyWorking: true,
      description: "Leading development of scalable microservices architecture serving 2M+ users. Built real-time collaboration features and reduced API response times by 60%."
    },
    {
      id: "2",
      title: "Software Engineer",
      company: "StartupXYZ",
      startDate: "Jun 2020",
      endDate: "Dec 2021",
      currentlyWorking: false,
      description: "Developed core product features and implemented CI/CD pipelines. Collaborated with design team to deliver pixel-perfect user interfaces."
    }
  ],
  projects: [
    {
      id: "1",
      name: "AI Content Studio",
      description: "Full-stack platform for AI-powered content generation with real-time collaboration. Built with React, Node.js, and OpenAI API.",
      technologies: "React, Node.js, PostgreSQL, OpenAI",
      link: "https://github.com"
    },
    {
      id: "2",
      name: "DevFlow",
      description: "Developer productivity tool with integrated code snippets, task management, and team collaboration features.",
      technologies: "Next.js, TypeScript, Prisma, tRPC",
      link: "https://github.com"
    },
    {
      id: "3",
      name: "Design System Pro",
      description: "Comprehensive design system with 100+ components, built for scalability and accessibility.",
      technologies: "React, Storybook, Tailwind CSS",
      link: "https://github.com"
    },
    {
      id: "4",
      name: "Analytics Dashboard",
      description: "Real-time analytics platform with interactive data visualizations and custom reporting.",
      technologies: "Vue.js, D3.js, Firebase",
      link: "https://github.com"
    }
  ],
  education: [
    {
      id: "1",
      degree: "Bachelor of Science in Computer Science",
      institution: "Stanford University",
      year: "2016 - 2020"
    },
    {
      id: "2",
      degree: "Full-Stack Web Development",
      institution: "Lambda School",
      year: "2019"
    }
  ],
  interests: [
    { id: "1", name: "Open Source" },
    { id: "2", name: "UI Design" },
    { id: "3", name: "Machine Learning" }
  ]
};

export default function App() {
  return <MinimalPortfolioTemplate data={demoData} />;
}