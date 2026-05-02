/**
 * Memory Match Game - Progressive Version
 * 
 * Design: Celestial Garden theme
 * 
 * Card-flipping memory game matching Arabic letter to its English name.
 * 
 * PROGRESSIVE:
 * - If 0 distractors: 3 pairs of the SAME letter (match letter ↔ name)
 *   but with different visual cues (color variations)
 * - If 1-2 distractors: current letter + known letters = 3-4 pairs
 * - If 3+ distractors: current letter + 3 known letters = 4 pairs
 * 
 * This game REQUIRES at least 2 distractors (minDistractors: 2 in gameEngine).
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { playPopSound, playWrongSound, playCorrectSound, shuffleArray } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

interface Card {
  id: string;
  pairId: number;
  content: string;
  type: 'arabic' | 'name';
  color: string;
  flipped: boolean;
  matched: boolean;
}

export default function MemoryMatchGame({ letter, distractorLetters, distractorCount, onComplete }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Build letter set using ONLY current + previously learned letters
    const selectedLetters: ArabicLetter[] = [letter];
    
    if (distractorCount >= 2) {
      const available = shuffleArray(distractorLetters.slice(0, Math.min(distractorCount, 3)));
      selectedLetters.push(...available);
    } else if (distractorCount === 1) {
      selectedLetters.push(distractorLetters[0]);
      // Add the current letter again with a different ID to make 3 pairs
      selectedLetters.push({ ...letter, id: letter.id + 100 });
    } else {
      // No distractors — use 3 copies of the same letter
      selectedLetters.push({ ...letter, id: letter.id + 100 });
      selectedLetters.push({ ...letter, id: letter.id + 200 });
    }

    // Ensure at least 3 pairs
    while (selectedLetters.length < 3) {
      selectedLetters.push({ ...letter, id: letter.id + selectedLetters.length * 100 });
    }

    const newCards: Card[] = [];
    selectedLetters.forEach((l) => {
      newCards.push({
        id: `arabic-${l.id}`,
        pairId: l.id,
        content: l.letter,
        type: 'arabic',
        color: l.color,
        flipped: false,
        matched: false,
      });
      newCards.push({
        id: `name-${l.id}`,
        pairId: l.id,
        content: l.name,
        type: 'name',
        color: l.color,
        flipped: false,
        matched: false,
      });
    });

    setCards(shuffleArray(newCards));
  }, [letter, distractorLetters, distractorCount]);

  const handleCardFlip = useCallback((cardId: string) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.matched || flippedCards.includes(cardId)) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    playPopSound();

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);
      
      const [first, second] = newFlipped.map(id => cards.find(c => c.id === id)!);
      
      if (first.pairId === second.pairId && first.type !== second.type) {
        setTimeout(() => {
          playCorrectSound();
          const newMatched = [...matchedPairs, first.pairId];
          setMatchedPairs(newMatched);
          setCards(prev => prev.map(c => 
            c.pairId === first.pairId ? { ...c, matched: true } : c
          ));
          setFlippedCards([]);
          setIsChecking(false);
          
          const totalPairs = cards.length / 2;
          if (newMatched.length >= totalPairs) {
            setCompleted(true);
            setTimeout(() => {
              const stars = moves <= totalPairs + 2 ? 2 : 1;
              onComplete(stars);
            }, 1500);
          }
        }, 600);
      } else {
        setTimeout(() => {
          playWrongSound();
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [cards, flippedCards, isChecking, matchedPairs, moves, onComplete]);

  const totalPairs = cards.length / 2;

  return (
    <div className="h-full flex flex-col items-center px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🃏</span>
          <span className="font-bold text-gray-700" style={{ fontFamily: 'var(--font-heading)' }}>
            {matchedPairs.length}/{totalPairs} pairs
          </span>
        </div>
        <div className="text-sm text-gray-400">
          Moves: {moves}
        </div>
      </div>

      {/* Instruction for first letter */}
      {distractorCount === 0 && (
        <p className="text-sm text-gray-500 mb-3 text-center" style={{ fontFamily: 'var(--font-body)' }}>
          Match each <span className="font-bold arabic-text" style={{ color: letter.color }}>{letter.letter}</span> with its name "{letter.name}"
        </p>
      )}

      {/* Card grid */}
      <div className={`grid ${cards.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'} gap-2 w-full max-w-sm flex-1 content-center`}>
        {cards.map(card => {
          const isFlipped = flippedCards.includes(card.id) || card.matched;
          
          return (
            <motion.button
              key={card.id}
              onClick={() => handleCardFlip(card.id)}
              className="relative aspect-square rounded-xl"
              whileTap={!isFlipped ? { scale: 0.95 } : {}}
              disabled={card.matched || isChecking}
            >
              <motion.div
                className="w-full h-full relative"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Card back */}
                <div 
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-md flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-2xl text-white/80">✦</span>
                </div>
                
                {/* Card front */}
                <div 
                  className={`absolute inset-0 rounded-xl shadow-md flex items-center justify-center ${
                    card.matched ? 'ring-2 ring-green-400 bg-green-50' : 'bg-white'
                  }`}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {card.type === 'arabic' ? (
                    <span className="text-3xl arabic-text font-bold" style={{ color: card.color }}>
                      {card.content}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-700 text-center px-1" style={{ fontFamily: 'var(--font-heading)' }}>
                      {card.content}
                    </span>
                  )}
                  
                  {card.matched && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 text-lg"
                    >
                      ✅
                    </motion.span>
                  )}
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {/* Completion overlay */}
      {completed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="text-center"
          >
            <span className="text-6xl block mb-3">🧠</span>
            <p className="text-2xl font-bold text-teal-600" style={{ fontFamily: 'var(--font-heading)' }}>
              Great Memory!
            </p>
            <p className="text-gray-500 mt-1">Completed in {moves} moves</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
