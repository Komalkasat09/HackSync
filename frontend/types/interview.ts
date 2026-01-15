export type AppState = 'create' | 'ready' | 'interview' | 'complete';

export interface CandidateInfo {
  name: string;
  email: string;
}

export interface InterviewDetails {
  candidateName: string;
  candidateEmail: string;
  totalQuestions: number;
  questionBreakdown?: {
    easy: number | string;
    medium: number | string;
    hard: number | string;
  };
  expiresAt?: string;
}

export interface CreateInterviewResponse {
  success: boolean;
  assistantId?: string;
  interviewDetails?: InterviewDetails;
  error?: string;
}

export interface InterviewFormData {
  resumeFile: File | null;
  jobDescription: string;
  candidateName: string;
  candidateEmail: string;
}

// Evaluation Report Types
export interface QuestionEvaluation {
  questionNumber: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  keyIssues: string[];
}

export interface OverallAssessment {
  technicalCompetency: number;
  communicationSkills: number;
  problemSolvingAbility: number;
  cultureFit: number;
}

export interface ScoresByDifficulty {
  easy: { total: number; count: number; average: number };
  medium: { total: number; count: number; average: number };
  hard: { total: number; count: number; average: number };
}

export interface InterviewMetadata {
  callId: string;
  assistantId: string;
  durationFormatted: string;
  totalQuestionsAnswered: number;
  expectedQuestions: number;
  interviewStatus: 'complete' | 'partial';
  isComplete: boolean;
  evaluatedAt: string;
}

export interface ScoresSummary {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  averageScore: number;
  scoresByDifficulty: ScoresByDifficulty;
  overallAssessment: OverallAssessment;
}

export interface FinalRecommendation {
  decision: string;
  reason: string;
  nextSteps: string;
}

export interface EvaluationReport {
  interviewMetadata: InterviewMetadata;
  scoresSummary: ScoresSummary;
  detailedEvaluations: QuestionEvaluation[];
  finalRecommendation: FinalRecommendation;
  summary: {
    strengths: string[];
    weaknesses: string[];
  };
}

export interface EvaluationResponse {
  report: EvaluationReport;
  textReport: string;
  callId: string;
  assistantId: string;
  score: number;
  recommendation: string;
  interviewStatus: string;
  questionsAnswered: number;
}
