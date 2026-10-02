/**
 * Letter Garden (Letter Explorer) - QuranIQ Kids
 * Design: Celestial Garden theme
 * All 28 letters as garden plots that grow with mastery
 * (soil → seed → sprout → leaves → flower → full bloom).
 * Tap any letter to see details, hear sound, and trace.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { arabicLetters } from '@/lib/curriculum';
import { ChevronLeft, X, Volume2 } from 'lucide-react';
import TracingCanvas from '@/components/TracingCanvas';
import { useProgress } from '@/contexts/ProgressContext';
import { isMastered } from '@/lib/mastery';
import { getPlantStage } from '@/lib/garden';

export default function LetterExplorer() {
  const [, navigate] = useLocation();
  const { getLetterMastery, masteryStats } = useProgress();
  const [selectedLetter, setSelectedLetter] = useState<typeof arabicLetters[0] | null>(null);

  const speakLetter = (letter: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.lang = 'ar';
      utterance.rate = 0.5;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#FFF8E7' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-amber-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => navigate('/levels')}
            className="flex items-center gap-1 text-teal-700 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" />
            <span style={{ fontFamily: 'var(--font-heading)' }}>Back</span>
          </button>
          
          <h1 className="text-xl font-bold text-teal-800" style={{ fontFamily: 'var(--font-heading)' }}>
            My Letter Garden
          </h1>

          <div className="w-12" /> {/* Spacer */}
        </div>
      </div>

      {/* Garden summary */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          {masteryStats.introduced === 0 ? (
            <span>Learn a letter to plant your first seed 🌰</span>
          ) : (
            <>
              <span className="font-bold text-pink-600">🌷 {masteryStats.mastered}</span>
              <span>blooming</span>
              <span className="text-gray-300">·</span>
              <span className="font-bold text-green-700">🌱 {masteryStats.introduced - masteryStats.mastered}</span>
              <span>growing</span>
              <span className="text-gray-300">·</span>
              <span>{arabicLetters.length - masteryStats.introduced} to plant</span>
            </>
          )}
        </div>
        {masteryStats.due > 0 && (
          <p className="text-center text-xs text-amber-600 mt-1">
            {masteryStats.due} plant{masteryStats.due === 1 ? ' needs' : 's need'} watering — try today's Review 💧
          </p>
        )}
      </div>

      {/* Letter grid */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-3">
          {arabicLetters.map((letter, idx) => {
            const mastery = getLetterMastery(letter.id);
            const mastered = mastery ? isMastered(mastery) : false;
            const plant = getPlantStage(mastery?.strength);
            return (
              <motion.button
                key={letter.id}
                onClick={() => {
                  setSelectedLetter(letter);
                  speakLetter(letter.letter);
                }}
                className={`relative aspect-square rounded-2xl bg-white border-2 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-all ${
                  mastered ? 'border-green-300' : mastery ? 'border-amber-200' : 'border-gray-100'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* The letter's plant, growing with mastery */}
                {plant.emoji && <motion.span
                  className="absolute top-1 right-1 text-base leading-none"
                  aria-label={plant.label}
                  animate={mastered ? { rotate: [0, -8, 8, 0] } : {}}
                  transition={{ duration: 2.5, repeat: mastered ? Infinity : 0 }}
                >
                  {plant.emoji}
                </motion.span>}
                <span
                  className="arabic-text text-3xl"
                  style={{ color: mastery ? letter.color : '#cbd5e1' }}
                >
                  {letter.letter}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 font-medium">
                  {letter.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Letter detail modal */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedLetter(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <div className="flex items-center gap-6 mb-6">
                {/* Large letter */}
                <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-amber-100 flex items-center justify-center">
                  <span className="arabic-text text-5xl" style={{ color: selectedLetter.color }}>
                    {selectedLetter.letter}
                  </span>
                </div>

                {/* Info */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
                    {selectedLetter.name}
                  </h2>
                  <p className="text-sm text-gray-500 arabic-text">{selectedLetter.nameAr}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedLetter.sound}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getPlantStage(getLetterMastery(selectedLetter.id)?.strength).emoji}{' '}
                    {getPlantStage(getLetterMastery(selectedLetter.id)?.strength).label}
                  </p>

                  {/* Sound button */}
                  <button
                    onClick={() => speakLetter(selectedLetter.letter)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: selectedLetter.color }}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Listen
                  </button>
                </div>
              </div>

              {/* Tracing area */}
              <div className="max-w-[250px] mx-auto">
                <p className="text-sm font-bold text-gray-700 mb-2 text-center" style={{ fontFamily: 'var(--font-heading)' }}>
                  Trace the letter:
                </p>
                <TracingCanvas 
                  letter={selectedLetter.letter} 
                  color={selectedLetter.color}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
