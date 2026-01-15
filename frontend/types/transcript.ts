export interface TranscriptMessage {
  role: 'assistant' | 'user' | 'bot' | 'system';
  message: string;
  time?: number;
  secondsFromStart?: number;
}

export interface QAPair {
  questionNumber: number;
  question: string;
  answer: string;
}

export interface TranscriptResponse {
  success: boolean;
  callId?: string;
  assistantId?: string;
  status?: string;
  transcript?: string;
  messages?: TranscriptMessage[];
  summary?: string;
  qaPairs?: QAPair[];
  duration?: number;
  durationFormatted?: string;
  startedAt?: string;
  endedAt?: string;
  error?: string;
}
