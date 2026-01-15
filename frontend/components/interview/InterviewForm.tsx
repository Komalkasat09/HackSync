import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send } from 'lucide-react';
import FileUpload from './FileUpload';
import LoadingOverlay from './LoadingOverlay';
import { InterviewFormData, CreateInterviewResponse, InterviewDetails } from '@/types/interview';

interface InterviewFormProps {
  onInterviewCreated: (assistantId: string, details: InterviewDetails) => void;
}

const InterviewForm = ({ onInterviewCreated }: InterviewFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<InterviewFormData>({
    resumeFile: null,
    jobDescription: '',
    candidateName: '',
    candidateEmail: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InterviewFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InterviewFormData, string>> = {};
    
    if (formState.jobDescription.length < 50) {
      newErrors.jobDescription = 'Job description must be at least 50 characters';
    }
    
    if (!formState.candidateName.trim()) {
      newErrors.candidateName = 'Candidate name is required';
    }
    
    if (!formState.candidateEmail.trim()) {
      newErrors.candidateEmail = 'Candidate email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.candidateEmail)) {
      newErrors.candidateEmail = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const payload = new FormData();
      
      if (formState.resumeFile) {
        payload.append('resume', formState.resumeFile);
      }
      payload.append('jobDescription', formState.jobDescription);
      payload.append('candidateName', formState.candidateName);
      payload.append('candidateEmail', formState.candidateEmail);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      let response;
      try {
        response = await fetch('https://n8n.srv990178.hstgr.cloud/webhook/start-interview', {
          method: 'POST',
          body: payload,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The n8n webhook is taking too long to respond. Please try again later.');
        }
        throw fetchError;
      }
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to create interview: ${response.status} ${errorText}`);
      }
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response content-type:', contentType);
      console.log('Response text length:', text?.length || 0);
      console.log('Response text (first 500 chars):', text?.substring(0, 500) || '(empty)');
      
      if (!text || text.trim().length === 0) {
        throw new Error(`Empty response from server (Status: ${response.status}). The n8n webhook may be timing out or not configured correctly. Please check the webhook configuration.`);
      }
      
      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      // Handle n8n response format: { success, data: { vapiAssistantId, candidateName, ... } }
      // n8n sometimes returns values prefixed with "=" (e.g. "=true", "=10")
      const stripEq = (v: unknown) => (typeof v === 'string' ? v.replace(/^=+/, '').trim() : v);
      const isTrue = (v: unknown) => v === true || stripEq(v) === 'true';

      const assistantId = stripEq(data?.data?.vapiAssistantId ?? data?.assistantId) as string | undefined;
      const interviewData = (data?.data ?? data?.interviewDetails) as any;

      if (isTrue(data?.success) && assistantId && interviewData) {
        const parsedTotal = Number.parseInt(String(stripEq(interviewData.totalQuestions ?? '')), 10);

        const details: InterviewDetails = {
          candidateName: (stripEq(interviewData.candidateName) as string) || formState.candidateName,
          candidateEmail: (stripEq(interviewData.candidateEmail) as string) || formState.candidateEmail,
          totalQuestions: Number.isFinite(parsedTotal) ? parsedTotal : 10,
          questionBreakdown: interviewData.questionBreakdown
            ? {
                easy: Number.parseInt(String(stripEq(interviewData.questionBreakdown.easy ?? '')), 10) || 0,
                medium: Number.parseInt(String(stripEq(interviewData.questionBreakdown.medium ?? '')), 10) || 0,
                hard: Number.parseInt(String(stripEq(interviewData.questionBreakdown.hard ?? '')), 10) || 0,
              }
            : { easy: 3, medium: 3, hard: 4 },
          expiresAt: stripEq(interviewData.expiresAt) as string | undefined,
        };

        onInterviewCreated(String(assistantId), details);
      } else {
        throw new Error((stripEq(data?.error) as string) || 'Failed to create interview');
      }
    } catch (error) {
      console.error('Error creating interview:', error);
      alert(error instanceof Error ? error.message : 'Failed to create interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <LoadingOverlay message="Creating interview... Analyzing resume and generating questions..." />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black dark:text-white flex items-center gap-3">
            <Mic className="w-8 h-8 text-blue-500" />
            AI Interview Prep
          </h1>
          <p className="text-black/60 dark:text-white/60 mt-1">
            Create a voice-based technical interview tailored to your job description
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Upload */}
            <FileUpload
              file={formState.resumeFile}
              onFileChange={(file) => setFormState({ ...formState, resumeFile: file })}
            />

            {/* Job Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-black dark:text-white">
                📝 Job Description <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <textarea
                value={formState.jobDescription}
                onChange={(e) => setFormState({ ...formState, jobDescription: e.target.value })}
                placeholder="We are looking for a Senior React Developer with 5+ years experience..."
                rows={5}
                maxLength={5000}
                className={`w-full px-4 py-2 bg-white dark:bg-black border-2 ${errors.jobDescription ? 'border-red-500' : 'border-black/20 dark:border-white/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 resize-none`}
              />
              <div className="flex justify-between text-sm">
                {errors.jobDescription ? (
                  <span className="text-red-600 dark:text-red-400">{errors.jobDescription}</span>
                ) : (
                  <span className="text-black/60 dark:text-white/60">Min 50 characters</span>
                )}
                <span className="text-black/60 dark:text-white/60">{formState.jobDescription.length}/5000</span>
              </div>
            </div>

            {/* Candidate Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-black dark:text-white">
                👤 Candidate Name <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formState.candidateName}
                onChange={(e) => setFormState({ ...formState, candidateName: e.target.value })}
                placeholder="John Doe"
                className={`w-full px-4 py-2 bg-white dark:bg-black border-2 ${errors.candidateName ? 'border-red-500' : 'border-black/20 dark:border-white/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50`}
              />
              {errors.candidateName && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.candidateName}</p>
              )}
            </div>

            {/* Candidate Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-black dark:text-white">
                ✉️ Candidate Email <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formState.candidateEmail}
                onChange={(e) => setFormState({ ...formState, candidateEmail: e.target.value })}
                placeholder="john@example.com"
                className={`w-full px-4 py-2 bg-white dark:bg-black border-2 ${errors.candidateEmail ? 'border-red-500' : 'border-black/20 dark:border-white/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50`}
              />
              {errors.candidateEmail && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.candidateEmail}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all font-medium flex items-center justify-center gap-2 h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Interview
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default InterviewForm;
