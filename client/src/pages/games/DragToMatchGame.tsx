/**
 * DragToMatchGame - Khan Academy Kids style drag-and-drop
 * 
 * Design: Celestial Garden theme
 * 
 * The child sees the current letter and must match it to the correct picture.
 * ALWAYS shows multiple pictures (even for the first letter) — uses other word cards
 * from the same letter or from other letters as distractors.
 * 
 * Uses Framer Motion drag for reliable touch/mouse support.
 * Also supports tap-to-select for toddlers who can't drag well.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ArabicLetter, arabicLetters } from '@/lib/curriculum';
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

interface PictureTarget {
  word: string;
  meaning: string;
  emoji: string;
  letterId: number;
  isCorrect: boolean;
}

export default function DragToMatchGame({ letter, allLetters, distractorLetters, distractorCount, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [matched, setMatched] = useState(false);
  const [wrongTarget, setWrongTarget] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [score, setScore] = useState(0);
  
  const targetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const totalRounds = Math.min(3, letter.wordCards.length);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  
  // Build picture targets for all rounds — ALWAYS show 3 pictures
  const targets = useMemo(() => {
    const rounds: PictureTarget[][] = [];
    
    for (let r = 0; r < totalRounds; r++) {
      const correctCard = letter.wordCards[r % letter.wordCards.length];
      const correct: PictureTarget = {
        word: correctCard.word,
        meaning: correctCard.meaning,
        emoji: correctCard.emoji,
        letterId: letter.id,
        isCorrect: true,
      };
      
      const distractors: PictureTarget[] = [];
      
      if (distractorCount > 0 && distractorLetters.length > 0) {
        // Use pictures from previously learned letters
        const shuffledDistractors = shuffleArray(distractorLetters);
        for (let i = 0; i < Math.min(2, shuffledDistractors.length); i++) {
          const dLetter = shuffledDistractors[i];
          if (dLetter.wordCards.length > 0) {
            const dCard = dLetter.wordCards[Math.floor(Math.random() * dLetter.wordCards.length)];
            distractors.push({
              word: dCard.word,
              meaning: dCard.meaning,
              emoji: dCard.emoji,
              letterId: dLetter.id,
              isCorrect: false,
            });
          }
        }
      }
      
      // If we still don't have enough distractors (e.g., first letter),
      // use OTHER word cards from the SAME letter or grab from future letters
      // (just for picture variety — the child won't be tested on those letters)
      if (distractors.length < 2) {
        // First try other word cards from the same letter
        const otherCards = letter.wordCards.filter((_, idx) => idx !== r);
        for (const card of shuffleArray(otherCards)) {
          if (distractors.length >= 2) break;
          distractors.push({
            word: card.word,
            meaning: card.meaning,
            emoji: card.emoji,
            letterId: letter.id,
            isCorrect: false, // These are wrong choices — different pictures
          });
        }
        
        // If still not enough, grab from other letters (just for pictures)
        if (distractors.length < 2) {
          const otherLetters = shuffleArray(allLetters.filter(l => l.id !== letter.id));
          for (const otherLetter of otherLetters) {
            if (distractors.length >= 2) break;
            if (otherLetter.wordCards.length > 0) {
              const card = otherLetter.wordCards[0];
              distractors.push({
                word: card.word,
                meaning: card.meaning,
                emoji: card.emoji,
                letterId: otherLetter.id,
                isCorrect: false,
              });
            }
          }
        }
      }
      
      rounds.push(shuffleArray([correct, ...distractors.slice(0, 2)]));
    }
    
    return rounds;
  }, [letter, allLetters, distractorLetters, distractorCount, totalRounds]);
  
  const currentTargets = targets[round] || targets[0];
  
  // Handle drag end - check if dropped on a target
  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    const dropX = info.point.x;
    const dropY = info.point.y;
    
    let hitTarget: PictureTarget | null = null;
    let hitIndex = -1;
    
    targetRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      // Very generous hit area for toddlers (expand by 30px)
      if (dropX >= rect.left - 30 && dropX <= rect.right + 30 && 
          dropY >= rect.top - 30 && dropY <= rect.bottom + 30) {
        hitTarget = currentTargets[idx];
        hitIndex = idx;
      }
    });
    
    if (hitTarget !== null) {
      const hit = hitTarget as PictureTarget;
      if (hit.isCorrect) {
        handleCorrect(hit);
      } else {
        setWrongTarget(hitIndex);
        playWrongSound();
        setTimeout(() => setWrongTarget(null), 800);
        setShowHint(true);
      }
    }
  }, [currentTargets]);

  const handleCorrect = useCallback((target: PictureTarget) => {
    setMatched(true);
    playCorrectSound();
    speakArabic(target.word);
    setScore(prev => prev + 1);
    
    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(prev => prev + 1);
        setMatched(false);
        setShowHint(false);
      } else {
        onComplete(2);
      }
    }, 1500);
  }, [round, totalRounds, onComplete]);
  
  // Also support TAP on target as alternative
  const handleTargetTap = useCallback((target: PictureTarget, idx: number) => {
    if (matched || isDragging) return;
    
    if (target.isCorrect) {
      handleCorrect(target);
    } else {
      setWrongTarget(idx);
      playWrongSound();
      setTimeout(() => setWrongTarget(null), 800);
      setShowHint(true);
    }
  }, [matched, isDragging, handleCorrect]);

  return (
    <div ref={dragConstraintsRef} className="h-full flex flex-col items-center justify-between py-4 px-4 select-none overflow-hidden relative">
      {/* Instruction */}
      <div className="text-center mb-2 z-10">
        <h2 className="text-lg font-bold text-gray-700" style={{ fontFamily: 'var(--font-heading)' }}>
          Match the letter to its picture!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Which picture starts with <span className="font-bold arabic-text text-xl" style={{ color: letter.color }}>{letter.letter}</span>?
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
      
      {/* Draggable letter */}
      <div className="relative mb-6 z-50">
        <motion.div
          key={`letter-${round}`}
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.3, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 1.1 }}
          className={`w-28 h-28 rounded-3xl flex items-center justify-center shadow-xl border-4 cursor-grab active:cursor-grabbing ${
            matched ? 'bg-green-100 border-green-400' : 'bg-white border-amber-300'
          }`}
          style={{ touchAction: 'none' }}
        >
          <span className="text-6xl arabic-text font-bold select-none pointer-events-none" style={{ color: letter.color }}>
            {letter.letter}
          </span>
        </motion.div>
        
        {/* Drag hint animation */}
        {!matched && !isDragging && (
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-2xl text-amber-400"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            👇
          </motion.div>
        )}
      </div>
      
      {/* Picture targets — always 3 */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {currentTargets.map((target, idx) => (
            <motion.div
              key={`${round}-${idx}`}
              ref={el => { targetRefs.current[idx] = el; }}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: wrongTarget === idx ? [1, 0.9, 1.05, 1] : matched && target.isCorrect ? 1.1 : 1,
              }}
              transition={{ delay: idx * 0.15, type: 'spring' }}
              onClick={() => handleTargetTap(target, idx)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-3xl border-4 transition-colors min-h-[140px] ${
                matched && target.isCorrect ? 'bg-green-50 border-green-400 shadow-xl' :
                wrongTarget === idx ? 'bg-red-50 border-red-400 shadow-lg' :
                showHint && target.isCorrect ? 'bg-amber-50 border-amber-300 shadow-lg ring-4 ring-amber-200' :
                isDragging ? 'bg-blue-50 border-blue-200 shadow-lg ring-2 ring-blue-100' :
                'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-amber-200'
              }`}
            >
              <span className="text-5xl mb-2 pointer-events-none">{target.emoji}</span>
              <span className="text-sm font-bold text-gray-700 pointer-events-none text-center">{target.meaning}</span>
              
              {/* Success checkmark */}
              {matched && target.isCorrect && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-white text-xl">✓</span>
                </motion.div>
              )}
              
              {/* Wrong X mark */}
              {wrongTarget === idx && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="text-white text-xl">✗</span>
                </motion.div>
              )}
              
              {/* Drop zone indicator when dragging */}
              {isDragging && !matched && (
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-dashed border-blue-300 pointer-events-none"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Hint text */}
      {showHint && !matched && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-amber-600 text-sm mt-3 font-medium"
        >
          💡 Hint: Look for the picture that starts with "{letter.name}"!
        </motion.p>
      )}
      
      {/* Tap instruction */}
      {!isDragging && !matched && !showHint && (
        <p className="text-center text-gray-400 text-xs mt-3">
          Drag the letter to the picture, or tap the correct one!
        </p>
      )}
    </div>
  );
}
