/**
 * Home Page - QuranIQ Kids
 * Design: Celestial Garden theme
 * Full-screen hero with mascot, app title, and start button
 * Warm teal + golden amber palette, large touch targets for toddlers
 */

import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useProgress } from '@/contexts/ProgressContext';


const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/hero-bg-5JM2iqrNbMBGRJFUy5rBv3.webp';
const MASCOT = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663317811558/JhGQquPdHPqw2LEAWe34js/mascot-moon-4TKGwbdD2xAUvRBjLqdhwG.webp';

export default function Home() {
  const [, navigate] = useLocation();
  const { stars, streakDays } = useProgress();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      {/* Stars counter - top right */}
      {stars > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
        >
          <span className="text-lg">🌙</span>
          <span className="font-bold text-lg text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>{stars}</span>
        </motion.div>
      )}

      {/* Streak badge - top left */}
      {streakDays > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
        >
          <span className="text-lg">🔥</span>
          <span className="font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>{streakDays} days</span>
        </motion.div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        {/* Mascot */}
        <motion.img
          src={MASCOT}
          alt="Hilal the Moon"
          className="w-36 h-36 md:w-48 md:h-48 drop-shadow-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 
            className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            QuranIQ Kids
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mt-2 font-semibold drop-shadow-md" style={{ fontFamily: 'var(--font-body)' }}>
            Learn to Read the Quran
          </p>
        </motion.div>

        {/* Start Button */}
        <motion.button
          onClick={() => navigate('/levels')}
          className="mt-8 px-12 py-5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-2xl md:text-3xl font-bold rounded-full shadow-[0_8px_30px_rgba(245,166,35,0.5)] hover:shadow-[0_12px_40px_rgba(245,166,35,0.7)] active:scale-95 transition-all"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Let's Learn!
        </motion.button>

        {/* Subtitle hint */}
        <motion.p
          className="text-white/70 text-sm mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Tap to start your Quran reading journey
        </motion.p>
      </div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 left-10 w-4 h-4 bg-yellow-300 rounded-full opacity-60"
        animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-40 right-16 w-3 h-3 bg-yellow-200 rounded-full opacity-50"
        animate={{ y: [0, -8, 0], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-32 left-20 w-2 h-2 bg-white rounded-full opacity-40"
        animate={{ y: [0, -6, 0], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}
