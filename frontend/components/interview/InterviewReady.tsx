import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Mic, ArrowLeft } from 'lucide-react';
import { InterviewDetails } from '@/types/interview';

interface InterviewReadyProps {
  assistantId: string;
  interviewDetails: InterviewDetails;
  onStartInterview: () => void;
  onCreateAnother: () => void;
}

const InterviewReady = ({
  assistantId,
  interviewDetails,
  onStartInterview,
  onCreateAnother,
}: InterviewReadyProps) => {
  const [copied, setCopied] = useState(false);
  
  const interviewLink = `${window.location.origin}${window.location.pathname}?assistant=${assistantId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(interviewLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy link. Please copy manually.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Success Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 mb-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center"
          >
            <Check className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>
        <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Interview Created!</h1>
      </div>

      {/* Interview Card */}
      <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl space-y-6">
        {/* Candidate Info */}
        <div className="text-center pb-6 border-b border-black/20 dark:border-white/20">
          <p className="text-lg font-semibold text-black dark:text-white">
            {interviewDetails.candidateName}
          </p>
          <p className="text-black/60 dark:text-white/60">{interviewDetails.candidateEmail}</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium">
            <span>{interviewDetails.totalQuestions} questions ready</span>
          </div>
        </div>

        {/* Interview Link */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-black dark:text-white">
            📋 Interview Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={interviewLink}
              readOnly
              className="flex-1 px-4 py-2 bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-lg text-sm text-black dark:text-white"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all flex items-center gap-2 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-black/60 dark:text-white/60">
            Share this link with the candidate to start the interview.
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/20 dark:border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-black px-2 text-black/60 dark:text-white/60">or</span>
          </div>
        </div>

        {/* Start Now */}
        <div className="text-center space-y-4">
          <p className="text-black/60 dark:text-white/60">Start interview immediately:</p>
          <button
            onClick={onStartInterview}
            className="w-full px-6 py-4 bg-blue-500 text-white border-2 border-blue-600 rounded-lg hover:bg-blue-600 transition-all font-semibold text-lg flex items-center justify-center gap-3"
          >
            <Mic className="w-6 h-6" />
            START INTERVIEW NOW
          </button>
        </div>

        {/* Create Another */}
        <button
          onClick={onCreateAnother}
          className="flex items-center justify-center gap-2 w-full py-3 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Create Another Interview
        </button>
      </div>
    </motion.div>
  );
};

export default InterviewReady;
