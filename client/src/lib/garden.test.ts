import { describe, it, expect } from 'vitest';
import {
  DAILY_GOAL_MOONS,
  currentDaily,
  addDailyMoons,
  isGoalMet,
  getPlantStage,
} from './garden';

const day = (s: string) => new Date(`${s}T12:00:00`);

describe('daily goal', () => {
  it('starts each day at zero', () => {
    expect(currentDaily(undefined, day('2026-10-02'))).toEqual({ date: '2026-10-02', moons: 0 });
  });

  it('accumulates moons within a day', () => {
    let d = addDailyMoons(undefined, 2, day('2026-10-02'));
    d = addDailyMoons(d, 1, day('2026-10-02'));
    expect(d).toEqual({ date: '2026-10-02', moons: 3 });
  });

  it('rolls over to a fresh tally on a new day', () => {
    const yesterday = { date: '2026-10-01', moons: 9 };
    expect(addDailyMoons(yesterday, 1, day('2026-10-02'))).toEqual({ date: '2026-10-02', moons: 1 });
    expect(isGoalMet(yesterday, day('2026-10-02'))).toBe(false);
  });

  it('is met once today reaches the goal', () => {
    const d = addDailyMoons(undefined, DAILY_GOAL_MOONS, day('2026-10-02'));
    expect(isGoalMet(d, day('2026-10-02'))).toBe(true);
  });

  it('ignores negative counts', () => {
    expect(addDailyMoons(undefined, -3, day('2026-10-02')).moons).toBe(0);
  });
});

describe('garden plant stages', () => {
  it('maps mastery strength to growing plants and clamps out-of-range', () => {
    expect(getPlantStage(undefined).label).toBe('Not planted yet');
    expect(getPlantStage(1).emoji).toBe('🌰');
    expect(getPlantStage(5).label).toBe('In full bloom');
    expect(getPlantStage(99).label).toBe('In full bloom');
  });
});
