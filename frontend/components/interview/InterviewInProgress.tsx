import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Phone, AlertCircle, Loader2 } from 'lucide-react';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { EvaluationResponse } from '@/types/interview';

interface InterviewInProgressProps {
  assistantId: string;
  candidateName?: string;
  onInterviewComplete: (duration: number, callData?: any) => void;
}

type InterviewPhase = 'welcome' | 'connecting' | 'active' | 'error';

const InterviewInProgress = ({
  assistantId,
  candidateName = 'Candidate',
  onInterviewComplete,
}: InterviewInProgressProps) => {
  const [phase, setPhase] = useState<InterviewPhase>('welcome');
  const [status, setStatus] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const callDataRef = useRef<any>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const endCall = useCallback(() => {
    stopTimer();
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  }, [stopTimer]);

  const startInterview = useCallback(async () => {
    setPhase('connecting');
    setError(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setPhase('error');
      setError('Microphone access is required for the interview. Please enable microphone access in your browser settings and try again.');
      return;
    }

    try {
      // Initialize Vapi with public key
      const vapi = new Vapi('b6307aa3-2bc7-4fc9-a866-3e540062c7e2');
      vapiRef.current = vapi;

      // Set up event handlers
      vapi.on('call-start', () => {
        setPhase('active');
        setStatus('Interview started');
        startTimer();
      });

      vapi.on('speech-start', () => {
        setIsSpeaking(true);
        setStatus('AI Interviewer is speaking...');
      });

      vapi.on('speech-end', () => {
        setIsSpeaking(false);
        setStatus('Listening to your answer...');
      });

      // Capture ALL message events to find call ID
      vapi.on('message', (message: any) => {
        console.log('Vapi message:', message);
        console.log('Message type:', message?.type);
        
        // Vapi sends different message types, capture call ID from any of them
        if (message?.call?.id) {
          console.log('✅ Call ID found in message.call.id:', message.call.id);
          if (!callDataRef.current) {
            callDataRef.current = message;
          }
        }
        
        // Store the end-of-call-report when received
        if (message?.type === 'end-of-call-report') {
          callDataRef.current = message;
          console.log('End of call report received:', message);
          console.log('Call ID from report:', message?.call?.id || message?.callId || message?.id || 'NOT FOUND');
        }
        
        // Also check for other message types that might contain call data
        if (message?.type === 'status-update' && message?.call) {
          console.log('Status update with call data:', message.call);
          if (!callDataRef.current?.call?.id) {
            callDataRef.current = message;
          }
        }
      });

      vapi.on('call-end', () => {
        stopTimer();
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        console.log('📞 Call ended - Duration:', finalDuration);
        console.log('📊 Call data captured:', callDataRef.current);
        
        // Try to get call ID from Vapi instance if not in callData
        if (!callDataRef.current?.call?.id && vapiRef.current) {
          // @ts-ignore - accessing internal property
          const internalCallId = vapiRef.current._callId || vapiRef.current.callId;
          if (internalCallId) {
            console.log('📱 Got call ID from Vapi instance:', internalCallId);
            callDataRef.current = {
              call: { id: internalCallId }
            };
          }
        }
        
        // Pass the captured call data along with duration
        onInterviewComplete(finalDuration, callDataRef.current);
      });

      vapi.on('error', (error) => {
        console.error('Vapi error:', error);
        setPhase('error');
        setError('Connection error occurred. Please try again.');
      });

      // Start the call
      await vapi.start(assistantId);
    } catch (err) {
      console.error('Failed to start interview:', err);
      setPhase('error');
      setError('Failed to connect to the interview. Please check your internet connection and try again.');
    }
  }, [assistantId, onInterviewComplete, startTimer, stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, [stopTimer]);

  // Welcome screen
  if (phase === 'welcome') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="card-elevated p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome to Your Interview
            </h1>
            <p className="text-lg text-primary font-medium">
              👋 Hello {candidateName}!
            </p>
          </div>

          <div className="text-left bg-secondary/50 rounded-xl p-4 space-y-2">
            <p className="text-muted-foreground">
              You'll be asked questions by an AI interviewer. Please:
            </p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Speak clearly into your microphone</li>
              <li>• Answer thoughtfully</li>
              <li>• Take your time with each answer</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              The interview takes about 10-15 minutes
            </p>
          </div>

          <Button
            onClick={startInterview}
            className="btn-success w-full h-14 text-lg gap-3"
          >
            <Mic className="w-6 h-6" />
            START INTERVIEW
          </Button>
        </div>
      </motion.div>
    );
  }

  // Connecting screen
  if (phase === 'connecting') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="card-elevated p-8 text-center space-y-6">
          <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Connecting to Interview...
            </h2>
            <p className="text-muted-foreground">
              Please allow microphone access when prompted
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error screen
  if (phase === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="card-elevated p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Connection Error
            </h2>
            <p className="text-muted-foreground">{error}</p>
          </div>

          <Button
            onClick={() => setPhase('welcome')}
            className="btn-primary gap-2"
          >
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  // Active interview screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen flex flex-col items-center justify-center p-8 relative"
    >
      {/* Animated Orb */}
      <div className="flex-1 flex items-center justify-center w-full">
        <motion.div
          className="relative"
          style={{ width: '400px', height: '400px' }}
        >
          {/* Outer glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Main orb with wave animation */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(192, 132, 252, 0.9), rgba(147, 51, 234, 0.7), rgba(88, 28, 135, 0.5))',
              boxShadow: '0 0 60px rgba(147, 51, 234, 0.6), inset 0 0 60px rgba(192, 132, 252, 0.3)',
            }}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
          >
            {/* Wave pattern overlay */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 400"
              style={{ mixBlendMode: 'overlay' }}
            >
              <defs>
                <pattern id="wave" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <motion.path
                    d="M 0,50 Q 25,0 50,50 T 100,50"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                    fill="none"
                    animate={{
                      d: [
                        'M 0,50 Q 25,0 50,50 T 100,50',
                        'M 0,50 Q 25,100 50,50 T 100,50',
                        'M 0,50 Q 25,0 50,50 T 100,50',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#wave)" opacity="0.5" />
            </svg>
            
            {/* Inner glow */}
            <motion.div
              className="absolute inset-[30%] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent)',
                filter: 'blur(20px)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
          
          {/* Pulsing rings when speaking */}
          {isSpeaking && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: 'rgba(192, 132, 252, 0.6)',
                }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: 'rgba(147, 51, 234, 0.4)',
                }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
              />
            </>
          )}
        </motion.div>
      </div>

      {/* End Interview Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Button
          onClick={endCall}
          variant="destructive"
          className="px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          style={{
            backgroundColor: '#dc2626',
            border: 'none',
          }}
        >
          <Phone className="w-5 h-5 rotate-[135deg] mr-2" />
          End Interview
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default InterviewInProgress;
