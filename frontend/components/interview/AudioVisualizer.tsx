import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  isActive: boolean;
  isSpeaking: boolean;
}

const AudioVisualizer = ({ isActive, isSpeaking }: AudioVisualizerProps) => {
  const bars = 12;
  
  return (
    <div className="relative flex items-center justify-center h-32">
      {/* Pulse rings */}
      {isActive && (
        <>
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-pulse-ring" />
          <div className="absolute w-24 h-24 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        </>
      )}
      
      {/* Visualizer bars */}
      <div className="relative flex items-center justify-center gap-1 h-16">
        {Array.from({ length: bars }).map((_, i) => {
          const delay = i * 0.08;
          const baseHeight = isActive ? (isSpeaking ? 0.4 + Math.random() * 0.6 : 0.2 + Math.random() * 0.3) : 0.15;
          
          return (
            <motion.div
              key={i}
              className={`w-1.5 rounded-full ${isSpeaking ? 'bg-accent' : 'bg-primary'}`}
              initial={{ scaleY: 0.15, opacity: 0.5 }}
              animate={{
                scaleY: isActive ? [baseHeight, baseHeight * 1.5, baseHeight] : 0.15,
                opacity: isActive ? 1 : 0.5,
              }}
              transition={{
                duration: isSpeaking ? 0.3 : 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: delay,
                ease: 'easeInOut',
              }}
              style={{
                height: '64px',
                transformOrigin: 'center',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AudioVisualizer;
