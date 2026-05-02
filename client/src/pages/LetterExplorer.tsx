/**
 * Letter Explorer Page - QuranIQ Kids
 * Design: Celestial Garden theme
 * Full alphabet explorer with all 28 letters in a grid
 * Tap any letter to see details, hear sound, and trace
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { arabicLetters } from '@/lib/curriculum';
import { ChevronLeft, X, Volume2 } from 'lucide-react';
import TracingCanvas from '@/components/TracingCanvas';

export default function LetterExplorer() {
  const [, navigate] = useLocation();
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
            All Letters
          </h1>

          <div className="w-12" /> {/* Spacer */}
        </div>
      </div>

      {/* Letter grid */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-3">
          {arabicLetters.map((letter, idx) => (
            <motion.button
              key={letter.id}
              onClick={() => {
                setSelectedLetter(letter);
                speakLetter(letter.letter);
              }}
              className="aspect-square rounded-2xl bg-white border-2 border-amber-100 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-all"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="arabic-text text-3xl" style={{ color: letter.color }}>
                {letter.letter}
              </span>
              <span className="text-[10px] text-gray-500 mt-1 font-medium">
                {letter.name}
              </span>
            </motion.button>
          ))}
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
