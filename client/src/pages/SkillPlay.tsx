/**
 * SkillPlay — runner for the reading-progression "skill" lessons.
 *
 * Letter lessons teach one letter at a time (see LetterPlay). The reading
 * stages of Qaida — harakat, blending, building words, reading phrases —
 * build on ALL the letters the child already knows, so they get their own
 * lesson driven by a single reading game with the full learned-letter pool
 * as distractors. This keeps the per-letter flow focused on recognition
 * and stages real reading in the correct Qaida order.
 */

import { useMemo, useState, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { arabicLetters, lessons, getLettersForLesson } from '@/lib/curriculum';
import { READING_GAMES, playCelebrationSound, shuffleArray } from '@/lib/gameEngine';
import { useProgress } from '@/contexts/ProgressContext';
import InstructionBar from '@/components/InstructionBar';
import HarakatGame from './games/HarakatGame';
import CombineLettersGame from './games/CombineLettersGame';
import WordBuildingGame from './games/WordBuildingGame';
import SentenceReadingGame from './games/SentenceReadingGame';

const MASCOT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/mascot-moon-4TKGwbdD2xAUvRBjLqdhwG.webp';

export default function SkillPlay() {
  const params = useParams<{ lessonId: string }>();
  const [, navigate] = useLocation();
  const { addStars, completeLesson, completedLessons } = useProgress();

  const lessonId = parseInt(params.lessonId || '6');
  const lesson = lessons.find(l => l.id === lessonId);

  const [totalStars, setTotalStars] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  // The letter that anchors this skill (e.g. Ba for harakat teaching).
  const anchorLetter = useMemo(() => {
    const id = lesson?.letters?.[0] ?? 2;
    return arabicLetters.find(l => l.id === id) ?? arabicLetters[1];
  }, [lesson]);

  // Distractors = every other letter the child has learned (all 28 by the
  // time the reading lessons unlock), capped for a clean UI.
  const learnedLetters = useMemo(() => {
    const fromLessons = completedLessons
      .flatMap(id => getLettersForLesson(id))
      .filter(l => l.id !== anchorLetter.id);
    const pool = fromLessons.length > 0 ? fromLessons : arabicLetters.filter(l => l.id !== anchorLetter.id);
    return shuffleArray(pool);
  }, [completedLessons, anchorLetter]);

  const distractorLetters = useMemo(() => learnedLetters.slice(0, 6), [learnedLetters]);

  const game = lesson?.skillGame ? READING_GAMES[lesson.skillGame] : undefined;

  const handleComplete = useCallback((stars: number = 1) => {
    setTotalStars(prev => prev + stars);
    addStars(stars);
    completeLesson(lessonId);
    playCelebrationSound();
    setShowComplete(true);
  }, [addStars, completeLesson, lessonId]);

  if (!lesson || !lesson.skillGame || !game) {
    navigate('/levels');
    return null;
  }

  const gameProps = {
    letter: anchorLetter,
    allLetters: arabicLetters,
    lessonLetters: [anchorLetter, ...distractorLetters],
    distractorLetters,
    distractorCount: learnedLetters.length,
    onComplete: handleComplete,
    onSkip: () => handleComplete(0),
  };

  const renderGame = () => {
    switch (lesson.skillGame) {
      case 'harakat': return <HarakatGame {...gameProps} />;
      case 'combine-letters': return <CombineLettersGame {...gameProps} />;
      case 'word-building': return <WordBuildingGame {...gameProps} />;
      case 'sentence-reading': return <SentenceReadingGame {...gameProps} />;
      default: return null;
    }
  };

  // ---- Lesson complete ----
  if (showComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-100 via-amber-50 to-teal-50 p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center"
        >
          <motion.img
            src={MASCOT}
            alt="Hilal"
            className="w-32 h-32 mx-auto mb-6"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 1, repeat: 2 }}
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-teal-700 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
            Mashallah! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
            You finished {lesson.title}!
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl">🌙</span>
            <span className="text-2xl font-bold text-amber-600">{totalStars} moons earned!</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/levels')}
            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xl font-bold rounded-full shadow-lg"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Continue
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-amber-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-amber-100 z-20">
        <button
          onClick={() => navigate(`/lesson/${lessonId}`)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <span className="text-xl">✕</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{lesson.icon}</span>
          <span className="text-sm font-bold text-gray-600" style={{ fontFamily: 'var(--font-heading)' }}>{lesson.title}</span>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 rounded-full px-3 py-1">
          <span className="text-sm">🌙</span>
          <span className="font-bold text-amber-700 text-sm">{totalStars}</span>
        </div>
      </div>

      {/* Spoken instruction */}
      <InstructionBar text={game.description} />

      {/* Game area */}
      <div className="flex-1 relative" style={{ minHeight: '60vh' }}>
        {renderGame()}
      </div>
    </div>
  );
}
