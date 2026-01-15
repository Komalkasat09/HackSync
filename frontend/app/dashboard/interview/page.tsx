"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Upload, Video, Trophy } from 'lucide-react';

export default function InterviewPrepPage() {
  const router = useRouter();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Mock Interview</h1>
        <p className="text-foreground/60">Practice and ace your interviews with personalized AI coaching</p>
      </div>

      {/* Main CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-8 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-bold">Start Your AI Interview</h2>
            </div>
            <p className="text-foreground/70 mb-6 max-w-2xl">
              Get personalized interview questions based on your resume. Our AI analyzes your skills, 
              projects, and experience to create a realistic interview experience with detailed feedback.
            </p>
            <button
              onClick={() => router.push('/interview/setup')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Interview Preparation
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
              <Video className="w-24 h-24 text-purple-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Resume Analysis</h3>
          <p className="text-sm text-foreground/60">
            Upload your resume and get questions tailored to your skills, experience, and projects.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
            <Video className="w-6 h-6 text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Live AI Interview</h3>
          <p className="text-sm text-foreground/60">
            Practice with webcam on, just like a real interview. Answer 10+ personalized questions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Detailed Feedback</h3>
          <p className="text-sm text-foreground/60">
            Get comprehensive scoring, strengths, weaknesses, and actionable improvement suggestions.
          </p>
        </motion.div>
      </div>

      {/* Interview Types */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Choose Your Interview Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 hover:border-purple-500/50 transition cursor-pointer">
            <div className="text-3xl mb-2">💼</div>
            <h4 className="font-semibold mb-1">General Interview</h4>
            <p className="text-sm text-foreground/60">Balanced mix of technical and behavioral questions</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 hover:border-purple-500/50 transition cursor-pointer">
            <div className="text-3xl mb-2">⚙️</div>
            <h4 className="font-semibold mb-1">Technical Deep Dive</h4>
            <p className="text-sm text-foreground/60">Focus on technical knowledge and coding concepts</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 hover:border-purple-500/50 transition cursor-pointer">
            <div className="text-3xl mb-2">🚀</div>
            <h4 className="font-semibold mb-1">Project-Heavy</h4>
            <p className="text-sm text-foreground/60">Deep dive into your projects and implementation details</p>
          </div>
        </div>
      </div>
    </div>
  );
}
