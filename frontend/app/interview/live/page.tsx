/**
 * Live Interview Page
 * Main interview interface with webcam, AI avatar, and questions
 */

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { InterviewAPI } from '../api';
import { Question } from '../types';
import { formatTime, getDifficultyColor, estimateConfidence, requestMediaPermissions, stopMediaStream, getBrowserInfo } from '../utils';
import { Video, Mic, MicOff, VideoOff, Send, AlertCircle, CheckCircle } from 'lucide-react';
import AIAvatarInterviewer from '../components/AIAvatarInterviewer';

function LiveInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);

  // Media states
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState({ tts: false, stt: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize interview
  useEffect(() => {
    if (!sessionId) {
      router.push('/interview/setup');
      return;
    }

    initializeInterview();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStream) stopMediaStream(mediaStream);
    };
  }, [sessionId]);

  const initializeInterview = async () => {
    try {
      // Check voice features status
      const voiceStatus = await InterviewAPI.getVoiceFeaturesStatus();
      setVoiceEnabled({
        tts: voiceStatus.textToSpeech,
        stt: voiceStatus.speechToText,
      });
      console.log('Voice features:', voiceStatus.message);

      // Load first question from session storage
      const storedQuestions = sessionStorage.getItem(`interview_questions_${sessionId}`);
      if (storedQuestions) {
        const questions = JSON.parse(storedQuestions);
        setTotalQuestions(questions.length);
        
        // Set first question
        if (questions[0]) {
          const firstQuestion: Question = {
            id: '1',
            text: questions[0].question,
            category: questions[0].type,
            difficulty: questions[0].difficulty,
            expectedTopics: questions[0].hints || [],
            timeLimit: 180,
          };
          setCurrentQuestion(firstQuestion);
          
          // Generate and play audio for first question if TTS enabled
          if (voiceStatus.textToSpeech) {
            playQuestionAudio(firstQuestion.text);
          }
        }
      }

      // Request media permissions
      const permissions = await requestMediaPermissions();
      setCameraEnabled(permissions.camera);
      setMicEnabled(permissions.microphone);

      if (permissions.stream) {
        setMediaStream(permissions.stream);
        if (videoRef.current) {
          videoRef.current.srcObject = permissions.stream;
        }
      }

      // Update metadata
      if (sessionId) {
        await InterviewAPI.updateMetadata(sessionId, {
          cameraEnabled: permissions.camera,
          microphoneEnabled: permissions.microphone,
          browserInfo: getBrowserInfo(),
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError('Failed to initialize interview: ' + errorMessage);
    }
  };

  // Start timer when question loads
  useEffect(() => {
    if (currentQuestion) {
      setQuestionStartTime(Date.now());
      setTimeRemaining(currentQuestion.timeLimit);

      // Start countdown
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentQuestion]);

  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentQuestion || !answer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      const confidence = estimateConfidence(answer);

      const response = await InterviewAPI.submitAnswer(
        sessionId,
        currentQuestion.id,
        answer,
        timeTaken,
        confidence
      );

      setProgress(response.progress);

      if (response.isComplete) {
        // Interview complete
        setInterviewComplete(true);
        await InterviewAPI.endInterview(sessionId);
        
        // Wait a moment before redirecting
        setTimeout(() => {
          router.push(`/interview/result/${sessionId}`);
        }, 2000);
      } else if (response.nextQuestion) {
        // Load next question
        setCurrentQuestion(response.nextQuestion);
        setQuestionNumber((prev) => prev + 1);
        setAnswer('');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Submit answer error:', err);
      const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to submit answer';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleSkipQuestion = () => {
    handleSubmitAnswer(); // Submit with current (possibly empty) answer
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
      }
    } else {
      // Start recording
      if (!micEnabled) {
        setError('Please enable your microphone first');
        return;
      }

      try {
        // Get audio-only stream for recording
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          }
        });

        // Check if MediaRecorder supports webm
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4';

        const recorder = new MediaRecorder(audioStream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: mimeType });
          
          // Stop the audio stream tracks
          audioStream.getTracks().forEach(track => track.stop());
          
          // Transcribe audio to text
          if (voiceEnabled.stt) {
            setLoading(true);
            try {
              const transcribedText = await InterviewAPI.speechToText(audioBlob);
              setLoading(false);
              
              if (transcribedText) {
                setAnswer((prev) => (prev ? prev + ' ' + transcribedText : transcribedText));
              } else {
                setError('Failed to transcribe audio. Please type your answer.');
              }
            } catch (err) {
              setLoading(false);
              setError('Transcription failed. Please type your answer.');
            }
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingTime(0);
        setError(null);
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.error('Recording error:', err);
        const errorMsg = err?.message || String(err) || 'Unknown error';
        setError(`Recording failed: ${errorMsg}. Please type your answer instead.`);
      }
    }
  };

  const playQuestionAudio = async (questionText: string) => {
    try {
      const audioBase64 = await InterviewAPI.textToSpeech(questionText);
      if (audioBase64 && audioRef.current) {
        const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
        audioRef.current.src = audioSrc;
        audioRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error('TTS error:', err);
      // Silently fail - TTS is optional
    }
  };

  const toggleCamera = () => {
    if (videoRef.current && mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
      }
    }
  };

  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    }
  };

  if (!sessionId) {
    return null;
  }

  if (interviewComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl shadow-[0_0_30px_rgba(10,127,255,0.2)]"
        >
          <CheckCircle className="w-20 h-20 text-[var(--shiny-blue)] mx-auto mb-6 drop-shadow-[0_0_15px_var(--shiny-blue-glow)]" />
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Interview Complete! 🎉
          </h2>
          <p className="text-foreground/60 text-lg">
            Generating your results...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hidden audio player for question audio */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-2 bg-foreground/10 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--shiny-blue)] to-[var(--shiny-blue-light)] shadow-[0_0_10px_var(--shiny-blue-glow)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="container mx-auto px-6 py-8 pt-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-foreground/60 text-sm">
              Question {questionNumber} of {totalQuestions || '10'}
            </p>
            <h1 className="text-2xl font-bold text-[var(--shiny-blue)] drop-shadow-[0_0_10px_var(--shiny-blue-glow)]">AI Mock Interview</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-lg ${
              timeRemaining < 30 ? 'bg-red-500/20 text-red-400' : 'bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)]'
            }`}>
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video & AI */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Webcam */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-video bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl overflow-hidden border border-[var(--glass-border)] shadow-[0_0_20px_rgba(10,127,255,0.1)]"
            >
              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Camera Off</p>
                  </div>
                </div>
              )}

              {/* Media Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3">
                <button 
                  onClick={toggleCamera}
                  className="p-3 bg-[var(--glass-bg)] backdrop-blur-xl rounded-full hover:bg-[var(--shiny-blue)]/30 transition border border-[var(--glass-border)] shadow-[0_0_15px_rgba(10,127,255,0.2)]"
                >
                  {cameraEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5 text-red-400" />
                  )}
                </button>
                <button 
                  onClick={toggleMic}
                  className="p-3 bg-[var(--glass-bg)] backdrop-blur-xl rounded-full hover:bg-[var(--shiny-blue)]/30 transition border border-[var(--glass-border)] shadow-[0_0_15px_rgba(10,127,255,0.2)]"
                >
                  {micEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5 text-red-400" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* AI Interviewer */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)] shadow-[0_0_20px_rgba(10,127,255,0.1)]"
            >
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-[var(--shiny-blue)] rounded-full mr-2 animate-pulse shadow-[0_0_8px_var(--shiny-blue-glow)]" />
                <span className="text-sm text-foreground/70">AI Interviewer Active</span>
              </div>
              <AIAvatarInterviewer isAsking={!loading} audioRef={audioRef} />
            </motion.div>
          </div>

          {/* Right Column - Question & Answer */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Question Card */}
                  <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)] shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-sm font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
                        {currentQuestion.difficulty.toUpperCase()}
                      </span>
                      <span className="text-xs text-foreground/60 bg-foreground/5 px-3 py-1 rounded-full border border-[var(--glass-border)]">
                        {currentQuestion.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-semibold mb-3 text-foreground leading-relaxed">
                      {currentQuestion.text}
                    </h2>

                    {currentQuestion.context && (
                      <p className="text-sm text-foreground/60 italic">
                        Context: {currentQuestion.context}
                      </p>
                    )}

                    {currentQuestion.expectedTopics.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {currentQuestion.expectedTopics.map((topic) => (
                          <span
                            key={topic}
                            className="text-xs bg-[var(--shiny-blue)]/10 text-[var(--shiny-blue)] px-3 py-1 rounded-full border border-[var(--shiny-blue)]/20"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Answer Input */}
                  <div className="bg-[var(--glass-bg)] backdrop-blur-xl rounded-xl p-6 border border-[var(--glass-border)] shadow-[0_0_20px_rgba(10,127,255,0.1)]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-foreground/70">
                        Your Answer
                      </label>
                      
                      {/* Voice Recording Button */}
                      <button
                        onClick={toggleRecording}
                        disabled={!micEnabled || loading}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition shadow-[0_0_15px_rgba(10,127,255,0.3)] ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-[var(--shiny-blue)] hover:bg-[var(--shiny-blue-light)]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isRecording ? (
                          <>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                            <span className="text-sm">Stop</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            <span className="text-sm">Voice Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    {!micEnabled && (
                      <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Microphone is disabled. Enable it to use voice answers.
                      </div>
                    )}
                    
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here... Be specific and provide examples."
                      rows={12}
                      className="w-full bg-background border border-[var(--glass-border)] rounded-lg p-4 text-foreground placeholder-foreground/40 focus:ring-2 focus:ring-[var(--shiny-blue)] focus:border-[var(--shiny-blue)] resize-none backdrop-blur-sm"
                      disabled={loading || isRecording}
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-foreground/60">
                        {answer.length} characters
                        {isRecording && <span className="ml-3 text-red-400">🔴 Recording...</span>}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSkipQuestion}
                          disabled={loading}
                          className="px-4 py-2 bg-[var(--glass-bg)] backdrop-blur-xl hover:bg-[var(--shiny-blue)]/20 rounded-lg transition disabled:opacity-50 border border-[var(--glass-border)]"
                        >
                          Skip
                        </button>
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={loading || !answer.trim()}
                          className="px-6 py-2 bg-[var(--shiny-blue)] hover:bg-[var(--shiny-blue-light)] rounded-lg font-semibold transition disabled:opacity-50 flex items-center shadow-[0_0_20px_var(--shiny-blue-glow)]"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Answer
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center backdrop-blur-sm"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                      <p className="text-red-400">{String(error)}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveInterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--shiny-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-foreground text-xl">Loading interview...</div>
        </div>
      </div>
    }>
      <LiveInterviewContent />
    </Suspense>
  );
}
