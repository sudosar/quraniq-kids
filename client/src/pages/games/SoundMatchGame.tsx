/**
 * Sound Match Game - Progressive Version
 * 
 * Design: Celestial Garden theme
 * 
 * Hear a letter sound, pick the correct letter from choices.
 * ONLY shows the current letter + previously learned letters as options.
 * 
 * This game REQUIRES at least 1 distractor (minDistractors: 1 in gameEngine).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { speakArabic, speakArabicIfAllowed, playCorrectSound, playWrongSound, shuffleArray } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

interface Round {
  target: ArabicLetter;
  options: ArabicLetter[];
}

export default function SoundMatchGame({ letter, distractorLetters, onComplete }: Props) {
  const [currentRound, setCurrentRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const TOTAL_ROUNDS = 3;

  // Build rounds using ONLY previously learned letters as distractors
  const rounds = useMemo(() => {
    const result: Round[] = [];
    const available = distractorLetters.slice(0, Math.min(distractorLetters.length, 3));
    
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      let target: ArabicLetter;
      let distractors: ArabicLetter[];
      
      if (i < 2) {
        target = letter;
        distractors = shuffleArray(available).slice(0, Math.min(3, available.length));
      } else {
        // Round 3: review a previously learned letter
        if (available.length > 0 && Math.random() > 0.5) {
          target = available[Math.floor(Math.random() * available.length)];
          distractors = shuffleArray([letter, ...available.filter(d => d.id !== target.id)]).slice(0, 3);
        } else {
          target = letter;
          distractors = shuffleArray(available).slice(0, Math.min(3, available.length));
        }
      }
      
      result.push({ target, options: shuffleArray([target, ...distractors]) });
    }
    
    return result;
  }, [letter, distractorLetters]);

  const round = rounds[currentRound];

  const playSound = useCallback(() => {
    if (!round) return;
    setIsSpeaking(true);
    speakArabic(round.target.letter, 0.7);
    setTimeout(() => setIsSpeaking(false), 1000);
  }, [round]);

  useEffect(() => {
    if (round && !showResult) {
      const timer = setTimeout(() => {
        if (round) speakArabicIfAllowed(round.target.letter, 0.7);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentRound, round, showResult]);

  const handleSelect = useCallback((optionIndex: number) => {
    if (selected !== null || !round) return;
    
    const option = round.options[optionIndex];
    const correct = option.id === round.target.id;
    
    setSelected(optionIndex);
    setIsCorrect(correct);
    
    if (correct) {
      playCorrectSound();
      setScore(prev => prev + 1);
    } else {
      playWrongSound();
    }

    setTimeout(() => {
      if (currentRound < TOTAL_ROUNDS - 1) {
        setCurrentRound(prev => prev + 1);
        setSelected(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
        const finalScore = correct ? score + 1 : score;
        if (finalScore >= 2) {
          setTimeout(() => onComplete(finalScore >= 3 ? 2 : 1), 1500);
        } else {
          setTimeout(() => {
            setCurrentRound(0);
            setSelected(null);
            setIsCorrect(null);
            setScore(0);
            setShowResult(false);
          }, 2000);
        }
      }
    }, 1200);
  }, [selected, round, currentRound, score, onComplete]);

  if (!round) return null;

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-6">
      {/* Round indicator */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentRound ? 'bg-teal-500' :
              i === currentRound ? 'w-4 h-4 bg-amber-500' :
              'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <h3 className="text-xl font-bold text-gray-700 mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
        Which letter makes this sound?
      </h3>
      
      {/* Speaker button */}
      <motion.button
        onClick={playSound}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-xl flex items-center justify-center mx-auto mb-2"
        whileTap={{ scale: 0.9 }}
        animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
        transition={isSpeaking ? { duration: 0.3, repeat: 3 } : {}}
      >
        <span className="text-4xl">🔊</span>
      </motion.button>
      <p className="text-sm text-gray-400 mb-6">Tap to hear again</p>

      {/* Options grid - ONLY current + previously learned letters */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {round.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrectOption = option.id === round.target.id;
          const showFeedback = selected !== null;
          
          let bgClass = 'bg-white border-2 border-gray-100 hover:border-amber-300';
          if (showFeedback && isCorrectOption) bgClass = 'bg-green-50 border-2 border-green-400';
          else if (showFeedback && isSelected && !isCorrect) bgClass = 'bg-red-50 border-2 border-red-300';

          return (
            <motion.button
              key={`${currentRound}-${option.id}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: isSelected && !isCorrect ? [0, -8, 8, -8, 8, 0] : 0,
              }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(i)}
              className={`p-6 rounded-2xl shadow-md transition-all relative ${bgClass}`}
              whileTap={selected === null ? { scale: 0.95 } : {}}
              disabled={selected !== null}
            >
              <span className="text-4xl arabic-text block" style={{ color: option.color }}>
                {option.letter}
              </span>
              <span className="text-sm text-gray-500 mt-1 block">{option.name}</span>
              
              {showFeedback && isSelected && (
                <span className="text-lg mt-1 block">
                  {isCorrect ? '✅' : '❌'}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Score */}
      <p className="text-sm text-gray-400 mt-4">
        Score: {score}/{TOTAL_ROUNDS}
      </p>

      {/* Result overlay */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <span className="text-5xl block mb-3">{score >= 2 ? '🎉' : '💪'}</span>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: score >= 2 ? '#0D7377' : '#666' }}>
                {score >= 2 ? 'Great ears!' : "Let's try again!"}
              </p>
              <p className="text-gray-500 mt-1">{score}/{TOTAL_ROUNDS} correct</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
