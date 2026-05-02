/**
 * LetterCard Component - QuranIQ Kids
 * Reusable card displaying an Arabic letter with optional interaction
 */

import { motion } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';

interface LetterCardProps {
  letter: ArabicLetter;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selected?: boolean;
  completed?: boolean;
  showName?: boolean;
}

export default function LetterCard({ letter, size = 'md', onClick, selected, completed, showName = true }: LetterCardProps) {
  const sizeClasses = {
    sm: 'w-14 h-14 text-2xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-28 h-28 text-6xl',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-2xl flex flex-col items-center justify-center transition-all border-3 ${
        completed 
          ? 'bg-green-50 border-green-300' 
          : selected 
            ? 'bg-teal-50 border-teal-400 shadow-lg' 
            : 'bg-white border-amber-100 shadow-md hover:shadow-lg'
      }`}
      whileTap={onClick ? { scale: 0.9 } : {}}
      whileHover={onClick ? { scale: 1.05 } : {}}
    >
      <span className="arabic-text leading-none" style={{ color: letter.color }}>
        {letter.letter}
      </span>
      {showName && size !== 'sm' && (
        <span className="text-[10px] text-gray-500 mt-1 font-medium" style={{ fontFamily: 'var(--font-body)' }}>
          {letter.name}
        </span>
      )}
    </motion.button>
  );
}
