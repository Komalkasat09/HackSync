"use client";

import { useState } from 'react';
import { learningPathAPI, LearningPath, LearningModule } from '@/lib/learningPathApi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  Upload, 
  Target, 
  Clock,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  BookOpen,
  Video,
  FileText,
  Code
} from 'lucide-react';

export default function LearningPathPage() {
  const [step, setStep] = useState<'input' | 'review' | 'processing' | 'result'>('input');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [loadingText, setLoadingText] = useState('Analyzing Resume...');
  const [path, setPath] = useState<LearningPath | null>(null);
  const [userId] = useState('user_' + Date.now());

  const popularRoles = [
    'Full Stack Developer',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Mobile Developer',
    'Cloud Architect',
    'Security Engineer',
    'AI/ML Researcher'
  ];

  const handleInitialParse = async () => {
    if (!resumeText.trim()) {
      alert('Please enter your resume or skills');
      return;
    }
    
    setStep('processing');
    setLoadingText('Extracting Skills...');

    try {
      const skills = await learningPathAPI.parseResume(resumeText);
      setCurrentSkills(skills);
      setStep('review');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error parsing resume.");
      setStep('input');
    }
  };

  const handleGenerate = async () => {
    setStep('processing');
    setLoadingText('Building Personalized Roadmap...');

    try {
      const currentSkillsMap: Record<string, string> = {};
      currentSkills.forEach(s => currentSkillsMap[s] = "Intermediate");

      const generatedPath = await learningPathAPI.generatePath(
        userId,
        currentSkillsMap,
        targetRole,
        hoursPerWeek
      );

      setPath(generatedPath);
      setStep('result');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error generating path.");
      setStep('review');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'interactive':
        return <Code className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-[var(--glass-border)]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--shiny-blue)]/10 rounded-lg border border-[var(--shiny-blue)]/20">
              <BrainCircuit className="w-6 h-6 text-[var(--shiny-blue)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--shiny-blue)] drop-shadow-[0_0_10px_var(--shiny-blue-glow)]">
                AI Learning Path
              </h1>
              <p className="text-sm text-foreground/60">Personalized roadmap to your dream career</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-8 text-center">
                <Sparkles className="w-12 h-12 text-[var(--shiny-blue)] mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-3">Let's Build Your Path</h2>
                <p className="text-foreground/60">
                  Share your skills and goals, and we'll create a personalized learning roadmap
                </p>
              </div>

              <div className="space-y-6">
                {/* Resume Input */}
                <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Your Resume or Skills
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume or list your current skills... e.g., 'JavaScript, React, Node.js, MongoDB'"
                    rows={8}
                    className="w-full bg-background border border-[var(--glass-border)] rounded-lg p-4 text-foreground placeholder-foreground/40 focus:ring-2 focus:ring-[var(--shiny-blue)] focus:border-[var(--shiny-blue)] resize-none"
                  />
                </div>

                {/* Target Role */}
                <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    list="roles"
                    className="w-full bg-background border border-[var(--glass-border)] rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-[var(--shiny-blue)] focus:border-[var(--shiny-blue)]"
                  />
                  <datalist id="roles">
                    {popularRoles.map(role => (
                      <option key={role} value={role} />
                    ))}
                  </datalist>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {popularRoles.slice(0, 5).map(role => (
                      <button
                        key={role}
                        onClick={() => setTargetRole(role)}
                        className="text-xs px-3 py-1.5 bg-[var(--shiny-blue)]/10 text-[var(--shiny-blue)] rounded-full border border-[var(--shiny-blue)]/20 hover:bg-[var(--shiny-blue)]/20 transition"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hours Per Week */}
                <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hours Per Week
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                    className="w-full accent-[var(--shiny-blue)]"
                  />
                  <div className="flex justify-between text-sm text-foreground/60 mt-2">
                    <span>5h</span>
                    <span className="text-[var(--shiny-blue)] font-semibold">{hoursPerWeek}h / week</span>
                    <span>40h</span>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleInitialParse}
                  className="w-full bg-[var(--shiny-blue)] hover:bg-[var(--shiny-blue-light)] text-white py-4 rounded-xl font-semibold text-lg shadow-[0_0_30px_var(--shiny-blue-glow)] hover:shadow-[0_0_40px_var(--shiny-blue-glow-strong)] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze & Generate Path
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Review Skills */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-3">Review Your Skills</h2>
                <p className="text-foreground/60">
                  We detected {currentSkills.length} skills. You can modify them before generating your path.
                </p>
              </div>

              <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)] mb-6">
                <h3 className="font-semibold mb-4">Detected Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {currentSkills.map((skill, index) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-4 py-2 bg-[var(--shiny-blue)]/10 text-[var(--shiny-blue)] rounded-lg border border-[var(--shiny-blue)]/20 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {skill}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:bg-[var(--shiny-blue)]/20 py-3 rounded-xl font-semibold transition"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 bg-[var(--shiny-blue)] hover:bg-[var(--shiny-blue-light)] text-white py-3 rounded-xl font-semibold shadow-[0_0_20px_var(--shiny-blue-glow)] transition flex items-center justify-center gap-2"
                >
                  Generate My Path
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto text-center py-20"
            >
              <div className="w-20 h-20 border-4 border-[var(--shiny-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">{loadingText}</h2>
              <p className="text-foreground/60">This may take a moment...</p>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 'result' && path && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-[var(--shiny-blue)]" />
                    <span className="text-sm text-foreground/60">Target Role</span>
                  </div>
                  <p className="text-xl font-bold">{path.target_role}</p>
                </div>
                <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-[var(--shiny-blue)]" />
                    <span className="text-sm text-foreground/60">Total Time</span>
                  </div>
                  <p className="text-xl font-bold">{path.total_weeks} weeks</p>
                </div>
                <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-[var(--shiny-blue)]" />
                    <span className="text-sm text-foreground/60">Learning Hours</span>
                  </div>
                  <p className="text-xl font-bold">{path.total_estimated_hours}h</p>
                </div>
              </div>

              {/* Learning Roadmap */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[var(--shiny-blue)]" />
                  Your Personalized Learning Roadmap
                </h2>

                {path.modules.map((module: LearningModule, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-xl p-6 shadow-[0_0_20px_rgba(10,127,255,0.1)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-[var(--shiny-blue)]/10 rounded-xl flex items-center justify-center border border-[var(--shiny-blue)]/20">
                        <span className="text-xl font-bold text-[var(--shiny-blue)]">W{module.week_number}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{module.skill_name}</h3>
                        <p className="text-foreground/60 text-sm mb-4">{module.explanation}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-foreground/60 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {module.estimated_hours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {module.resources.length} resources
                          </span>
                        </div>

                        {/* Resources */}
                        <div className="space-y-2">
                          {module.resources.map((resource, ridx) => (
                            <a
                              key={ridx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-background border border-[var(--glass-border)] rounded-lg hover:border-[var(--shiny-blue)]/50 hover:bg-[var(--shiny-blue)]/5 transition group"
                            >
                              <div className="w-8 h-8 bg-[var(--shiny-blue)]/10 rounded-lg flex items-center justify-center text-[var(--shiny-blue)]">
                                {getResourceIcon(resource.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{resource.title}</p>
                                <p className="text-xs text-foreground/60 flex items-center gap-2">
                                  <span>{resource.source}</span>
                                  {resource.verified && (
                                    <span className="flex items-center gap-1 text-[var(--shiny-blue)]">
                                      <CheckCircle className="w-3 h-3" />
                                      Verified
                                    </span>
                                  )}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-foreground/40 group-hover:text-[var(--shiny-blue)] transition" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => {
                    setStep('input');
                    setPath(null);
                  }}
                  className="flex-1 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:bg-[var(--shiny-blue)]/20 py-3 rounded-xl font-semibold transition"
                >
                  Create New Path
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-[var(--shiny-blue)] hover:bg-[var(--shiny-blue-light)] text-white py-3 rounded-xl font-semibold shadow-[0_0_20px_var(--shiny-blue-glow)] transition"
                >
                  Download / Print
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
