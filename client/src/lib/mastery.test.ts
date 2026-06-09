import { describe, it, expect } from 'vitest';
import {
  createMastery,
  applyResult,
  isDue,
  isMastered,
  getDueLetterIds,
  getMasteryStats,
  MASTERED_STRENGTH,
  MAX_STRENGTH,
  type MasteryMap,
} from './mastery';

const day = (s: string) => new Date(`${s}T12:00:00`);

describe('mastery spaced repetition', () => {
  it('introduces a letter due immediately at strength 1', () => {
    const m = createMastery(1, day('2026-01-01'));
    expect(m.strength).toBe(1);
    expect(isDue(m, day('2026-01-01'))).toBe(true);
  });

  it('correct reps climb boxes and push the due date out', () => {
    let m = createMastery(1, day('2026-01-01'));
    m = applyResult(m, true, day('2026-01-01')); // strength 2 → +2 days
    expect(m.strength).toBe(2);
    expect(m.correct).toBe(1);
    expect(isDue(m, day('2026-01-02'))).toBe(false);
    expect(isDue(m, day('2026-01-03'))).toBe(true);
  });

  it('a miss drops a box but never below 1 and is due tomorrow', () => {
    let m = createMastery(1, day('2026-01-01'));
    m = applyResult(m, true, day('2026-01-01')); // 2
    m = applyResult(m, false, day('2026-01-03')); // back to 1
    expect(m.strength).toBe(1);
    expect(m.incorrect).toBe(1);
    expect(isDue(m, day('2026-01-04'))).toBe(true);
  });

  it('reaches mastered after enough correct reps and caps at MAX', () => {
    let m = createMastery(1, day('2026-01-01'));
    let d = 1;
    for (let i = 0; i < 10; i++) {
      m = applyResult(m, true, day(`2026-02-${String(d++).padStart(2, '0')}`));
    }
    expect(m.strength).toBe(MAX_STRENGTH);
    expect(isMastered(m)).toBe(true);
    expect(m.strength).toBeGreaterThanOrEqual(MASTERED_STRENGTH);
  });

  it('orders due letters weakest-first and counts stats', () => {
    const map: MasteryMap = {
      1: { letterId: 1, strength: 3, correct: 3, incorrect: 0, lastSeen: '2026-01-01', dueDate: '2026-01-01' },
      2: { letterId: 2, strength: 1, correct: 0, incorrect: 1, lastSeen: '2026-01-01', dueDate: '2026-01-01' },
      3: { letterId: 3, strength: 4, correct: 5, incorrect: 0, lastSeen: '2026-01-01', dueDate: '2026-12-01' }, // not due
    };
    const today = day('2026-01-02');
    expect(getDueLetterIds(map, today)).toEqual([2, 1]); // weakest first, #3 not due
    expect(getMasteryStats(map, today)).toEqual({ introduced: 3, mastered: 1, due: 2 });
  });
});
