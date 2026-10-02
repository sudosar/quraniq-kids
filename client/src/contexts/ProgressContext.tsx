import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  LetterMastery,
  MasteryMap,
  MasteryStats,
  createMastery,
  applyResult,
  getDueLetterIds,
  getMasteryStats,
} from '@/lib/mastery';
import { getLettersForLesson } from '@/lib/curriculum';
import { DailyProgress, DAILY_GOAL_MOONS, addDailyMoons, currentDaily, isGoalMet } from '@/lib/garden';
import { narrate } from '@/lib/gameEngine';

interface ProgressState {
  completedLessons: number[];
  completedActivities: Record<number, string[]>; // lessonId -> activityTypes completed
  stars: number;
  currentLesson: number;
  streakDays: number;
  lastPlayDate: string | null;
  letterMastery: MasteryMap; // letterId -> mastery (spaced repetition)
  daily: DailyProgress;      // moons earned today, toward the daily goal
  goalDaysMet: number;       // lifetime count of days the daily goal was reached
}

interface ProgressContextType extends ProgressState {
  completeActivity: (lessonId: number, activityType: string) => void;
  completeLesson: (lessonId: number) => void;
  addStars: (count: number) => void;
  setCurrentLesson: (lessonId: number) => void;
  resetProgress: () => void;
  isLessonComplete: (lessonId: number) => boolean;
  isActivityComplete: (lessonId: number, activityType: string) => boolean;
  getLessonProgress: (lessonId: number) => number; // 0-100
  // Mastery / spaced repetition
  recordLetterResult: (letterId: number, correct: boolean) => void;
  getLetterMastery: (letterId: number) => LetterMastery | undefined;
  getDueLetters: () => number[];
  masteryStats: MasteryStats;
  // Daily goal
  dailyMoons: number;
  dailyGoal: number;
  dailyGoalMet: boolean;
}

const defaultState: ProgressState = {
  completedLessons: [],
  completedActivities: {},
  stars: 0,
  currentLesson: 1,
  streakDays: 0,
  lastPlayDate: null,
  letterMastery: {},
  daily: currentDaily(undefined),
  goalDaysMet: 0,
};

const STORAGE_KEY = 'quraniq-kids-progress';

/**
 * Seed mastery for letters the child already finished before this feature
 * existed, so returning users immediately have a Review to do rather than
 * an empty one. Introduced at a middling strength, due today.
 */
function seedMasteryFromLessons(completedLessons: number[]): MasteryMap {
  const map: MasteryMap = {};
  for (const lessonId of completedLessons) {
    for (const letter of getLettersForLesson(lessonId)) {
      if (!map[letter.id]) {
        // Treat prior completion as one good rep (strength 2), due today.
        map[letter.id] = { ...createMastery(letter.id), strength: 2 };
      }
    }
  }
  return map;
}

function loadProgress(): ProgressState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate older saves that predate mastery: seed from completed lessons.
      if (!parsed.letterMastery) {
        parsed.letterMastery = seedMasteryFromLessons(parsed.completedLessons || []);
      }
      // Older saves predate the daily goal.
      parsed.daily = currentDaily(parsed.daily);
      parsed.goalDaysMet = parsed.goalDaysMet ?? 0;
      // Check streak
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (parsed.lastPlayDate === today) {
        return parsed;
      } else if (parsed.lastPlayDate === yesterday) {
        return { ...parsed, streakDays: parsed.streakDays + 1, lastPlayDate: today };
      } else {
        return { ...parsed, streakDays: 1, lastPlayDate: today };
      }
    }
  } catch (e) {
    // ignore
  }
  return { ...defaultState, lastPlayDate: new Date().toDateString(), streakDays: 1 };
}

/** Award moons: total, today's tally, and count the day if the goal was just crossed. */
function withMoons(prev: ProgressState, count: number): ProgressState {
  const daily = addDailyMoons(prev.daily, count);
  const justMet = !isGoalMet(prev.daily) && isGoalMet(daily);
  return {
    ...prev,
    stars: prev.stars + count,
    daily,
    goalDaysMet: prev.goalDaysMet + (justMet ? 1 : 0),
  };
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const completeActivity = useCallback((lessonId: number, activityType: string) => {
    setState(prev => {
      const lessonActivities = prev.completedActivities[lessonId] || [];
      if (lessonActivities.includes(activityType)) return prev;
      return {
        ...prev,
        completedActivities: {
          ...prev.completedActivities,
          [lessonId]: [...lessonActivities, activityType],
        },
      };
    });
  }, []);

  const completeLesson = useCallback((lessonId: number) => {
    setState(prev => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      return {
        ...prev,
        ...withMoons(prev, 3), // 3 moons per lesson completion
        completedLessons: [...prev.completedLessons, lessonId],
      };
    });
  }, []);

  const addStars = useCallback((count: number) => {
    setState(prev => withMoons(prev, count));
  }, []);

  const setCurrentLesson = useCallback((lessonId: number) => {
    setState(prev => ({ ...prev, currentLesson: lessonId }));
  }, []);

  const resetProgress = useCallback(() => {
    setState({ ...defaultState, daily: currentDaily(undefined), lastPlayDate: new Date().toDateString(), streakDays: 1 });
  }, []);

  const isLessonComplete = useCallback((lessonId: number) => {
    return state.completedLessons.includes(lessonId);
  }, [state.completedLessons]);

  const isActivityComplete = useCallback((lessonId: number, activityType: string) => {
    return (state.completedActivities[lessonId] || []).includes(activityType);
  }, [state.completedActivities]);

  const getLessonProgress = useCallback((lessonId: number) => {
    const activities = state.completedActivities[lessonId] || [];
    const totalActivities = 5; // learn, listen, match, trace, quiz
    return Math.round((activities.length / totalActivities) * 100);
  }, [state.completedActivities]);

  // ---- Mastery / spaced repetition ----

  const recordLetterResult = useCallback((letterId: number, correct: boolean) => {
    setState(prev => {
      const existing = prev.letterMastery[letterId] || createMastery(letterId);
      return {
        ...prev,
        letterMastery: {
          ...prev.letterMastery,
          [letterId]: applyResult(existing, correct),
        },
      };
    });
  }, []);

  const getLetterMastery = useCallback(
    (letterId: number) => state.letterMastery[letterId],
    [state.letterMastery],
  );

  const getDueLetters = useCallback(
    () => getDueLetterIds(state.letterMastery),
    [state.letterMastery],
  );

  const masteryStats = getMasteryStats(state.letterMastery);

  // ---- Daily goal ----

  const dailyMoons = currentDaily(state.daily).moons;
  const dailyGoalMet = dailyMoons >= DAILY_GOAL_MOONS;

  // Celebrate the moment the goal is reached (not on load).
  const prevGoalDays = useRef(state.goalDaysMet);
  useEffect(() => {
    if (state.goalDaysMet > prevGoalDays.current) {
      toast.success("Today's goal reached! 🌙 Mashallah!");
      narrate({ text: 'Mashallah! You reached your goal for today!' });
    }
    prevGoalDays.current = state.goalDaysMet;
  }, [state.goalDaysMet]);

  return (
    <ProgressContext.Provider value={{
      ...state,
      completeActivity,
      completeLesson,
      addStars,
      setCurrentLesson,
      resetProgress,
      isLessonComplete,
      isActivityComplete,
      getLessonProgress,
      recordLetterResult,
      getLetterMastery,
      getDueLetters,
      masteryStats,
      dailyMoons,
      dailyGoal: DAILY_GOAL_MOONS,
      dailyGoalMet,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
