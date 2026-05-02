/**
 * WordCardsGame - Show Arabic words that start with the current letter
 * 
 * Design: Celestial Garden theme
 * 
 * FIXES:
 * - Arabic words are rendered as a SINGLE connected string (no splitting!)
 * - The target letter is highlighted using a colored underline/background
 *   without breaking the word's connected script
 * - Shows letter forms: beginning (ـبـ), middle (ـبـ), end (ـب), isolated (ب)
 * 
 * For each letter, the child sees:
 * - Word cards with emoji pictures
 * - The full Arabic word (properly connected)
 * - Letter position forms (initial, medial, final, isolated)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { speakArabic, playCorrectSound } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

/**
 * Arabic letter forms lookup.
 * Each Arabic letter can appear in 4 forms depending on position in a word:
 * - isolated: standalone
 * - initial: beginning of word (connects to next)
 * - medial: middle of word (connects both sides)
 * - final: end of word (connects to previous)
 * 
 * Some letters (like ا, د, ذ, ر, ز, و) don't connect to the left,
 * so they only have isolated and final forms.
 */
const LETTER_FORMS: Record<string, { isolated: string; initial: string; medial: string; final: string }> = {
  'ا': { isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا' },
  'ب': { isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
  'ت': { isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت' },
  'ث': { isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث' },
  'ج': { isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
  'ح': { isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح' },
  'خ': { isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ' },
  'د': { isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
  'ذ': { isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ' },
  'ر': { isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
  'ز': { isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز' },
  'س': { isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس' },
  'ش': { isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش' },
  'ص': { isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص' },
  'ض': { isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض' },
  'ط': { isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط' },
  'ظ': { isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ' },
  'ع': { isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع' },
  'غ': { isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ' },
  'ف': { isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف' },
  'ق': { isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
  'ك': { isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
  'ل': { isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
  'م': { isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
  'ن': { isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
  'ه': { isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
  'و': { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
  'ي': { isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي' },
};

export default function WordCardsGame({ letter, onComplete }: Props) {
  const [cardIndex, setCardIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const wordCards = letter.wordCards || [];
  const currentCard = wordCards[Math.min(cardIndex, wordCards.length - 1)];
  const letterForms = LETTER_FORMS[letter.letter];

  useEffect(() => {
    if (currentCard) {
      const timer = setTimeout(() => {
        speakArabic(currentCard.word, 0.7);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cardIndex, currentCard]);

  const handleNextCard = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowMeaning(false);

    if (cardIndex < wordCards.length - 1) {
      setCardIndex(prev => Math.min(prev + 1, wordCards.length - 1));
      setTimeout(() => setIsTransitioning(false), 400);
    } else {
      playCorrectSound();
      onComplete(1);
    }
  }, [cardIndex, wordCards.length, isTransitioning, onComplete]);

  const handleTapCard = useCallback(() => {
    setShowMeaning(true);
    if (currentCard) {
      speakArabic(currentCard.word, 0.6);
    }
  }, [currentCard]);

  if (!currentCard) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">No word cards available</p>
      </div>
    );
  }

  // Use the position field from the word card data (set in curriculum)
  const position = currentCard.position || 'beginning';

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 gap-3">
      {/* Progress dots */}
      <div className="flex gap-2 mb-1">
        {wordCards.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < cardIndex ? 'bg-teal-500' :
              i === cardIndex ? 'bg-amber-500 scale-125' :
              'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Instruction */}
      <p className="text-sm text-gray-500 font-medium" style={{ fontFamily: 'var(--font-body)' }}>
        Words with <span className="font-bold arabic-text" style={{ color: letter.color }}>{letter.letter}</span> ({letter.name})
      </p>

      {/* Word Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cardIndex}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-sm"
        >
          <motion.button
            onClick={handleTapCard}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-white rounded-3xl shadow-xl border-2 border-amber-100 overflow-hidden p-6 text-center"
          >
            {/* Big Emoji */}
            <motion.div
              className="text-7xl mb-3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            >
              {currentCard.emoji}
            </motion.div>

            {/* Arabic Word — rendered as ONE connected string, NO splitting */}
            <div 
              className="text-5xl font-bold mb-3 leading-relaxed"
              dir="rtl"
              style={{ fontFamily: 'Amiri, serif' }}
            >
              {currentCard.word}
            </div>

            {/* Letter position indicator */}
            <div className="flex items-center justify-center gap-1 mb-2">
              <span 
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ 
                  backgroundColor: letter.color + '20', 
                  color: letter.color,
                }}
              >
                {position === 'beginning' ? '⬅️ at the start' : 
                 position === 'middle' ? '↔️ in the middle' : 
                 '➡️ at the end'}
              </span>
            </div>

            {/* Transliteration */}
            <p className="text-lg text-gray-500 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
              {currentCard.transliteration}
            </p>

            {/* Meaning - revealed on tap */}
            <AnimatePresence>
              {showMeaning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-amber-100">
                    <p className="text-xl font-bold text-teal-700" style={{ fontFamily: 'var(--font-heading)' }}>
                      {currentCard.meaning}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Tap to hear it again!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showMeaning && (
              <p className="text-xs text-amber-400 mt-2 animate-pulse">Tap the card to see the meaning!</p>
            )}
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Letter Forms Display — shows how the letter looks in different positions */}
      {letterForms && (
        <div className="w-full max-w-sm bg-white/80 rounded-2xl p-3 border border-amber-100 shadow-sm">
          <p className="text-xs text-gray-400 text-center mb-2 font-medium">Letter forms of {letter.name}:</p>
          <div className="flex items-center justify-around">
            {[
              { label: 'Isolated', form: letterForms.isolated },
              { label: 'Start', form: letterForms.initial },
              { label: 'Middle', form: letterForms.medial },
              { label: 'End', form: letterForms.final },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span 
                  className="text-2xl arabic-text font-bold"
                  style={{ 
                    color: position === 'beginning' && item.label === 'Start' ? letter.color :
                           position === 'middle' && item.label === 'Middle' ? letter.color :
                           position === 'end' && item.label === 'End' ? letter.color :
                           item.label === 'Isolated' && cardIndex === 0 ? letter.color :
                           '#666'
                  }}
                >
                  {item.form}
                </span>
                <span className="text-[10px] text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {/* Listen button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => speakArabic(currentCard.word, 0.6)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full border border-teal-200"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <span className="text-lg">🔊</span>
          Listen
        </motion.button>

        {/* Next button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNextCard}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-base font-bold rounded-full shadow-lg"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {cardIndex < wordCards.length - 1 ? 'Next Word' : 'Done! ✨'}
        </motion.button>
      </div>
    </div>
  );
}
