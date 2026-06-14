/**
 * Tracing Game - Khan Academy Kids Style
 * 
 * A guided letter tracing activity with:
 * - Animated arrow that slides along pre-defined stroke paths
 * - Path-following validation (must stay close to the line)
 * - Stroke-by-stroke progression (complete one, unlock the next)
 * - Visual feedback for on-path vs off-path tracing
 * - Proper coverage checking before completion
 * - Celebration with particles when all strokes are done
 * 
 * PEDAGOGY:
 * - Kids follow the animated arrow to learn correct stroke order
 * - Must trace ON the path, not just scribble anywhere
 * - Each stroke completes before the next is shown
 * - Builds muscle memory for proper Arabic letter formation
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArabicLetter } from '@/lib/curriculum';
import { playCorrectSound, speakArabic } from '@/lib/gameEngine';
import {
  getStrokeData,
  hasStrokeData,
  generateFallbackStroke,
  getStrokeSamplePoints,
  distanceToStroke,
  type LetterStroke,
  type StrokePoint,
} from '@/lib/letterStrokePaths';

interface Props {
  letter: ArabicLetter;
  allLetters: ArabicLetter[];
  lessonLetters: ArabicLetter[];
  distractorLetters: ArabicLetter[];
  distractorCount: number;
  onComplete: (stars: number) => void;
  onSkip: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface StrokeProgress {
  coveredSamples: Set<number>;
  isComplete: boolean;
}

// Configuration
const CANVAS_SIZE = 320;
const STROKE_THRESHOLD = 0.85; // 85% of samples must be covered
const MAX_DISTANCE_TOLERANCE = 0.07; // How far from path is still "on track"
const ARROW_SPEED = 1.5; // Seconds to travel full stroke
const MIN_TRACING_LENGTH = 0.15; // Minimum fraction of stroke that must be traced

export default function TracingGame({ letter, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Stroke data for this letter
  const strokeData = useMemo(() => {
    if (hasStrokeData(letter.letter)) {
      return getStrokeData(letter.letter)!;
    }
    return generateFallbackStroke(letter.letter);
  }, [letter.letter]);

  const totalStrokes = strokeData.strokes.length;

  // Game state
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState(0);
  const [strokeProgresses, setStrokeProgresses] = useState<StrokeProgress[]>(() =>
    strokeData.strokes.map(() => ({ coveredSamples: new Set<number>(), isComplete: false }))
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showHint, setShowHint] = useState(true);
  const [offPathWarning, setOffPathWarning] = useState(false);
  const [arrowPosition, setArrowPosition] = useState(0);
  const [userPath, setUserPath] = useState<StrokePoint[]>([]);
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZE);

  // Refs for animation and tracking
  const arrowAnimRef = useRef<number | null>(null);
  const arrowStartTimeRef = useRef<number>(0);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(0);
  const strokeProgressesRef = useRef(strokeProgresses);
  const userPathRef = useRef<StrokePoint[]>([]);

  // Keep refs in sync
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    currentStrokeRef.current = currentStrokeIdx;
  }, [currentStrokeIdx]);

  useEffect(() => {
    strokeProgressesRef.current = strokeProgresses;
  }, [strokeProgresses]);

  useEffect(() => {
    userPathRef.current = userPath;
  }, [userPath]);

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

  // Setup canvas and draw guide
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 2;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw faint letter guide
    ctx.save();
    ctx.font = `bold ${canvasSize * 0.65}px "Amiri", "Noto Naskh Arabic", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `${letter.color}12`;
    ctx.fillText(letter.letter, canvasSize / 2, canvasSize / 2);
    ctx.restore();

    // Draw all strokes
    strokeData.strokes.forEach((stroke, idx) => {
      const isCurrent = idx === currentStrokeRef.current;
      const isCompleted = strokeProgressesRef.current[idx]?.isComplete;
      const isFuture = idx > currentStrokeRef.current;

      const points = stroke.points;
      if (points.length < 2) return;

      // Convert normalized to canvas coordinates
      const toCanvas = (p: StrokePoint) => ({
        x: p.x * canvasSize,
        y: p.y * canvasSize,
      });

      ctx.save();

      if (isCompleted) {
        // Completed stroke - draw solid filled
        ctx.beginPath();
        const start = toCanvas(points[0]);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
          const cp = toCanvas(points[i]);
          // Smooth curve
          const prev = toCanvas(points[i - 1]);
          const cpx = (prev.x + cp.x) / 2;
          const cpy = (prev.y + cp.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        const last = toCanvas(points[points.length - 1]);
        ctx.lineTo(last.x, last.y);
        ctx.strokeStyle = letter.color;
        ctx.lineWidth = canvasSize * 0.055;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Add glow
        ctx.shadowColor = letter.color;
        ctx.shadowBlur = 8;
        ctx.stroke();

      } else if (isCurrent) {
        // Current stroke - draw as dashed guide line
        ctx.beginPath();
        const start = toCanvas(points[0]);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
          const cp = toCanvas(points[i]);
          const prev = toCanvas(points[i - 1]);
          const cpx = (prev.x + cp.x) / 2;
          const cpy = (prev.y + cp.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        const last = toCanvas(points[points.length - 1]);
        ctx.lineTo(last.x, last.y);
        
        ctx.setLineDash([canvasSize * 0.015, canvasSize * 0.012]);
        ctx.strokeStyle = `${letter.color}60`;
        ctx.lineWidth = canvasSize * 0.04;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw start circle
        ctx.beginPath();
        ctx.arc(start.x, start.y, canvasSize * 0.025, 0, Math.PI * 2);
        ctx.fillStyle = letter.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

      } else if (isFuture) {
        // Future stroke - very faint
        ctx.beginPath();
        const start = toCanvas(points[0]);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
          const cp = toCanvas(points[i]);
          const prev = toCanvas(points[i - 1]);
          const cpx = (prev.x + cp.x) / 2;
          const cpy = (prev.y + cp.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        const last = toCanvas(points[points.length - 1]);
        ctx.lineTo(last.x, last.y);
        ctx.setLineDash([canvasSize * 0.008, canvasSize * 0.008]);
        ctx.strokeStyle = `${letter.color}15`;
        ctx.lineWidth = canvasSize * 0.025;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    // Draw user's current tracing path
    const currentPath = userPathRef.current;
    if (currentPath.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x * canvasSize, currentPath[0].y * canvasSize);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x * canvasSize, currentPath[i].y * canvasSize);
      }
      ctx.strokeStyle = letter.color;
      ctx.lineWidth = canvasSize * 0.035;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = letter.color;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.restore();
    }
  }, [letter, strokeData, canvasSize]);

  // Redraw canvas when state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, currentStrokeIdx, strokeProgresses, userPath, canvasSize]);

  // Arrow animation along current stroke
  useEffect(() => {
    if (completed) return;

    const animate = (timestamp: number) => {
      if (arrowStartTimeRef.current === 0) {
        arrowStartTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - arrowStartTimeRef.current) / 1000;
      const stroke = strokeData.strokes[currentStrokeRef.current];
      
      if (stroke && !strokeProgressesRef.current[currentStrokeRef.current]?.isComplete) {
        // Loop the arrow along the stroke path
        const progress = (elapsed % ARROW_SPEED) / ARROW_SPEED;
        setArrowPosition(progress);
      }

      arrowAnimRef.current = requestAnimationFrame(animate);
    };

    arrowStartTimeRef.current = 0;
    arrowAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (arrowAnimRef.current) {
        cancelAnimationFrame(arrowAnimRef.current);
      }
    };
  }, [completed, strokeData, currentStrokeIdx]);

  // Get canvas point from mouse/touch event
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
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
  }, [canvasSize]);

  // Check if point is near current stroke path
  const checkPathProximity = useCallback((point: { x: number; y: number }): {
    onPath: boolean;
    distance: number;
    closestSampleIdx: number;
  } => {
    const stroke = strokeData.strokes[currentStrokeRef.current];
    if (!stroke) return { onPath: false, distance: Infinity, closestSampleIdx: -1 };

    const samples = getStrokeSamplePoints(stroke);
    let minDist = Infinity;
    let closestIdx = -1;

    for (let i = 0; i < samples.length; i++) {
      const dx = point.x - samples[i].x;
      const dy = point.y - samples[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }

    return {
      onPath: minDist <= MAX_DISTANCE_TOLERANCE,
      distance: minDist,
      closestSampleIdx: closestIdx,
    };
  }, [strokeData]);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (completed) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    if (!point) return;

    // Check if starting near the current stroke
    const proximity = checkPathProximity(point);
    const currentStroke = strokeData.strokes[currentStrokeRef.current];
    
    if (!currentStroke) return;

    // Must start near the current stroke
    if (!proximity.onPath) return;

    setIsDrawing(true);
    isDrawingRef.current = true;
    setShowHint(false);
    setUserPath([point]);
    userPathRef.current = [point];
    setOffPathWarning(false);
  }, [completed, getCanvasPoint, checkPathProximity, strokeData]);

  // Draw / trace
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current || completed) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    // Check proximity to path
    const proximity = checkPathProximity(point);

    // Show warning if off path
    if (!proximity.onPath) {
      setOffPathWarning(true);
    } else {
      setOffPathWarning(false);
    }

    // Only add point if reasonably close to path (kid-forgiving)
    if (proximity.distance <= MAX_DISTANCE_TOLERANCE * 1.8) {
      const newPath = [...userPathRef.current, point];
      setUserPath(newPath);
      userPathRef.current = newPath;

      // Mark sample as covered
      if (proximity.closestSampleIdx >= 0) {
        const strokeIdx = currentStrokeRef.current;
        setStrokeProgresses(prev => {
          const updated = [...prev];
          const progress = { ...updated[strokeIdx] };
          progress.coveredSamples = new Set(progress.coveredSamples);
          progress.coveredSamples.add(proximity.closestSampleIdx);
          
          // Check if stroke is complete
          const stroke = strokeData.strokes[strokeIdx];
          const totalSamples = stroke.sampleCount;
          const coverage = progress.coveredSamples.size / totalSamples;
          
          // Also check if user traced enough length of the stroke
          const pathLength = newPath.length;
          const minPoints = Math.max(5, totalSamples * MIN_TRACING_LENGTH * 0.5);
          
          progress.isComplete = coverage >= STROKE_THRESHOLD && pathLength >= minPoints;
          
          updated[strokeIdx] = progress;
          return updated;
        });
      }

      // Add sparkle particles
      if (Math.random() > 0.7) {
        const newParticles = Array.from({ length: 2 }).map((_, i) => ({
          id: Date.now() + i + Math.random() * 1000,
          x: point.x * canvasSize,
          y: point.y * canvasSize,
          color: letter.color,
          size: 3 + Math.random() * 4,
        }));
        setParticles(prev => [...prev.slice(-20), ...newParticles]);
      }
    }
  }, [completed, getCanvasPoint, checkPathProximity, strokeData, canvasSize, letter.color]);

  // Stop drawing and evaluate
  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    setIsDrawing(false);
    isDrawingRef.current = false;
    setOffPathWarning(false);

    const strokeIdx = currentStrokeRef.current;
    const progress = strokeProgressesRef.current[strokeIdx];
    
    if (progress?.isComplete) {
      // Stroke completed! Move to next
      playCorrectSound();
      
      // Clear user path
      setUserPath([]);
      userPathRef.current = [];

      if (strokeIdx < totalStrokes - 1) {
        // Move to next stroke
        setTimeout(() => {
          setCurrentStrokeIdx(prev => prev + 1);
          setShowHint(true);
        }, 400);
      } else {
        // All strokes complete!
        setCompleted(true);
        speakArabic(letter.letter);
        setTimeout(() => onComplete(3), 2000);
      }
    } else {
      // Stroke not complete - reset path but keep progress
      setUserPath([]);
      userPathRef.current = [];
      setShowHint(true);
    }
  }, [totalStrokes, letter, onComplete]);

  // Get arrow position on current stroke path
  const getArrowPosition = useMemo(() => {
    const stroke = strokeData.strokes[currentStrokeIdx];
    if (!stroke) return null;
    
    const samples = getStrokeSamplePoints(stroke);
    if (samples.length === 0) return null;
    
    const idx = Math.min(
      Math.floor(arrowPosition * samples.length),
      samples.length - 1
    );
    
    // Get direction for rotation
    const nextIdx = Math.min(idx + 1, samples.length - 1);
    const dx = samples[nextIdx].x - samples[idx].x;
    const dy = samples[nextIdx].y - samples[idx].y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return {
      x: samples[idx].x * canvasSize,
      y: samples[idx].y * canvasSize,
      angle: angle + 90,
    };
  }, [arrowPosition, currentStrokeIdx, strokeData, canvasSize]);

  // Get current stroke coverage percentage
  const currentCoverage = useMemo(() => {
    const progress = strokeProgresses[currentStrokeIdx];
    if (!progress) return 0;
    const stroke = strokeData.strokes[currentStrokeIdx];
    return Math.min(100, Math.floor((progress.coveredSamples.size / stroke.sampleCount) * 100));
  }, [strokeProgresses, currentStrokeIdx, strokeData]);

  // Clear and restart
  const handleClear = useCallback(() => {
    setCurrentStrokeIdx(0);
    setStrokeProgresses(strokeData.strokes.map(() => ({ coveredSamples: new Set<number>(), isComplete: false })));
    setIsDrawing(false);
    isDrawingRef.current = false;
    setCompleted(false);
    setUserPath([]);
    userPathRef.current = [];
    setParticles([]);
    setShowHint(true);
    setOffPathWarning(false);
    arrowStartTimeRef.current = 0;
  }, [strokeData]);

  // Get label for current stroke
  const currentStrokeLabel = strokeData.strokes[currentStrokeIdx]?.label || 'Trace the letter';

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
        <p className="text-sm text-gray-400">
          Follow the arrow along the dotted line
        </p>
      </motion.div>

      {/* Stroke progress indicator */}
      <div className="flex items-center gap-2 mb-3">
        {strokeData.strokes.map((_, idx) => (
          <div
            key={idx}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx < currentStrokeIdx
                ? 'w-6 bg-green-400'
                : idx === currentStrokeIdx
                ? 'w-8'
                : 'w-4 bg-gray-200'
            }`}
            style={
              idx === currentStrokeIdx && !completed
                ? { backgroundColor: letter.color }
                : undefined
            }
          />
        ))}
      </div>

      {/* Current stroke hint */}
      <AnimatePresence mode="wait">
        {!completed && showHint && (
          <motion.div
            key={`hint-${currentStrokeIdx}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-center mb-2 px-4 py-1.5 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: `${letter.color}15`,
              color: letter.color,
            }}
          >
            {currentStrokeLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Off-path warning */}
      <AnimatePresence>
        {offPathWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center mb-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-200"
          >
            Stay on the line! ✋
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* Sparkle particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full pointer-events-none z-10"
              style={{
                left: p.x - p.size / 2,
                top: p.y - p.size / 2,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0, opacity: 0, y: -15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </AnimatePresence>

        {/* Animated arrow guide */}
        {!completed && !isDrawing && getArrowPosition && (
          <motion.div
            className="absolute z-20 pointer-events-none"
            style={{
              left: getArrowPosition.x,
              top: getArrowPosition.y,
              transform: `translate(-50%, -50%) rotate(${getArrowPosition.angle}deg)`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            >
              <path
                d="M12 4L12 16M12 16L7 11M12 16L17 11"
                stroke={letter.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="10" stroke={letter.color} strokeWidth="2" fill="white" fillOpacity="0.9" />
              <path
                d="M12 8L12 16M12 16L8 12M12 16L16 12"
                stroke={letter.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}

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
                <p className="text-sm text-gray-500 mt-1">
                  You traced {letter.name}!
                </p>
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
          <div className="text-xs text-gray-400">
            Stroke {currentStrokeIdx + 1} of {totalStrokes}
          </div>
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: letter.color }}
              animate={{ width: `${currentCoverage}%` }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </div>
          <div className="text-xs font-medium" style={{ color: letter.color }}>
            {currentCoverage}%
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
