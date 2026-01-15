/**
 * AI Interviewer Avatar Component
 * Animated robot avatar
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AIInterviewerAvatarProps {
  isAsking?: boolean;
}

export default function AIInterviewerAvatar({ isAsking = true }: AIInterviewerAvatarProps) {
  const [blinkEyes, setBlinkEyes] = useState(false);

  // Random eye blinks
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkEyes(true);
      setTimeout(() => setBlinkEyes(false), 200);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={isAsking ? {
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
        } : {}}
        transition={{
          duration: 2,
          repeat: isAsking ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        {/* Robot Head */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenna */}
          <motion.line
            x1="60"
            y1="10"
            x2="60"
            y2="25"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ y1: [10, 5, 10] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="60"
            cy="10"
            r="4"
            fill="url(#gradient)"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Head */}
          <rect
            x="30"
            y="25"
            width="60"
            height="60"
            rx="10"
            fill="url(#gradient)"
            opacity="0.2"
          />
          <rect
            x="30"
            y="25"
            width="60"
            height="60"
            rx="10"
            stroke="url(#gradient)"
            strokeWidth="2"
          />

          {/* Eyes */}
          <motion.g
            animate={blinkEyes ? { scaleY: 0.1 } : { scaleY: 1 }}
            transition={{ duration: 0.1 }}
          >
            <circle cx="45" cy="50" r="6" fill="#A78BFA" />
            <circle cx="75" cy="50" r="6" fill="#A78BFA" />
          </motion.g>

          {/* Pupils (animated when asking) */}
          {isAsking && !blinkEyes && (
            <>
              <motion.circle
                cx="45"
                cy="50"
                r="3"
                fill="#E9D5FF"
                animate={{ x: [0, 2, -2, 0], y: [0, 1, -1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.circle
                cx="75"
                cy="50"
                r="3"
                fill="#E9D5FF"
                animate={{ x: [0, -2, 2, 0], y: [0, 1, -1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </>
          )}

          {/* Mouth (voice indicator) */}
          <motion.path
            d={isAsking ? 
              "M 45 70 Q 60 75 75 70" : 
              "M 45 70 L 75 70"
            }
            stroke="#A78BFA"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            animate={isAsking ? {
              d: [
                "M 45 70 Q 60 75 75 70",
                "M 45 70 Q 60 70 75 70",
                "M 45 70 Q 60 75 75 70",
              ],
            } : {}}
            transition={{ duration: 0.5, repeat: isAsking ? Infinity : 0 }}
          />

          {/* Side panels */}
          <rect x="25" y="40" width="3" height="20" rx="1.5" fill="url(#gradient)" />
          <rect x="92" y="40" width="3" height="20" rx="1.5" fill="url(#gradient)" />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#F472B6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Glow effect when asking */}
        {isAsking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>

      {/* Status Text */}
      <motion.p
        className="mt-4 text-sm font-medium"
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        {isAsking ? (
          <span className="text-purple-400">Waiting for your answer...</span>
        ) : (
          <span className="text-slate-400">Processing...</span>
        )}
      </motion.p>

      {/* Sound waves when asking */}
      {isAsking && (
        <div className="flex space-x-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
              animate={{
                height: ['8px', '16px', '8px'],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
