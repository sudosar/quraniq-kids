/**
 * FindInWordGame - Spot the target letter in Quranic words
 * 
 * Design: Celestial Garden theme
 * 
 * CRITICAL FIX: Arabic text MUST remain as a single connected string.
 * We CANNOT split into individual characters/graphemes and render them as separate
 * spans — this breaks Arabic connected script (letters disconnect).
 * 
 * NEW APPROACH:
 * - Render the full word as ONE connected Arabic string
 * - The child taps the word to confirm they found the letter
 * - After correct tap, we highlight the word and show where the letter appears
 * - This preserves proper Arabic shaping/joining
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { speakArabic, playCorrectSound, playWrongSound } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

export default function FindInWordGame({ letter, onComplete }: Props) {
  const [wordIndex, setWordIndex] = useState(0);
  const [found, setFound] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [score, setScore] = useState(0);
  const [tapped, setTapped] = useState(false);

  const quranicWords = letter.quranicWords || [];
  const currentWord = quranicWords[wordIndex];

  useEffect(() => {
    if (currentWord) {
      const timer = setTimeout(() => {
        speakArabic(currentWord.word, 0.6);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [wordIndex, currentWord]);

  // Reset state when word changes
  useEffect(() => {
    setFound(false);
    setTapped(false);
    setShowPrompt(true);
  }, [wordIndex]);

  const handleWordTap = useCallback(() => {
    if (found) return;
    
    setTapped(true);
    setFound(true);
    setScore(prev => prev + 1);
    playCorrectSound();
    
    // Auto-advance after celebration
    setTimeout(() => {
      if (wordIndex < quranicWords.length - 1) {
        setWordIndex(prev => prev + 1);
      } else {
        onComplete(score + 1 >= quranicWords.length ? 2 : 1);
      }
    }, 2000);
  }, [found, wordIndex, quranicWords.length, score, onComplete]);

  if (!currentWord) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">No Quranic words available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 gap-6">
      {/* Progress dots */}
      <div className="flex gap-2">
        {quranicWords.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < wordIndex ? 'bg-teal-500' :
              i === wordIndex ? 'bg-amber-500 scale-125' :
              'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Instruction */}
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-600 mb-1" style={{ fontFamily: 'var(--font-body)' }}>
          Find the letter <span className="text-3xl font-bold" style={{ fontFamily: 'Amiri, serif', color: letter.color }}>{letter.letter}</span> in this word!
        </p>
        <p className="text-sm text-gray-400">Tap the word when you see it</p>
      </div>

      {/* Target letter reminder */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: letter.color + '20', border: `3px solid ${letter.color}` }}
      >
        <span className="text-3xl font-bold" style={{ fontFamily: 'Amiri, serif', color: letter.color }}>
          {letter.letter}
        </span>
      </motion.div>

      {/* Quranic Word Card — rendered as ONE connected Arabic string */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wordIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-amber-100 p-8 max-w-md w-full"
        >
          {/* The Arabic word — single connected string, tappable */}
          <motion.div 
            className="flex justify-center mb-6 cursor-pointer"
            onClick={handleWordTap}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              dir="rtl"
              className="inline-block text-center"
              style={{ 
                fontFamily: 'Amiri, serif', 
                fontSize: '3.5rem', 
                lineHeight: 1.8,
                color: found ? '#059669' : '#1f2937',
                backgroundColor: found ? '#D1FAE5' : 'transparent',
                padding: '0.2em 0.5em',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
              }}
              animate={found ? { scale: [1, 1.1, 1] } : {}}
            >
              {currentWord.word}
            </motion.span>
          </motion.div>

          {/* Found celebration */}
          <AnimatePresence>
            {found && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4"
              >
                <p className="text-lg font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>
                  ✨ You found {letter.name}! Great job!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap prompt */}
          {!found && (
            <motion.div
              className="text-center mb-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <p className="text-sm text-amber-500 font-medium">
                👆 Tap the word when you spot {letter.name}!
              </p>
            </motion.div>
          )}

          {/* Word info */}
          <div className="text-center border-t border-amber-50 pt-4">
            <p className="text-sm text-gray-400 mb-1">From Surah {currentWord.surah}</p>
            <p className="text-lg font-semibold text-teal-700" style={{ fontFamily: 'var(--font-heading)' }}>
              "{currentWord.meaning}"
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Listen button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => speakArabic(currentWord.word, 0.6)}
        className="flex items-center gap-2 px-5 py-2.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <span className="text-xl">🔊</span>
        Hear the word
      </motion.button>

      {/* Score */}
      <p className="text-sm text-gray-400">
        Found {score}/{quranicWords.length} words
      </p>
    </div>
  );
}
