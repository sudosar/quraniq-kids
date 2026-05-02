/**
 * TracingCanvas Component - QuranIQ Kids
 * Simple canvas for tracing Arabic letters with finger/mouse
 * Shows the letter as a guide and lets children trace over it
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TracingCanvasProps {
  letter: string;
  color: string;
  onComplete?: () => void;
}

export default function TracingCanvas({ letter, color, onComplete }: TracingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Draw guide letter
    ctx.font = `bold ${rect.width * 0.6}px Amiri`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color + '20';
    ctx.fillText(letter, rect.width / 2, rect.height / 2);
  }, [letter, color]);

  const getPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
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
  }, []);

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [color, getPos]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const endDraw = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStrokeCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3 && !completed) {
        setCompleted(true);
        onComplete?.();
      }
      return newCount;
    });
  }, [isDrawing, completed, onComplete]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Redraw guide
    ctx.font = `bold ${rect.width * 0.6}px Amiri`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color + '20';
    ctx.fillText(letter, rect.width / 2, rect.height / 2);
    
    setStrokeCount(0);
    setCompleted(false);
  }, [letter, color]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full aspect-square rounded-3xl bg-white border-4 border-amber-100 shadow-inner touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      
      {/* Clear button */}
      <button
        onClick={clearCanvas}
        className="absolute bottom-3 right-3 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-500 shadow-sm"
      >
        Clear
      </button>

      {/* Completion indicator */}
      {completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-sm">✓</span>
        </motion.div>
      )}

      {/* Hint text */}
      <p className="text-center text-xs text-gray-400 mt-2">
        Trace the letter with your finger
      </p>
    </div>
  );
}
