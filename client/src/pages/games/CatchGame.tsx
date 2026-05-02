/**
 * Catch Game (Toddler-Friendly) - Progressive Version
 * 
 * Design: Celestial Garden theme
 * 
 * Letters fall from the top slowly. Child taps the correct ones.
 * NO time limit — letters keep falling until child catches enough.
 * 
 * PROGRESSIVE: Only uses previously learned letters as distractors.
 * If no distractors available (first letter), ALL falling letters are the target
 * (pure reinforcement — just tap them all!).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { playPopSound, playWrongSound, playCorrectSound } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

interface FallingLetter {
  id: number;
  letter: ArabicLetter;
  x: number;
  duration: number;
  isTarget: boolean;
  caught: boolean;
  wrong: boolean;
}

const TARGET_CATCH = 5;

export default function CatchGame({ letter, distractorLetters, distractorCount, onComplete }: Props) {
  const [fallingLetters, setFallingLetters] = useState<FallingLetter[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);
  const [completed, setCompleted] = useState(false);
  const spawnInterval = useRef<NodeJS.Timeout>(null);
  const cleanupInterval = useRef<NodeJS.Timeout>(null);

  const spawnLetter = useCallback(() => {
    let isTarget: boolean;
    let letterToSpawn: ArabicLetter;

    if (distractorCount === 0) {
      // First letter ever — ALL falling letters are the target (pure reinforcement)
      isTarget = true;
      letterToSpawn = letter;
    } else {
      // 55% chance of target, rest are ONLY previously learned letters
      isTarget = Math.random() < 0.55;
      if (isTarget) {
        letterToSpawn = letter;
      } else {
        const available = distractorLetters.slice(0, Math.min(distractorCount, 4));
        letterToSpawn = available[Math.floor(Math.random() * available.length)];
      }
    }
    
    const newLetter: FallingLetter = {
      id: Date.now() + Math.random() * 10000,
      letter: letterToSpawn,
      x: 5 + Math.random() * 70,
      duration: 7000 + Math.random() * 3000,
      isTarget,
      caught: false,
      wrong: false,
    };

    setFallingLetters(prev => [...prev.slice(-8), newLetter]);
  }, [letter, distractorLetters, distractorCount]);

  const startGame = () => {
    setShowInstruction(false);
    setGameStarted(true);
    spawnLetter();
    spawnInterval.current = setInterval(spawnLetter, 2500);
    cleanupInterval.current = setInterval(() => {
      setFallingLetters(prev => prev.filter(f => !f.caught && !f.wrong));
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (spawnInterval.current) clearInterval(spawnInterval.current);
      if (cleanupInterval.current) clearInterval(cleanupInterval.current);
    };
  }, []);

  useEffect(() => {
    if (score >= TARGET_CATCH && !completed) {
      setCompleted(true);
      if (spawnInterval.current) clearInterval(spawnInterval.current);
      if (cleanupInterval.current) clearInterval(cleanupInterval.current);
      playCorrectSound();
      setTimeout(() => onComplete(2), 1800);
    }
  }, [score, completed, onComplete]);

  const handleCatch = (fl: FallingLetter) => {
    if (fl.caught || fl.wrong) return;
    
    if (fl.isTarget) {
      playPopSound();
      setScore(prev => prev + 1);
      setFallingLetters(prev => prev.map(f => 
        f.id === fl.id ? { ...f, caught: true } : f
      ));
    } else {
      playWrongSound();
      setFallingLetters(prev => prev.map(f => 
        f.id === fl.id ? { ...f, wrong: true } : f
      ));
    }
  };

  // Instruction text adapts to whether there are distractors
  const instructionText = distractorCount === 0
    ? `Tap every ${letter.name} as it falls!`
    : `Tap ${letter.name} (${letter.letter}) as it falls!`;

  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50">
      {/* Instruction overlay */}
      <AnimatePresence>
        {showInstruction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl"
            >
              <span className="text-5xl mb-4 block">🧺</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Catch the Letters!
              </h3>
              <p className="text-gray-600 mb-2">
                {instructionText}
              </p>
              <div className="mb-4">
                <span className="text-5xl arabic-text font-bold" style={{ color: letter.color }}>{letter.letter}</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">Take your time — more will keep coming!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-full shadow-lg"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Start! 🎮
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score bar */}
      {gameStarted && (
        <div className="absolute top-4 left-0 right-0 z-20 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-md flex items-center gap-3">
            <span className="text-lg">🧺</span>
            <div className="flex gap-1">
              {Array.from({ length: TARGET_CATCH }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    i < score 
                      ? 'border-teal-400 bg-teal-400' 
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {i < score && <span className="text-white text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Target reminder */}
      {gameStarted && (
        <div className="absolute top-4 right-4 z-20 w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center" style={{ borderColor: letter.color, borderWidth: '3px' }}>
          <span className="text-3xl arabic-text font-bold" style={{ color: letter.color }}>{letter.letter}</span>
        </div>
      )}

      {/* Falling letters */}
      <AnimatePresence>
        {fallingLetters.filter(f => !f.caught && !f.wrong).map(fl => (
          <motion.button
            key={fl.id}
            className="absolute rounded-3xl flex items-center justify-center shadow-xl z-10 active:scale-90 transition-transform"
            style={{
              left: `${fl.x}%`,
              width: '5rem',
              height: '5rem',
              backgroundColor: fl.isTarget ? `${letter.color}25` : '#f9fafb',
              border: `3px solid ${fl.isTarget ? letter.color : '#d1d5db'}`,
            }}
            initial={{ top: '-100px', rotate: -5 }}
            animate={{ 
              top: 'calc(100% + 100px)',
              rotate: [0, 3, -3, 2, -2, 0],
            }}
            transition={{ 
              top: { duration: fl.duration / 1000, ease: 'linear' },
              rotate: { duration: 3, repeat: Infinity },
            }}
            exit={{ 
              scale: [1, 1.4, 0], 
              opacity: [1, 1, 0],
              transition: { duration: 0.4 }
            }}
            onClick={() => handleCatch(fl)}
            whileTap={{ scale: 0.75 }}
          >
            <span className="text-4xl arabic-text font-bold" style={{ color: fl.isTarget ? letter.color : '#6b7280' }}>
              {fl.letter.letter}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Caught animation */}
      <AnimatePresence>
        {fallingLetters.filter(f => f.caught).map(fl => (
          <motion.div
            key={`caught-${fl.id}`}
            className="absolute z-20 flex items-center justify-center"
            style={{ left: `${fl.x}%`, top: '50%' }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-4xl">⭐</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Wrong tap animation */}
      <AnimatePresence>
        {fallingLetters.filter(f => f.wrong).map(fl => (
          <motion.div
            key={`wrong-${fl.id}`}
            className="absolute z-20 flex items-center justify-center"
            style={{ left: `${fl.x}%`, top: '50%' }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 0.5, opacity: 0, rotate: 45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-3xl">💨</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Encouragement */}
      {gameStarted && !completed && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
            <p className="text-sm text-gray-500">
              {score === 0 && "Tap the right letters! 👆"}
              {score === 1 && "Great start! Keep going! 🌟"}
              {score === 2 && "You're doing amazing! 🎉"}
              {score === 3 && "Almost there! 💪"}
              {score === 4 && "One more! You got this! 🙌"}
            </p>
          </div>
        </div>
      )}

      {/* Win celebration */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.span 
                className="text-7xl block mb-4"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                🎉
              </motion.span>
              <h3 className="text-3xl font-bold text-teal-600" style={{ fontFamily: 'var(--font-heading)' }}>
                You caught them all!
              </h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
