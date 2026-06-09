/**
 * ReviewPlay — the daily spaced-repetition Review.
 *
 * Pulls the letters that are "due" (per the mastery model), quizzes each
 * with a quick recognition game, and records the result so the schedule
 * updates. This is the loop that keeps old letters from fading and gives
 * the child a reason to open the app tomorrow. No new content — it reuses
 * the existing quiz games against whatever is shakiest.
 */

import { useMemo, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { arabicLetters } from '@/lib/curriculum';
import { playCelebrationSound, shuffleArray } from '@/lib/gameEngine';
import { useProgress } from '@/contexts/ProgressContext';
import InstructionBar from '@/components/InstructionBar';
import SoundMatchGame from './games/SoundMatchGame';
import DragToMatchGame from './games/DragToMatchGame';
import BubblePopGame from './games/BubblePopGame';

const MASCOT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/mascot-moon-4TKGwbdD2xAUvRBjLqdhwG.webp';

const SESSION_SIZE = 6;
// Quiz games suitable for review. 'sound-match' needs ≥1 distractor.
const SOLO_GAMES = ['drag-to-match', 'bubble-pop'] as const;
const ALL_GAMES = ['sound-match', 'drag-to-match', 'bubble-pop'] as const;

export default function ReviewPlay() {
  const [, navigate] = useLocation();
  const { getDueLetters, getLetterMastery, recordLetterResult, addStars, masteryStats } = useProgress();

  // Freeze the session's letter list on mount so it doesn't reshuffle as
  // mastery updates mid-session.
  const sessionLetterIds = useMemo(() => getDueLetters().slice(0, SESSION_SIZE), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Letters the child has already met — used as distractors.
  const introducedLetters = useMemo(
    () => arabicLetters.filter(l => getLetterMastery(l.id)),
    [getLetterMastery],
  );

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [done, setDone] = useState(false);

  const currentLetter = arabicLetters.find(l => l.id === sessionLetterIds[index]);

  const distractorLetters = useMemo(() => {
    if (!currentLetter) return [];
    return shuffleArray(introducedLetters.filter(l => l.id !== currentLetter.id)).slice(0, 6);
  }, [currentLetter, introducedLetters]);

  // Pick a quiz game for this letter; vary it but respect distractor needs.
  const gameType = useMemo(() => {
    const pool = distractorLetters.length >= 1 ? ALL_GAMES : SOLO_GAMES;
    return pool[index % pool.length];
  }, [index, distractorLetters.length]);

  const handleResult = useCallback((stars: number) => {
    if (!currentLetter) return;
    const correct = stars > 0;
    recordLetterResult(currentLetter.id, correct);
    if (correct) setCorrectCount(c => c + 1);
    setStarsEarned(s => s + stars);
    addStars(stars);

    if (index < sessionLetterIds.length - 1) {
      setIndex(i => i + 1);
    } else {
      playCelebrationSound();
      setDone(true);
    }
  }, [currentLetter, index, sessionLetterIds.length, recordLetterResult, addStars]);

  // ---- Nothing due ----
  if (sessionLetterIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 via-white to-amber-50 p-6 text-center">
        <motion.img src={MASCOT} alt="Hilal" className="w-28 h-28 mb-5" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} />
        <h1 className="text-3xl font-extrabold text-teal-700 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>All caught up! 🌟</h1>
        <p className="text-gray-500 mb-8 max-w-xs">Your letters are fresh and strong. Come back later for your next review.</p>
        <button
          onClick={() => navigate('/levels')}
          className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-lg font-bold rounded-full shadow-lg"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Back to Journey
        </button>
      </div>
    );
  }

  // ---- Session complete ----
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-100 via-amber-50 to-teal-50 p-6 text-center">
        <motion.img src={MASCOT} alt="Hilal" className="w-32 h-32 mb-5" animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 1, repeat: 2 }} />
        <h1 className="text-4xl font-extrabold text-teal-700 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Review done! 🎉</h1>
        <p className="text-xl text-gray-600 mb-1">You practised {sessionLetterIds.length} letters</p>
        <p className="text-gray-500 mb-2">{correctCount} strong · {sessionLetterIds.length - correctCount} to keep practising</p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🌙</span>
          <span className="text-2xl font-bold text-amber-600">+{starsEarned} moons</span>
        </div>
        <p className="text-sm text-gray-400 mb-8">{masteryStats.mastered} of {masteryStats.introduced} letters mastered</p>
        <button
          onClick={() => navigate('/levels')}
          className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xl font-bold rounded-full shadow-lg"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Continue
        </button>
      </div>
    );
  }

  if (!currentLetter) return null;

  const gameProps = {
    letter: currentLetter,
    allLetters: arabicLetters,
    lessonLetters: [currentLetter, ...distractorLetters],
    distractorLetters,
    distractorCount: introducedLetters.length - 1,
    onComplete: handleResult,
    onSkip: () => handleResult(0),
  };

  const renderGame = () => {
    switch (gameType) {
      case 'sound-match': return <SoundMatchGame {...gameProps} />;
      case 'drag-to-match': return <DragToMatchGame {...gameProps} />;
      case 'bubble-pop': return <BubblePopGame {...gameProps} />;
      default: return <DragToMatchGame {...gameProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-amber-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-amber-100 z-20">
        <button onClick={() => navigate('/levels')} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <span className="text-xl">✕</span>
        </button>
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {sessionLetterIds.map((id, i) => (
            <div
              key={id}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < index ? 'w-6 bg-teal-500' : i === index ? 'w-8 bg-amber-500' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 bg-teal-50 rounded-full px-3 py-1">
          <span className="text-sm">🔁</span>
          <span className="font-bold text-teal-700 text-sm">Review</span>
        </div>
      </div>

      {/* Spoken instruction */}
      <InstructionBar text="Let's keep your letters strong! Tap the right answer." />

      {/* Game area */}
      <div className="flex-1 relative" style={{ minHeight: '60vh' }}>
        {renderGame()}
      </div>
    </div>
  );
}
