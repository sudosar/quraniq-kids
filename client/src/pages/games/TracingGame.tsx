/**
 * TracingGame - trace the actual letter glyph
 *
 * The guide is the letter itself, rendered transparently from the Amiri
 * font: no hand-drawn paths, so the template cannot be the wrong shape.
 * The child traces over the template with their finger (or mouse); the
 * game measures how much of the letter's ink their strokes cover and
 * completes when enough of the letter has been traced.
 *
 * How coverage works: the glyph is drawn once on a small offscreen
 * canvas and every ink pixel is recorded. Each pointer point marks all
 * ink pixels within a finger-sized brush radius as covered. The visible
 * template and the ink mask use the exact same draw call (font, size,
 * alignment), so they always match, whatever the font's metrics.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { playCorrectSound, speakArabic } from '@/lib/gameEngine';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

// Configuration
const CANVAS_SIZE = 320;
const MASK_SIZE = 160; // offscreen ink-mask resolution
const COVERAGE_THRESHOLD = 0.6; // fraction of the letter's ink to trace
const BRUSH_RADIUS = 0.055; // normalized finger brush radius for coverage
const GLYPH_SCALE = 0.72; // glyph size relative to canvas

interface Point {
  x: number;
  y: number;
}

export default function TracingGame({ letter, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZE);
  const [isDrawing, setIsDrawing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [userPath, setUserPath] = useState<Point[]>([]);
  const [coveredCount, setCoveredCount] = useState(0);
  const [inkTotal, setInkTotal] = useState(0);
  const [fontReady, setFontReady] = useState(false);

  const isDrawingRef = useRef(false);
  const userPathRef = useRef<Point[]>([]);
  const coveredRef = useRef<Set<number>>(new Set());
  const inkRef = useRef<Point[]>([]);
  const completedRef = useRef(false);

  // Measure canvas size responsively
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width - 32, CANVAS_SIZE);
        setCanvasSize(Math.max(size, 240));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Build the ink mask from the real glyph once the font is available.
  // The mask and the visible template share this draw call exactly.
  useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled) return;
      const mask = document.createElement('canvas');
      mask.width = MASK_SIZE;
      mask.height = MASK_SIZE;
      const ctx = mask.getContext('2d');
      if (!ctx) return;
      ctx.font = `700 ${MASK_SIZE * GLYPH_SCALE}px Amiri, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter.letter, MASK_SIZE / 2, MASK_SIZE / 2);
      const data = ctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;
      const ink: Point[] = [];
      for (let y = 0; y < MASK_SIZE; y++) {
        for (let x = 0; x < MASK_SIZE; x++) {
          if (data[(y * MASK_SIZE + x) * 4 + 3] > 128) {
            ink.push({ x: x / MASK_SIZE, y: y / MASK_SIZE });
          }
        }
      }
      inkRef.current = ink;
      coveredRef.current = new Set();
      setInkTotal(ink.length);
      setCoveredCount(0);
      setFontReady(true);
    };
    if (document.fonts) {
      document.fonts
        .load(`700 100px Amiri`)
        .catch(() => {})
        .finally(() => {
          if (document.fonts.ready) {
            document.fonts.ready.then(build).catch(build);
          } else {
            build();
          }
        });
    } else {
      build();
    }
    return () => {
      cancelled = true;
    };
  }, [letter.letter]);

  // Draw the transparent template + the user's tracing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 2;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Transparent template: the letter itself
    if (fontReady) {
      ctx.font = `700 ${canvasSize * GLYPH_SCALE}px Amiri, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `${letter.color}30`;
      ctx.fillText(letter.letter, canvasSize / 2, canvasSize / 2);
    }

    // User's tracing path
    const path = userPathRef.current;
    if (path.length > 1) {
      ctx.beginPath();
      ctx.moveTo(path[0].x * canvasSize, path[0].y * canvasSize);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x * canvasSize, path[i].y * canvasSize);
      }
      ctx.strokeStyle = letter.color;
      ctx.lineWidth = canvasSize * 0.035;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [letter, canvasSize, fontReady]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, userPath, canvasSize, fontReady]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ('touches' in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) / canvasSize,
        y: (clientY - rect.top) / canvasSize,
      };
    },
    [canvasSize]
  );

  // Mark ink pixels near this point as covered; returns the new count
  const markCovered = useCallback((point: Point): number => {
    const covered = coveredRef.current;
    const ink = inkRef.current;
    let added = 0;
    for (let i = 0; i < ink.length; i++) {
      if (covered.has(i)) continue;
      const dx = point.x - ink[i].x;
      const dy = point.y - ink[i].y;
      if (dx * dx + dy * dy <= BRUSH_RADIUS * BRUSH_RADIUS) {
        covered.add(i);
        added++;
      }
    }
    if (added > 0) {
      setCoveredCount(covered.size);
    }
    return covered.size;
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);
    playCorrectSound();
    speakArabic(letter.letter);
    setTimeout(() => onComplete(3), 2000);
  }, [letter, onComplete]);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (completedRef.current) return;
      e.preventDefault();
      const point = getCanvasPoint(e);
      if (!point) return;
      setIsDrawing(true);
      isDrawingRef.current = true;
      const path = [point];
      setUserPath(path);
      userPathRef.current = path;
      const count = markCovered(point);
      if (inkTotal > 0 && count / inkTotal >= COVERAGE_THRESHOLD) {
        finish();
      }
    },
    [getCanvasPoint, markCovered, inkTotal, finish]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current || completedRef.current) return;
      const point = getCanvasPoint(e);
      if (!point) return;
      const path = [...userPathRef.current, point];
      setUserPath(path);
      userPathRef.current = path;
      const count = markCovered(point);
      if (inkTotal > 0 && count / inkTotal >= COVERAGE_THRESHOLD) {
        finish();
      }
    },
    [getCanvasPoint, markCovered, inkTotal, finish]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    setIsDrawing(false);
    isDrawingRef.current = false;
    // The traced path stays on screen: the child lifts the finger and
    // keeps tracing the rest of the letter.
  }, []);

  const handleClear = useCallback(() => {
    coveredRef.current = new Set();
    setCoveredCount(0);
    setCompleted(false);
    completedRef.current = false;
    setIsDrawing(false);
    isDrawingRef.current = false;
    setUserPath([]);
    userPathRef.current = [];
  }, []);

  const coverage = inkTotal > 0 ? Math.min(100, Math.floor((coveredCount / inkTotal) * 100)) : 0;

  return (
    <div className="h-full flex flex-col items-center px-4 py-4 select-none">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3"
      >
        <h3 className="text-xl font-bold text-gray-700" style={{ fontFamily: 'var(--font-heading)' }}>
          ✏️ Trace the letter!
        </h3>
        <p className="text-sm text-gray-400">Trace over the letter with your finger</p>
      </motion.div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex-shrink-0 rounded-3xl overflow-hidden bg-white shadow-inner border-2"
        style={{
          width: canvasSize,
          height: canvasSize,
          borderColor: completed ? '#34D399' : `${letter.color}30`,
        }}
      >
        {/* Completion overlay */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-4xl">🌟</span>
                </div>
                <p className="text-2xl font-bold text-teal-600" style={{ fontFamily: 'var(--font-heading)' }}>
                  Beautiful!
                </p>
                <p className="text-sm text-gray-500 mt-1">You traced {letter.name}!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          style={{ touchAction: 'none', width: canvasSize, height: canvasSize }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Progress info */}
      {!completed && (
        <div className="mt-3 flex items-center gap-4">
          <div className="text-xs text-gray-400">Letter traced</div>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: letter.color }}
              animate={{ width: `${coverage}%` }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </div>
          <div className="text-xs font-medium" style={{ color: letter.color }}>
            {coverage}%
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        {!completed ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              🔄 Start Over
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onComplete(1)}
              className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-full text-sm font-semibold border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Skip →
            </motion.button>
          </>
        ) : (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onComplete(3)}
            className="px-8 py-3 text-white rounded-full text-base font-bold shadow-lg"
            style={{ backgroundColor: letter.color }}
          >
            Continue →
          </motion.button>
        )}
      </div>
    </div>
  );
}
