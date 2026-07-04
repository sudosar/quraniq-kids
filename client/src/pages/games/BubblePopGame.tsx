/**
 * Bubble Pop Game - Khan Academy Kids Style
 * 
 * Design: Celestial Garden theme
 * 
 * MECHANICS (inspired by Khan Academy Kids):
 * - Bubbles float slowly and randomly across the screen
 * - They drift in and out of view, bouncing off edges gently
 * - Child taps the correct letter bubbles
 * - Wrong bubbles wobble but don't pop
 * 
 * PHYSICS:
 * - Bubbles NEVER overlap — collision detection positions them with minimum separation
 * - Each bubble has a "home" safe position; float animation uses small ±radius oscillation
 *   that fits within the collision margin — no bubble ever enters another's space
 * - Bubbles bounce off screen edges naturally
 * 
 * PROGRESSIVE DISTRACTORS:
 * - ALWAYS shows distractors — even for the first letter!
 * - For the first letter: uses 2-3 other common Arabic letters as visual distractors
 * - For later letters: uses previously learned letters as distractors
 * 
 * ALL LETTER FORMS:
 * - Target bubbles show the letter in ALL its positional forms (isolated, initial, medial, final)
 * - This teaches children to recognize the letter regardless of shape
 * - A small label below each target bubble shows which form it is
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter, arabicLetters } from '@/lib/curriculum';
import { getLetterForms, formLabels, LetterForms } from '@/lib/letterForms';
import { playPopSound, playWrongSound, playCorrectSound, shuffleArray } from '@/lib/gameEngine';

// Non-connecting letters: isolated & initial are identical, medial & final are identical
const NON_CONNECTING = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة']);

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

interface Bubble {
  id: number;
  displayLetter: string;
  formLabel: string | null;
  isTarget: boolean;
  popped: boolean;
  wobble: boolean;
  colorIndex: number;
  // Physics / layout
  homeX: number;   // home center X (% of container width)
  homeY: number;   // home center Y (% of container height)
  radius: number;  // collision radius in px
  // Float animation params — oscillation stays within collision margin
  floatRadiusX: number;  // max horizontal oscillation (px)
  floatRadiusY: number;  // max vertical oscillation (px)
  floatDuration: number; // seconds per oscillation cycle
  floatDelay: number;   // animation start delay (s)
  floatPhaseX: number;  // initial phase offset (radians)
  floatPhaseY: number;  // initial phase offset (radians)
}

const BUBBLE_COLORS = [
  '#FF6B9D', '#C084FC', '#60A5FA', '#34D399',
  '#FBBF24', '#F97316', '#EC4899', '#8B5CF6',
  '#06B6D4', '#10B981',
];

const TARGET_COUNT = 6;
// Collision safety margin — how much extra space between bubbles beyond their visual radius
const COLLISION_MARGIN = 8; // px
// How much smaller the oscillation radius is vs the separation space available
// This ensures the oscillating bubble never reaches into another bubble's territory
const OSCILLATION_SAFETY = 0.65;

interface RawBubble {
  displayLetter: string;
  formLabel: string | null;
  isTarget: boolean;
  size: number; // px diameter
}

/**
 * Place bubbles using physics-inspired rejection sampling:
 * - Try random positions
 * - Check against all previously placed bubbles (with collision margin)
 * - If overlap, retry up to maxAttempts; if still failing, place anyway but mark overlapped
 * - Bubbles are sorted by size (largest first) so big ones get priority placement
 */
function computeBubbleLayout(
  rawBubbles: RawBubble[],
  containerW: number,
  containerH: number,
  paddingPx: number = 16
): Array<{ homeX: number; homeY: number; radius: number; floatRadiusX: number; floatRadiusY: number }> {
  // Sort by size descending — place biggest bubbles first
  const sorted = [...rawBubbles].sort((a, b) => b.size - a.size);

  const placed: Array<{ homeX: number; homeY: number; radius: number }> = [];
  const maxAttempts = 150;

  for (const bubble of sorted) {
    const r = bubble.size / 2;
    let bestX = 0, bestY = 0, bestDist = -1;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // Candidate position — keep within padding of container edges
      const cx = paddingPx + r + Math.random() * (containerW - 2 * (paddingPx + r));
      const cy = paddingPx + r + Math.random() * (containerH - 2 * (paddingPx + r));

      // Check collision with all previously placed bubbles
      let minDist = Infinity;
      let collides = false;
      for (const p of placed) {
        const dx = cx - p.homeX;
        const dy = cy - p.homeY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minRequired = r + p.radius + COLLISION_MARGIN;
        if (dist < minRequired) {
          collides = true;
          break;
        }
        if (dist < minDist) minDist = dist;
      }

      if (!collides) {
        bestX = cx;
        bestY = cy;
        break;
      }

      // Track the position with maximum separation (best fallback)
      if (minDist > bestDist) {
        bestDist = minDist;
        bestX = cx;
        bestY = cy;
      }

      attempts++;
    }

    placed.push({ homeX: bestX, homeY: bestY, radius: r });
  }

  // Convert to percentage and compute safe oscillation radius for each bubble
  // The oscillation radius must stay well within the gap between this bubble and its nearest neighbor
  const oscillationResults = placed.map((p, i) => {
    const r = p.radius;
    // Find nearest neighbor
    let nearestDist = Infinity;
    for (let j = 0; j < placed.length; j++) {
      if (i === j) continue;
      const dx = p.homeX - placed[j].homeX;
      const dy = p.homeY - placed[j].homeY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) nearestDist = dist;
    }

    // Max safe oscillation: stay within (nearestDist - r - neighborRadius - COLLISION_MARGIN) / 2
    // We use a conservative factor so oscillation stays clearly inside safe zone
    const safeGap = nearestDist - r;
    const maxOscX = Math.max(12, (safeGap * OSCILLATION_SAFETY) - COLLISION_MARGIN);
    const maxOscY = Math.max(12, (safeGap * OSCILLATION_SAFETY * 0.75) - COLLISION_MARGIN);

    return {
      homeX: (p.homeX / containerW) * 100,
      homeY: (p.homeY / containerH) * 100,
      radius: r,
      floatRadiusX: Math.min(maxOscX, r * 0.25),
      floatRadiusY: Math.min(maxOscY, r * 0.20),
    };
  });

  return oscillationResults;
}

export default function BubblePopGame({ letter, distractorLetters, distractorCount, onComplete }: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [gameReady, setGameReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutDone = useRef(false);

  // Get all forms of the target letter
  const letterFormsData = useMemo(() => getLetterForms(letter.letter), [letter]);

  const generateBubbles = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;

    layoutDone.current = true;

    const allItems: RawBubble[] = [];

    // Add target letter in its positional forms
    if (letterFormsData) {
      const isNonConnecting = NON_CONNECTING.has(letter.letter);
      const forms: Array<{ key: keyof LetterForms; label: string }> = [
        { key: 'isolated', label: 'Alone' },
        ...(isNonConnecting ? [] : [{ key: 'initial' as keyof LetterForms, label: 'Start' }]),
        ...(isNonConnecting ? [] : [{ key: 'medial' as keyof LetterForms, label: 'Middle' }]),
        { key: 'final', label: 'End' },
      ];

      if (isNonConnecting) {
        // Triple each of the 2 forms = 6 targets
        forms.forEach(({ key, label }) => {
          for (let i = 0; i < 3; i++) {
            allItems.push({ displayLetter: letterFormsData[key], formLabel: label, isTarget: true, size: 80 + Math.random() * 30 });
          }
        });
      } else {
        // 4 forms × 1 + 2 extra = 6 targets
        forms.forEach(({ key, label }) => {
          allItems.push({ displayLetter: letterFormsData[key], formLabel: label, isTarget: true, size: 80 + Math.random() * 30 });
        });
        [{ key: 'isolated' as keyof LetterForms, label: 'Alone' }, { key: 'initial' as keyof LetterForms, label: 'Start' }].forEach(({ key, label }) => {
          allItems.push({ displayLetter: letterFormsData[key], formLabel: label, isTarget: true, size: 80 + Math.random() * 30 });
        });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        allItems.push({ displayLetter: letter.letter, formLabel: null, isTarget: true, size: 80 + Math.random() * 30 });
      }
    }

    // ALWAYS add distractors
    if (distractorCount > 0 && distractorLetters.length > 0) {
      const usableDistractors = distractorLetters.slice(0, Math.min(distractorCount, 4));
      usableDistractors.forEach(d => {
        for (let i = 0; i < 2; i++) {
          allItems.push({ displayLetter: d.letter, formLabel: null, isTarget: false, size: 80 + Math.random() * 30 });
        }
        if (usableDistractors.length < 3) {
          allItems.push({ displayLetter: d.letter, formLabel: null, isTarget: false, size: 80 + Math.random() * 30 });
        }
      });
    } else {
      const otherLetters = arabicLetters.filter(l => l.id !== letter.id);
      const visualDistractors = shuffleArray(otherLetters).slice(0, 3);
      visualDistractors.forEach(d => {
        for (let i = 0; i < 2; i++) {
          allItems.push({ displayLetter: d.letter, formLabel: null, isTarget: false, size: 80 + Math.random() * 30 });
        }
      });
    }

    const shuffled = shuffleArray(allItems);

    // Compute collision-free layout
    const layout = computeBubbleLayout(shuffled, cw, ch, 20);
    // layout[i] corresponds to shuffled[i] bubble

    const newBubbles: Bubble[] = shuffled.map((item, i) => {
      const pos = layout[i];
      return {
        id: i,
        displayLetter: item.displayLetter,
        formLabel: item.formLabel,
        isTarget: item.isTarget,
        popped: false,
        wobble: false,
        colorIndex: i % BUBBLE_COLORS.length,
        homeX: pos.homeX,
        homeY: pos.homeY,
        radius: pos.radius,
        floatRadiusX: pos.floatRadiusX,
        floatRadiusY: pos.floatRadiusY,
        floatDuration: 5 + Math.random() * 5,
        floatDelay: i * 0.2,
        floatPhaseX: Math.random() * Math.PI * 2,
        floatPhaseY: Math.random() * Math.PI * 2,
      };
    });

    setBubbles(newBubbles);
  }, [letter, letterFormsData, distractorLetters, distractorCount]);

  useEffect(() => {
    // Use ResizeObserver to re-compute layout when container size changes
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      layoutDone.current = false;
      generateBubbles();
    });
    ro.observe(container);

    // Initial layout after mount
    const timer = setTimeout(() => {
      generateBubbles();
      setGameReady(true);
    }, 100);

    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [generateBubbles]);

  const handleBubbleTap = useCallback((bubble: Bubble) => {
    if (bubble.popped || !gameReady) return;

    if (bubble.isTarget) {
      playPopSound();
      const newScore = score + 1;
      setScore(newScore);

      const newParticles = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i + Math.random() * 1000,
        x: bubble.homeX,
        y: bubble.homeY,
        color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.includes(p))), 1000);

      setBubbles(prev => prev.map(b =>
        b.id === bubble.id ? { ...b, popped: true } : b
      ));

      if (newScore >= TARGET_COUNT) {
        setTimeout(() => {
          playCorrectSound();
          onComplete(2);
        }, 600);
      }
    } else {
      playWrongSound();
      setBubbles(prev => prev.map(b =>
        b.id === bubble.id ? { ...b, wobble: true } : b
      ));
      setTimeout(() => {
        setBubbles(prev => prev.map(b =>
          b.id === bubble.id ? { ...b, wobble: false } : b
        ));
      }, 600);
    }
  }, [score, gameReady, onComplete]);

  const instructionText = `Pop all forms of ${letter.name} (${letter.letter})!`;

  return (
    <div ref={containerRef} className="h-full relative overflow-hidden bg-gradient-to-b from-sky-200 via-blue-100 to-indigo-50">
      {/* Score */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🫧</span>
          <span className="font-bold text-lg text-blue-700" style={{ fontFamily: 'var(--font-heading)' }}>
            {score} / {TARGET_COUNT}
          </span>
        </div>
      </div>

      {/* Target letter reminder */}
      <div className="absolute top-4 right-3 z-20 bg-white/95 shadow-lg rounded-2xl px-3 py-2 border-2" style={{ borderColor: letter.color }}>
        <div className="flex items-center gap-1.5">
          {letterFormsData && (['isolated', 'initial', 'medial', 'final'] as const)
            .filter(form => !NON_CONNECTING.has(letter.letter) || (form !== 'initial' && form !== 'medial'))
            .map((form) => (
            <span
              key={form}
              className="arabic-text font-bold text-lg"
              style={{ color: letter.color, fontFamily: '"Amiri", "Noto Naskh Arabic", serif' }}
              title={formLabels[form].en}
            >
              {letterFormsData[form]}
            </span>
          ))}
        </div>
      </div>

      {/* Instruction at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/90 rounded-2xl px-6 py-3 shadow-lg max-w-xs">
        <p className="text-base font-bold text-gray-700 text-center" style={{ fontFamily: 'var(--font-heading)' }}>
          {instructionText}
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          Look for all shapes: alone, start, middle, end!
        </p>
      </div>

      {/* Pop particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-3 h-3 rounded-full z-30 pointer-events-none"
          style={{ backgroundColor: p.color, left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            scale: 0,
            opacity: 0,
            x: (Math.random() - 0.5) * 120,
            y: (Math.random() - 0.5) * 120,
          }}
          transition={{ duration: 0.7 }}
        />
      ))}

      {/* Floating Bubbles — position uses homeX/homeY, float via translate from center */}
      <AnimatePresence>
        {bubbles.filter(b => !b.popped).map(bubble => {
          const color = BUBBLE_COLORS[bubble.colorIndex];
          const size = bubble.radius * 2;

          // Oscillation keyframes — oscillate within floatRadius (already collision-safe)
          // We use sin() approach via CSS custom properties for smooth per-bubble oscillation
          const oscillationX = bubble.floatRadiusX;
          const oscillationY = bubble.floatRadiusY;

          return (
            <motion.div
              key={bubble.id}
              className="absolute"
              style={{
                left: `${bubble.homeX}%`,
                top: `${bubble.homeY}%`,
                width: `${size}px`,
                height: `${size}px`,
                marginLeft: `-${size / 2}px`,
                marginTop: `-${size / 2}px`,
                zIndex: 10 + (bubble.id % 5),
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={bubble.wobble ? {
                scale: 1,
                opacity: 1,
                x: [0, -10, 10, -10, 10, 0],
              } : {
                scale: 1,
                opacity: 1,
                // Lissajous-style oscillation — each bubble has unique phase so they don't sync
                x: [
                  0,
                  oscillationX * 0.6,
                  0,
                  -oscillationX * 0.6,
                  0,
                ],
                y: [
                  0,
                  -oscillationY * 0.4,
                  -oscillationY * 0.8,
                  -oscillationY * 0.4,
                  0,
                ],
              }}
              transition={bubble.wobble ? { duration: 0.5 } : {
                scale: { type: 'spring', delay: bubble.floatDelay, stiffness: 200, damping: 15 },
                opacity: { delay: bubble.floatDelay, duration: 0.4 },
                x: {
                  duration: bubble.floatDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: bubble.floatDelay,
                },
                y: {
                  duration: bubble.floatDuration * 0.85,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: bubble.floatDelay + 0.3,
                },
              }}
              exit={{ scale: [1, 1.4, 0], opacity: [1, 0.8, 0], transition: { duration: 0.35 } }}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleBubbleTap(bubble)}
            >
              <div
                className="w-full h-full rounded-full flex flex-col items-center justify-center relative cursor-pointer select-none"
                style={{
                  backgroundColor: color,
                  border: '3px solid rgba(255,255,255,0.6)',
                  boxShadow: `0 4px 20px ${color}80, inset 0 -6px 12px rgba(0,0,0,0.15), inset 0 6px 12px rgba(255,255,255,0.5)`,
                }}
              >
                {/* Bubble highlight/shine */}
                <div
                  className="absolute rounded-full bg-white/50"
                  style={{ top: '12%', left: '18%', width: '30%', height: '22%', transform: 'rotate(-20deg)' }}
                />
                {/* Letter */}
                <span
                  className="text-3xl md:text-4xl arabic-text font-bold relative z-10"
                  style={{
                    color: '#1a1a2e',
                    textShadow: '0 0 8px rgba(255,255,255,0.9), 0 2px 4px rgba(255,255,255,0.5)',
                    fontFamily: '"Amiri", "Noto Naskh Arabic", serif',
                  }}
                >
                  {bubble.displayLetter}
                </span>
                {/* Form label for target bubbles */}
                {bubble.isTarget && bubble.formLabel && (
                  <span
                    className="text-[9px] font-bold relative z-10 mt-0.5 px-1.5 py-0.5 rounded-full bg-white/70"
                    style={{ color: '#1a1a2e' }}
                  >
                    {bubble.formLabel}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Win overlay */}
      <AnimatePresence>
        {score >= TARGET_COUNT && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="text-center"
            >
              <span className="text-6xl block mb-2">🎉</span>
              <p className="text-2xl font-bold text-blue-700" style={{ fontFamily: 'var(--font-heading)' }}>
                All forms popped!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
