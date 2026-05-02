/**
 * LessonPage - Shows the letters in a lesson and lets kids pick which to play
 * 
 * Design: Celestial Garden theme
 * Each letter is a big interactive card that starts the mini-game sequence.
 * Completed letters show a checkmark. Current letter pulses.
 */

import { useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Play, Lock } from 'lucide-react';
import { lessons, getLettersForLesson } from '@/lib/curriculum';
import { useProgress } from '@/contexts/ProgressContext';

const MASCOT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/mascot-moon-4TKGwbdD2xAUvRBjLqdhwG.webp';

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isActivityComplete, completedLessons } = useProgress();
  
  const lessonId = parseInt(params.id || '1');
  const lesson = lessons.find(l => l.id === lessonId);
  const lessonLetters = useMemo(() => getLettersForLesson(lessonId), [lessonId]);

  if (!lesson) {
    navigate('/levels');
    return null;
  }

  // For non-letter lessons, show a coming soon message
  if (lesson.type !== 'letters') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-teal-50 flex flex-col">
        <header className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate('/levels')} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>{lesson.title}</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <span className="text-6xl mb-4">{lesson.icon}</span>
          <h2 className="text-2xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{lesson.title}</h2>
          <p className="text-gray-500 text-center mb-8">{lesson.description}</p>
          <p className="text-sm text-gray-400 text-center">Coming soon! This lesson is under development.</p>
        </div>
      </div>
    );
  }

  // Count completed letters
  const completedCount = lessonLetters.filter(l => isActivityComplete(lessonId, `letter-${l.id}`)).length;
  const isLessonDone = completedLessons.includes(lessonId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-white/80 backdrop-blur-sm border-b border-amber-100">
        <button onClick={() => navigate('/levels')} className="w-10 h-10 rounded-full bg-gray-50 shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>{lesson.title}</h1>
          <p className="text-xs text-gray-400">{completedCount}/{lessonLetters.length} letters completed</p>
        </div>
        <div className="text-2xl">{lesson.icon}</div>
      </header>

      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / lessonLetters.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Mascot encouragement */}
      <div className="flex items-center gap-3 px-6 py-3">
        <img src={MASCOT} alt="Hilal" className="w-12 h-12" />
        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-sm border border-amber-100">
          <p className="text-sm text-gray-600">
            {isLessonDone ? 'Great job! You completed all letters! 🎉' :
             completedCount === 0 ? 'Tap a letter to start playing! Each one has fun games. 🎮' :
             `Keep going! ${lessonLetters.length - completedCount} letters left! 💪`}
          </p>
        </div>
      </div>

      {/* Letter grid */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {lessonLetters.map((letterObj, index) => {
            const isComplete = isActivityComplete(lessonId, `letter-${letterObj.id}`);
            // A letter is unlocked if it's the first or the previous one is complete
            const isUnlocked = index === 0 || isActivityComplete(lessonId, `letter-${lessonLetters[index - 1].id}`);
            const isCurrent = isUnlocked && !isComplete;

            return (
              <motion.button
                key={letterObj.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => {
                  if (isUnlocked) navigate(`/play/${lessonId}/${index}`);
                }}
                disabled={!isUnlocked}
                className={`relative p-6 rounded-3xl shadow-md transition-all ${
                  isComplete ? 'bg-green-50 border-2 border-green-300' :
                  isCurrent ? 'bg-white border-2 border-amber-400 shadow-lg' :
                  isUnlocked ? 'bg-white border-2 border-gray-100' :
                  'bg-gray-50 border-2 border-gray-100 opacity-50'
                }`}
                whileHover={isUnlocked ? { scale: 1.03 } : {}}
                whileTap={isUnlocked ? { scale: 0.97 } : {}}
              >
                {/* Status icon */}
                {isComplete && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-100" />
                  </div>
                )}
                {isCurrent && (
                  <motion.div
                    className="absolute top-2 right-2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Play className="w-5 h-5 text-amber-500 fill-amber-200" />
                  </motion.div>
                )}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-gray-300" />
                  </div>
                )}

                {/* Letter */}
                <span 
                  className="text-5xl block mb-2 arabic-text"
                  style={{ color: isUnlocked ? letterObj.color : '#ccc' }}
                >
                  {letterObj.letter}
                </span>
                
                {/* Name */}
                <span className={`text-sm font-semibold block ${isUnlocked ? 'text-gray-600' : 'text-gray-300'}`}>
                  {letterObj.name}
                </span>

                {/* Game count badge */}
                {isCurrent && (
                  <div className="mt-2 text-xs text-amber-600 font-semibold bg-amber-50 rounded-full px-2 py-0.5">
                    6 games
                  </div>
                )}

                {/* Pulse ring for current */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl border-2 border-amber-400"
                    animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Lesson complete banner */}
        {isLessonDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center"
          >
            <span className="text-4xl block mb-2">🏆</span>
            <h3 className="text-xl font-bold text-green-700" style={{ fontFamily: 'var(--font-heading)' }}>
              Lesson Complete!
            </h3>
            <p className="text-green-600 text-sm mt-1">You mastered all {lessonLetters.length} letters!</p>
            <button
              onClick={() => navigate('/levels')}
              className="mt-4 px-6 py-2 bg-green-500 text-white font-bold rounded-full text-sm hover:bg-green-600 transition-colors"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Continue Journey →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
