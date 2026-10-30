import { describe, it, expect } from 'vitest';
import {
  createMastery,
  applyResult,
  isDue,
  isMastered,
  hasPassed,
  getDueLetterIds,
  getMasteryStats,
  summariseLetterPerformance,
  ensureIntroduced,
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

  it('summarises assessed-game mistakes into one honest rep', () => {
    // Exposure only (no assessed game) records nothing.
    expect(summariseLetterPerformance([])).toBeNull();
    // Clean run, and a run averaging at most one mistake per game, pass.
    expect(summariseLetterPerformance([0, 0, 0])).toBe(true);
    expect(summariseLetterPerformance([0, 2])).toBe(true);
    // Struggling through games (more mistakes than games) does not.
    expect(summariseLetterPerformance([3, 2])).toBe(false);
    expect(summariseLetterPerformance([5])).toBe(false);
  });

  it('ensureIntroduced adds a fresh letter without touching existing ones', () => {
    const empty: MasteryMap = {};
    const withOne = ensureIntroduced(empty, 7, day('2026-01-01'));
    expect(withOne[7].strength).toBe(1);
    expect(withOne[7].correct).toBe(0);
    expect(isDue(withOne[7], day('2026-01-01'))).toBe(true);
    // Already-known letters are returned unchanged (same reference).
    expect(ensureIntroduced(withOne, 7, day('2026-06-01'))).toBe(withOne);
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

  it('hasPassed needs one lifetime correct rep and never decays on misses', () => {
    expect(hasPassed(undefined)).toBe(false);
    // Freshly introduced or exposure-only: no correct rep, not passed.
    expect(hasPassed(createMastery(1, day('2026-01-01')))).toBe(false);
    let m = createMastery(1, day('2026-01-01'));
    m = applyResult(m, true, day('2026-01-01')); // one clean rep
    expect(hasPassed(m)).toBe(true);
    // Later misses drop strength but must not re-lock the letter.
    m = applyResult(m, false, day('2026-01-03'));
    expect(m.strength).toBe(1);
    expect(hasPassed(m)).toBe(true);
  });
});
