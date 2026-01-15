/**
 * Category Score Bar Component
 * Animated horizontal bar chart for category scores
 */

'use client';

import { motion } from 'framer-motion';
import { getScoreColor } from '../utils';

interface CategoryScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
}

export default function CategoryScoreBar({ label, score, maxScore }: CategoryScoreBarProps) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
      
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
        >
          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
