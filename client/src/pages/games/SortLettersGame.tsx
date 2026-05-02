/**
 * SortLettersGame - Khan Academy Kids style sorting
 * 
 * Design: Celestial Garden theme
 * 
 * Two characters/buckets at the bottom of the screen. Letters appear one at a time
 * at the top. The child must drag each letter to the correct character.
 * 
 * For early letters (only 1 distractor): sort between current letter and 1 previous letter.
 * For later letters: sort between current letter and a random previous letter.
 * 
 * Progressive: Only uses previously learned letters.
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

interface SortItem {
  letter: string;
  name: string;
  belongsTo: 'left' | 'right';
}

export default function SortLettersGame({ letter, distractorLetters, onComplete }: Props) {
  // Pick one distractor letter for sorting
  const otherLetter = distractorLetters[0] || letter; // fallback shouldn't happen since this game requires distractors
  
  // Randomly assign left/right
  const [sides] = useState<{ left: ArabicLetter; right: ArabicLetter }>(() => {
    return Math.random() > 0.5 
      ? { left: letter, right: otherLetter }
      : { left: otherLetter, right: letter };
  });
  
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
      
      {/* Two buckets/characters */}
      <div className="flex items-end justify-between w-full max-w-sm gap-4 mt-4">
        {/* Left bucket */}
        <motion.div
          ref={leftRef}
          animate={{ scale: showCorrect && currentItem?.belongsTo === 'left' ? 1.05 : 1 }}
          className="flex-1 flex flex-col items-center"
        >
          <div className="w-full bg-gradient-to-b from-amber-100 to-amber-200 rounded-2xl p-4 border-3 border-amber-300 shadow-md min-h-[120px] flex flex-col items-center justify-center"
            style={{ borderWidth: '3px' }}
          >
            <span className="text-4xl arabic-text font-bold mb-1" style={{ color: sides.left.color }}>
              {sides.left.letter}
            </span>
            <span className="text-xs font-semibold text-gray-600">{sides.left.name}</span>
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
        
        {/* Right bucket */}
        <motion.div
          ref={rightRef}
          animate={{ scale: showCorrect && currentItem?.belongsTo === 'right' ? 1.05 : 1 }}
          className="flex-1 flex flex-col items-center"
        >
          <div className="w-full bg-gradient-to-b from-sky-100 to-sky-200 rounded-2xl p-4 border-3 border-sky-300 shadow-md min-h-[120px] flex flex-col items-center justify-center"
            style={{ borderWidth: '3px' }}
          >
            <span className="text-4xl arabic-text font-bold mb-1" style={{ color: sides.right.color }}>
              {sides.right.letter}
            </span>
            <span className="text-xs font-semibold text-gray-600">{sides.right.name}</span>
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
  
  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, borderColor: color }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.15, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 50 }}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ 
        scale: showWrong ? [1, 0.8, 1.1, 1] : showCorrect ? [1, 1.2, 0] : 1,
        rotate: showWrong ? [0, -5, 5, -5, 0] : 0,
      }}
      className="w-20 h-20 rounded-2xl bg-white border-4 shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      <span className="text-4xl arabic-text font-bold" style={{ color }}>
        {item.letter}
      </span>
    </motion.div>
  );
}
