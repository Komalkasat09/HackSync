import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay = ({ message }: LoadingOverlayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-black backdrop-blur-lg border-2 border-black/20 dark:border-white/20 rounded-xl p-8 shadow-xl max-w-sm mx-4 text-center"
      >
        <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin mb-4" />
        <p className="text-black dark:text-white font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingOverlay;
