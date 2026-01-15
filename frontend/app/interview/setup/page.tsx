/**
 * Interview Setup Page
 * Upload resume and configure interview
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { InterviewAPI } from '../api';
import { InterviewType, Resume } from '../types';
import { Upload, FileText, Sparkles, AlertCircle } from 'lucide-react';

export default function InterviewSetupPage() {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState<InterviewType>('general');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [useProfileResume, setUseProfileResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setResumeFile(file);
        setUseProfileResume(false);
        setError(null);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleStartInterview = async () => {
    if (!resumeFile && !useProfileResume) {
      setError('Please upload a resume or use your profile resume');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In production, fetch profile resume from API if useProfileResume is true
      const profileResume: Resume | undefined = useProfileResume
        ? {
            skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
            experience: [],
            projects: [],
            education: [],
          }
        : undefined;

      const response = await InterviewAPI.startInterview(
        interviewType,
        profileResume,
        resumeFile || undefined
      );

      // Navigate to live interview
      router.push(`/interview/live?session=${response.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start interview');
      setLoading(false);
    }
  };

  const interviewTypes = [
    {
      value: 'general' as InterviewType,
      label: 'General Interview',
      description: 'Balanced mix of technical and behavioral questions',
      icon: '💼',
    },
    {
      value: 'technical' as InterviewType,
      label: 'Technical Deep Dive',
      description: 'Focus on technical knowledge and coding concepts',
      icon: '⚙️',
    },
    {
      value: 'project_heavy' as InterviewType,
      label: 'Project-Heavy',
      description: 'Deep dive into your projects and implementation',
      icon: '🚀',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[var(--shiny-blue)] mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Mock Interview
            </h1>
          </div>
          <p className="text-foreground/60 text-lg">
            Prepare for your dream job with personalized AI-powered interviews
          </p>
        </motion.div>

        {/* Interview Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4">Select Interview Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {interviewTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setInterviewType(type.value)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  interviewType === type.value
                    ? 'border-[var(--shiny-blue)] bg-[var(--shiny-blue)]/10 shadow-[0_0_20px_var(--shiny-blue-glow)]'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--shiny-blue)]/30 backdrop-blur-xl'
                }`}
              >
                <div className="text-4xl mb-3">{type.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                <p className="text-sm text-foreground/60">{type.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Resume Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4">Upload Your Resume</h2>
          
          {/* Upload Box */}
          <div className="border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 bg-[var(--glass-bg)] hover:border-[var(--shiny-blue)]/30 transition-colors backdrop-blur-xl">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={useProfileResume}
            />
            
            <label
              htmlFor="resume-upload"
              className={`flex flex-col items-center cursor-pointer ${
                useProfileResume ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {resumeFile ? (
                <>
                  <FileText className="w-16 h-16 text-[var(--shiny-blue)] mb-4 drop-shadow-[0_0_10px_var(--shiny-blue-glow)]" />
                  <p className="text-lg font-medium text-[var(--shiny-blue)] mb-2">
                    {resumeFile.name}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {(resumeFile.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-foreground/40 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Click to upload resume
                  </p>
                  <p className="text-sm text-foreground/60">PDF format, max 5MB</p>
                </>
              )}
            </label>
          </div>

          {/* Or Use Profile Resume */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="use-profile"
                checked={useProfileResume}
                onChange={(e) => {
                  setUseProfileResume(e.target.checked);
                  if (e.target.checked) setResumeFile(null);
                }}
                className="w-5 h-5 text-[var(--shiny-blue)] rounded focus:ring-[var(--shiny-blue)]"
              />
              <label htmlFor="use-profile" className="text-foreground/70 cursor-pointer">
                Use resume from my profile instead
              </label>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center"
          >
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <button
            onClick={handleStartInterview}
            disabled={loading || (!resumeFile && !useProfileResume)}
            className="px-8 py-4 bg-[var(--shiny-blue)] hover:bg-[var(--shiny-blue-light)] rounded-xl font-semibold text-lg shadow-[0_0_30px_var(--shiny-blue-glow)] hover:shadow-[0_0_40px_var(--shiny-blue-glow-strong)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Preparing Interview...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Start AI Interview
              </>
            )}
          </button>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="p-4 bg-[var(--glass-bg)] backdrop-blur-xl rounded-lg border border-[var(--glass-border)]">
            <h4 className="font-semibold mb-2 text-[var(--shiny-blue)]">📹 Live Interview</h4>
            <p className="text-sm text-foreground/60">
              Webcam-based interview with AI asking questions
            </p>
          </div>
          <div className="p-4 bg-[var(--glass-bg)] backdrop-blur-xl rounded-lg border border-[var(--glass-border)]">
            <h4 className="font-semibold mb-2 text-[var(--shiny-blue)]">🎯 10+ Questions</h4>
            <p className="text-sm text-foreground/60">
              Personalized based on your resume and experience
            </p>
          </div>
          <div className="p-4 bg-[var(--glass-bg)] backdrop-blur-xl rounded-lg border border-[var(--glass-border)]">
            <h4 className="font-semibold mb-2 text-[var(--shiny-blue)]">📊 Detailed Feedback</h4>
            <p className="text-sm text-foreground/60">
              Comprehensive scoring and improvement suggestions
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
