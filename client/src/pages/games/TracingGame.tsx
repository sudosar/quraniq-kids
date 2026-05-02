/**
 * Tracing Game
 * 
 * A fun letter tracing activity with:
 * - Large guide letter in the background
 * - Sparkle particles following the finger/mouse
 * - Progress indicator showing how much has been traced
 * - Celebration on completion
 * - Color trail that stays on the canvas
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

export default function TracingGame({ letter, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [completed, setCompleted] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const pixelsDrawn = useRef(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const targetPixels = useRef(800); // Approximate pixels needed

  const COLORS = ['#F5A623', '#E8567F', '#0D7377', '#9B59B6', '#2ECC71', '#3498DB'];

  // Initialize canvas with guide letter
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    
    // Draw guide letter
    ctx.font = `bold ${Math.min(rect.width, rect.height) * 0.7}px Amiri`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `${letter.color}20`;
    ctx.strokeStyle = `${letter.color}35`;
    ctx.lineWidth = 3;
    ctx.fillText(letter.letter, rect.width / 2, rect.height / 2);
    ctx.strokeText(letter.letter, rect.width / 2, rect.height / 2);
    
    // Draw dotted outline
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = `${letter.color}50`;
    ctx.lineWidth = 2;
    ctx.strokeText(letter.letter, rect.width / 2, rect.height / 2);
    ctx.setLineDash([]);
  }, [letter]);

  const addParticles = useCallback((x: number, y: number) => {
    const newParticles = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + i + Math.random() * 1000,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
    }));
    setParticles(prev => [...prev.slice(-30), ...newParticles]);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (completed) return;
    setIsDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || completed) return;
    e.preventDefault();
    
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx && lastPoint.current) {
      const dx = pos.x - lastPoint.current.x;
      const dy = pos.y - lastPoint.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Draw colorful stroke
      const gradient = ctx.createLinearGradient(
        lastPoint.current.x, lastPoint.current.y, pos.x, pos.y
      );
      gradient.addColorStop(0, letter.color);
      gradient.addColorStop(1, COLORS[Math.floor(Math.random() * COLORS.length)]);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      
      // Track progress
      pixelsDrawn.current += dist;
      const newProgress = Math.min(100, (pixelsDrawn.current / targetPixels.current) * 100);
      setProgress(newProgress);
      
      // Add sparkle particles
      if (dist > 5) {
        addParticles(pos.x, pos.y);
      }
      
      // Check completion
      if (newProgress >= 100 && !completed) {
        setCompleted(true);
        playCorrectSound();
        speakArabic(letter.letter);
        setTimeout(() => onComplete(2), 1500);
      }
    }
    
    lastPoint.current = pos;
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStrokeCount(prev => prev + 1);
      lastPoint.current = null;
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Redraw guide
    ctx.font = `bold ${Math.min(rect.width, rect.height) * 0.7}px Amiri`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `${letter.color}20`;
    ctx.strokeStyle = `${letter.color}35`;
    ctx.lineWidth = 3;
    ctx.fillText(letter.letter, rect.width / 2, rect.height / 2);
    ctx.strokeText(letter.letter, rect.width / 2, rect.height / 2);
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = `${letter.color}50`;
    ctx.lineWidth = 2;
    ctx.strokeText(letter.letter, rect.width / 2, rect.height / 2);
    ctx.setLineDash([]);
    
    pixelsDrawn.current = 0;
    setProgress(0);
    setParticles([]);
    setStrokeCount(0);
  };

  return (
    <div className="h-full flex flex-col items-center px-4 py-4">
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-3"
      >
        <h3 className="text-xl font-bold text-gray-700" style={{ fontFamily: 'var(--font-heading)' }}>
          ✏️ Trace the letter!
        </h3>
        <p className="text-sm text-gray-400">Draw over the dotted letter with your finger</p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-sm h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: letter.color }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100 }}
        />
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 w-full max-w-md rounded-3xl overflow-hidden bg-white shadow-inner border-2 border-gray-100">
        {/* Sparkle particles */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full pointer-events-none z-10"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
            }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 0, opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          />
        ))}

        {/* Completion overlay */}
        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="text-center"
            >
              <span className="text-6xl block mb-2">🌟</span>
              <p className="text-2xl font-bold text-teal-600" style={{ fontFamily: 'var(--font-heading)' }}>
                Beautiful!
              </p>
            </motion.div>
          </motion.div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Clear button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={clearCanvas}
        className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-full font-semibold hover:bg-gray-200 transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        🔄 Start Over
      </motion.button>
    </div>
  );
}
