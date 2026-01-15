import { motion } from 'framer-motion';
import { MessageSquare, Clock, HelpCircle, MessageCircle, Bot, User } from 'lucide-react';
import type { TranscriptMessage, QAPair } from '@/types/transcript';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface TranscriptDisplayProps {
  messages?: TranscriptMessage[];
  qaPairs?: QAPair[];
  durationFormatted?: string;
}

const TranscriptDisplay = ({ messages, qaPairs, durationFormatted }: TranscriptDisplayProps) => {
  // Display Q&A pairs if available
  if (qaPairs && qaPairs.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/20 dark:border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-white">Interview Q&A</h2>
              <p className="text-sm text-black/60 dark:text-white/60">{qaPairs.length} questions answered</p>
            </div>
          </div>
          {durationFormatted && (
            <div className="flex items-center gap-2 text-black/60 dark:text-white/60 text-sm bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              {durationFormatted}
            </div>
          )}
        </div>

        {/* Q&A Cards */}
        <div className="space-y-4">
          {qaPairs.map((qa, index) => (
            <motion.div
              key={qa.questionNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white dark:bg-black border-2 border-black/20 dark:border-white/20 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Question Header */}
              <div className="bg-blue-100 dark:bg-blue-900/30 border-b border-black/20 dark:border-white/20 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Question {qa.questionNumber}
                      </span>
                    </div>
                    <p className="text-black dark:text-white font-medium leading-relaxed">
                      {qa.question}
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer */}
              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1 block">
                      Answer
                    </span>
                    <p className="text-black/90 dark:text-white/90 leading-relaxed">
                      {qa.answer}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Fallback to raw messages display
  if (messages && messages.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-black dark:text-white">Conversation</h2>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages
            .filter((m) => m.role !== 'system')
            .map((msg, index) => {
              const isUser = msg.role === 'user';
              const isAI = msg.role === 'assistant' || msg.role === 'bot';

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isAI ? 'bg-blue-500/10' : 'bg-blue-500/10'
                    }`}
                  >
                    {isAI ? (
                      <Bot className="w-4 h-4 text-blue-500" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-black/60 dark:text-white/60">
                        {isAI ? 'AI Interviewer' : 'Candidate'}
                      </span>
                      {msg.secondsFromStart !== undefined && (
                        <span className="text-xs text-black/60 dark:text-white/60">
                          {formatTime(msg.secondsFromStart)}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm text-black dark:text-white rounded-lg p-3 ${
                        isAI ? 'bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 rounded-tl-none' : 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-tr-none'
                      }`}
                    >
                      {msg.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </motion.div>
    );
  }

  return null;
};

export default TranscriptDisplay;
