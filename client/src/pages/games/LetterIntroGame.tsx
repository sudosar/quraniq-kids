/**
 * Letter Intro Game
 * 
 * An animated, interactive introduction to a new letter.
 * - Letter appears with a dramatic reveal animation
 * - Auto-plays the letter sound (only if user has previously interacted)
 * - Shows the letter name and pronunciation
 * - Tap the letter to hear it again (with ripple effect)
 * - Tap "Next" to continue after interacting
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { speakArabic, speakArabicIfAllowed, playCorrectSound } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

export default function LetterIntroGame({ letter, onComplete }: Props) {
  const [phase, setPhase] = useState<'reveal' | 'interact' | 'done'>('reveal');
  const [tapCount, setTapCount] = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [autoPlayFailed, setAutoPlayFailed] = useState(false);

  // Auto-play sound after reveal — only works if user has previously interacted
  useEffect(() => {
    const timer = setTimeout(() => {
      const played = speakArabicIfAllowed(letter.letter);
      if (!played) {
        // User hasn't interacted yet — show a prompt to tap
        setAutoPlayFailed(true);
      }
      setPhase('interact');
    }, 1200);
    return () => clearTimeout(timer);
  }, [letter]);

  const handleLetterTap = useCallback(() => {
    // This is a user gesture — speech will work
    speakArabic(letter.letter);
    setTapCount(prev => prev + 1);
    setShowRipple(true);
    setAutoPlayFailed(false);
    
    // Create particles
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      color: ['#F5A623', '#E8567F', '#0D7377', '#9B59B6', '#2ECC71', '#3498DB'][i % 6],
    }));
    setParticles(prev => [...prev, ...newParticles]);
    
    setTimeout(() => setShowRipple(false), 600);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.includes(p))), 1000);
  }, [letter]);

  const handleContinue = () => {
    playCorrectSound();
    onComplete(1);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-30"
            style={{
              backgroundColor: letter.color,
              left: `${10 + (i * 7.5)}%`,
              top: `${20 + Math.sin(i) * 30}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      {/* Main letter display */}
      <div className="relative flex flex-col items-center">
        {/* Particles on tap */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-4 h-4 rounded-full"
            style={{ backgroundColor: p.color }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: [0, 1.5, 0], x: p.x, y: p.y, opacity: [1, 1, 0] }}
            transition={{ duration: 0.8 }}
          />
        ))}

        {/* Ripple effect */}
        {showRipple && (
          <motion.div
            className="absolute w-48 h-48 rounded-full border-4"
            style={{ borderColor: letter.color }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}

        {/* The letter itself */}
        <motion.button
          onClick={handleLetterTap}
          className="relative z-10"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.3 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center shadow-2xl"
            style={{ 
              background: `radial-gradient(circle, ${letter.color}15, ${letter.color}30)`,
              border: `4px solid ${letter.color}40`,
            }}
            animate={phase === 'interact' ? { 
              boxShadow: [
                `0 0 0 0 ${letter.color}40`,
                `0 0 0 20px ${letter.color}00`,
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span 
              className="text-[8rem] md:text-[10rem] leading-none arabic-text"
              style={{ color: letter.color }}
            >
              {letter.letter}
            </span>
          </motion.div>
        </motion.button>

        {/* Tap hint — shown when auto-play failed or user hasn't tapped yet */}
        {phase === 'interact' && tapCount === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`mt-4 text-sm ${autoPlayFailed ? 'text-orange-500 font-semibold animate-bounce' : 'text-gray-400 animate-pulse'}`}
          >
            👆 {autoPlayFailed ? 'Tap the letter to hear it!' : 'Tap the letter to hear it!'}
          </motion.p>
        )}
      </div>

      {/* Letter info */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
          {letter.name}
        </h2>
        <p className="text-lg text-gray-500 mt-1 arabic-text font-bold">
          {letter.nameAr}
        </p>
        <p className="text-base text-gray-400 mt-2">
          Sounds like: <span className="font-semibold text-gray-600">{letter.sound}</span>
        </p>
      </motion.div>

      {/* Sound button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={handleLetterTap}
        className="mt-6 flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-2xl">🔊</span>
        <span className="font-semibold text-gray-700">Listen Again</span>
      </motion.button>

      {/* Continue button - appears after interaction */}
      {(tapCount >= 1 || phase === 'interact') && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: tapCount >= 1 ? 0 : 2 }}
          onClick={handleContinue}
          className="mt-8 px-10 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xl font-bold rounded-full shadow-lg hover:shadow-xl transition-shadow"
          style={{ fontFamily: 'var(--font-heading)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Next Game →
        </motion.button>
      )}
    </div>
  );
}
