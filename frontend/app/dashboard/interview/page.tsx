"use client";

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import InterviewForm from '@/components/interview/InterviewForm';
import InterviewReady from '@/components/interview/InterviewReady';
import InterviewInProgress from '@/components/interview/InterviewInProgress';
import InterviewComplete from '@/components/interview/InterviewComplete';
import { AppState, InterviewDetails, EvaluationResponse } from '@/types/interview';
import { TranscriptResponse } from '@/types/transcript';

export default function InterviewPrepPage() {
  const [currentState, setCurrentState] = useState<AppState>('create');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails | null>(null);
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [evaluationReport, setEvaluationReport] = useState<EvaluationResponse | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [callData, setCallData] = useState<any>(null);

  // Check for assistant parameter in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const assistantParam = urlParams.get('assistant');
    
    if (assistantParam) {
      setAssistantId(assistantParam);
      setCurrentState('interview');
    }
  }, []);

  // Update URL when assistantId changes
  useEffect(() => {
    if (assistantId && currentState === 'ready') {
      const url = new URL(window.location.href);
      url.searchParams.set('assistant', assistantId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [assistantId, currentState]);

  const handleInterviewCreated = (newAssistantId: string, details: InterviewDetails) => {
    setAssistantId(newAssistantId);
    setInterviewDetails(details);
    setCurrentState('ready');
  };

  const handleStartInterview = () => {
    setCurrentState('interview');
  };

  const handleInterviewComplete = async (duration: number, callDataParam?: any) => {
    setInterviewDuration(duration);
    setCallData(callDataParam);
    setCurrentState('complete');
    console.log('Interview complete, call data stored:', callDataParam);
  };

  const handleFetchResults = async () => {
    setIsLoadingReport(true);

    // Wait a bit for the call to be fully processed by Vapi
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch transcript from our backend
    try {
      const token = localStorage.getItem("token");
      let callId = callData?.call?.id ?? callData?.callId ?? callData?.id;
      
      // If no call ID, try to fetch using assistant ID (get most recent call)
      if (!callId && assistantId) {
        console.log('⚠️ No call ID, will fetch most recent call for assistant:', assistantId);
        callId = assistantId; // Backend will handle fetching recent call
      }
      
      if (!callId) {
        console.error('No call ID or assistant ID found');
        setIsLoadingReport(false);
        return;
      }

      console.log('Fetching transcript for call/assistant ID:', callId);

      const response = await fetch(`http://localhost:8000/api/interview/fetch-transcript?call_id=${callId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check response status
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to fetch transcript: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Transcript fetched successfully:', data);
        setTranscriptData(data as TranscriptResponse);

        // Transform Q&A pairs to n8n format and send to webhook
        if (data.qaPairs && data.qaPairs.length > 0 && interviewDetails) {
          console.log('Sending Q&A pairs to n8n webhook:', data.qaPairs);
          
          // Transform qaPairs to n8n expected format: q_a array with q1/a1, q2/a2, etc.
          const q_a_formatted = data.qaPairs.map((qa: any, index: number) => {
            const qNum = qa.questionNumber || index + 1;
            return {
              [`q${qNum}`]: qa.question || '',
              [`a${qNum}`]: qa.answer || '',
              difficulty: qa.difficulty || 'medium'
            };
          });

          // Prepare payload for n8n webhook
          const payload = {
            q_a: q_a_formatted,
            name: interviewDetails.candidateName,
            Email: interviewDetails.candidateEmail,
          };

          try {
            console.log('Calling n8n webhook with payload:', payload);
            
            const evalResponse = await fetch('https://n8n.srv990178.hstgr.cloud/webhook/vapi-callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            // Check response status
            if (!evalResponse.ok) {
              const errorText = await evalResponse.text().catch(() => evalResponse.statusText);
              throw new Error(`Failed to evaluate interview: ${evalResponse.status} ${errorText}`);
            }

            // Parse response (n8n returns array with single object)
            const evalDataArray = await evalResponse.json();
            const evalData = Array.isArray(evalDataArray) && evalDataArray.length > 0 
              ? evalDataArray[0] 
              : evalDataArray;

            console.log('Evaluation received from n8n:', evalData);

            // Transform n8n response to match our EvaluationResponse format
            const structuredReport = evalData.structuredReport || {};
            const metrics = evalData.metrics || {};
            const evaluations = structuredReport.evaluations || [];
            const overallAssessment = structuredReport.overallAssessment || {};
            const scoresByDifficulty = metrics.scoresByDifficulty || {
              easy: { total: 0, count: 0, average: 0 },
              medium: { total: 0, count: 0, average: 0 },
              hard: { total: 0, count: 0, average: 0 },
            };

            // Transform evaluations to match QuestionEvaluation format
            const detailedEvaluations = evaluations.map((evaluation: any) => ({
              questionNumber: evaluation.questionNumber || 0,
              difficulty: (evaluation.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard',
              category: evaluation.category || 'general',
              score: evaluation.score || 0,
              maxScore: evaluation.maxScore || 10,
              feedback: evaluation.feedback || '',
              strengths: evaluation.strengths || [],
              improvements: evaluation.improvements || [],
              keyIssues: evaluation.keyIssues || [],
            }));

            // Create EvaluationReport
            const evaluationReport: EvaluationResponse = {
              report: {
                interviewMetadata: {
                  callId: data.callId || callId || '',
                  assistantId: assistantId || '',
                  durationFormatted: data.durationFormatted || formatDuration(interviewDuration),
                  totalQuestionsAnswered: structuredReport.questionsAnswered || evaluations.length,
                  expectedQuestions: interviewDetails.totalQuestions || 10,
                  interviewStatus: structuredReport.interviewCompleteness === 'complete' ? 'complete' : 'partial',
                  isComplete: structuredReport.interviewCompleteness === 'complete',
                  evaluatedAt: new Date().toISOString(),
                },
                scoresSummary: {
                  totalScore: metrics.totalScore || 0,
                  maxPossibleScore: metrics.maxScore || 0,
                  percentageScore: metrics.percentage || 0,
                  averageScore: metrics.averageScore || 0,
                  scoresByDifficulty: {
                    easy: {
                      total: scoresByDifficulty.easy?.total || 0,
                      count: scoresByDifficulty.easy?.count || 0,
                      average: scoresByDifficulty.easy?.average || 0,
                    },
                    medium: {
                      total: scoresByDifficulty.medium?.total || 0,
                      count: scoresByDifficulty.medium?.count || 0,
                      average: scoresByDifficulty.medium?.average || 0,
                    },
                    hard: {
                      total: scoresByDifficulty.hard?.total || 0,
                      count: scoresByDifficulty.hard?.count || 0,
                      average: scoresByDifficulty.hard?.average || 0,
                    },
                  },
                  overallAssessment: {
                    technicalCompetency: overallAssessment.technicalCompetency || 0,
                    communicationSkills: overallAssessment.communicationSkills || 0,
                    problemSolvingAbility: overallAssessment.problemSolvingAbility || 0,
                    cultureFit: overallAssessment.cultureFit || 0,
                  },
                },
                detailedEvaluations,
                finalRecommendation: {
                  decision: structuredReport.recommendation || evalData.recommendation || 'N/A',
                  reason: structuredReport.additionalNotes || '',
                  nextSteps: 'Review the detailed feedback and work on areas for improvement.',
                },
                summary: {
                  strengths: structuredReport.summaryStrengths || [],
                  weaknesses: structuredReport.summaryWeaknesses || [],
                },
              },
              textReport: evalData.textReport || '',
              callId: data.callId || callId || '',
              assistantId: assistantId || '',
              score: metrics.totalScore || 0,
              recommendation: structuredReport.recommendation || evalData.recommendation || 'N/A',
              interviewStatus: structuredReport.interviewCompleteness || 'partial',
              questionsAnswered: structuredReport.questionsAnswered || evaluations.length,
            };
            
            console.log('Transformed evaluation report:', evaluationReport);
            setEvaluationReport(evaluationReport);
          } catch (evalErr) {
            console.error('Error calling n8n webhook:', evalErr);
            alert(evalErr instanceof Error ? evalErr.message : 'Failed to evaluate interview. Please try again.');
          }
        } else {
          console.warn('No Q&A pairs found in transcript');
        }
      } else {
        console.error('Failed to fetch transcript:', data.message);
        alert(data.message || 'Failed to fetch transcript. Please try again.');
      }
    } catch (err) {
      console.error('Error calling fetch-transcript:', err);
      alert(err instanceof Error ? err.message : 'Failed to fetch results. Please try again.');
    }

    setIsLoadingReport(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateAnother = () => {
    // Clear URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('assistant');
    window.history.replaceState({}, '', url.toString());
    
    // Reset state
    setAssistantId(null);
    setInterviewDetails(null);
    setInterviewDuration(0);
    setEvaluationReport(null);
    setTranscriptData(null);
    setCallData(null);
    setCurrentState('create');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 sm:p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-blue-500/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentState}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full relative z-10"
        >
          {currentState === 'create' && (
            <InterviewForm onInterviewCreated={handleInterviewCreated} />
          )}

          {currentState === 'ready' && assistantId && interviewDetails && (
            <InterviewReady
              assistantId={assistantId}
              interviewDetails={interviewDetails}
              onStartInterview={handleStartInterview}
              onCreateAnother={handleCreateAnother}
            />
          )}

          {currentState === 'interview' && assistantId && (
            <InterviewInProgress
              assistantId={assistantId}
              candidateName={interviewDetails?.candidateName}
              onInterviewComplete={handleInterviewComplete}
            />
          )}

          {currentState === 'complete' && (
            <InterviewComplete
              candidateName={interviewDetails?.candidateName || 'Candidate'}
              duration={interviewDuration}
              onCreateAnother={handleCreateAnother}
              evaluationReport={evaluationReport}
              transcriptData={transcriptData}
              isLoadingReport={isLoadingReport}
              onFetchResults={handleFetchResults}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
