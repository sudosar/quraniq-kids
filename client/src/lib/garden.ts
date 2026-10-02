/**
 * Daily goal + letter garden.
 *
 * The daily goal gives a child a small, finishable target each day
 * ("earn 5 moons"). Moons are already awarded by every game, review and
 * lesson, so one goal covers every mode without touching each game.
 *
 * The garden turns per-letter mastery into something a toddler can see
 * grow: each letter is a plot that goes from bare soil to a blossom as
 * its spaced-repetition strength climbs.
 *
 * Pure functions only — state lives in ProgressContext.
 */

import { toDateKey } from './mastery';

/** Moons to earn per day. One short session (~5 games) should reach it. */
export const DAILY_GOAL_MOONS = 5;

export interface DailyProgress {
  date: string;  // YYYY-MM-DD this tally belongs to
  moons: number; // moons earned on that date
}

/** Today's tally, starting fresh if the stored one is from another day. */
export function currentDaily(daily: DailyProgress | undefined, today: Date = new Date()): DailyProgress {
  const key = toDateKey(today);
  return daily && daily.date === key ? daily : { date: key, moons: 0 };
}

/** Add moons to today's tally, rolling over to a new day when needed. */
export function addDailyMoons(
  daily: DailyProgress | undefined,
  count: number,
  today: Date = new Date(),
): DailyProgress {
  const cur = currentDaily(daily, today);
  return { ...cur, moons: cur.moons + Math.max(0, count) };
}

export function isGoalMet(daily: DailyProgress | undefined, today: Date = new Date()): boolean {
  return currentDaily(daily, today).moons >= DAILY_GOAL_MOONS;
}

export interface PlantStage {
  emoji: string;
  label: string;
}

// Indexed by mastery strength (0 = not started … 5 = max).
const PLANT_STAGES: PlantStage[] = [
  { emoji: '', label: 'Not planted yet' }, // the greyed-out letter already shows this
  { emoji: '🌰', label: 'Seed' },
  { emoji: '🌱', label: 'Sprout' },
  { emoji: '🌿', label: 'Growing' },
  { emoji: '🌷', label: 'Flower' },
  { emoji: '🌸', label: 'In full bloom' },
];

/** The plant for a letter at the given mastery strength (undefined = not started). */
export function getPlantStage(strength: number | undefined): PlantStage {
  const s = Math.max(0, Math.min(PLANT_STAGES.length - 1, strength ?? 0));
  return PLANT_STAGES[s];
}
