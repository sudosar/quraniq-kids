/**
 * LetterSlotGame - Khan Academy Kids style fill-in-the-blank
 * 
 * Design: Celestial Garden theme
 * 
 * Shows a word with a missing letter (blank slot). Below are letter cards.
 * The child must DRAG the correct letter into the blank to complete the word.
 * 
 * CRITICAL FIX: Arabic words are rendered as connected segments:
 * - Part before the missing letter (connected)
 * - The blank slot
 * - Part after the missing letter (connected)
 * This preserves Arabic script joining while showing the gap.
 * 
 * Progressive: Only uses the current letter + previously learned letters as choices.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, animate, useMotionValue } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { playCorrectSound, playWrongSound, speakArabic, shuffleArray } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

interface SlotRound {
  word: string;
  meaning: string;
  emoji: string;
  missingIndex: number;
  beforeSlot: string;  // Arabic text before the missing letter
  afterSlot: string;   // Arabic text after the missing letter
  choices: { letter: string; isCorrect: boolean }[];
}

/**
 * Split Arabic word into grapheme clusters using Intl.Segmenter
 */
function splitGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), s => s.segment);
  }
  // Fallback
  const regex = /[\s\S][\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0300-\u036F]*/g;
  return text.match(regex) || text.split('');
}

export default function LetterSlotGame({ letter, distractorLetters, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  
  const totalRounds = Math.min(3, letter.wordCards.length);
  
  // Build rounds from word cards — split into before/after segments
  const [rounds] = useState<SlotRound[]>(() => {
    return letter.wordCards.slice(0, totalRounds).map(card => {
      const chars = splitGraphemes(card.word);
      const targetIdx = card.letterHighlightIndex[0] || 0;
      
      // Build connected text segments
      const beforeSlot = chars.slice(0, targetIdx).join('');
      const afterSlot = chars.slice(targetIdx + 1).join('');
      
      // Build choices: correct letter + distractors
      const distractorChars = distractorLetters
        .slice(0, Math.min(2, distractorLetters.length))
        .map(d => d.letter);
      
      const choices = shuffleArray([
        { letter: letter.letter, isCorrect: true },
        ...distractorChars.map(l => ({ letter: l, isCorrect: false })),
      ]);
      
      // If no distractors, add a placeholder wrong choice
      if (choices.length < 2) {
        choices.push({ letter: '○', isCorrect: false });
      }
      
      return {
        word: card.word,
        meaning: card.meaning,
        emoji: card.emoji,
        missingIndex: targetIdx,
        beforeSlot,
        afterSlot,
        choices,
      };
    });
  });
  
  const currentRound = rounds[round];
  
  const handleChoiceDragEnd = useCallback((choiceIdx: number, info: any) => {
    if (completed) return;
    
    const choice = currentRound.choices[choiceIdx];
    const slotRect = slotRef.current?.getBoundingClientRect();
    
    if (!slotRect) return;
    
    const dropX = info.point.x;
    const dropY = info.point.y;
    
    // Check if dropped on the slot (generous hit area)
    const hitSlot = dropX >= slotRect.left - 30 && dropX <= slotRect.right + 30 &&
                    dropY >= slotRect.top - 30 && dropY <= slotRect.bottom + 30;
    
    if (hitSlot) {
      if (choice.isCorrect) {
        setCompleted(true);
        setShowSuccess(true);
        playCorrectSound();
        speakArabic(currentRound.word);
        
        setTimeout(() => {
          if (round < totalRounds - 1) {
            setRound(prev => prev + 1);
            setCompleted(false);
            setShowSuccess(false);
            setWrongChoice(null);
          } else {
            onComplete(2);
          }
        }, 2000);
      } else {
        setWrongChoice(choiceIdx);
        playWrongSound();
        setTimeout(() => setWrongChoice(null), 800);
      }
    }
  }, [completed, currentRound, round, totalRounds, onComplete]);

  // Also support TAP on choice as alternative for toddlers
  const handleChoiceTap = useCallback((choiceIdx: number) => {
    if (completed) return;
    
    const choice = currentRound.choices[choiceIdx];
    if (choice.isCorrect) {
      setCompleted(true);
      setShowSuccess(true);
      playCorrectSound();
      speakArabic(currentRound.word);
      
      setTimeout(() => {
        if (round < totalRounds - 1) {
          setRound(prev => prev + 1);
          setCompleted(false);
          setShowSuccess(false);
          setWrongChoice(null);
        } else {
          onComplete(2);
        }
      }, 2000);
    } else {
      setWrongChoice(choiceIdx);
      playWrongSound();
      setTimeout(() => setWrongChoice(null), 800);
    }
  }, [completed, currentRound, round, totalRounds, onComplete]);

  if (!currentRound) return null;

  return (
    <div className="h-full flex flex-col items-center justify-between py-6 px-4">
      {/* Instruction */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-700" style={{ fontFamily: 'var(--font-heading)' }}>
          Complete the word!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Drag the missing letter into the word
        </p>
        {/* Round indicator */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all ${
              i < round ? 'bg-teal-500' : i === round ? 'bg-amber-500 scale-125' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>
      
      {/* Picture hint */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-4"
      >
        <span className="text-6xl">{currentRound.emoji}</span>
        <p className="text-lg font-semibold text-gray-600 mt-2">{currentRound.meaning}</p>
      </motion.div>
      
      {/* Word with blank slot — rendered as connected segments */}
      <div className="flex items-center justify-center gap-1 mb-8 bg-white rounded-2xl p-6 shadow-md border border-amber-100" dir="rtl">
        {/* Before the slot (connected Arabic text) */}
        {currentRound.beforeSlot && (
          <span className="text-3xl arabic-text font-bold text-gray-700">
            {currentRound.beforeSlot}
          </span>
        )}
        
        {/* The slot itself */}
        <div
          ref={slotRef}
          className={`w-14 h-14 rounded-xl border-3 border-dashed flex items-center justify-center transition-all mx-1 ${
            showSuccess ? 'border-green-400 bg-green-50' : 'border-amber-400 bg-amber-50'
          }`}
          style={{ borderWidth: '3px' }}
        >
          {showSuccess ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-3xl arabic-text font-bold"
              style={{ color: letter.color }}
            >
              {letter.letter}
            </motion.span>
          ) : (
            <span className="text-2xl text-amber-300">?</span>
          )}
        </div>
        
        {/* After the slot (connected Arabic text) */}
        {currentRound.afterSlot && (
          <span className="text-3xl arabic-text font-bold text-gray-700">
            {currentRound.afterSlot}
          </span>
        )}
      </div>
      
      {/* Draggable letter choices */}
      <div className="flex items-center justify-center gap-4">
        {currentRound.choices.map((choice, idx) => (
          <DraggableChoice
            key={`${round}-${idx}`}
            choice={choice}
            idx={idx}
            color={choice.isCorrect ? letter.color : '#6B7280'}
            isWrong={wrongChoice === idx}
            isDisabled={completed}
            onDragEnd={(info) => handleChoiceDragEnd(idx, info)}
            onTap={() => handleChoiceTap(idx)}
          />
        ))}
      </div>
      
      {/* Hint text */}
      {!completed && (
        <p className="text-center text-gray-400 text-xs mt-4">
          Drag or tap <span className="arabic-text font-bold" style={{ color: letter.color }}>{letter.letter}</span> ({letter.name}) to fill the blank
        </p>
      )}
    </div>
  );
}

// Separate draggable component to manage individual drag state
function DraggableChoice({ choice, idx, color, isWrong, isDisabled, onDragEnd, onTap }: {
  choice: { letter: string; isCorrect: boolean };
  idx: number;
  color: string;
  isWrong: boolean;
  isDisabled: boolean;
  onDragEnd: (info: any) => void;
  onTap: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleDragEnd = (_: any, info: any) => {
    onDragEnd(info);
    animate(x, 0, { type: 'spring', stiffness: 300 });
    animate(y, 0, { type: 'spring', stiffness: 300 });
  };
  
  return (
    <motion.div
      drag={!isDisabled}
      dragMomentum={false}
      style={{ x, y, touchAction: 'none' }}
      onDragEnd={handleDragEnd}
      onClick={onTap}
      whileDrag={{ scale: 1.2, zIndex: 50, boxShadow: '0 15px 40px rgba(0,0,0,0.2)' }}
      whileTap={{ scale: 0.9 }}
      animate={{
        scale: isWrong ? [1, 0.8, 1.1, 1] : 1,
        borderColor: isWrong ? '#EF4444' : color,
      }}
      className={`w-16 h-16 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg bg-white border-2 ${
        isDisabled ? 'opacity-50' : ''
      }`}
    >
      <span className="text-3xl arabic-text font-bold" style={{ color }}>
        {choice.letter}
      </span>
    </motion.div>
  );
}
