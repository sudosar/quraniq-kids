/**
 * FindInWordGame - Spot the target letter in Quranic words
 * 
 * PEDAGOGY:
 * - Child sees a Quranic word rendered as connected Arabic text
 * - On hover/touch, individual letters "separate" and grow bigger
 * - Child must tap the specific letter they're looking for
 * - This teaches letter recognition within real Quranic context
 * 
 * TECHNICAL APPROACH:
 * - We use Intl.Segmenter to split the word into grapheme clusters
 * - Each cluster is rendered as a separate span with hover/touch effects
 * - On hover, the letter grows and gets a colored background
 * - We use letter-spacing and isolation to show the letter clearly
 * - The word remains visually connected until interaction
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

// Split Arabic word into grapheme clusters
function splitIntoGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).map(s => s.segment);
  }
  // Fallback: split by character (less accurate but works)
  return Array.from(text);
}

// Check if a grapheme contains the target letter (ignoring diacritics)
function graphemeContainsLetter(grapheme: string, targetLetter: string): boolean {
  // Remove common Arabic diacritics to compare base letters
  const stripped = grapheme.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  return stripped.includes(targetLetter);
}

export default function FindInWordGame({ letter, onComplete }: Props) {
  const [wordIndex, setWordIndex] = useState(0);
  const [found, setFound] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [interacting, setInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setHoveredIndex(null);
    setWrongIndex(null);
    setInteracting(false);
  }, [wordIndex]);

  const handleLetterTap = useCallback((grapheme: string, index: number) => {
    if (found) return;
    
    const isCorrect = graphemeContainsLetter(grapheme, letter.letter);
    
    if (isCorrect) {
      setFound(true);
      setScore(prev => prev + 1);
      setHoveredIndex(index);
      playCorrectSound();
      
      // Auto-advance after celebration
      setTimeout(() => {
        if (wordIndex < quranicWords.length - 1) {
          setWordIndex(prev => prev + 1);
        } else {
          const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
          onComplete(stars);
        }
      }, 2000);
    } else {
      setWrongIndex(index);
      setMistakes(prev => prev + 1);
      playWrongSound();
      setTimeout(() => setWrongIndex(null), 600);
    }
  }, [found, letter.letter, wordIndex, quranicWords.length, mistakes, onComplete]);

  // Touch handling for mobile
  const handleTouchStart = useCallback((index: number) => {
    setInteracting(true);
    setHoveredIndex(index);
  }, []);

  const handleTouchEnd = useCallback((grapheme: string, index: number) => {
    handleLetterTap(grapheme, index);
    // Keep hover state briefly for visual feedback
    setTimeout(() => {
      if (!found) setHoveredIndex(null);
      setInteracting(false);
    }, 300);
  }, [handleLetterTap, found]);

  if (!currentWord) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">No Quranic words available</p>
      </div>
    );
  }

  const graphemes = splitIntoGraphemes(currentWord.word);

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
        <p className="text-sm text-gray-400">
          {interacting ? 'Now tap the letter!' : 'Touch each letter to see it bigger'}
        </p>
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

      {/* Quranic Word Card — letters are individually tappable */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wordIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-amber-100 p-6 max-w-md w-full"
        >
          {/* The Arabic word — each grapheme is a tappable element */}
          <div 
            ref={containerRef}
            className="flex justify-center items-center mb-4 flex-wrap gap-1"
            dir="rtl"
            style={{ minHeight: '5rem' }}
          >
            {graphemes.map((grapheme, i) => {
              const isTarget = graphemeContainsLetter(grapheme, letter.letter);
              const isHovered = hoveredIndex === i;
              const isWrong = wrongIndex === i;
              const isFound = found && isTarget;
              
              return (
                <motion.button
                  key={i}
                  onMouseEnter={() => !found && setHoveredIndex(i)}
                  onMouseLeave={() => !found && !interacting && setHoveredIndex(null)}
                  onTouchStart={() => handleTouchStart(i)}
                  onTouchEnd={() => handleTouchEnd(grapheme, i)}
                  onClick={() => handleLetterTap(grapheme, i)}
                  animate={{
                    scale: isHovered ? 1.5 : isFound ? 1.3 : 1,
                    y: isHovered ? -8 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={`
                    relative inline-flex items-center justify-center
                    rounded-xl cursor-pointer select-none
                    transition-colors duration-200
                    ${isFound ? 'bg-green-100 ring-3 ring-green-400' : ''}
                    ${isHovered && !found ? 'bg-amber-50 ring-2 ring-amber-300 shadow-lg z-10' : ''}
                    ${isWrong ? 'bg-red-100 ring-2 ring-red-400' : ''}
                    ${!isHovered && !isFound && !isWrong ? 'hover:bg-gray-50' : ''}
                  `}
                  style={{ 
                    fontFamily: 'Amiri, serif', 
                    fontSize: isHovered ? '3rem' : '2.5rem',
                    padding: isHovered ? '0.3em 0.4em' : '0.1em 0.15em',
                    lineHeight: 1.4,
                    color: isFound ? '#059669' : isWrong ? '#DC2626' : '#1f2937',
                  }}
                >
                  {grapheme}
                  {isFound && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 text-sm"
                    >
                      ✅
                    </motion.span>
                  )}
                  {isWrong && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                      className="absolute -top-2 -right-2 text-sm"
                    >
                      ❌
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Found celebration */}
          <AnimatePresence>
            {found && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-3"
              >
                <p className="text-lg font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>
                  ✨ You found {letter.name}! Great job!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint prompt */}
          {!found && !interacting && (
            <motion.div
              className="text-center mb-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <p className="text-sm text-amber-500 font-medium">
                👆 Touch each letter to make it bigger, then tap {letter.name}!
              </p>
            </motion.div>
          )}

          {/* Word info */}
          <div className="text-center border-t border-amber-50 pt-3">
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
