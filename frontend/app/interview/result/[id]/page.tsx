/**
 * Interview Results Page
 * Display comprehensive interview feedback and scores
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { InterviewAPI } from '../../api';
import { InterviewScore } from '../../types';
import { getScoreColor, getScoreLabel, formatCategoryName } from '../../utils';
import { 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  Download,
  Home,
  ArrowRight
} from 'lucide-react';
import ScoreRadarChart from '../../components/ScoreRadarChart';
import CategoryScoreBar from '../../components/CategoryScoreBar';

export default function InterviewResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [result, setResult] = useState<InterviewScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchResults();
  }, [sessionId, retryCount]);

  const fetchResults = async () => {
    try {
      const data = await InterviewAPI.getResults(sessionId);
      setResult(data);
      setLoading(false);
    } catch (err: any) {
      if (err.message === 'PROCESSING') {
        // Still processing, retry after delay
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 3000);
      } else {
        setError(err.message || 'Failed to load results');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Analyzing Your Performance
          </h2>
          <p className="text-foreground/60">
            Our AI is evaluating your answers...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-foreground/60 mb-6">{error}</p>
          <button
            onClick={() => router.push('/interview/setup')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  const categories = result.categories;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-3">Interview Complete!</h1>
          <p className="text-foreground/60 text-lg">
            Here's your comprehensive performance analysis
          </p>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl p-8 border border-purple-500/30 text-center">
            <p className="text-foreground/70 text-sm mb-2">OVERALL SCORE</p>
            <motion.h2
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className={`text-7xl font-bold mb-3 ${getScoreColor(result.overall)}`}
            >
              {result.overall}
            </motion.h2>
            <p className="text-2xl font-semibold text-foreground/80">
              {getScoreLabel(result.overall)}
            </p>
          </div>
        </motion.div>

        {/* Category Scores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Bar Charts */}
          <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)]">
            <h3 className="text-xl font-semibold mb-6">Category Breakdown</h3>
            <div className="space-y-6">
              <CategoryScoreBar
                label="Technical Knowledge"
                score={categories.technicalKnowledge.score}
                maxScore={100}
              />
              <CategoryScoreBar
                label="Problem Solving"
                score={categories.problemSolving.score}
                maxScore={100}
              />
              <CategoryScoreBar
                label="Communication"
                score={categories.communication.score}
                maxScore={100}
              />
              <CategoryScoreBar
                label="Project Understanding"
                score={categories.projectUnderstanding.score}
                maxScore={100}
              />
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)]">
            <h3 className="text-xl font-semibold mb-6">Performance Radar</h3>
            <ScoreRadarChart categories={categories} />
          </div>
        </motion.div>

        {/* Strengths & Weaknesses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Strengths */}
          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-400 mr-3" />
              <h3 className="text-xl font-semibold text-green-400">Strengths</h3>
            </div>
            <ul className="space-y-3">
              {result.strengths.map((strength, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-start"
                >
                  <ArrowRight className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">{strength}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-orange-500/10 rounded-xl p-6 border border-orange-500/30">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-400 mr-3" />
              <h3 className="text-xl font-semibold text-orange-400">Areas to Improve</h3>
            </div>
            <ul className="space-y-3">
              {result.weaknesses.map((weakness, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-start"
                >
                  <ArrowRight className="w-5 h-5 text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80">{weakness}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Improvement Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)] mb-12"
        >
          <div className="flex items-center mb-6">
            <BookOpen className="w-6 h-6 text-purple-400 mr-3" />
            <h3 className="text-2xl font-semibold">Actionable Improvements</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.improvementSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="bg-slate-900/50 rounded-lg p-4 border border-[var(--glass-border)]"
              >
                <div className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm font-semibold mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-foreground/80">{suggestion}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recommended Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)] mb-12"
        >
          <h3 className="text-2xl font-semibold mb-6">📚 Study These Topics</h3>
          <div className="flex flex-wrap gap-3">
            {result.recommendedTopics.map((topic, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-sm font-medium hover:border-purple-400 transition cursor-pointer"
              >
                {topic}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Detailed Feedback (Optional) */}
        {result.detailedFeedback.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)] mb-12"
          >
            <h3 className="text-2xl font-semibold mb-6">Question-by-Question Feedback</h3>
            <div className="space-y-6">
              {result.detailedFeedback.map((feedback, index) => (
                <motion.div
                  key={feedback.questionId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-slate-900/50 rounded-lg p-5 border border-[var(--glass-border)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">Q{index + 1}</h4>
                    <span className={`text-xl font-bold ${getScoreColor(feedback.score * 10)}`}>
                      {feedback.score.toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-foreground/70 mb-3">{feedback.question}</p>
                  <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded p-3 mb-3">
                    <p className="text-sm text-foreground/60 italic">{feedback.answer.substring(0, 200)}...</p>
                  </div>
                  <p className="text-foreground/70 mb-3">{feedback.feedback}</p>
                  {feedback.strengths.length > 0 && (
                    <div className="mb-2">
                      <span className="text-green-400 text-sm font-semibold">✓ Good: </span>
                      <span className="text-sm text-foreground/60">{feedback.strengths.join(', ')}</span>
                    </div>
                  )}
                  {feedback.improvements.length > 0 && (
                    <div>
                      <span className="text-orange-400 text-sm font-semibold">→ Improve: </span>
                      <span className="text-sm text-foreground/60">{feedback.improvements.join(', ')}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push('/interview/setup')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition flex items-center justify-center"
          >
            Take Another Interview
          </button>
          <button
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Report
          </button>
        </motion.div>
      </div>
    </div>
  );
}
