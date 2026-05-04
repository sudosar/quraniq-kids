/**
 * FindInWordGame - Spot the target letter in Quranic words
 * 
 * PEDAGOGY:
 * - Child sees a Quranic word rendered as CONNECTED Arabic text (not broken apart)
 * - On hover/touch, the hovered letter grows bigger with a highlight
 * - Child must tap the specific letter they're looking for
 * - This teaches letter recognition within real Quranic context
 * 
 * TECHNICAL APPROACH:
 * - We render the FULL word as connected text using a single Arabic text block
 * - Each grapheme cluster is wrapped in an inline <span> so it stays connected
 *   (Arabic shaping is preserved because the spans are inline within the same text node context)
 * - On hover/tap, the specific span gets scaled up and highlighted
 * - We normalize Alif variants (ٱ, أ, إ, آ → ا) for matching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { speakArabic, speakArabicIfAllowed, playCorrectSound, playWrongSound } from '@/lib/gameEngine';

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

/**
 * Normalize Arabic letter for comparison.
 * Maps all Alif variants to bare Alif, strips diacritics, etc.
 */
function normalizeArabicLetter(char: string): string {
  // Strip diacritics (tashkeel)
  let stripped = char.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '');
  
  // Normalize Alif variants to bare Alif (ا)
  // ٱ (U+0671 Alif Wasla) → ا
  // أ (U+0623 Alif with Hamza Above) → ا
  // إ (U+0625 Alif with Hamza Below) → ا
  // آ (U+0622 Alif with Madda) → ا
  // ٲ (U+0672) → ا
  // ٳ (U+0673) → ا
  stripped = stripped.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627');
  
  // Normalize other common variants
  // ة (Ta Marbuta) → ت (for matching purposes)
  // ى (Alif Maksura) → ي
  stripped = stripped.replace(/\u0629/g, '\u062A');
  stripped = stripped.replace(/\u0649/g, '\u064A');
  
  return stripped;
}

// Check if a grapheme contains the target letter (with normalization)
function graphemeContainsLetter(grapheme: string, targetLetter: string): boolean {
  const normalizedGrapheme = normalizeArabicLetter(grapheme);
  const normalizedTarget = normalizeArabicLetter(targetLetter);
  return normalizedGrapheme.includes(normalizedTarget);
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
        speakArabicIfAllowed(currentWord.word, 0.6);
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
          Find the letter <span className="text-3xl font-bold arabic-text" style={{ color: letter.color }}>{letter.letter}</span> in this word!
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
        <span className="text-3xl font-bold arabic-text" style={{ color: letter.color }}>
          {letter.letter}
        </span>
      </motion.div>

      {/* Quranic Word Card — letters are individually tappable but STAY CONNECTED */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wordIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-amber-100 p-6 max-w-md w-full"
        >
          {/* 
            The Arabic word — rendered as CONNECTED text.
            Each grapheme is in an inline <span> so Arabic shaping is preserved.
            The key insight: using display:inline (not flex/grid) keeps Arabic ligatures connected.
          */}
          <div 
            ref={containerRef}
            className="text-center mb-4"
            dir="rtl"
            style={{ 
              minHeight: '5rem',
              fontFamily: '"Amiri", "Noto Naskh Arabic", serif',
              fontSize: '3.5rem',
              lineHeight: 1.8,
            }}
          >
            {graphemes.map((grapheme, i) => {
              const isTarget = graphemeContainsLetter(grapheme, letter.letter);
              const isHovered = hoveredIndex === i;
              const isWrong = wrongIndex === i;
              const isFound = found && isTarget;
              
              return (
                <span
                  key={i}
                  onMouseEnter={() => !found && setHoveredIndex(i)}
                  onMouseLeave={() => !found && !interacting && setHoveredIndex(null)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleTouchStart(i);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleTouchEnd(grapheme, i);
                  }}
                  onClick={() => handleLetterTap(grapheme, i)}
                  style={{
                    display: 'inline',
                    position: 'relative',
                    cursor: 'pointer',
                    userSelect: 'none',
                    // Scale up on hover using CSS transform with transform-origin center
                    transform: isHovered ? 'scale(1.4) translateY(-4px)' : isFound ? 'scale(1.3)' : 'scale(1)',
                    transformOrigin: 'center bottom',
                    transition: 'transform 0.2s ease, color 0.2s ease, background-color 0.2s ease',
                    // Inline-block needed for transform to work, but we use a trick:
                    // We set display to inline-block ONLY when hovered to allow transform,
                    // and back to inline when not hovered to keep Arabic connected
                    ...(isHovered || isFound || isWrong ? {
                      display: 'inline-block',
                      borderRadius: '8px',
                      padding: '0 4px',
                      zIndex: 10,
                    } : {}),
                    // Colors
                    color: isFound ? '#059669' : isWrong ? '#DC2626' : '#1f2937',
                    backgroundColor: isFound ? '#D1FAE5' : isHovered ? '#FEF3C7' : isWrong ? '#FEE2E2' : 'transparent',
                    // Ring effect via box-shadow
                    boxShadow: isFound ? '0 0 0 3px #34D399' : isHovered ? '0 0 0 2px #FCD34D, 0 4px 12px rgba(0,0,0,0.1)' : isWrong ? '0 0 0 2px #F87171' : 'none',
                  }}
                >
                  {grapheme}
                  {isFound && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      ✅
                    </span>
                  )}
                  {isWrong && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      ❌
                    </span>
                  )}
                </span>
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
