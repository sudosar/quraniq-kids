/**
 * Letter Stroke Paths - Guided tracing paths for all 28 Arabic letters
 * (rewritten 2026-10-30 after a glyph audit found 27 of 28 paths wrong)
 *
 * Each letter has 1-4 strokes defined as a series of points (x, y) in normalized
 * coordinates (0-1 range). The game maps these to the canvas size.
 *
 * Stroke order follows traditional Arabic writing:
 * - Right-to-left for main strokes (paths start on the right)
 * - Dots are placed last
 *
 * Each stroke has:
 * - points: array of {x, y} control points forming the path
 * - type: 'main' | 'dot' | 'diacritic'
 * - label: hint text (e.g., "Start here", "Draw the curve")
 *
 * Dots: a dot stroke is a tiny 2-point segment centred on the dot.
 * TracingGame renders type:'dot' as a filled circle at the segment
 * midpoint and completes it on a single tap — dots are never traced
 * as lines.
 */

export interface StrokePoint {
  x: number;  // 0-1 normalized
  y: number;  // 0-1 normalized
}

export interface LetterStroke {
  points: StrokePoint[];
  type: 'main' | 'dot' | 'diacritic';
  label: string;
  /** Approximate width of the stroke line (for hit detection) */
  strokeWidth: number;
  /** Number of sample points along the path for coverage checking */
  sampleCount: number;
}

export interface LetterStrokeData {
  letter: string;
  strokes: LetterStroke[];
}

// Helper: Generate interpolated points along a bezier-like curve
function interpolatePoints(points: StrokePoint[], count: number): StrokePoint[] {
  if (points.length < 2) return points;
  
  const result: StrokePoint[] = [];
  const totalSegments = points.length - 1;
  
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const segmentT = t * totalSegments;
    const segmentIdx = Math.min(Math.floor(segmentT), totalSegments - 1);
    const localT = segmentT - segmentIdx;
    
    const p0 = points[segmentIdx];
    const p1 = points[segmentIdx + 1];
    
    // Smooth interpolation
    const smoothT = localT * localT * (3 - 2 * localT); // smoothstep
    
    result.push({
      x: p0.x + (p1.x - p0.x) * smoothT,
      y: p0.y + (p1.y - p0.y) * smoothT,
    });
  }
  
  return result;
}

// Get all sample points for a stroke (for path coverage checking)
export function getStrokeSamplePoints(stroke: LetterStroke): StrokePoint[] {
  return interpolatePoints(stroke.points, stroke.sampleCount);
}

// Calculate distance from a point to the nearest point on a stroke path
export function distanceToStroke(x: number, y: number, stroke: LetterStroke): number {
  const samples = getStrokeSamplePoints(stroke);
  let minDist = Infinity;
  
  for (const sample of samples) {
    const dx = x - sample.x;
    const dy = y - sample.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
  }
  
  return minDist;
}

// Check if a point is near any stroke in the letter
export function isPointNearStrokes(
  x: number, 
  y: number, 
  strokes: LetterStroke[],
  maxDistance: number = 0.08
): { near: boolean; closestStroke: number; distance: number } {
  let minDist = Infinity;
  let closestStroke = -1;
  
  for (let i = 0; i < strokes.length; i++) {
    const dist = distanceToStroke(x, y, strokes[i]);
    if (dist < minDist) {
      minDist = dist;
      closestStroke = i;
    }
  }
  
  return {
    near: minDist <= maxDistance,
    closestStroke,
    distance: minDist,
  };
}

// Stroke path definitions for all 28 Arabic letters
// Coordinates are in normalized 0-1 space (0,0 = top-left, 1,1 = bottom-right)
// Arabic is RTL, so strokes generally flow right-to-left

const strokePaths: Record<string, LetterStrokeData> = {
  // ا
  'ا': {
    letter: 'ا',
    strokes: [
      {
        points: [
          { x: 0.50, y: 0.15 },
          { x: 0.50, y: 0.85 }
        ],
        type: 'main',
        label: 'Draw from top to bottom',
        strokeWidth: 0.08,
        sampleCount: 30,
      },
    ],
  },

  // ب
  'ب': {
    letter: 'ب',
    strokes: [
      {
        points: [
          { x: 0.74, y: 0.34 },
          { x: 0.58, y: 0.38 },
          { x: 0.40, y: 0.38 },
          { x: 0.28, y: 0.44 },
          { x: 0.28, y: 0.56 },
          { x: 0.42, y: 0.63 },
          { x: 0.60, y: 0.63 },
          { x: 0.72, y: 0.56 }
        ],
        type: 'main',
        label: 'Draw the bowl shape',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.50, y: 0.75 },
          { x: 0.50, y: 0.77 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ت
  'ت': {
    letter: 'ت',
    strokes: [
      {
        points: [
          { x: 0.74, y: 0.34 },
          { x: 0.58, y: 0.38 },
          { x: 0.40, y: 0.38 },
          { x: 0.28, y: 0.44 },
          { x: 0.28, y: 0.56 },
          { x: 0.42, y: 0.63 },
          { x: 0.60, y: 0.63 },
          { x: 0.72, y: 0.56 }
        ],
        type: 'main',
        label: 'Draw the bowl shape',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.42, y: 0.15 },
          { x: 0.42, y: 0.17 }
        ],
        type: 'dot',
        label: 'Tap the first dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.58, y: 0.15 },
          { x: 0.58, y: 0.17 }
        ],
        type: 'dot',
        label: 'Tap the second dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ث
  'ث': {
    letter: 'ث',
    strokes: [
      {
        points: [
          { x: 0.74, y: 0.34 },
          { x: 0.58, y: 0.38 },
          { x: 0.40, y: 0.38 },
          { x: 0.28, y: 0.44 },
          { x: 0.28, y: 0.56 },
          { x: 0.42, y: 0.63 },
          { x: 0.60, y: 0.63 },
          { x: 0.72, y: 0.56 }
        ],
        type: 'main',
        label: 'Draw the bowl shape',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.50, y: 0.10 },
          { x: 0.50, y: 0.12 }
        ],
        type: 'dot',
        label: 'Tap the top dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.40, y: 0.18 },
          { x: 0.40, y: 0.20 }
        ],
        type: 'dot',
        label: 'Tap the left dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.60, y: 0.18 },
          { x: 0.60, y: 0.20 }
        ],
        type: 'dot',
        label: 'Tap the right dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ج
  'ج': {
    letter: 'ج',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.22 },
          { x: 0.52, y: 0.20 },
          { x: 0.36, y: 0.26 },
          { x: 0.30, y: 0.40 },
          { x: 0.34, y: 0.56 },
          { x: 0.46, y: 0.68 },
          { x: 0.62, y: 0.68 },
          { x: 0.70, y: 0.58 },
          { x: 0.68, y: 0.48 }
        ],
        type: 'main',
        label: 'Draw the hook',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.50, y: 0.81 },
          { x: 0.50, y: 0.83 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ح
  'ح': {
    letter: 'ح',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.22 },
          { x: 0.52, y: 0.20 },
          { x: 0.36, y: 0.26 },
          { x: 0.30, y: 0.40 },
          { x: 0.34, y: 0.56 },
          { x: 0.46, y: 0.68 },
          { x: 0.62, y: 0.68 },
          { x: 0.70, y: 0.58 },
          { x: 0.68, y: 0.48 }
        ],
        type: 'main',
        label: 'Draw the open hook',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // خ
  'خ': {
    letter: 'خ',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.22 },
          { x: 0.52, y: 0.20 },
          { x: 0.36, y: 0.26 },
          { x: 0.30, y: 0.40 },
          { x: 0.34, y: 0.56 },
          { x: 0.46, y: 0.68 },
          { x: 0.62, y: 0.68 },
          { x: 0.70, y: 0.58 },
          { x: 0.68, y: 0.48 }
        ],
        type: 'main',
        label: 'Draw the hook',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.50, y: 0.09 },
          { x: 0.50, y: 0.11 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // د
  'د': {
    letter: 'د',
    strokes: [
      {
        points: [
          { x: 0.68, y: 0.28 },
          { x: 0.52, y: 0.26 },
          { x: 0.38, y: 0.32 },
          { x: 0.34, y: 0.44 },
          { x: 0.42, y: 0.54 },
          { x: 0.56, y: 0.56 },
          { x: 0.66, y: 0.50 }
        ],
        type: 'main',
        label: 'Draw the curve',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // ذ
  'ذ': {
    letter: 'ذ',
    strokes: [
      {
        points: [
          { x: 0.68, y: 0.28 },
          { x: 0.52, y: 0.26 },
          { x: 0.38, y: 0.32 },
          { x: 0.34, y: 0.44 },
          { x: 0.42, y: 0.54 },
          { x: 0.56, y: 0.56 },
          { x: 0.66, y: 0.50 }
        ],
        type: 'main',
        label: 'Draw the curve',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.50, y: 0.12 },
          { x: 0.50, y: 0.14 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ر
  'ر': {
    letter: 'ر',
    strokes: [
      {
        points: [
          { x: 0.66, y: 0.26 },
          { x: 0.50, y: 0.26 },
          { x: 0.38, y: 0.34 },
          { x: 0.38, y: 0.48 },
          { x: 0.48, y: 0.58 },
          { x: 0.62, y: 0.58 },
          { x: 0.68, y: 0.52 }
        ],
        type: 'main',
        label: 'Draw the small hook',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // ز
  'ز': {
    letter: 'ز',
    strokes: [
      {
        points: [
          { x: 0.66, y: 0.26 },
          { x: 0.50, y: 0.26 },
          { x: 0.38, y: 0.34 },
          { x: 0.38, y: 0.48 },
          { x: 0.48, y: 0.58 },
          { x: 0.62, y: 0.58 },
          { x: 0.68, y: 0.52 }
        ],
        type: 'main',
        label: 'Draw the curve',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.50, y: 0.12 },
          { x: 0.50, y: 0.14 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // س
  'س': {
    letter: 'س',
    strokes: [
      {
        points: [
          { x: 0.78, y: 0.34 },
          { x: 0.70, y: 0.28 },
          { x: 0.64, y: 0.36 },
          { x: 0.58, y: 0.28 },
          { x: 0.52, y: 0.36 },
          { x: 0.46, y: 0.28 },
          { x: 0.40, y: 0.36 },
          { x: 0.30, y: 0.44 },
          { x: 0.28, y: 0.56 },
          { x: 0.40, y: 0.64 },
          { x: 0.60, y: 0.64 },
          { x: 0.74, y: 0.56 }
        ],
        type: 'main',
        label: 'Draw the three teeth',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
    ],
  },

  // ش
  'ش': {
    letter: 'ش',
    strokes: [
      {
        points: [
          { x: 0.78, y: 0.34 },
          { x: 0.70, y: 0.28 },
          { x: 0.64, y: 0.36 },
          { x: 0.58, y: 0.28 },
          { x: 0.52, y: 0.36 },
          { x: 0.46, y: 0.28 },
          { x: 0.40, y: 0.36 },
          { x: 0.30, y: 0.44 },
          { x: 0.28, y: 0.56 },
          { x: 0.40, y: 0.64 },
          { x: 0.60, y: 0.64 },
          { x: 0.74, y: 0.56 }
        ],
        type: 'main',
        label: 'Draw the three teeth',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
      {
        points: [
          { x: 0.50, y: 0.09 },
          { x: 0.50, y: 0.11 }
        ],
        type: 'dot',
        label: 'Tap the top dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.40, y: 0.16 },
          { x: 0.40, y: 0.18 }
        ],
        type: 'dot',
        label: 'Tap the left dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.60, y: 0.16 },
          { x: 0.60, y: 0.18 }
        ],
        type: 'dot',
        label: 'Tap the right dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ص
  'ص': {
    letter: 'ص',
    strokes: [
      {
        points: [
          { x: 0.68, y: 0.26 },
          { x: 0.50, y: 0.24 },
          { x: 0.44, y: 0.32 },
          { x: 0.46, y: 0.40 },
          { x: 0.56, y: 0.44 },
          { x: 0.68, y: 0.42 },
          { x: 0.70, y: 0.34 },
          { x: 0.56, y: 0.44 },
          { x: 0.40, y: 0.50 },
          { x: 0.30, y: 0.58 },
          { x: 0.34, y: 0.68 },
          { x: 0.50, y: 0.72 },
          { x: 0.68, y: 0.70 },
          { x: 0.76, y: 0.62 }
        ],
        type: 'main',
        label: 'Draw the loop, then the bowl',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
    ],
  },

  // ض
  'ض': {
    letter: 'ض',
    strokes: [
      {
        points: [
          { x: 0.68, y: 0.26 },
          { x: 0.50, y: 0.24 },
          { x: 0.44, y: 0.32 },
          { x: 0.46, y: 0.40 },
          { x: 0.56, y: 0.44 },
          { x: 0.68, y: 0.42 },
          { x: 0.70, y: 0.34 },
          { x: 0.56, y: 0.44 },
          { x: 0.40, y: 0.50 },
          { x: 0.30, y: 0.58 },
          { x: 0.34, y: 0.68 },
          { x: 0.50, y: 0.72 },
          { x: 0.68, y: 0.70 },
          { x: 0.76, y: 0.62 }
        ],
        type: 'main',
        label: 'Draw the loop, then the bowl',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
      {
        points: [
          { x: 0.56, y: 0.11 },
          { x: 0.56, y: 0.13 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ط
  'ط': {
    letter: 'ط',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.18 },
          { x: 0.70, y: 0.50 },
          { x: 0.52, y: 0.56 },
          { x: 0.34, y: 0.56 },
          { x: 0.28, y: 0.64 },
          { x: 0.44, y: 0.70 },
          { x: 0.64, y: 0.68 },
          { x: 0.74, y: 0.60 }
        ],
        type: 'main',
        label: 'Draw down, then the bowl',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // ظ
  'ظ': {
    letter: 'ظ',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.18 },
          { x: 0.70, y: 0.50 },
          { x: 0.52, y: 0.56 },
          { x: 0.34, y: 0.56 },
          { x: 0.28, y: 0.64 },
          { x: 0.44, y: 0.70 },
          { x: 0.64, y: 0.68 },
          { x: 0.74, y: 0.60 }
        ],
        type: 'main',
        label: 'Draw down, then the bowl',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.70, y: 0.08 },
          { x: 0.70, y: 0.10 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ع
  'ع': {
    letter: 'ع',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.24 },
          { x: 0.56, y: 0.20 },
          { x: 0.44, y: 0.26 },
          { x: 0.44, y: 0.36 },
          { x: 0.54, y: 0.42 },
          { x: 0.64, y: 0.38 },
          { x: 0.62, y: 0.30 },
          { x: 0.48, y: 0.44 },
          { x: 0.34, y: 0.54 },
          { x: 0.30, y: 0.66 },
          { x: 0.44, y: 0.74 },
          { x: 0.64, y: 0.74 },
          { x: 0.76, y: 0.64 }
        ],
        type: 'main',
        label: 'Draw the loop, then the deep bowl',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
    ],
  },

  // غ
  'غ': {
    letter: 'غ',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.24 },
          { x: 0.56, y: 0.20 },
          { x: 0.44, y: 0.26 },
          { x: 0.44, y: 0.36 },
          { x: 0.54, y: 0.42 },
          { x: 0.64, y: 0.38 },
          { x: 0.62, y: 0.30 },
          { x: 0.48, y: 0.44 },
          { x: 0.34, y: 0.54 },
          { x: 0.30, y: 0.66 },
          { x: 0.44, y: 0.74 },
          { x: 0.64, y: 0.74 },
          { x: 0.76, y: 0.64 }
        ],
        type: 'main',
        label: 'Draw the loop, then the deep bowl',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
      {
        points: [
          { x: 0.56, y: 0.08 },
          { x: 0.56, y: 0.10 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ف
  'ف': {
    letter: 'ف',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.26 },
          { x: 0.56, y: 0.22 },
          { x: 0.46, y: 0.28 },
          { x: 0.48, y: 0.38 },
          { x: 0.60, y: 0.42 },
          { x: 0.70, y: 0.36 },
          { x: 0.56, y: 0.48 },
          { x: 0.38, y: 0.52 },
          { x: 0.30, y: 0.60 },
          { x: 0.44, y: 0.68 },
          { x: 0.64, y: 0.68 },
          { x: 0.74, y: 0.60 }
        ],
        type: 'main',
        label: 'Draw the loop, then the bowl',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
      {
        points: [
          { x: 0.58, y: 0.10 },
          { x: 0.58, y: 0.12 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ق
  'ق': {
    letter: 'ق',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.26 },
          { x: 0.56, y: 0.22 },
          { x: 0.46, y: 0.28 },
          { x: 0.48, y: 0.38 },
          { x: 0.60, y: 0.42 },
          { x: 0.70, y: 0.36 },
          { x: 0.56, y: 0.50 },
          { x: 0.36, y: 0.54 },
          { x: 0.28, y: 0.64 },
          { x: 0.42, y: 0.74 },
          { x: 0.64, y: 0.74 },
          { x: 0.76, y: 0.64 }
        ],
        type: 'main',
        label: 'Draw the loop, then the deep bowl',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
      {
        points: [
          { x: 0.50, y: 0.10 },
          { x: 0.50, y: 0.12 }
        ],
        type: 'dot',
        label: 'Tap the first dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.64, y: 0.10 },
          { x: 0.64, y: 0.12 }
        ],
        type: 'dot',
        label: 'Tap the second dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ك
  'ك': {
    letter: 'ك',
    strokes: [
      {
        points: [
          { x: 0.70, y: 0.18 },
          { x: 0.70, y: 0.52 },
          { x: 0.52, y: 0.58 },
          { x: 0.34, y: 0.58 },
          { x: 0.28, y: 0.66 },
          { x: 0.44, y: 0.72 },
          { x: 0.64, y: 0.70 },
          { x: 0.74, y: 0.62 }
        ],
        type: 'main',
        label: 'Draw down, then the bowl',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // ل
  'ل': {
    letter: 'ل',
    strokes: [
      {
        points: [
          { x: 0.62, y: 0.15 },
          { x: 0.62, y: 0.52 },
          { x: 0.56, y: 0.64 },
          { x: 0.42, y: 0.70 },
          { x: 0.30, y: 0.66 },
          { x: 0.28, y: 0.58 }
        ],
        type: 'main',
        label: 'Draw down, then hook the foot',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // م
  'م': {
    letter: 'م',
    strokes: [
      {
        points: [
          { x: 0.64, y: 0.24 },
          { x: 0.52, y: 0.18 },
          { x: 0.40, y: 0.24 },
          { x: 0.40, y: 0.34 },
          { x: 0.50, y: 0.40 },
          { x: 0.62, y: 0.36 },
          { x: 0.58, y: 0.26 },
          { x: 0.48, y: 0.40 },
          { x: 0.46, y: 0.58 },
          { x: 0.44, y: 0.74 }
        ],
        type: 'main',
        label: 'Draw the loop, then the tail',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // ن
  'ن': {
    letter: 'ن',
    strokes: [
      {
        points: [
          { x: 0.74, y: 0.32 },
          { x: 0.58, y: 0.38 },
          { x: 0.40, y: 0.38 },
          { x: 0.28, y: 0.44 },
          { x: 0.30, y: 0.56 },
          { x: 0.44, y: 0.64 },
          { x: 0.62, y: 0.64 },
          { x: 0.74, y: 0.56 }
        ],
        type: 'main',
        label: 'Draw the bowl',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.51, y: 0.17 },
          { x: 0.51, y: 0.19 }
        ],
        type: 'dot',
        label: 'Tap the dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // ه
  'ه': {
    letter: 'ه',
    strokes: [
      {
        points: [
          { x: 0.56, y: 0.18 },
          { x: 0.42, y: 0.22 },
          { x: 0.34, y: 0.34 },
          { x: 0.38, y: 0.50 },
          { x: 0.52, y: 0.58 },
          { x: 0.66, y: 0.52 },
          { x: 0.70, y: 0.38 },
          { x: 0.62, y: 0.24 },
          { x: 0.56, y: 0.18 }
        ],
        type: 'main',
        label: 'Draw the teardrop loop',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // و
  'و': {
    letter: 'و',
    strokes: [
      {
        points: [
          { x: 0.62, y: 0.24 },
          { x: 0.50, y: 0.20 },
          { x: 0.40, y: 0.26 },
          { x: 0.42, y: 0.38 },
          { x: 0.54, y: 0.44 },
          { x: 0.64, y: 0.38 },
          { x: 0.62, y: 0.28 },
          { x: 0.52, y: 0.48 },
          { x: 0.40, y: 0.58 },
          { x: 0.38, y: 0.68 },
          { x: 0.50, y: 0.74 },
          { x: 0.64, y: 0.72 },
          { x: 0.72, y: 0.64 }
        ],
        type: 'main',
        label: 'Draw the loop, then the tail',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
    ],
  },

  // ي
  'ي': {
    letter: 'ي',
    strokes: [
      {
        points: [
          { x: 0.74, y: 0.34 },
          { x: 0.58, y: 0.38 },
          { x: 0.40, y: 0.38 },
          { x: 0.28, y: 0.44 },
          { x: 0.30, y: 0.56 },
          { x: 0.44, y: 0.63 },
          { x: 0.62, y: 0.62 },
          { x: 0.70, y: 0.54 },
          { x: 0.66, y: 0.66 },
          { x: 0.52, y: 0.74 },
          { x: 0.36, y: 0.74 },
          { x: 0.28, y: 0.68 }
        ],
        type: 'main',
        label: 'Draw the bowl, then the tail',
        strokeWidth: 0.08,
        sampleCount: 50,
      },
      {
        points: [
          { x: 0.42, y: 0.83 },
          { x: 0.42, y: 0.85 }
        ],
        type: 'dot',
        label: 'Tap the first dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.58, y: 0.83 },
          { x: 0.58, y: 0.85 }
        ],
        type: 'dot',
        label: 'Tap the second dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

};

/**
 * Get stroke data for a letter
 */
export function getStrokeData(letter: string): LetterStrokeData | undefined {
  return strokePaths[letter];
}

/**
 * Check if a letter has stroke path data
 */
export function hasStrokeData(letter: string): boolean {
  return letter in strokePaths;
}

/**
 * Get all supported letters
 */
export function getSupportedLetters(): string[] {
  return Object.keys(strokePaths);
}

/**
 * Fallback stroke data generator for letters without pre-defined paths
 * Creates a simple centerline based on the letter shape
 */
export function generateFallbackStroke(letter: string): LetterStrokeData {
  // Create a generic tracing path - a flowing curve from right to left
  return {
    letter,
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.25 },
          { x: 0.65, y: 0.2 },
          { x: 0.5, y: 0.2 },
          { x: 0.35, y: 0.25 },
          { x: 0.28, y: 0.38 },
          { x: 0.3, y: 0.52 },
          { x: 0.42, y: 0.6 },
          { x: 0.58, y: 0.58 },
          { x: 0.68, y: 0.48 },
          { x: 0.7, y: 0.35 },
          { x: 0.65, y: 0.55 },
          { x: 0.55, y: 0.7 },
          { x: 0.4, y: 0.75 },
        ],
        type: 'main',
        label: 'Trace along the path',
        strokeWidth: 0.1,
        sampleCount: 50,
      },
    ],
  };
}
