/**
 * Interview API Client
 */

import { Resume, Question, InterviewScore, InterviewType } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_INTERVIEW_API || 'http://localhost:3001';

export class InterviewAPI {
  /**
   * Start a new interview session
   */
  static async startInterview(
    interviewType: InterviewType,
    resume?: Resume,
    resumeFile?: File,
    userId?: string
  ): Promise<{
    sessionId: string;
    firstQuestion: Question;
    totalQuestions: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/interview/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId || 'guest',
        role: interviewType || 'Software Engineer',
        company: 'Tech Company',
        experience_level: 'mid',
        skills: resume?.skills || ['JavaScript', 'Python', 'React'],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start interview');
    }

    const data = await response.json();
    
    // Store all questions in session storage
    if (data.mock_session?.questions) {
      sessionStorage.setItem(`interview_questions_${data.mock_session.session_id}`, 
        JSON.stringify(data.mock_session.questions));
    }
    
    // Transform backend response to match frontend interface
    return {
      sessionId: data.mock_session.session_id,
      firstQuestion: {
        id: '1',
        text: data.mock_session.questions[0].question,
        category: data.mock_session.questions[0].type,
        difficulty: data.mock_session.questions[0].difficulty as 'easy' | 'medium' | 'hard',
        expectedTopics: data.mock_session.questions[0].hints || [],
        timeLimit: 180,
      },
      totalQuestions: data.mock_session.questions.length,
    };
  }

  /**
   * Submit an answer and get next question
   */
  static async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string,
    timeTaken: number,
    confidence?: number
  ): Promise<{
    nextQuestion?: Question;
    isComplete: boolean;
    progress: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/api/interview/submit-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        user_answer: answer,
        time_taken: timeTaken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit answer');
    }

    const data = await response.json();
    
    // Get all questions from storage
    const storedQuestions = sessionStorage.getItem(`interview_questions_${sessionId}`);
    const questions = storedQuestions ? JSON.parse(storedQuestions) : [];
    
    // Calculate progress
    const currentQuestionIndex = parseInt(questionId);
    const progress = (currentQuestionIndex / questions.length) * 100;
    const isComplete = currentQuestionIndex >= questions.length;
    
    // Get next question if available
    let nextQuestion = undefined;
    if (!isComplete && questions[currentQuestionIndex]) {
      const nextQ = questions[currentQuestionIndex];
      nextQuestion = {
        id: (currentQuestionIndex + 1).toString(),
        text: nextQ.question,
        category: nextQ.type,
        difficulty: nextQ.difficulty as 'easy' | 'medium' | 'hard',
        expectedTopics: nextQ.hints || [],
        timeLimit: 180,
      };
    }
    
    return {
      nextQuestion,
      isComplete,
      progress,
    };
  }

  /**
   * End interview session (no-op for Python backend)
   */
  static async endInterview(sessionId: string): Promise<void> {
    // Python backend doesn't have explicit end endpoint
    // Cleanup local storage
    sessionStorage.removeItem(`interview_questions_${sessionId}`);
  }

  /**
   * Get interview results
   */
  static async getResults(sessionId: string): Promise<InterviewScore> {
    const response = await fetch(`${API_BASE_URL}/api/interview/results/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get results');
    }

    const data = await response.json();
    const feedback = data.feedback;
    
    // Transform Python backend feedback to frontend format
    return {
      sessionId,
      overallScore: feedback.overall_score * 10, // Convert 8.2 to 82
      categoryScores: {
        technical: feedback.technical_score * 10,
        communication: feedback.communication_score * 10,
        problemSolving: (feedback.technical_score + feedback.confidence_score) / 2 * 10,
        behavioral: feedback.confidence_score * 10,
      },
      strengths: feedback.strengths,
      improvements: feedback.areas_for_improvement,
      detailedFeedback: Object.values(feedback.detailed_feedback || {}).join('\n\n'),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update session metadata (no-op for Python backend)
   */
  static async updateMetadata(
    sessionId: string,
    metadata: {
      cameraEnabled?: boolean;
      microphoneEnabled?: boolean;
      browserInfo?: string;
    }
  ): Promise<void> {
    // Python backend doesn't track this metadata
    console.log('Metadata:', metadata);
  }

  /**
   * Convert text to speech
   */
  static async textToSpeech(text: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('TTS not available');
        return null;
      }

      const data = await response.json();
      return data.audio_base64;
    } catch (err) {
      console.error('TTS error:', err);
      return null;
    }
  }

  /**
   * Convert speech to text
   */
  static async speechToText(audioBlob: Blob): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`${API_BASE_URL}/api/interview/speech-to-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('STT not available');
        return null;
      }

      const data = await response.json();
      return data.text;
    } catch (err) {
      console.error('STT error:', err);
      return null;
    }
  }

  /**
   * Check voice features status
   */
  static async getVoiceFeaturesStatus(): Promise<{
    textToSpeech: boolean;
    speechToText: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/voice-features-status`);
      const data = await response.json();
      return {
        textToSpeech: data.text_to_speech,
        speechToText: data.speech_to_text,
        message: data.message,
      };
    } catch (err) {
      return {
        textToSpeech: false,
        speechToText: false,
        message: 'Voice features unavailable',
      };
    }
  }
}
