/**
 * MascotBubble Component - QuranIQ Kids
 * Shows the moon mascot with a speech bubble for hints/encouragement
 */

import { motion } from 'framer-motion';

const MASCOT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/mascot-moon-4TKGwbdD2xAUvRBjLqdhwG.webp';

interface MascotBubbleProps {
  message: string;
  show?: boolean;
  position?: 'top' | 'bottom';
}

export default function MascotBubble({ message, show = true, position = 'bottom' }: MascotBubbleProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'bottom' ? 20 : -20 }}
      className={`flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg max-w-xs ${
        position === 'bottom' ? 'fixed bottom-6 left-4 right-4 mx-auto' : ''
      }`}
    >
      <motion.img
        src={MASCOT}
        alt="Hilal"
        className="w-10 h-10 flex-shrink-0"
        animate={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <p className="text-sm text-gray-700 font-medium" style={{ fontFamily: 'var(--font-body)' }}>
        {message}
      </p>
    </motion.div>
  );
}
