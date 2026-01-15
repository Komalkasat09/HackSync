import React, { useState } from 'react';
import { Mail, MapPin, Github, Linkedin, Globe, ExternalLink, Calendar, Briefcase, Code, GraduationCap, ChevronDown, ChevronUp, Menu, X } from 'lucide-react';

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

interface ProfessionalPortfolioTemplateProps {
  data: PortfolioData;
  isPreview?: boolean;
}

export function ProfessionalPortfolioTemplate({ data, isPreview = false }: ProfessionalPortfolioTemplateProps) {
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [educationOpen, setEducationOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const Sidebar = () => (
    <aside className="w-80 bg-amber-950 text-amber-50 h-screen sticky top-0 overflow-y-auto border-r-4 border-amber-800">
      <div className="p-8">
        {/* Profile Section */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center border-4 border-amber-800">
            <span className="text-5xl font-bold text-amber-100">{data.name.charAt(0)}</span>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 text-amber-50">{data.name}</h1>
          <p className="text-sm text-amber-200 text-center leading-relaxed">{data.bio}</p>
        </div>

        {/* Contact Info */}
        <div className="mb-8 space-y-3 pb-8 border-b border-amber-800">
          {data.email && (
            <a href={`mailto:${data.email}`} className="flex items-center gap-3 text-amber-200 hover:text-amber-100 transition group">
              <div className="p-2 bg-amber-900 rounded-lg group-hover:bg-amber-800 transition">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm">{data.email}</span>
            </a>
          )}
          {data.location && (
            <div className="flex items-center gap-3 text-amber-200">
              <div className="p-2 bg-amber-900 rounded-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm">{data.location}</span>
            </div>
          )}
        </div>

        {/* Social Links */}
        {data.links.length > 0 && (
          <div className="mb-8 pb-8 border-b border-amber-800">
            <h3 className="text-xs uppercase tracking-wider text-amber-400 mb-4 font-semibold">Connect</h3>
            <div className="space-y-2">
              {data.links.map(link => (
                <a
                  key={link.id}
                  href={link.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-amber-200 hover:text-amber-100 transition group"
                >
                  <div className="p-2 bg-amber-900 rounded-lg group-hover:bg-amber-800 transition">
                    {getLinkIcon(link.type)}
                  </div>
                  <span className="text-sm capitalize">{link.type}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Skills Dropdown */}
        {data.skills.length > 0 && (
          <div className="mb-8 pb-8 border-b border-amber-800">
            <button
              onClick={() => setSkillsOpen(!skillsOpen)}
              className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-amber-400 mb-4 font-semibold hover:text-amber-300 transition"
            >
              <span>Skills</span>
              {skillsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {skillsOpen && (
              <div className="space-y-2 animate-in fade-in">
                {data.skills.map(skill => (
                  <div key={skill.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                    <span className="text-sm text-amber-200">{skill.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Education Dropdown */}
        {data.education.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setEducationOpen(!educationOpen)}
              className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-amber-400 mb-4 font-semibold hover:text-amber-300 transition"
            >
              <span>Education</span>
              {educationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {educationOpen && (
              <div className="space-y-4 animate-in fade-in">
                {data.education.map(edu => (
                  <div key={edu.id} className="bg-amber-900/50 rounded-lg p-3 border border-amber-800">
                    <h4 className="text-sm font-semibold text-amber-100 mb-1">{edu.degree}</h4>
                    <p className="text-xs text-amber-300 mb-1">{edu.institution}</p>
                    <p className="text-xs text-amber-400">{edu.year}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className={`min-h-screen bg-amber-50 ${isPreview ? '' : 'overflow-x-hidden'}`}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-amber-950 text-amber-50 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="w-80 bg-amber-950" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Hero Banner */}
          <section className="bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 text-amber-50 py-20 px-8 lg:px-16">
            <div className="max-w-5xl mx-auto">
              <div className="inline-block mb-6 px-4 py-2 bg-amber-950/30 border border-amber-600/50 rounded-full text-sm">
                Open to Opportunities
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Crafting Digital<br />Experiences
              </h2>
              <p className="text-xl text-amber-100 max-w-2xl leading-relaxed">
                {data.bio}
              </p>
            </div>
          </section>

          {/* Experience Section */}
          {data.experiences.length > 0 && (
            <section className="py-16 px-8 lg:px-16 bg-amber-100/50">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-12">
                  <Briefcase className="w-8 h-8 text-amber-800" />
                  <h2 className="text-4xl font-bold text-amber-950">Work Experience</h2>
                </div>
                <div className="space-y-8">
                  {data.experiences.map((exp, idx) => (
                    <div key={exp.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-4 top-8 w-3 h-3 bg-amber-700 rounded-full border-4 border-amber-100"></div>
                      {/* Timeline line */}
                      {idx !== data.experiences.length - 1 && (
                        <div className="absolute -left-2.5 top-14 bottom-0 w-0.5 bg-amber-300"></div>
                      )}
                      
                      <div className="ml-8 bg-white rounded-2xl p-8 shadow-md border-2 border-amber-200 hover:border-amber-400 transition-all">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-amber-950 mb-2">{exp.title}</h3>
                            <p className="text-lg text-amber-700 font-semibold">{exp.company}</p>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full border border-amber-300 whitespace-nowrap">
                            <Calendar className="w-4 h-4 text-amber-700" />
                            <span className="text-sm text-amber-800 font-medium">
                              {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                            </span>
                          </div>
                        </div>
                        <p className="text-amber-900 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Projects Section */}
          {data.projects.length > 0 && (
            <section className="py-16 px-8 lg:px-16 bg-white">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-12">
                  <Code className="w-8 h-8 text-amber-800" />
                  <h2 className="text-4xl font-bold text-amber-950">Featured Projects</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  {data.projects.map(project => (
                    <div 
                      key={project.id} 
                      className="group bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-8 border-2 border-amber-200 hover:border-amber-600 transition-all hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-2xl font-bold text-amber-950 group-hover:text-amber-800 transition">
                          {project.name}
                        </h3>
                        {project.link && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-700 transition"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                      <p className="text-amber-900 mb-4 leading-relaxed">{project.description}</p>
                      {project.technologies && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.split(',').map((tech, i) => (
                            <span 
                              key={i} 
                              className="px-3 py-1 bg-amber-800 text-amber-50 rounded-full text-xs font-medium"
                            >
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Interests Section */}
          {data.interests.length > 0 && (
            <section className="py-16 px-8 lg:px-16 bg-amber-100/50">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-4xl font-bold text-amber-950 mb-8">Interests</h2>
                <div className="flex flex-wrap gap-3">
                  {data.interests.map(interest => (
                    <div 
                      key={interest.id} 
                      className="px-6 py-3 bg-white border-2 border-amber-300 rounded-full text-amber-900 font-medium hover:bg-amber-800 hover:text-amber-50 hover:border-amber-800 transition-all"
                    >
                      {interest.name}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Contact CTA */}
          <section className="py-20 px-8 lg:px-16 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 text-amber-50">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-5xl font-bold mb-6">Let's Collaborate</h2>
              <p className="text-xl text-amber-200 mb-10 max-w-2xl mx-auto">
                Have an exciting project or opportunity? I'd love to hear from you.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {data.email && (
                  <a 
                    href={`mailto:${data.email}`} 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-amber-50 text-amber-950 rounded-full font-bold text-lg hover:bg-amber-100 transition-all shadow-lg"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Get in Touch</span>
                  </a>
                )}
                {data.links.slice(0, 2).map(link => (
                  <a
                    key={link.id}
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-amber-800/50 backdrop-blur-sm border-2 border-amber-600 text-amber-50 rounded-full font-bold text-lg hover:bg-amber-700 transition-all"
                  >
                    {getLinkIcon(link.type)}
                    <span className="capitalize">{link.type}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 px-8 lg:px-16 bg-amber-950 text-amber-200 text-center border-t-4 border-amber-800">
            <p>© 2026 {data.name}. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

// Demo data
const demoData: PortfolioData = {
  user_id: "1",
  name: "Jordan Hayes",
  email: "jordan@example.com",
  location: "Portland, OR",
  bio: "Creative developer with a passion for building elegant solutions to complex problems",
  links: [
    { id: "1", type: "github", value: "https://github.com" },
    { id: "2", type: "linkedin", value: "https://linkedin.com" },
    { id: "3", type: "website", value: "https://example.com" }
  ],
  skills: [
    { id: "1", name: "JavaScript" },
    { id: "2", name: "React" },
    { id: "3", name: "TypeScript" },
    { id: "4", name: "Node.js" },
    { id: "5", name: "Python" },
    { id: "6", name: "UI Design" },
    { id: "7", name: "PostgreSQL" },
    { id: "8", name: "AWS" },
    { id: "9", name: "Docker" },
    { id: "10", name: "GraphQL" }
  ],
  experiences: [
    {
      id: "1",
      title: "Lead Developer",
      company: "Digital Craft Studio",
      startDate: "Jan 2023",
      endDate: "",
      currentlyWorking: true,
      description: "Leading a team of developers in creating innovative web applications. Architected scalable solutions that improved performance by 45% and reduced infrastructure costs significantly."
    },
    {
      id: "2",
      title: "Full-Stack Developer",
      company: "Tech Innovators Inc",
      startDate: "Mar 2021",
      endDate: "Dec 2022",
      currentlyWorking: false,
      description: "Developed and maintained multiple client-facing applications. Collaborated with design and product teams to deliver seamless user experiences."
    },
    {
      id: "3",
      title: "Junior Developer",
      company: "StartUp Labs",
      startDate: "Jun 2019",
      endDate: "Feb 2021",
      currentlyWorking: false,
      description: "Built features for core product offerings and learned best practices in agile development environments."
    }
  ],
  projects: [
    {
      id: "1",
      name: "E-Commerce Platform",
      description: "Full-featured online store with payment processing, inventory management, and analytics dashboard.",
      technologies: "React, Node.js, Stripe, MongoDB",
      link: "https://github.com"
    },
    {
      id: "2",
      name: "Task Management App",
      description: "Collaborative tool for teams with real-time updates, file sharing, and advanced filtering.",
      technologies: "Next.js, Socket.io, PostgreSQL",
      link: "https://github.com"
    },
    {
      id: "3",
      name: "Weather Dashboard",
      description: "Beautiful weather app with detailed forecasts, interactive maps, and location-based alerts.",
      technologies: "Vue.js, OpenWeather API, Chart.js",
      link: "https://github.com"
    },
    {
      id: "4",
      name: "Portfolio Builder",
      description: "Drag-and-drop portfolio creator allowing users to customize and publish their professional sites.",
      technologies: "React, Firebase, Tailwind CSS",
      link: "https://github.com"
    }
  ],
  education: [
    {
      id: "1",
      degree: "BS Computer Science",
      institution: "State University",
      year: "2015 - 2019"
    },
    {
      id: "2",
      degree: "Web Development Bootcamp",
      institution: "Code Academy",
      year: "2019"
    }
  ],
  interests: [
    { id: "1", name: "Open Source" },
    { id: "2", name: "Photography" },
    { id: "3", name: "Hiking" },
    { id: "4", name: "Coffee Brewing" }
  ]
};

export default function App() {
  return <ProfessionalPortfolioTemplate data={demoData} />;
}