import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, ArrowLeft, Trophy, Target, MessageSquare, 
  Brain, Users, ChevronDown, ChevronUp, Star, AlertTriangle,
  TrendingUp, Clock, Loader2, Download
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { EvaluationResponse, QuestionEvaluation } from '@/types/interview';
import { TranscriptResponse } from '@/types/transcript';
import TranscriptDisplay from './TranscriptDisplay';

interface InterviewCompleteProps {
  candidateName: string;
  duration: number;
  onCreateAnother: () => void;
  evaluationReport?: EvaluationResponse | null;
  transcriptData?: TranscriptResponse | null;
  isLoadingReport?: boolean;
  onFetchResults?: () => void;
}

const InterviewComplete = ({
  candidateName,
  duration,
  onCreateAnother,
  evaluationReport,
  transcriptData,
  isLoadingReport = false,
  onFetchResults,
}: InterviewCompleteProps) => {
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleQuestion = (questionNumber: number) => {
    setExpandedQuestions(prev =>
      prev.includes(questionNumber)
        ? prev.filter(q => q !== questionNumber)
        : [...prev, questionNumber]
    );
  };

  const getScoreColor = (score: number, max: number = 10) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getRecommendationBadge = (decision: string) => {
    const lower = decision.toLowerCase();
    if (lower.includes('strong hire')) return 'bg-success/20 text-success border-success/30';
    if (lower.includes('hire') && !lower.includes('no')) return 'bg-success/10 text-success border-success/20';
    if (lower.includes('maybe') || lower.includes('follow-up')) return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-success/10 text-success';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'hard': return 'bg-destructive/10 text-destructive';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  // Loading state
  if (isLoadingReport) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-8 shadow-xl text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="relative inline-flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">Processing Your Interview</h1>
            <p className="text-black/60 dark:text-white/60 mt-2">
              Our AI is evaluating your responses...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const report = evaluationReport?.report;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="space-y-6">
        {/* Success Header Card */}
        <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-8 shadow-xl text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="relative inline-flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute w-24 h-24 rounded-full bg-blue-500/10"
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="relative w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <h1 className="text-2xl font-bold text-black dark:text-white">Interview Complete!</h1>
            <p className="text-lg text-blue-500 font-medium">
              Thank you, {candidateName}!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20">
              <Clock className="w-4 h-4 text-black/60 dark:text-white/60" />
              <span className="font-mono font-semibold text-black dark:text-white">
                {report?.interviewMetadata?.durationFormatted || formatDuration(duration)}
              </span>
            </div>
            {report && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20">
                <MessageSquare className="w-4 h-4 text-black/60 dark:text-white/60" />
                <span className="font-semibold text-black dark:text-white">
                  {report.interviewMetadata.totalQuestionsAnswered}/{report.interviewMetadata.expectedQuestions} Questions
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Evaluation Report */}
        {report && (
          <>
            {/* Score Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-black dark:text-white">Score Overview</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Overall Score */}
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(report.scoresSummary.percentageScore, 100)}`}>
                    {report.scoresSummary.percentageScore}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.scoresSummary.totalScore}/{report.scoresSummary.maxPossibleScore} points
                  </p>
                </div>

                {/* Average Score */}
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Average Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(report.scoresSummary.averageScore)}`}>
                    {report.scoresSummary.averageScore}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">out of 10</p>
                </div>

                {/* Recommendation */}
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Recommendation</p>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getRecommendationBadge(report.finalRecommendation.decision)}`}>
                    {report.finalRecommendation.decision}
                  </span>
                </div>
              </div>

              {/* Scores by Difficulty */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Scores by Difficulty</p>
                <div className="grid grid-cols-3 gap-3">
                  {['easy', 'medium', 'hard'].map((diff) => {
                    const data = report.scoresSummary.scoresByDifficulty[diff as keyof typeof report.scoresSummary.scoresByDifficulty];
                    return (
                      <div key={diff} className="text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getDifficultyBadge(diff)} capitalize mb-1`}>
                          {diff}
                        </span>
                        <p className="text-lg font-semibold text-foreground">
                          {data.average > 0 ? `${data.average}/10` : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">{data.count} questions</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Overall Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-black dark:text-white">Assessment Areas</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Technical Competency', value: report.scoresSummary.overallAssessment.technicalCompetency, icon: Brain },
                  { label: 'Communication Skills', value: report.scoresSummary.overallAssessment.communicationSkills, icon: MessageSquare },
                  { label: 'Problem Solving', value: report.scoresSummary.overallAssessment.problemSolvingAbility, icon: TrendingUp },
                  { label: 'Culture Fit', value: report.scoresSummary.overallAssessment.cultureFit, icon: Users },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <span className={`font-semibold ${getScoreColor(item.value)}`}>{item.value}/10</span>
                    </div>
                    <Progress value={item.value * 10} className="h-2" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Strengths & Improvements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {/* Strengths */}
              <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-5 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Star className="w-5 h-5" />
                  <h3 className="font-semibold">Key Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {report.summary.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-black/60 dark:text-white/60">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-5 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-semibold">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {report.summary.weaknesses.map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-black/60 dark:text-white/60">
                      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Final Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl space-y-3"
            >
              <h3 className="font-semibold text-black dark:text-white">Recommendation</h3>
              <p className="text-black/60 dark:text-white/60">{report.finalRecommendation.reason}</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                <span className="font-medium">Next Steps:</span> {report.finalRecommendation.nextSteps}
              </p>
            </motion.div>

            {/* Detailed Question Evaluations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-black dark:text-white">Question Details</h2>
              </div>

              <div className="space-y-3">
                {report.detailedEvaluations.map((evaluation: QuestionEvaluation) => {
                  const isExpanded = expandedQuestions.includes(evaluation.questionNumber);
                  return (
                    <div
                      key={evaluation.questionNumber}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleQuestion(evaluation.questionNumber)}
                        className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">
                            Question {evaluation.questionNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyBadge(evaluation.difficulty)}`}>
                            {evaluation.difficulty}
                          </span>
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                            {evaluation.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${getScoreColor(evaluation.score, evaluation.maxScore)}`}>
                            {evaluation.score}/{evaluation.maxScore}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-background">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Feedback</p>
                            <p className="text-sm text-foreground">{evaluation.feedback}</p>
                          </div>

                          {evaluation.strengths.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-success mb-1">Strengths</p>
                              <ul className="space-y-1">
                                {evaluation.strengths.map((s, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <Check className="w-3 h-3 text-success mt-1 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evaluation.improvements.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-warning mb-1">Improvements</p>
                              <ul className="space-y-1">
                                {evaluation.improvements.map((imp, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <AlertTriangle className="w-3 h-3 text-warning mt-1 shrink-0" />
                                    {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {evaluation.keyIssues.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-destructive mb-1">Key Issues</p>
                              <ul className="space-y-1">
                                {evaluation.keyIssues.map((issue, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <AlertTriangle className="w-3 h-3 text-destructive mt-1 shrink-0" />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}

        {/* Transcript Display */}
        {transcriptData && transcriptData.success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <TranscriptDisplay
              messages={transcriptData.messages}
              qaPairs={transcriptData.qaPairs}
              durationFormatted={transcriptData.durationFormatted}
            />
          </motion.div>
        )}

        {/* No Report Message with Fetch Results Button */}
        {!report && !transcriptData && !isLoadingReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-6 shadow-xl text-center space-y-4"
          >
            <p className="text-black/60 dark:text-white/60">
              Your interview is complete! Click the button below to fetch your results and evaluation report.
            </p>
            {onFetchResults && (
              <button
                onClick={onFetchResults}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Fetch Results
              </button>
            )}
          </motion.div>
        )}

        {/* Create Another Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <button
            onClick={onCreateAnother}
            className="px-6 py-3 bg-white dark:bg-white text-black border-2 border-black/20 rounded-lg hover:bg-white/80 dark:hover:bg-white/90 transition-all font-medium flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Create Another Interview
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InterviewComplete;