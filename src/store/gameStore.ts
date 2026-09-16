import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KanjiProgress } from '../types/kanji';
import { REPS_TO_OBTAIN } from '../types/kanji';
import { calculateNextReview, qualityFromMistakes } from '../lib/srs';
import { DEFAULT_VERSUS_STATS, type VersusStats } from '../features/versus/types';

/**
 * The whole save file.
 *
 * Only *inputs* are persisted, never anything the game can recompute. A
 * weapon is stored as the recipe that made it (which kanji, in which order);
 * its name, stats and icon are derived on read by the forge. That keeps saves
 * small, and means a balance change re-tunes weapons the learner already owns
 * instead of leaving stale numbers behind.
 */

/** A crafted weapon: the kanji that went into it, in order. */
export interface WeaponRecipe {
  /** Stable id — the kanji characters joined, e.g. "火山". */
  id: string;
  /** Kanji ids in slot order. Order matters: 火山 and 山火 differ. */
  kanjiIds: string[];
  craftedAt: number;
}

export interface DailyState {
  /** Local YYYY-MM-DD the counters belong to. */
  date: string;
  /** Completed reps today. */
  repsToday: number;
  /** Kanji obtained today (reps reached the goal). */
  obtainedToday: number;
  /** Stages cleared today. */
  stagesToday: number;
  /** Reviews completed today. */
  reviewsToday: number;
  /** Task ids already claimed today. */
  claimed: string[];
}

export const todayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const freshDaily = (): DailyState => ({
  date: todayKey(),
  repsToday: 0,
  obtainedToday: 0,
  stagesToday: 0,
  reviewsToday: 0,
  claimed: [],
});

export interface GameState {
  /** Per-kanji learning record, keyed by kanji id. */
  progress: Record<string, KanjiProgress>;
  /** Stage ids the learner has cleared. */
  clearedStages: string[];
  /** Nexmax individuals owned, by id. */
  individuals: string[];
  /** The individual currently deployed. */
  activeIndividual: string | null;
  /** Weapons crafted, newest last. */
  weapons: WeaponRecipe[];
  /** The weapon currently equipped, by recipe id. */
  equippedWeapon: string | null;
  /** Nexmax Gems — the gacha currency. */
  gems: number;
  /** Pity counter since the last top-rarity pull. */
  pityCount: number;
  /** Today's task counters. */
  daily: DailyState;
  /** Consecutive days played. */
  streak: { count: number; lastDate: string };
  settings: { furigana: boolean; muted: boolean; reducedMotion: boolean };
  /** One-off explainers the player has already been shown. */
  tutorials: { forge: boolean };
  /** Versus record. */
  versus: VersusStats;
}

export interface GameActions {
  /** Record one completed writing rep. Returns true if this rep obtained the kanji. */
  recordRep: (kanjiId: string, mistakes: number) => boolean;
  /** Record a review rep on an already-obtained kanji. */
  recordReview: (kanjiId: string, mistakes: number) => void;
  clearStage: (stageId: string) => void;
  addGems: (n: number) => void;
  spendGems: (n: number) => boolean;
  grantIndividual: (id: string) => boolean;
  setActiveIndividual: (id: string | null) => void;
  craftWeapon: (kanjiIds: string[]) => WeaponRecipe | null;
  equipWeapon: (recipeId: string | null) => void;
  claimDailyTask: (taskId: string, reward: number) => boolean;
  rollDailyIfNeeded: () => void;
  bumpPity: () => void;
  resetPity: () => void;
  setSetting: <K extends keyof GameState['settings']>(key: K, value: GameState['settings'][K]) => void;
  markTutorialSeen: (key: keyof GameState['tutorials']) => void;
  recordVersusResult: (won: boolean, ratingDelta: number) => void;
  hasKanji: (kanjiId: string) => boolean;
  resetSave: () => void;
}

const blankProgress = (): KanjiProgress => ({
  reps: 0,
  mistakes: 0,
  streak: 0,
  nextReview: 0,
  intervalDays: 0,
});

const initialState: GameState = {
  progress: {},
  clearedStages: [],
  individuals: [],
  activeIndividual: null,
  weapons: [],
  equippedWeapon: null,
  gems: 0,
  pityCount: 0,
  daily: freshDaily(),
  streak: { count: 0, lastDate: '' },
  settings: { furigana: true, muted: false, reducedMotion: false },
  tutorials: { forge: false },
  versus: DEFAULT_VERSUS_STATS,
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      recordRep: (kanjiId, mistakes) => {
        get().rollDailyIfNeeded();
        const prev = get().progress[kanjiId] ?? blankProgress();
        const alreadyOwned = prev.reps >= REPS_TO_OBTAIN;
        const reps = Math.min(REPS_TO_OBTAIN, prev.reps + 1);
        const justObtained = !alreadyOwned && reps >= REPS_TO_OBTAIN;

        const next: KanjiProgress = {
          ...prev,
          reps,
          mistakes: prev.mistakes + mistakes,
          streak: mistakes === 0 ? prev.streak + 1 : 0,
        };

        if (justObtained) {
          // Obtaining the kanji starts its review schedule.
          const outcome = calculateNextReview(qualityFromMistakes(mistakes), 0, 0);
          next.obtainedAt = Date.now();
          next.intervalDays = outcome.intervalDays;
          next.nextReview = outcome.nextReview;
          next.streak = outcome.streak;
        }

        set((s) => ({
          progress: { ...s.progress, [kanjiId]: next },
          daily: {
            ...s.daily,
            repsToday: s.daily.repsToday + 1,
            obtainedToday: s.daily.obtainedToday + (justObtained ? 1 : 0),
          },
        }));
        return justObtained;
      },

      recordReview: (kanjiId, mistakes) => {
        get().rollDailyIfNeeded();
        const prev = get().progress[kanjiId];
        if (!prev) return;
        const outcome = calculateNextReview(
          qualityFromMistakes(mistakes),
          prev.intervalDays,
          prev.streak,
        );
        set((s) => ({
          progress: {
            ...s.progress,
            [kanjiId]: {
              ...prev,
              mistakes: prev.mistakes + mistakes,
              intervalDays: outcome.intervalDays,
              nextReview: outcome.nextReview,
              streak: outcome.streak,
            },
          },
          daily: { ...s.daily, reviewsToday: s.daily.reviewsToday + 1 },
        }));
      },

      clearStage: (stageId) => {
        get().rollDailyIfNeeded();
        set((s) =>
          s.clearedStages.includes(stageId)
            ? { daily: { ...s.daily, stagesToday: s.daily.stagesToday + 1 } }
            : {
                clearedStages: [...s.clearedStages, stageId],
                daily: { ...s.daily, stagesToday: s.daily.stagesToday + 1 },
              },
        );
      },

      addGems: (n) => set((s) => ({ gems: s.gems + n })),

      spendGems: (n) => {
        if (get().gems < n) return false;
        set((s) => ({ gems: s.gems - n }));
        return true;
      },

      grantIndividual: (id) => {
        const state = get();
        const isNew = !state.individuals.includes(id);
        set((s) => ({
          individuals: isNew ? [...s.individuals, id] : s.individuals,
          activeIndividual: s.activeIndividual ?? id,
        }));
        return isNew;
      },

      setActiveIndividual: (id) => set({ activeIndividual: id }),

      craftWeapon: (kanjiIds) => {
        const state = get();
        // Every ingredient must actually be owned — the forge UI filters, but
        // the store is the thing that decides.
        if (!kanjiIds.length || !kanjiIds.every((id) => state.hasKanji(id))) return null;
        const id = kanjiIds.join('+');
        if (state.weapons.some((w) => w.id === id)) return null;
        const recipe: WeaponRecipe = { id, kanjiIds, craftedAt: Date.now() };
        set((s) => ({
          weapons: [...s.weapons, recipe],
          equippedWeapon: s.equippedWeapon ?? recipe.id,
        }));
        return recipe;
      },

      equipWeapon: (recipeId) => set({ equippedWeapon: recipeId }),

      claimDailyTask: (taskId, reward) => {
        get().rollDailyIfNeeded();
        const { daily } = get();
        if (daily.claimed.includes(taskId)) return false;
        set((s) => ({
          daily: { ...s.daily, claimed: [...s.daily.claimed, taskId] },
          gems: s.gems + reward,
        }));
        return true;
      },

      rollDailyIfNeeded: () => {
        const today = todayKey();
        const { daily, streak } = get();
        if (daily.date === today) return;

        // A new day: reset the counters, and extend the streak only if
        // yesterday was the last day played.
        const yesterday = todayKey(new Date(Date.now() - 86_400_000));
        const count = streak.lastDate === yesterday ? streak.count + 1 : 1;
        set({ daily: { ...freshDaily(), date: today }, streak: { count, lastDate: today } });
      },

      bumpPity: () => set((s) => ({ pityCount: s.pityCount + 1 })),
      resetPity: () => set({ pityCount: 0 }),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

      markTutorialSeen: (key) => set((s) => ({ tutorials: { ...s.tutorials, [key]: true } })),

      recordVersusResult: (won, ratingDelta) =>
        set((s) => ({
          versus: {
            // Rating never drops below the floor: a losing streak should not
            // leave a learner staring at a number that only goes down.
            rating: Math.max(800, s.versus.rating + ratingDelta),
            wins: s.versus.wins + (won ? 1 : 0),
            losses: s.versus.losses + (won ? 0 : 1),
          },
        })),

      hasKanji: (kanjiId) => (get().progress[kanjiId]?.reps ?? 0) >= REPS_TO_OBTAIN,

      resetSave: () => set({ ...initialState, daily: freshDaily() }),
    }),
    {
      name: 'nexmax-kanji-adventure',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // A one-level-deep merge: zustand's shallow merge drops nested fields
      // added after a save was written, which silently wipes settings for
      // existing players on every release.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          tutorials: { ...current.tutorials, ...(p.tutorials ?? {}) },
          versus: { ...current.versus, ...(p.versus ?? {}) },
          daily: { ...current.daily, ...(p.daily ?? {}) },
          streak: { ...current.streak, ...(p.streak ?? {}) },
        };
      },
    },
  ),
);
