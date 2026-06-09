/**
 * Mastery & spaced repetition for QuranIQ Kids.
 *
 * Recognition isn't a one-and-done event — a toddler who "passed" Alif on
 * Monday has half-forgotten it by Friday. This module models each letter's
 * mastery as a Leitner-style box that strengthens on success, weakens on a
 * miss, and becomes "due" for review on a widening schedule. That gives the
 * app two things it lacked: a real signal of what the child actually knows,
 * and a reason to come back tomorrow (the daily Review).
 *
 * Pure functions only — no React, no storage — so the logic is easy to test
 * and reuse. State lives in ProgressContext.
 */

export interface LetterMastery {
  letterId: number;
  strength: number;   // Leitner box, 0..MAX_STRENGTH (higher = better known)
  correct: number;    // lifetime correct reps
  incorrect: number;  // lifetime missed reps
  lastSeen: string;   // YYYY-MM-DD of last practice
  dueDate: string;    // YYYY-MM-DD when it next needs review
}

export const MAX_STRENGTH = 5;
/** A letter is considered "mastered" at or above this strength. */
export const MASTERED_STRENGTH = 4;

// Days until a letter is due again, indexed by its strength after a rep.
// strength 0/1 → review very soon; higher → spaced further out.
const REVIEW_INTERVALS_DAYS = [0, 1, 2, 4, 8, 16];

/** Local calendar date as YYYY-MM-DD (review cadence is day-grained). */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysKey(fromKey: string, days: number): string {
  const [y, m, d] = fromKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Create a freshly-introduced letter, due immediately for its first review. */
export function createMastery(letterId: number, today: Date = new Date()): LetterMastery {
  const key = toDateKey(today);
  return { letterId, strength: 1, correct: 0, incorrect: 0, lastSeen: key, dueDate: key };
}

/**
 * Apply a practice result and reschedule. Correct climbs a box and pushes
 * the due date out; a miss drops a box (never below 1, so it stays in
 * rotation) and brings it back tomorrow.
 */
export function applyResult(
  m: LetterMastery,
  correct: boolean,
  today: Date = new Date(),
): LetterMastery {
  const key = toDateKey(today);
  const strength = correct
    ? Math.min(MAX_STRENGTH, m.strength + 1)
    : Math.max(1, m.strength - 1);
  const interval = correct
    ? REVIEW_INTERVALS_DAYS[Math.min(strength, REVIEW_INTERVALS_DAYS.length - 1)]
    : 1;
  return {
    ...m,
    strength,
    correct: m.correct + (correct ? 1 : 0),
    incorrect: m.incorrect + (correct ? 0 : 1),
    lastSeen: key,
    dueDate: addDaysKey(key, interval),
  };
}

/** True when the letter is at/over its review date. */
export function isDue(m: LetterMastery, today: Date = new Date()): boolean {
  return m.dueDate <= toDateKey(today);
}

export function isMastered(m: LetterMastery): boolean {
  return m.strength >= MASTERED_STRENGTH;
}

export type MasteryMap = Record<number, LetterMastery>;

/**
 * Letters due for review now, weakest-and-most-overdue first, so a short
 * session targets what's shakiest.
 */
export function getDueLetterIds(map: MasteryMap, today: Date = new Date()): number[] {
  return Object.values(map)
    .filter(m => isDue(m, today))
    .sort((a, b) => a.strength - b.strength || a.dueDate.localeCompare(b.dueDate))
    .map(m => m.letterId);
}

export interface MasteryStats {
  introduced: number; // letters the child has met
  mastered: number;   // strength >= MASTERED_STRENGTH
  due: number;        // need review right now
}

export function getMasteryStats(map: MasteryMap, today: Date = new Date()): MasteryStats {
  const all = Object.values(map);
  return {
    introduced: all.length,
    mastered: all.filter(isMastered).length,
    due: all.filter(m => isDue(m, today)).length,
  };
}
