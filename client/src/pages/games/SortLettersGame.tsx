/**
 * SortLettersGame - Khan Academy Kids style sorting
 *
 * Design: Celestial Garden theme
 *
 * Toddler-friendly letter sorting:
 * - Shows picture cards (Arabic word + emoji) in each basket, not just the letter
 * - The target letter in each word is highlighted
 * - Tapping the card pronounces the letter's sound
 * - Draggable item is the LETTER (not the card) so it's easy for small fingers
 *
 * Progressive: Only uses previously learned letters.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, animate, useMotionValue } from 'framer-motion';
import { ArabicLetter, getBeginningWords } from '@/lib/curriculum';
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

interface SortItem {
  letter: string;
  name: string;
  belongsTo: 'left' | 'right';
}

interface BasketCard {
  letter: ArabicLetter;
  word: string;
  emoji: string;
  meaning: string;
}

function normalizeArabicLetter(char: string): string {
  let stripped = char.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0610-\u061A]/g, '');
  stripped = stripped.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627');
  stripped = stripped.replace(/\u0629/g, '\u062A');
  stripped = stripped.replace(/\u0649/g, '\u064A');
  return stripped;
}

function splitIntoGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).map(s => s.segment);
  }
  return Array.from(text);
}

/**
 * Render a word with the target letter highlighted in the word
 */
function HighlightedWord({ word, targetLetter, letterColor }: { word: string; targetLetter: string; letterColor: string }) {
  const graphemes = useMemo(() => splitIntoGraphemes(word), [word]);
  const normalizedTarget = useMemo(() => normalizeArabicLetter(targetLetter), [targetLetter]);

  return (
    <span className="arabic-text text-xl font-bold" dir="rtl" style={{ fontFamily: '"Amiri", serif' }}>
      {graphemes.map((g, i) => {
        const normalizedG = normalizeArabicLetter(g);
        const isTarget = normalizedG.includes(normalizedTarget);
        return (
          <span
            key={i}
            style={{
              color: isTarget ? letterColor : '#1f2937',
              fontWeight: isTarget ? 800 : 400,
              textDecoration: isTarget ? 'underline' : 'none',
              textDecorationColor: isTarget ? letterColor + '80' : 'transparent',
              textUnderlineOffset: '2px',
            }}
          >
            {g}
          </span>
        );
      })}
    </span>
  );
}

export default function SortLettersGame({ letter, distractorLetters, onComplete }: Props) {
  // Pick one distractor letter for sorting
  const otherLetter = distractorLetters[0] || letter;

  // Randomly assign left/right
  const [sides] = useState<{ left: ArabicLetter; right: ArabicLetter }>(() => {
    return Math.random() > 0.5
      ? { left: letter, right: otherLetter }
      : { left: otherLetter, right: letter };
  });

  // Get word cards for picture display in baskets
  const leftWords = useMemo(() => getBeginningWords(sides.left).slice(0, 1), [sides]);
  const rightWords = useMemo(() => getBeginningWords(sides.right).slice(0, 1), [sides]);

  // Build items to sort (mix of both letters)
  const [items] = useState<SortItem[]>(() => {
    const allItems: SortItem[] = [];
    // 3 of the current letter
    for (let i = 0; i < 3; i++) {
      allItems.push({ letter: letter.letter, name: letter.name, belongsTo: sides.left.id === letter.id ? 'left' : 'right' });
    }
    // 3 of the distractor
    for (let i = 0; i < 3; i++) {
      allItems.push({ letter: otherLetter.letter, name: otherLetter.name, belongsTo: sides.left.id === otherLetter.id ? 'left' : 'right' });
    }
    return shuffleArray(allItems);
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [leftCount, setLeftCount] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [showWrong, setShowWrong] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [completed, setCompleted] = useState(false);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentIdx];
  const totalItems = items.length;

  const handleDragEnd = useCallback((_: any, info: any) => {
    if (completed || !currentItem) return;

    const dropX = info.point.x;
    const dropY = info.point.y;

    const leftRect = leftRef.current?.getBoundingClientRect();
    const rightRect = rightRef.current?.getBoundingClientRect();

    let droppedSide: 'left' | 'right' | null = null;

    if (leftRect && dropX >= leftRect.left - 20 && dropX <= leftRect.right + 20 && dropY >= leftRect.top - 40 && dropY <= leftRect.bottom + 20) {
      droppedSide = 'left';
    } else if (rightRect && dropX >= rightRect.left - 20 && dropX <= rightRect.right + 20 && dropY >= rightRect.top - 40 && dropY <= rightRect.bottom + 20) {
      droppedSide = 'right';
    }

    if (droppedSide) {
      if (droppedSide === currentItem.belongsTo) {
        // Correct!
        setShowCorrect(true);
        playCorrectSound();
        if (droppedSide === 'left') setLeftCount(prev => prev + 1);
        else setRightCount(prev => prev + 1);

        setTimeout(() => {
          setShowCorrect(false);
          if (currentIdx < totalItems - 1) {
            setCurrentIdx(prev => prev + 1);
          } else {
            setCompleted(true);
            onComplete(2);
          }
        }, 800);
      } else {
        // Wrong bucket
        setShowWrong(true);
        playWrongSound();
        setTimeout(() => setShowWrong(false), 800);
      }
    }
  }, [completed, currentItem, currentIdx, totalItems, onComplete]);

  if (completed) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-bold text-teal-700 mt-4" style={{ fontFamily: 'var(--font-heading)' }}>
            All sorted!
          </h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-between py-4 px-4">
      {/* Instruction */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-gray-700" style={{ fontFamily: 'var(--font-heading)' }}>
          Sort the letters!
        </h2>
        <p className="text-sm text-gray-500">
          Drag each letter to the right basket
        </p>
        {/* Progress */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {items.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < currentIdx ? 'bg-teal-500' : i === currentIdx ? 'bg-amber-500 scale-125' : 'bg-gray-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Current letter to sort */}
      {currentItem && (
        <DraggableSortItem
          key={currentIdx}
          item={currentItem}
          color={currentItem.letter === letter.letter ? letter.color : otherLetter.color}
          showWrong={showWrong}
          showCorrect={showCorrect}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Two baskets with picture cards */}
      <div className="flex items-end justify-between w-full max-w-sm gap-4 mt-4">
        {/* Left basket */}
        <motion.div
          ref={leftRef}
          animate={{ scale: showCorrect && currentItem?.belongsTo === 'left' ? 1.05 : 1 }}
          className="flex-1 flex flex-col items-center"
        >
          <div
            className="w-full bg-gradient-to-b from-amber-100 to-amber-200 rounded-2xl p-3 border-3 border-amber-300 shadow-md min-h-[140px] flex flex-col items-center justify-center"
            style={{ borderWidth: '3px' }}
          >
            {/* Picture card showing word with highlighted letter */}
            {leftWords[0] && (
              <div className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => speakArabic(sides.left.letter)}
              >
                <span className="text-3xl">{leftWords[0].emoji}</span>
                <HighlightedWord
                  word={leftWords[0].word}
                  targetLetter={sides.left.letter}
                  letterColor={sides.left.color}
                />
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                  🔊 tap to hear
                </span>
              </div>
            )}
            {/* Dots for sorted items */}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: leftCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full bg-teal-400"
                />
              ))}
            </div>
          </div>
          <span className="text-2xl mt-2">🧺</span>
        </motion.div>

        {/* Right basket */}
        <motion.div
          ref={rightRef}
          animate={{ scale: showCorrect && currentItem?.belongsTo === 'right' ? 1.05 : 1 }}
          className="flex-1 flex flex-col items-center"
        >
          <div
            className="w-full bg-gradient-to-b from-sky-100 to-sky-200 rounded-2xl p-3 border-3 border-sky-300 shadow-md min-h-[140px] flex flex-col items-center justify-center"
            style={{ borderWidth: '3px' }}
          >
            {/* Picture card showing word with highlighted letter */}
            {rightWords[0] && (
              <div className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => speakArabic(sides.right.letter)}
              >
                <span className="text-3xl">{rightWords[0].emoji}</span>
                <HighlightedWord
                  word={rightWords[0].word}
                  targetLetter={sides.right.letter}
                  letterColor={sides.right.color}
                />
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                  🔊 tap to hear
                </span>
              </div>
            )}
            {/* Dots for sorted items */}
            <div className="flex gap-1 mt-2">
              {Array.from({ length: rightCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full bg-teal-400"
                />
              ))}
            </div>
          </div>
          <span className="text-2xl mt-2">🧺</span>
        </motion.div>
      </div>
    </div>
  );
}

// Draggable letter item
function DraggableSortItem({ item, color, showWrong, showCorrect, onDragEnd }: {
  item: SortItem;
  color: string;
  showWrong: boolean;
  showCorrect: boolean;
  onDragEnd: (e: any, info: any) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleDragEnd = (e: any, info: any) => {
    onDragEnd(e, info);
    animate(x, 0, { type: 'spring', stiffness: 300 });
    animate(y, 0, { type: 'spring', stiffness: 300 });
  };

  const handleTap = () => {
    speakArabic(item.letter);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, borderColor: color, touchAction: 'none' }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.15, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50, cursor: 'grabbing' }}
      whileTap={{ scale: 0.95 }}
      onClick={handleTap}
      className="w-24 h-24 rounded-2xl bg-white border-4 shadow-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
    >
      <span className="text-4xl arabic-text font-bold" style={{ color }}>
        {item.letter}
      </span>
      <span className="text-[10px] text-gray-400 mt-0.5">tap to hear</span>
    </motion.div>
  );
}