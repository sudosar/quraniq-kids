/**
 * Level Map Page - QuranIQ Kids
 * Design: Celestial Garden theme
 * Shows progressive levels as a winding garden path
 * Each level is a "garden" with lessons as flowers
 */

import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useProgress } from '@/contexts/ProgressContext';
import { levels, lessons, isLessonUnlocked } from '@/lib/curriculum';
import { Star, Lock, ChevronLeft, CheckCircle2, BookOpen, Map, Search } from 'lucide-react';

const PATTERN_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/pattern-tile-Wv3JDcUDf6Y9TQjZuHwneK.webp';
const MASCOT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/mascot-moon-4TKGwbdD2xAUvRBjLqdhwG.webp';

export default function LevelMap() {
  const [, navigate] = useLocation();
  const { completedLessons, stars } = useProgress();

  const totalLessons = lessons.length;
  const completedCount = completedLessons.length;
  const progressPercent = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="min-h-screen relative pb-24" style={{ background: '#FFF8E7' }}>
      {/* Pattern background */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: `url(${PATTERN_BG})`, backgroundSize: '300px' }}
      />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-teal-700 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            <span style={{ fontFamily: 'var(--font-heading)' }}>Home</span>
          </button>
          
          <h1 className="text-xl font-bold text-teal-800" style={{ fontFamily: 'var(--font-heading)' }}>
            My Journey
          </h1>

          <div className="flex items-center gap-1 bg-amber-50 rounded-full px-3 py-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-amber-700 text-sm">{stars}</span>
          </div>
        </div>
      </div>

      {/* Mascot helper + progress */}
      <motion.div 
        className="flex justify-center pt-4 pb-2 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-md max-w-sm w-full">
          <img src={MASCOT} alt="Hilal" className="w-12 h-12" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 font-medium" style={{ fontFamily: 'var(--font-body)' }}>
              {completedCount === 0 
                ? "Let's start learning! Tap a lesson." 
                : completedCount < totalLessons 
                  ? `Great progress! ${completedCount}/${totalLessons} lessons done.`
                  : "Amazing! You completed everything!"
              }
            </p>
            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Levels */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pb-8 pt-4">
        {levels.map((level, levelIdx) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: levelIdx * 0.1 }}
            className="mb-8"
          >
            {/* Level header */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                style={{ backgroundColor: level.color, fontFamily: 'var(--font-heading)' }}
              >
                {level.id}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
                  {level.title}
                </h2>
                <p className="text-xs text-gray-500">{level.description}</p>
              </div>
            </div>

            {/* Lessons grid */}
            <div className="grid grid-cols-2 gap-3">
              {level.lessons.map((lessonId) => {
                const lesson = lessons.find(l => l.id === lessonId)!;
                const unlocked = isLessonUnlocked(lessonId, completedLessons);
                const completed = completedLessons.includes(lessonId);

                return (
                  <motion.button
                    key={lessonId}
                    onClick={() => unlocked && navigate(`/lesson/${lessonId}`)}
                    disabled={!unlocked}
                    className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                      completed 
                        ? 'bg-green-50 border-green-300 shadow-md' 
                        : unlocked 
                          ? 'bg-white border-amber-200 shadow-md hover:shadow-lg hover:border-amber-400 active:scale-95' 
                          : 'bg-gray-100 border-gray-200 opacity-60'
                    }`}
                    whileTap={unlocked ? { scale: 0.95 } : {}}
                  >
                    {/* Icon */}
                    <span className="text-2xl">{lesson.icon}</span>
                    
                    {/* Title */}
                    <h3 className="text-sm font-bold mt-2 text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>

                    {/* Status badge */}
                    {completed && (
                      <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-green-500" />
                    )}
                    {!unlocked && (
                      <Lock className="absolute top-3 right-3 w-4 h-4 text-gray-400" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-100 px-4 py-2 safe-area-pb">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button 
            className="flex flex-col items-center gap-0.5 py-1 px-4 text-teal-600"
            onClick={() => navigate('/levels')}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Journey</span>
          </button>
          <button 
            className="flex flex-col items-center gap-0.5 py-1 px-4 text-gray-400"
            onClick={() => navigate('/explore')}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Explore</span>
          </button>
          <button 
            className="flex flex-col items-center gap-0.5 py-1 px-4 text-gray-400"
            onClick={() => navigate('/explore')}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Letters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
