/**
 * FindInWordGame - Spot the target letter in Quranic words
 * 
 * PEDAGOGY:
 * - Child sees a Quranic word rendered as CONNECTED Arabic text
 * - On hover/touch, the hovered letter grows bigger with a highlight
 * - Child must tap the specific letter they're looking for
 * - After finding the letter, a LETTER FORM GUIDE appears showing
 *   isolated/initial/medial/final forms of the letter
 * - A REPLAY WORD animation highlights each letter sequentially
 *   to teach right-to-left reading flow
 * 
 * TECHNICAL APPROACH:
 * - Inline <span> elements preserve Arabic ligatures
 * - normalizeArabicLetter handles Alif variants for matching
 * - Letter form guide uses data from letterForms.ts
 * - Replay animation uses sequential timeouts with highlights
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { getLetterForms, formLabels } from '@/lib/letterForms';
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
  return Array.from(text);
}

/**
 * Normalize Arabic letter for comparison.
 */
function normalizeArabicLetter(char: string): string {
  let stripped = char.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '');
  stripped = stripped.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627');
  stripped = stripped.replace(/\u0629/g, '\u062A');
  stripped = stripped.replace(/\u0649/g, '\u064A');
  return stripped;
}

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
  const [showFormGuide, setShowFormGuide] = useState(false);
  const [replayHighlight, setReplayHighlight] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const replayTimeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const quranicWords = letter.quranicWords || [];
  const currentWord = quranicWords[wordIndex];
  const letterForms = getLetterForms(letter.letter);

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
    setShowFormGuide(false);
    setReplayHighlight(null);
    setIsReplaying(false);
    // Clear any pending replay timeouts
    replayTimeoutRef.current.forEach(t => clearTimeout(t));
    replayTimeoutRef.current = [];
  }, [wordIndex]);

  // Cleanup replay timeouts on unmount
  useEffect(() => {
    return () => {
      replayTimeoutRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const handleLetterTap = useCallback((grapheme: string, index: number) => {
    if (found || isReplaying) return;
    
    const isCorrect = graphemeContainsLetter(grapheme, letter.letter);
    
    if (isCorrect) {
      setFound(true);
      setScore(prev => prev + 1);
      setHoveredIndex(index);
      playCorrectSound();
      
      // Show the letter form guide after a brief celebration
      setTimeout(() => {
        setShowFormGuide(true);
      }, 800);
    } else {
      setWrongIndex(index);
      setMistakes(prev => prev + 1);
      playWrongSound();
      setTimeout(() => setWrongIndex(null), 600);
    }
  }, [found, isReplaying, letter.letter]);

  // Advance to next word (called from form guide or after replay)
  const advanceToNext = useCallback(() => {
    setShowFormGuide(false);
    if (wordIndex < quranicWords.length - 1) {
      setWordIndex(prev => prev + 1);
    } else {
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      onComplete(stars);
    }
  }, [wordIndex, quranicWords.length, mistakes, onComplete]);

  // Replay word animation — highlights each letter from right to left
  const startReplay = useCallback(() => {
    if (!currentWord || isReplaying) return;
    
    const graphemes = splitIntoGraphemes(currentWord.word);
    setIsReplaying(true);
    setShowFormGuide(false);
    setHoveredIndex(null);
    
    // Clear previous timeouts
    replayTimeoutRef.current.forEach(t => clearTimeout(t));
    replayTimeoutRef.current = [];
    
    // Speak the word
    speakArabic(currentWord.word, 0.5);
    
    // Highlight each grapheme sequentially (RTL order = array order since text is RTL)
    graphemes.forEach((_, i) => {
      const timeout = setTimeout(() => {
        setReplayHighlight(i);
      }, i * 500 + 200);
      replayTimeoutRef.current.push(timeout);
    });
    
    // Clear highlight and finish
    const finishTimeout = setTimeout(() => {
      setReplayHighlight(null);
      setIsReplaying(false);
      // Show form guide again if letter was found
      if (found) {
        setShowFormGuide(true);
      }
    }, graphemes.length * 500 + 600);
    replayTimeoutRef.current.push(finishTimeout);
  }, [currentWord, isReplaying, found]);

  // Touch handling for mobile
  const handleTouchStart = useCallback((index: number) => {
    if (isReplaying) return;
    setInteracting(true);
    setHoveredIndex(index);
  }, [isReplaying]);

  const handleTouchEnd = useCallback((grapheme: string, index: number) => {
    if (isReplaying) return;
    handleLetterTap(grapheme, index);
    setTimeout(() => {
      if (!found) setHoveredIndex(null);
      setInteracting(false);
    }, 300);
  }, [handleLetterTap, found, isReplaying]);

  if (!currentWord) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">No Quranic words available</p>
      </div>
    );
  }

  const graphemes = splitIntoGraphemes(currentWord.word);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 gap-4">
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
          {isReplaying ? 'Watch each letter light up!' :
           interacting ? 'Now tap the letter!' : 
           'Touch each letter to see it bigger'}
        </p>
      </div>

      {/* Target letter reminder */}
      <motion.div
        animate={{ scale: found ? 1 : [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: found ? 0 : Infinity }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: letter.color + '20', border: `3px solid ${letter.color}` }}
      >
        <span className="text-2xl font-bold arabic-text" style={{ color: letter.color }}>
          {letter.letter}
        </span>
      </motion.div>

      {/* Quranic Word Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wordIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-amber-100 p-5 max-w-md w-full"
        >
          {/* The Arabic word — connected text with tappable graphemes */}
          <div 
            ref={containerRef}
            className="text-center mb-3"
            dir="rtl"
            style={{ 
              minHeight: '4.5rem',
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
              const isReplayActive = replayHighlight === i;
              
              return (
                <span
                  key={i}
                  onMouseEnter={() => !found && !isReplaying && setHoveredIndex(i)}
                  onMouseLeave={() => !found && !interacting && !isReplaying && setHoveredIndex(null)}
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
                    cursor: isReplaying ? 'default' : 'pointer',
                    userSelect: 'none',
                    transform: isReplayActive ? 'scale(1.35) translateY(-4px)' :
                               isHovered ? 'scale(1.4) translateY(-4px)' : 
                               isFound ? 'scale(1.3)' : 'scale(1)',
                    transformOrigin: 'center bottom',
                    transition: 'transform 0.25s ease, color 0.2s ease, background-color 0.25s ease, box-shadow 0.25s ease',
                    ...(isHovered || isFound || isWrong || isReplayActive ? {
                      display: 'inline-block',
                      borderRadius: '8px',
                      padding: '0 4px',
                      zIndex: 10,
                    } : {}),
                    color: isFound ? '#059669' : isReplayActive ? '#0D7377' : isWrong ? '#DC2626' : '#1f2937',
                    backgroundColor: isFound ? '#D1FAE5' : 
                                     isReplayActive ? '#E0F7FA' :
                                     isHovered ? '#FEF3C7' : 
                                     isWrong ? '#FEE2E2' : 'transparent',
                    boxShadow: isFound ? '0 0 0 3px #34D399' : 
                               isReplayActive ? '0 0 0 3px #0D9488, 0 4px 16px rgba(13,115,119,0.25)' :
                               isHovered ? '0 0 0 2px #FCD34D, 0 4px 12px rgba(0,0,0,0.1)' : 
                               isWrong ? '0 0 0 2px #F87171' : 'none',
                  }}
                >
                  {grapheme}
                  {isFound && !isReplaying && (
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '0.8rem' }}>
                      ✅
                    </span>
                  )}
                  {isWrong && (
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '0.8rem' }}>
                      ❌
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Letter Form Guide — shown after finding the letter */}
          <AnimatePresence>
            {showFormGuide && letterForms && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 mb-3 border border-teal-100">
                  <p className="text-sm font-semibold text-teal-700 text-center mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                    ✨ {letter.name} has different shapes!
                  </p>
                  <div className="flex justify-center gap-2">
                    {(['isolated', 'initial', 'medial', 'final'] as const).map((form) => (
                      <motion.div
                        key={form}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: form === 'isolated' ? 0.1 : form === 'initial' ? 0.25 : form === 'medial' ? 0.4 : 0.55, type: 'spring', stiffness: 300 }}
                        className="flex flex-col items-center"
                      >
                        <div 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-1 shadow-sm"
                          style={{ 
                            backgroundColor: 'white',
                            border: `2px solid ${letter.color}30`,
                          }}
                        >
                          <span 
                            className="arabic-text"
                            style={{ 
                              fontSize: '1.6rem',
                              color: letter.color,
                              fontFamily: '"Amiri", "Noto Naskh Arabic", serif',
                            }}
                          >
                            {letterForms[form]}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-teal-600">
                          {formLabels[form].en}
                        </span>
                        <span className="text-[10px] text-teal-500 arabic-text" style={{ fontFamily: '"Amiri", serif' }}>
                          {formLabels[form].ar}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action buttons after form guide */}
                <div className="flex gap-2 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startReplay}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 text-teal-700 rounded-full border border-teal-200 text-sm font-medium"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <span>▶️</span>
                    Replay Word
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={advanceToNext}
                    className="flex items-center gap-1.5 px-5 py-2 text-white rounded-full text-sm font-semibold shadow-md"
                    style={{ fontFamily: 'var(--font-body)', backgroundColor: letter.color }}
                  >
                    {wordIndex < quranicWords.length - 1 ? 'Next Word →' : 'Finish! 🎉'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Found celebration (brief, before form guide appears) */}
          <AnimatePresence>
            {found && !showFormGuide && !isReplaying && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mb-3"
              >
                <p className="text-lg font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>
                  ✨ You found {letter.name}!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replay animation indicator */}
          <AnimatePresence>
            {isReplaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mb-3"
              >
                <p className="text-sm font-semibold text-teal-600" style={{ fontFamily: 'var(--font-heading)' }}>
                  🔤 Follow each letter...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint prompt (before finding) */}
          {!found && !interacting && !isReplaying && (
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
