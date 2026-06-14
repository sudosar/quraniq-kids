/**
 * Letter Stroke Paths - Guided tracing paths for all 28 Arabic letters
 * 
 * Each letter has 1-3 strokes defined as a series of points (x, y) in normalized
 * coordinates (0-1 range). The game maps these to the canvas size.
 * 
 * Stroke order follows traditional Arabic writing:
 * - Right-to-left for main strokes
 * - Dots are placed last
 * 
 * Each stroke has:
 * - points: array of {x, y} control points forming the path
 * - type: 'main' | 'dot' | 'diacritic'
 * - label: hint text (e.g., "Start here", "Draw the curve")
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
  // Alif - vertical stroke from top to bottom
  'ا': {
    letter: 'ا',
    strokes: [
      {
        points: [
          { x: 0.5, y: 0.15 },
          { x: 0.5, y: 0.85 },
        ],
        type: 'main',
        label: 'Draw from top to bottom',
        strokeWidth: 0.08,
        sampleCount: 30,
      },
    ],
  },

  // Ba - bowl shape + dot below
  'ب': {
    letter: 'ب',
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.35 },
          { x: 0.65, y: 0.25 },
          { x: 0.5, y: 0.2 },
          { x: 0.35, y: 0.25 },
          { x: 0.25, y: 0.4 },
          { x: 0.3, y: 0.55 },
          { x: 0.45, y: 0.6 },
          { x: 0.6, y: 0.55 },
          { x: 0.7, y: 0.45 },
        ],
        type: 'main',
        label: 'Draw the bowl shape',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.5, y: 0.75 },
          { x: 0.5, y: 0.85 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Ta - bowl shape + two dots above
  'ت': {
    letter: 'ت',
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.35 },
          { x: 0.65, y: 0.25 },
          { x: 0.5, y: 0.2 },
          { x: 0.35, y: 0.25 },
          { x: 0.25, y: 0.4 },
          { x: 0.3, y: 0.55 },
          { x: 0.45, y: 0.6 },
          { x: 0.6, y: 0.55 },
          { x: 0.7, y: 0.45 },
        ],
        type: 'main',
        label: 'Draw the bowl shape',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.42, y: 0.12 },
          { x: 0.42, y: 0.18 },
        ],
        type: 'dot',
        label: 'First dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.58, y: 0.12 },
          { x: 0.58, y: 0.18 },
        ],
        type: 'dot',
        label: 'Second dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // Tha - bowl shape + three dots above
  'ث': {
    letter: 'ث',
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.4 },
          { x: 0.65, y: 0.3 },
          { x: 0.5, y: 0.25 },
          { x: 0.35, y: 0.3 },
          { x: 0.25, y: 0.45 },
          { x: 0.3, y: 0.6 },
          { x: 0.45, y: 0.65 },
          { x: 0.6, y: 0.6 },
          { x: 0.7, y: 0.5 },
        ],
        type: 'main',
        label: 'Draw the bowl shape',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.35, y: 0.12 },
          { x: 0.35, y: 0.18 },
        ],
        type: 'dot',
        label: 'First dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.5, y: 0.12 },
          { x: 0.5, y: 0.18 },
        ],
        type: 'dot',
        label: 'Second dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.65, y: 0.12 },
          { x: 0.65, y: 0.18 },
        ],
        type: 'dot',
        label: 'Third dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // Jeem - hook shape + dot below
  'ج': {
    letter: 'ج',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.2 },
          { x: 0.55, y: 0.2 },
          { x: 0.4, y: 0.25 },
          { x: 0.3, y: 0.35 },
          { x: 0.3, y: 0.5 },
          { x: 0.4, y: 0.6 },
          { x: 0.55, y: 0.55 },
          { x: 0.6, y: 0.4 },
          { x: 0.5, y: 0.35 },
          { x: 0.35, y: 0.4 },
        ],
        type: 'main',
        label: 'Draw the hook',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.5, y: 0.78 },
          { x: 0.5, y: 0.85 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Ha - open hook shape
  'ح': {
    letter: 'ح',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.2 },
          { x: 0.55, y: 0.2 },
          { x: 0.4, y: 0.25 },
          { x: 0.3, y: 0.35 },
          { x: 0.3, y: 0.5 },
          { x: 0.4, y: 0.6 },
          { x: 0.55, y: 0.55 },
          { x: 0.6, y: 0.4 },
          { x: 0.5, y: 0.35 },
          { x: 0.35, y: 0.4 },
        ],
        type: 'main',
        label: 'Draw the open hook',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // Kha - hook shape + dot above
  'خ': {
    letter: 'خ',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.25 },
          { x: 0.55, y: 0.25 },
          { x: 0.4, y: 0.3 },
          { x: 0.3, y: 0.4 },
          { x: 0.3, y: 0.55 },
          { x: 0.4, y: 0.65 },
          { x: 0.55, y: 0.6 },
          { x: 0.6, y: 0.45 },
          { x: 0.5, y: 0.4 },
          { x: 0.35, y: 0.45 },
        ],
        type: 'main',
        label: 'Draw the hook',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.5, y: 0.1 },
          { x: 0.5, y: 0.17 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Dal - simple curve
  'د': {
    letter: 'د',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.3 },
          { x: 0.6, y: 0.2 },
          { x: 0.45, y: 0.15 },
          { x: 0.3, y: 0.2 },
          { x: 0.25, y: 0.35 },
          { x: 0.3, y: 0.5 },
          { x: 0.45, y: 0.6 },
          { x: 0.6, y: 0.55 },
        ],
        type: 'main',
        label: 'Draw the curve',
        strokeWidth: 0.08,
        sampleCount: 30,
      },
    ],
  },

  // Dhal - curve + dot above
  'ذ': {
    letter: 'ذ',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.3 },
          { x: 0.6, y: 0.2 },
          { x: 0.45, y: 0.15 },
          { x: 0.3, y: 0.2 },
          { x: 0.25, y: 0.35 },
          { x: 0.3, y: 0.5 },
          { x: 0.45, y: 0.6 },
          { x: 0.6, y: 0.55 },
        ],
        type: 'main',
        label: 'Draw the curve',
        strokeWidth: 0.08,
        sampleCount: 30,
      },
      {
        points: [
          { x: 0.5, y: 0.05 },
          { x: 0.5, y: 0.12 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Ra - small hook curve
  'ر': {
    letter: 'ر',
    strokes: [
      {
        points: [
          { x: 0.6, y: 0.2 },
          { x: 0.5, y: 0.2 },
          { x: 0.4, y: 0.25 },
          { x: 0.35, y: 0.35 },
          { x: 0.4, y: 0.45 },
          { x: 0.5, y: 0.5 },
          { x: 0.6, y: 0.45 },
        ],
        type: 'main',
        label: 'Draw the small hook',
        strokeWidth: 0.08,
        sampleCount: 25,
      },
    ],
  },

  // Zay - small hook + dot above
  'ز': {
    letter: 'ز',
    strokes: [
      {
        points: [
          { x: 0.6, y: 0.25 },
          { x: 0.5, y: 0.25 },
          { x: 0.4, y: 0.3 },
          { x: 0.35, y: 0.4 },
          { x: 0.4, y: 0.5 },
          { x: 0.5, y: 0.55 },
          { x: 0.6, y: 0.5 },
        ],
        type: 'main',
        label: 'Draw the curve',
        strokeWidth: 0.08,
        sampleCount: 25,
      },
      {
        points: [
          { x: 0.5, y: 0.08 },
          { x: 0.5, y: 0.15 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Seen - three connected humps
  'س': {
    letter: 'س',
    strokes: [
      {
        points: [
          { x: 0.8, y: 0.45 },
          { x: 0.75, y: 0.35 },
          { x: 0.65, y: 0.3 },
          { x: 0.55, y: 0.35 },
          { x: 0.5, y: 0.45 },
          { x: 0.45, y: 0.35 },
          { x: 0.35, y: 0.3 },
          { x: 0.25, y: 0.35 },
          { x: 0.2, y: 0.45 },
          { x: 0.25, y: 0.55 },
          { x: 0.35, y: 0.6 },
          { x: 0.45, y: 0.55 },
          { x: 0.55, y: 0.55 },
          { x: 0.65, y: 0.55 },
          { x: 0.75, y: 0.5 },
        ],
        type: 'main',
        label: 'Draw the three humps',
        strokeWidth: 0.08,
        sampleCount: 45,
      },
    ],
  },

  // Sheen - three humps + three dots
  'ش': {
    letter: 'ش',
    strokes: [
      {
        points: [
          { x: 0.8, y: 0.5 },
          { x: 0.75, y: 0.4 },
          { x: 0.65, y: 0.35 },
          { x: 0.55, y: 0.4 },
          { x: 0.5, y: 0.5 },
          { x: 0.45, y: 0.4 },
          { x: 0.35, y: 0.35 },
          { x: 0.25, y: 0.4 },
          { x: 0.2, y: 0.5 },
          { x: 0.25, y: 0.6 },
          { x: 0.35, y: 0.65 },
          { x: 0.45, y: 0.6 },
          { x: 0.55, y: 0.6 },
          { x: 0.65, y: 0.6 },
          { x: 0.75, y: 0.55 },
        ],
        type: 'main',
        label: 'Draw the three humps',
        strokeWidth: 0.08,
        sampleCount: 45,
      },
      {
        points: [
          { x: 0.35, y: 0.08 },
          { x: 0.35, y: 0.14 },
        ],
        type: 'dot',
        label: 'First dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.5, y: 0.02 },
          { x: 0.5, y: 0.08 },
        ],
        type: 'dot',
        label: 'Second dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.65, y: 0.08 },
          { x: 0.65, y: 0.14 },
        ],
        type: 'dot',
        label: 'Third dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // Sad - loop + vertical
  'ص': {
    letter: 'ص',
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.3 },
          { x: 0.65, y: 0.2 },
          { x: 0.5, y: 0.15 },
          { x: 0.35, y: 0.2 },
          { x: 0.25, y: 0.3 },
          { x: 0.25, y: 0.45 },
          { x: 0.35, y: 0.55 },
          { x: 0.5, y: 0.55 },
          { x: 0.65, y: 0.5 },
          { x: 0.7, y: 0.4 },
          { x: 0.7, y: 0.25 },
          { x: 0.7, y: 0.15 },
        ],
        type: 'main',
        label: 'Draw the loop',
        strokeWidth: 0.08,
        sampleCount: 45,
      },
    ],
  },

  // Dad - loop + vertical + dot
  'ض': {
    letter: 'ض',
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.3 },
          { x: 0.65, y: 0.2 },
          { x: 0.5, y: 0.15 },
          { x: 0.35, y: 0.2 },
          { x: 0.25, y: 0.3 },
          { x: 0.25, y: 0.45 },
          { x: 0.35, y: 0.55 },
          { x: 0.5, y: 0.55 },
          { x: 0.65, y: 0.5 },
          { x: 0.7, y: 0.4 },
          { x: 0.7, y: 0.25 },
          { x: 0.7, y: 0.15 },
        ],
        type: 'main',
        label: 'Draw the loop',
        strokeWidth: 0.08,
        sampleCount: 45,
      },
      {
        points: [
          { x: 0.5, y: 0.75 },
          { x: 0.5, y: 0.82 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Taa - loop shape
  'ط': {
    letter: 'ط',
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.25 },
          { x: 0.65, y: 0.18 },
          { x: 0.5, y: 0.15 },
          { x: 0.35, y: 0.18 },
          { x: 0.25, y: 0.28 },
          { x: 0.2, y: 0.42 },
          { x: 0.25, y: 0.55 },
          { x: 0.4, y: 0.62 },
          { x: 0.55, y: 0.6 },
          { x: 0.7, y: 0.5 },
          { x: 0.7, y: 0.35 },
          { x: 0.65, y: 0.22 },
        ],
        type: 'main',
        label: 'Draw the loop',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // Dhaa - loop + dot
  'ظ': {
    letter: 'ظ',
    strokes: [
      {
        points: [
          { x: 0.75, y: 0.25 },
          { x: 0.65, y: 0.18 },
          { x: 0.5, y: 0.15 },
          { x: 0.35, y: 0.18 },
          { x: 0.25, y: 0.28 },
          { x: 0.2, y: 0.42 },
          { x: 0.25, y: 0.55 },
          { x: 0.4, y: 0.62 },
          { x: 0.55, y: 0.6 },
          { x: 0.7, y: 0.5 },
          { x: 0.7, y: 0.35 },
          { x: 0.65, y: 0.22 },
        ],
        type: 'main',
        label: 'Draw the loop',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.5, y: 0.78 },
          { x: 0.5, y: 0.85 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Ayn - deep curve with hook
  'ع': {
    letter: 'ع',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.2 },
          { x: 0.55, y: 0.25 },
          { x: 0.4, y: 0.35 },
          { x: 0.3, y: 0.5 },
          { x: 0.35, y: 0.65 },
          { x: 0.5, y: 0.7 },
          { x: 0.65, y: 0.6 },
          { x: 0.6, y: 0.45 },
          { x: 0.45, y: 0.4 },
          { x: 0.3, y: 0.45 },
        ],
        type: 'main',
        label: 'Draw the deep curve',
        strokeWidth: 0.09,
        sampleCount: 40,
      },
    ],
  },

  // Ghayn - deep curve + dot
  'غ': {
    letter: 'غ',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.2 },
          { x: 0.55, y: 0.25 },
          { x: 0.4, y: 0.35 },
          { x: 0.3, y: 0.5 },
          { x: 0.35, y: 0.65 },
          { x: 0.5, y: 0.7 },
          { x: 0.65, y: 0.6 },
          { x: 0.6, y: 0.45 },
          { x: 0.45, y: 0.4 },
          { x: 0.3, y: 0.45 },
        ],
        type: 'main',
        label: 'Draw the deep curve',
        strokeWidth: 0.09,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.5, y: 0.05 },
          { x: 0.5, y: 0.12 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Fa - bowl + horizontal + dot
  'ف': {
    letter: 'ف',
    strokes: [
      {
        points: [
          { x: 0.5, y: 0.15 },
          { x: 0.5, y: 0.35 },
          { x: 0.5, y: 0.55 },
          { x: 0.5, y: 0.75 },
        ],
        type: 'main',
        label: 'Draw the vertical line',
        strokeWidth: 0.07,
        sampleCount: 25,
      },
      {
        points: [
          { x: 0.3, y: 0.35 },
          { x: 0.4, y: 0.3 },
          { x: 0.55, y: 0.3 },
          { x: 0.7, y: 0.35 },
        ],
        type: 'main',
        label: 'Draw the horizontal stroke',
        strokeWidth: 0.07,
        sampleCount: 20,
      },
      {
        points: [
          { x: 0.65, y: 0.15 },
          { x: 0.65, y: 0.22 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Qaf - bowl + two dots
  'ق': {
    letter: 'ق',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.25 },
          { x: 0.6, y: 0.18 },
          { x: 0.45, y: 0.15 },
          { x: 0.3, y: 0.2 },
          { x: 0.25, y: 0.32 },
          { x: 0.25, y: 0.48 },
          { x: 0.35, y: 0.58 },
          { x: 0.5, y: 0.58 },
          { x: 0.65, y: 0.5 },
          { x: 0.7, y: 0.35 },
          { x: 0.7, y: 0.55 },
          { x: 0.7, y: 0.75 },
        ],
        type: 'main',
        label: 'Draw the bowl',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.42, y: 0.78 },
          { x: 0.42, y: 0.85 },
        ],
        type: 'dot',
        label: 'First dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.58, y: 0.78 },
          { x: 0.58, y: 0.85 },
        ],
        type: 'dot',
        label: 'Second dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
    ],
  },

  // Kaf - vertical + curve
  'ك': {
    letter: 'ك',
    strokes: [
      {
        points: [
          { x: 0.6, y: 0.15 },
          { x: 0.6, y: 0.35 },
          { x: 0.6, y: 0.55 },
          { x: 0.6, y: 0.75 },
        ],
        type: 'main',
        label: 'Draw the vertical line',
        strokeWidth: 0.07,
        sampleCount: 25,
      },
      {
        points: [
          { x: 0.75, y: 0.25 },
          { x: 0.65, y: 0.2 },
          { x: 0.5, y: 0.2 },
          { x: 0.35, y: 0.25 },
          { x: 0.3, y: 0.38 },
          { x: 0.35, y: 0.5 },
          { x: 0.5, y: 0.52 },
          { x: 0.65, y: 0.48 },
        ],
        type: 'main',
        label: 'Draw the curve',
        strokeWidth: 0.07,
        sampleCount: 25,
      },
    ],
  },

  // Lam - vertical stroke
  'ل': {
    letter: 'ل',
    strokes: [
      {
        points: [
          { x: 0.55, y: 0.15 },
          { x: 0.55, y: 0.4 },
          { x: 0.55, y: 0.65 },
          { x: 0.55, y: 0.85 },
        ],
        type: 'main',
        label: 'Draw from top to bottom',
        strokeWidth: 0.08,
        sampleCount: 30,
      },
    ],
  },

  // Meem - loop shape
  'م': {
    letter: 'م',
    strokes: [
      {
        points: [
          { x: 0.25, y: 0.2 },
          { x: 0.25, y: 0.4 },
          { x: 0.25, y: 0.55 },
          { x: 0.35, y: 0.62 },
          { x: 0.5, y: 0.58 },
          { x: 0.6, y: 0.48 },
          { x: 0.65, y: 0.35 },
          { x: 0.65, y: 0.2 },
          { x: 0.55, y: 0.15 },
          { x: 0.4, y: 0.18 },
          { x: 0.3, y: 0.3 },
          { x: 0.35, y: 0.45 },
          { x: 0.5, y: 0.5 },
          { x: 0.6, y: 0.4 },
        ],
        type: 'main',
        label: 'Draw the loop',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // Noon - bowl shape + dot
  'ن': {
    letter: 'ن',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.3 },
          { x: 0.6, y: 0.2 },
          { x: 0.45, y: 0.15 },
          { x: 0.3, y: 0.2 },
          { x: 0.25, y: 0.32 },
          { x: 0.3, y: 0.45 },
          { x: 0.45, y: 0.52 },
          { x: 0.6, y: 0.45 },
          { x: 0.65, y: 0.32 },
        ],
        type: 'main',
        label: 'Draw the bowl',
        strokeWidth: 0.08,
        sampleCount: 30,
      },
      {
        points: [
          { x: 0.5, y: 0.72 },
          { x: 0.5, y: 0.78 },
        ],
        type: 'dot',
        label: 'Place the dot',
        strokeWidth: 0.06,
        sampleCount: 8,
      },
    ],
  },

  // Ha (final) - two loops
  'ه': {
    letter: 'ه',
    strokes: [
      {
        points: [
          { x: 0.3, y: 0.25 },
          { x: 0.3, y: 0.45 },
          { x: 0.35, y: 0.6 },
          { x: 0.5, y: 0.65 },
          { x: 0.65, y: 0.6 },
          { x: 0.7, y: 0.45 },
          { x: 0.7, y: 0.25 },
          { x: 0.6, y: 0.15 },
          { x: 0.45, y: 0.15 },
          { x: 0.35, y: 0.25 },
          { x: 0.4, y: 0.4 },
          { x: 0.55, y: 0.45 },
          { x: 0.65, y: 0.35 },
        ],
        type: 'main',
        label: 'Draw the connected loops',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
    ],
  },

  // Waw - small hook + vertical
  'و': {
    letter: 'و',
    strokes: [
      {
        points: [
          { x: 0.5, y: 0.15 },
          { x: 0.5, y: 0.4 },
          { x: 0.5, y: 0.65 },
          { x: 0.5, y: 0.8 },
        ],
        type: 'main',
        label: 'Draw the line down',
        strokeWidth: 0.08,
        sampleCount: 25,
      },
      {
        points: [
          { x: 0.65, y: 0.4 },
          { x: 0.6, y: 0.3 },
          { x: 0.5, y: 0.25 },
          { x: 0.4, y: 0.3 },
          { x: 0.4, y: 0.4 },
          { x: 0.5, y: 0.45 },
          { x: 0.6, y: 0.4 },
        ],
        type: 'main',
        label: 'Draw the hook',
        strokeWidth: 0.07,
        sampleCount: 20,
      },
    ],
  },

  // Ya - bowl shape + two dots below
  'ي': {
    letter: 'ي',
    strokes: [
      {
        points: [
          { x: 0.7, y: 0.35 },
          { x: 0.6, y: 0.25 },
          { x: 0.45, y: 0.2 },
          { x: 0.3, y: 0.25 },
          { x: 0.25, y: 0.38 },
          { x: 0.3, y: 0.52 },
          { x: 0.45, y: 0.58 },
          { x: 0.6, y: 0.5 },
          { x: 0.65, y: 0.35 },
          { x: 0.65, y: 0.55 },
          { x: 0.65, y: 0.75 },
        ],
        type: 'main',
        label: 'Draw the bowl',
        strokeWidth: 0.08,
        sampleCount: 40,
      },
      {
        points: [
          { x: 0.42, y: 0.82 },
          { x: 0.42, y: 0.88 },
        ],
        type: 'dot',
        label: 'First dot',
        strokeWidth: 0.05,
        sampleCount: 5,
      },
      {
        points: [
          { x: 0.58, y: 0.82 },
          { x: 0.58, y: 0.88 },
        ],
        type: 'dot',
        label: 'Second dot',
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
