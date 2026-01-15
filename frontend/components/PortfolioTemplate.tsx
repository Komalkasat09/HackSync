import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Github, Linkedin, Globe, Menu, X, ChevronDown, ExternalLink, Calendar, Briefcase, Code, GraduationCap, ArrowUp, Terminal, Zap, Cpu, Database, Globe2 } from 'lucide-react';

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

interface PortfolioTemplateProps {
  data: PortfolioData;
  isPreview?: boolean;
}

export function PortfolioTemplate({ data, isPreview = false }: PortfolioTemplateProps) {
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = isPreview ? containerRef.current : window;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollY = isPreview && containerRef.current ? containerRef.current.scrollTop : window.scrollY;
      setScrolled(scrollY > 50);
      setShowScrollTop(scrollY > 300);
      
      const sections = ['home', 'about', 'skills', 'experience', 'projects', 'education', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          if (isPreview && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top;
            return relativeTop <= 100 && relativeTop >= -element.offsetHeight + 100;
          } else {
            const rect = element.getBoundingClientRect();
            return rect.top <= 100 && rect.bottom >= 100;
          }
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll as any);
    }
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll as any);
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPreview]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      if (isPreview && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top + containerRef.current.scrollTop;
        containerRef.current.scrollTo({ top: relativeTop - 80, behavior: 'smooth' });
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    if (isPreview && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'education', label: 'Education' },
    { id: 'contact', label: 'Contact' }
  ];

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'github': return <Github className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'website': return <Globe2 className="w-5 h-5" />;
      case 'portfolio': return <Terminal className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div ref={containerRef} className={`${isPreview ? '' : 'min-h-screen'} bg-black text-white relative ${isPreview ? '' : 'overflow-x-hidden'}`}>
      {/* Animated Grid Background */}
      <div className={`${isPreview ? 'absolute' : 'fixed'} inset-0 z-0`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        {/* Animated Glow */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Navigation - Hidden in preview mode */}
        {!isPreview && (
          <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-zinc-800/50' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white cursor-pointer hover:text-green-400 transition-colors flex items-center gap-2" onClick={() => scrollToSection('home')}>
                <Terminal className="w-6 h-6" />
                <span className="font-mono">{data.name.split(' ')[0]}</span>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`px-4 py-2 text-sm font-mono transition-all relative group ${
                      activeSection === item.id ? 'text-green-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {activeSection === item.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />
                    )}
                    <span className="relative z-10">&lt;{item.label}/&gt;</span>
                  </button>
                ))}
              </div>

              {/* Mobile Menu Button */}
              <button className="md:hidden text-white hover:text-green-400 transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden mt-4 pb-4 space-y-2 bg-zinc-900/50 backdrop-blur-xl rounded-lg p-4 border border-zinc-800">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`block w-full text-left px-4 py-2 rounded font-mono text-sm transition ${
                      activeSection === item.id ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    &lt;{item.label}/&gt;
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
        )}

        {/* Hero Section */}
        <section id="home" className={`min-h-screen flex items-center justify-center px-6 ${isPreview ? 'pt-8' : 'pt-20'}`}>
          <div className="max-w-5xl mx-auto w-full">
            <div className="space-y-8">
              {/* Terminal-style header */}
              <div className="font-mono text-sm text-green-400 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-zinc-500">~/portfolio</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm">
                  <p className="text-zinc-500">$ whoami</p>
                  <p className="text-white mt-2">&gt; {data.name}</p>
                  <p className="text-zinc-500 mt-4">$ cat bio.txt</p>
                  <p className="text-zinc-300 mt-2">&gt; {data.bio}</p>
                  <p className="text-zinc-500 mt-4">$ locate</p>
                  <p className="text-zinc-300 mt-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    &gt; {data.location}
                  </p>
                  <span className="inline-block w-2 h-5 bg-green-400 ml-1 animate-pulse" />
                </div>
              </div>

              {/* Name Display */}
              <div className="relative">
                <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                    {data.name}
                  </span>
                </h1>
                <div className="absolute -top-4 -left-4 w-20 h-20 border-t-2 border-l-2 border-green-500 opacity-50" />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 border-b-2 border-r-2 border-green-500 opacity-50" />
              </div>

              {/* Social Links */}
              <div className="flex gap-4 flex-wrap">
                {data.email && (
                  <a
                    href={`mailto:${data.email}`}
                    className="group flex items-center gap-2 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-green-500 hover:bg-zinc-900 transition-all font-mono text-sm backdrop-blur-sm"
                  >
                    <Mail className="w-4 h-4 group-hover:text-green-400 transition-colors" />
                    <span className="text-zinc-400 group-hover:text-white transition-colors">{data.email}</span>
                  </a>
                )}
                {data.links.map(link => (
                  <a
                    key={link.id}
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-green-500 hover:bg-zinc-900 transition-all font-mono text-sm backdrop-blur-sm"
                  >
                    {getLinkIcon(link.type)}
                    <span className="text-zinc-400 group-hover:text-white transition-colors capitalize">{link.type}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>

              <button
                onClick={() => scrollToSection('about')}
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-all animate-bounce mt-8 font-mono text-sm"
              >
                Scroll Down <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 font-mono">
                <span className="text-green-400">&lt;</span>
                About
                <span className="text-green-400">/&gt;</span>
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-transparent" />
            </div>
            
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl blur-3xl" />
              <div className="relative bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm hover:border-zinc-700 transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <Terminal className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xl text-zinc-300 leading-relaxed mb-6 font-light">
                      {data.bio}
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                      <div className="border border-zinc-800 rounded-lg p-4 hover:border-green-500/50 transition-all group">
                        <Cpu className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-mono text-sm text-zinc-400">Technical Excellence</h3>
                      </div>
                      <div className="border border-zinc-800 rounded-lg p-4 hover:border-green-500/50 transition-all group">
                        <Zap className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-mono text-sm text-zinc-400">Performance Driven</h3>
                      </div>
                      <div className="border border-zinc-800 rounded-lg p-4 hover:border-green-500/50 transition-all group">
                        <Database className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-mono text-sm text-zinc-400">Scalable Solutions</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        {data.skills.length > 0 && (
          <section id="skills" className="py-32 px-6 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="mb-16">
                <h2 className="text-5xl md:text-6xl font-bold mb-4 font-mono">
                  <span className="text-green-400">&lt;</span>
                  Skills
                  <span className="text-green-400">/&gt;</span>
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-transparent" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.skills.map((skill, idx) => (
                  <div
                    key={skill.id}
                    className="group relative bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 hover:border-green-500 hover:bg-zinc-900/50 transition-all backdrop-blur-sm"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3">
                      <Code className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                      <h3 className="font-mono text-sm text-white">{skill.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Experience Section */}
        {data.experiences.length > 0 && (
          <section id="experience" className="py-32 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="mb-16">
                <h2 className="text-5xl md:text-6xl font-bold mb-4 font-mono">
                  <span className="text-green-400">&lt;</span>
                  Experience
                  <span className="text-green-400">/&gt;</span>
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-transparent" />
              </div>

              <div className="space-y-8 relative">
                {/* Timeline Line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-green-400 via-green-500/50 to-transparent hidden md:block" />

                {data.experiences.map((exp) => (
                  <div key={exp.id} className="relative md:pl-12 group">
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-6 w-3 h-3 bg-green-400 rounded-full border-4 border-black hidden md:block group-hover:scale-150 transition-transform" />
                    
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 hover:border-green-500/50 transition-all backdrop-blur-sm">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="w-5 h-5 text-green-400" />
                            <h3 className="text-2xl font-bold text-white font-mono">{exp.title}</h3>
                          </div>
                          <p className="text-lg text-green-400 font-semibold mb-2">{exp.company}</p>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm mt-2 md:mt-0">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {exp.startDate} → {exp.currentlyWorking ? <span className="text-green-400 font-semibold">Present</span> : exp.endDate}
                          </span>
                        </div>
                      </div>
                      <p className="text-zinc-300 leading-relaxed font-light">{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Projects Section */}
        {data.projects.length > 0 && (
          <section id="projects" className="py-32 px-6 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="mb-16">
                <h2 className="text-5xl md:text-6xl font-bold mb-4 font-mono">
                  <span className="text-green-400">&lt;</span>
                  Projects
                  <span className="text-green-400">/&gt;</span>
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-transparent" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {data.projects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 hover:border-green-500/50 transition-all backdrop-blur-sm"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <Terminal className="w-8 h-8 text-green-400" />
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-green-400 transition-colors"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 font-mono">{project.name}</h3>
                      <p className="text-zinc-300 mb-4 leading-relaxed font-light">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {project.technologies.split(',').map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 font-mono"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Education Section */}
        {data.education.length > 0 && (
          <section id="education" className="py-32 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="mb-16">
                <h2 className="text-5xl md:text-6xl font-bold mb-4 font-mono">
                  <span className="text-green-400">&lt;</span>
                  Education
                  <span className="text-green-400">/&gt;</span>
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-transparent" />
              </div>

              <div className="space-y-6">
                {data.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 hover:border-green-500/50 transition-all backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-4">
                      <GraduationCap className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2 font-mono">{edu.degree}</h3>
                        <p className="text-lg text-green-400 mb-2">{edu.institution}</p>
                        <p className="text-zinc-400 font-mono text-sm">{edu.year}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section id="contact" className="py-32 px-6 bg-gradient-to-b from-transparent via-zinc-950/50 to-black">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4 font-mono">
                <span className="text-green-400">&lt;</span>
                Contact
                <span className="text-green-400">/&gt;</span>
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-green-400 to-transparent mx-auto" />
            </div>

            <p className="text-xl text-zinc-300 mb-12 max-w-2xl mx-auto font-light">
              Let's collaborate on building something exceptional. Open to new opportunities and innovative projects.
            </p>

            <a
              href={`mailto:${data.email}`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-black rounded-lg font-mono font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/50"
            >
              <Mail className="w-5 h-5" />
              Initiate Contact
            </a>

            {/* Interests */}
            {data.interests.length > 0 && (
              <div className="mt-16">
                <h3 className="text-xl font-semibold mb-6 font-mono text-zinc-400">
                  $ cat interests.txt
                </h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {data.interests.map((interest) => (
                    <span
                      key={interest.id}
                      className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded font-mono text-sm hover:border-green-500 hover:bg-zinc-900 transition-all"
                    >
                      {interest.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-zinc-900">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-zinc-500 font-mono text-sm">
              © 2025 {data.name} — Built with precision & passion
            </p>
          </div>
        </footer>

        {/* Scroll to Top Button */}
        {showScrollTop && !isPreview && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-green-500 hover:bg-green-600 rounded-lg text-black transition-all hover:scale-110 z-40 shadow-lg shadow-green-500/50"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}