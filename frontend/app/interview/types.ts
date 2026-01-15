/**
 * TypeScript types for Interview Frontend
 */

export interface Resume {
  name?: string;
  email?: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  githubLinks?: string[];
  rawText?: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  major?: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedTopics: string[];
  timeLimit: number;
  context?: string;
}

export interface Answer {
  questionId: string;
  text: string;
  timeTaken: number;
  timestamp: Date;
  confidence?: number;
}

export interface InterviewSession {
  sessionId: string;
  currentQuestion: Question | null;
  totalQuestions: number;
  answeredQuestions: number;
  progress: number;
}

export interface CategoryScore {
  score: number;
  weight: number;
  feedback: string;
}

export interface AnswerFeedback {
  questionId: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewScore {
  overall: number;
  categories: {
    technicalKnowledge: CategoryScore;
    problemSolving: CategoryScore;
    communication: CategoryScore;
    projectUnderstanding: CategoryScore;
  };
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  recommendedTopics: string[];
  detailedFeedback: AnswerFeedback[];
}

export type InterviewType = 'general' | 'technical' | 'project_heavy';

export interface MediaPermissions {
  camera: boolean;
  microphone: boolean;
}
