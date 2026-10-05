import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KanjiProgress } from '../types/kanji';
import { REPS_TO_OBTAIN } from '../types/kanji';
import { calculateNextReview, qualityFromMistakes } from '../lib/srs';
import {
  BOSS_REPEAT_EXP_PER_DAY,
  KANJI_EXP_PER_DAY,
  cappedGain,
  expForReview,
  expForWrite,
  isReviewDue,
} from '../lib/level';
import { DEFAULT_VERSUS_STATS, type VersusStats } from '../features/versus/types';
import { FoundVia, HINT_COST, MAX_HINT, TRY_COST_2, TRY_COST_3 } from '../lib/forge/discovery';
import { getGear, type GearSlot } from '../data/equipment';
import { ALL_KANJI } from '../data/kanji.generated';
import { UNLOCKED_ON_MOJI } from '../data/unlocks';

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
  /** 強化 points: one per clean write of its kanji in 強化 (lib/forge/recipe.ts). */
  points?: number;
  /** The day it was last 強化'd — once a day (05 §2.2). */
  trainedOn?: string;
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
  /** Experience each kanji has given today (lib/level.ts KANJI_EXP_PER_DAY). */
  expByKanji: Record<string, number>;
  /** Experience from replaying beaten opponents today (BOSS_REPEAT_EXP_PER_DAY). */
  bossExpToday: number;
}

/** The highest きずな (11 §4.2). */
export const BOND_MAX = 5;

export const todayKey = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const freshDaily = (): DailyState => ({
  date: todayKey(),
  repsToday: 0,
  obtainedToday: 0,
  stagesToday: 0,
  reviewsToday: 0,
  claimed: [],
  expByKanji: {},
  bossExpToday: 0,
});

export interface GameState {
  /** Per-kanji learning record, keyed by kanji id. */
  progress: Record<string, KanjiProgress>;
  /** Stage ids the learner has cleared. */
  clearedStages: string[];
  /** Stages cleared once with no mistake (★3): the かんぺき bonus is paid once (data/clearRewards.ts). */
  perfectStages: string[];
  /** Stages won once in Hard (lib/difficulty.ts): its bonus is paid once. */
  hardStages: string[];
  /** The fight's rules told one at a time (data/fightRules.ts FIGHT_TIPS), each once. */
  tipsSeen: string[];
  /** Nexmax individuals owned, by id. */
  individuals: string[];
  /** The individual currently deployed. */
  activeIndividual: string | null;
  /** Weapons crafted, newest last. */
  weapons: WeaponRecipe[];
  /** The weapon currently equipped, by recipe id. */
  equippedWeapon: string | null;
  /** Shields, armour and charms made (data/equipment.ts ids). */
  gear: string[];
  /** What is worn in the three non-weapon slots. */
  equippedGear: Record<GearSlot, string | null>;
  /** Nexmax Gems — the gacha currency. */
  gems: number;
  /** Pity counter since the last top-rarity pull. */
  pityCount: number;
  /**
   * ガチャチケット: one pull without gems. The first comes with the first clear
   * of the episode that opens the gacha (1章 4話), so the first pull is made
   * there and then, shown how (docs/design/16 §3).
   */
  gachaTickets: number;
  /** きずな by card id, 0..BOND_MAX (docs/design/11 §4.2): a duplicate pull or a ★3 win with it along. */
  bonds: Record<string, number>;
  /** The day each card last gained きずな from a win — one a day. */
  bondDays: Record<string, string>;
  /** Today's task counters. */
  daily: DailyState;
  /** Consecutive days played. */
  streak: { count: number; lastDate: string };
  /** `english`: word meanings in English start shown (EN on the kanji card, ？ことば in the story). */
  settings: { furigana: boolean; muted: boolean; reducedMotion: boolean; bgmOff: boolean; english: boolean };
  /** One-off explainers the player has already been shown. */
  /** intro: むかし編の 0話. prologue: 文字が 消えた 町の プロローグ (08 §10.2). stars: じゅんびの ★の ひみつ. */
  tutorials: { forge: boolean; intro: boolean; prologue: boolean; stars: boolean; tools: boolean; gacha: boolean };
  /** The world last played in — where つづきから, ストーリー and もどる lead back to. */
  lastArc: 'mukashi' | 'gendai' | 'moji';
  /**
   * 文字が 消えた 町: how the player chose to start at the end of the
   * prologue — 0章 (kana) or straight to the town. つづきから follows it
   * (data/mojiFlow.ts nextUp). null until the prologue's question is answered.
   */
  startPath: 'kana' | 'town' | null;
  /** Versus record. */
  versus: VersusStats;
  /**
   * すみ — the ink the forge spends on a guess. Earned only by writing, so
   * trying every pair costs the same effort as learning the characters.
   */
  sumi: number;
  /** ネクマックスの 経験値, all of it (lib/level.ts turns it into a level, up to the kanji owned). */
  exp: number;
  /** Words discovered, and how. */
  foundWords: Record<string, FoundVia>;
  /** Hint tier opened per word. */
  hints: Record<string, number>;
  /** Wrong guesses per word — the answer tier needs a few. */
  misses: Record<string, number>;
  /** かな編: passing writes per kana (08 §3.4). KANA_REPS makes it known. */
  kana: Record<string, number>;
}

export interface GameActions {
  /** Record one completed writing rep. Returns true if this rep obtained the kanji. */
  recordRep: (kanjiId: string, mistakes: number) => boolean;
  /** Record a review rep on an already-obtained kanji. */
  recordReview: (kanjiId: string, mistakes: number) => void;
  /**
   * Experience from a fight (a reading turn, a beaten opponent). Writes and
   * reviews add theirs in recordRep / recordReview. Returns what was added
   * (a replayed opponent's share stops at its daily cap).
   */
  gainExp: (n: number, source?: { bossRepeat?: boolean }) => number;
  clearStage: (stageId: string) => void;
  /** Spends one ガチャチケット. False when there is none. */
  useGachaTicket: () => boolean;
  /** Records a かんぺき clear. True only the first time for that stage. */
  markPerfect: (stageId: string) => boolean;
  /** Records a Hard win. True only the first time for that stage. */
  markHard: (stageId: string) => boolean;
  addGems: (n: number) => void;
  spendGems: (n: number) => boolean;
  grantIndividual: (id: string) => boolean;
  setActiveIndividual: (id: string | null) => void;
  craftWeapon: (kanjiIds: string[]) => WeaponRecipe | null;
  /**
   * 強化 (docs/design/11 §6): add the points earned writing this weapon's
   * kanji, once a day per weapon. Null if it was already done today.
   */
  trainWeapon: (recipeId: string, gained: number) => { before: number; after: number } | null;
  /** Whether this weapon can still be 強化'd today. */
  canTrainToday: (recipeId: string) => boolean;
  equipWeapon: (recipeId: string | null) => void;
  /** Make a piece of gear. False unless every character it needs is owned. */
  makeGear: (gearId: string) => boolean;
  equipGear: (slot: GearSlot, gearId: string | null) => void;
  claimDailyTask: (taskId: string, reward: number) => boolean;
  rollDailyIfNeeded: () => void;
  bumpPity: () => void;
  /** きずな +1 for this card. Returns the new level, or null when it is already at BOND_MAX. */
  addBond: (cardId: string) => number | null;
  /** A ★3 win with this card along: きずな +1, once a day. Returns the new level, or null. */
  bondFromWin: (cardId: string) => number | null;
  resetPity: () => void;
  setSetting: <K extends keyof GameState['settings']>(key: K, value: GameState['settings'][K]) => void;
  markTutorialSeen: (key: keyof GameState['tutorials']) => void;
  markTipSeen: (id: string) => void;
  setLastArc: (arc: GameState['lastArc']) => void;
  setStartPath: (path: GameState['startPath']) => void;
  recordVersusResult: (won: boolean, ratingDelta: number) => void;
  /** Spend ink on a guess. False when there is not enough. */
  spendSumi: (n: number) => boolean;
  /** Cost of trying a combination of this length. */
  tryCost: (kanjiCount: number) => number;
  /** Record a discovery. Returns false if it was already known. */
  recordFound: (word: string, via: FoundVia) => boolean;
  /** Buy the next hint tier for a word. Returns the tier now open, or null. */
  buyHint: (word: string) => number | null;
  recordMiss: (word: string) => void;
  /** Words found by guessing — the count titles are based on. */
  earnedFoundCount: () => number;
  hasKanji: (kanjiId: string) => boolean;
  /** Record one passing write of a kana. Returns the new count. */
  recordKanaRep: (kana: string) => number;
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
  perfectStages: [],
  hardStages: [],
  tipsSeen: [],
  individuals: [],
  activeIndividual: null,
  weapons: [],
  equippedWeapon: null,
  gear: [],
  equippedGear: { shield: null, body: null, charm: null },
  gems: 0,
  pityCount: 0,
  gachaTickets: 0,
  bonds: {},
  bondDays: {},
  daily: freshDaily(),
  streak: { count: 0, lastDate: '' },
  settings: { furigana: true, muted: false, reducedMotion: false, bgmOff: false, english: true },
  tutorials: { forge: false, intro: false, prologue: false, stars: false, tools: false, gacha: false },
  // A new player starts on the new route (08 §10.2).
  lastArc: 'moji',
  startPath: null,
  versus: DEFAULT_VERSUS_STATS,
  sumi: 0,
  exp: 0,
  foundWords: {},
  hints: {},
  misses: {},
  kana: {},
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

        set((s) => {
          // Writing is also Nexmax's experience, up to a day's worth per kanji.
          const used = s.daily.expByKanji?.[kanjiId] ?? 0;
          const gained = cappedGain(expForWrite(mistakes), used, KANJI_EXP_PER_DAY);
          return {
            progress: { ...s.progress, [kanjiId]: next },
            // Writing is the only source of ink.
            sumi: s.sumi + 1,
            exp: s.exp + gained,
            daily: {
              ...s.daily,
              repsToday: s.daily.repsToday + 1,
              obtainedToday: s.daily.obtainedToday + (justObtained ? 1 : 0),
              expByKanji: { ...(s.daily.expByKanji ?? {}), [kanjiId]: used + gained },
            },
          };
        });
        return justObtained;
      },

      recordReview: (kanjiId, mistakes) => {
        get().rollDailyIfNeeded();
        const prev = get().progress[kanjiId];
        if (!prev) return;
        // Read before the schedule moves on: was this review's time up?
        const due = isReviewDue(prev, Date.now());
        const outcome = calculateNextReview(
          qualityFromMistakes(mistakes),
          prev.intervalDays,
          prev.streak,
        );
        set((s) => {
          const used = s.daily.expByKanji?.[kanjiId] ?? 0;
          const gained = cappedGain(expForReview(mistakes, due), used, KANJI_EXP_PER_DAY);
          return {
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
            sumi: s.sumi + 1,
            exp: s.exp + gained,
            daily: {
              ...s.daily,
              reviewsToday: s.daily.reviewsToday + 1,
              expByKanji: { ...(s.daily.expByKanji ?? {}), [kanjiId]: used + gained },
            },
          };
        });
      },

      gainExp: (n, source) => {
        if (!(n > 0)) return 0;
        get().rollDailyIfNeeded();
        const { daily } = get();
        const gained = source?.bossRepeat ? cappedGain(n, daily.bossExpToday ?? 0, BOSS_REPEAT_EXP_PER_DAY) : n;
        if (gained <= 0) return 0;
        set((s) => ({
          exp: s.exp + gained,
          daily: source?.bossRepeat ? { ...s.daily, bossExpToday: (s.daily.bossExpToday ?? 0) + gained } : s.daily,
        }));
        return gained;
      },

      markPerfect: (stageId) => {
        if (get().perfectStages.includes(stageId)) return false;
        set((s) => ({ perfectStages: [...s.perfectStages, stageId] }));
        return true;
      },

      markHard: (stageId) => {
        if (get().hardStages.includes(stageId)) return false;
        set((s) => ({ hardStages: [...s.hardStages, stageId] }));
        return true;
      },

      clearStage: (stageId) => {
        get().rollDailyIfNeeded();
        set((s) =>
          s.clearedStages.includes(stageId)
            ? { daily: { ...s.daily, stagesToday: s.daily.stagesToday + 1 } }
            : {
                clearedStages: [...s.clearedStages, stageId],
                daily: { ...s.daily, stagesToday: s.daily.stagesToday + 1 },
                // The gacha opens here: its first pull comes with it (docs/design/16 §3).
                ...(stageId === UNLOCKED_ON_MOJI.gacha ? { gachaTickets: s.gachaTickets + 1 } : {}),
              },
        );
      },

      addGems: (n) => set((s) => ({ gems: s.gems + n })),

      useGachaTicket: () => {
        if (get().gachaTickets <= 0) return false;
        set((s) => ({ gachaTickets: s.gachaTickets - 1 }));
        return true;
      },

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

      trainWeapon: (recipeId, gained) => {
        const recipe = get().weapons.find((w) => w.id === recipeId);
        const today = todayKey();
        if (!recipe || recipe.trainedOn === today) return null;
        const before = recipe.points ?? 0;
        const after = before + Math.max(0, Math.round(gained));
        set((s) => ({ weapons: s.weapons.map((w) => (w.id === recipeId ? { ...w, points: after, trainedOn: today } : w)) }));
        return { before, after };
      },
      canTrainToday: (recipeId) => {
        const recipe = get().weapons.find((w) => w.id === recipeId);
        return recipe != null && recipe.trainedOn !== todayKey();
      },

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

      makeGear: (gearId) => {
        const item = getGear(gearId);
        const state = get();
        if (!item || state.gear.includes(gearId)) return false;
        const owned = item.kanji.every((c) => {
          const k = ALL_KANJI.find((x) => x.char === c);
          return k ? state.hasKanji(k.id) : false;
        });
        if (!owned) return false;
        set((s) => ({
          gear: [...s.gear, gearId],
          // A new piece goes straight on when the slot is empty.
          equippedGear: s.equippedGear[item.slot]
            ? s.equippedGear
            : { ...s.equippedGear, [item.slot]: gearId },
        }));
        return true;
      },

      equipGear: (slot, gearId) => {
        if (gearId && (!get().gear.includes(gearId) || getGear(gearId)?.slot !== slot)) return;
        set((s) => ({ equippedGear: { ...s.equippedGear, [slot]: gearId } }));
      },

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
      addBond: (cardId) => {
        const now = get().bonds?.[cardId] ?? 0;
        if (now >= BOND_MAX) return null;
        set((s) => ({ bonds: { ...(s.bonds ?? {}), [cardId]: now + 1 } }));
        return now + 1;
      },
      bondFromWin: (cardId) => {
        const today = todayKey();
        if (get().bondDays?.[cardId] === today) return null;
        const lv = get().addBond(cardId);
        if (lv != null) set((s) => ({ bondDays: { ...(s.bondDays ?? {}), [cardId]: today } }));
        return lv;
      },
      resetPity: () => set({ pityCount: 0 }),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

      markTutorialSeen: (key) => set((s) => ({ tutorials: { ...s.tutorials, [key]: true } })),

      markTipSeen: (id) => set((s) => (s.tipsSeen.includes(id) ? s : { tipsSeen: [...s.tipsSeen, id] })),

      setLastArc: (arc) => set((s) => (s.lastArc === arc ? s : { lastArc: arc })),
      setStartPath: (path) => set({ startPath: path }),

      spendSumi: (n) => {
        if (get().sumi < n) return false;
        set((s) => ({ sumi: s.sumi - n }));
        return true;
      },

      tryCost: (kanjiCount) => (kanjiCount >= 3 ? TRY_COST_3 : TRY_COST_2),

      recordFound: (word, via) => {
        if (get().foundWords[word]) return false;
        set((s) => ({ foundWords: { ...s.foundWords, [word]: via } }));
        return true;
      },

      buyHint: (word) => {
        const current = get().hints[word] ?? 1; // the meaning is always free
        const next = current + 1;
        if (next > MAX_HINT) return null;
        if (!get().spendSumi(HINT_COST[next])) return null;
        set((s) => ({ hints: { ...s.hints, [word]: next } }));
        return next;
      },

      recordMiss: (word) =>
        set((s) => ({ misses: { ...s.misses, [word]: (s.misses[word] ?? 0) + 1 } })),

      earnedFoundCount: () =>
        Object.values(get().foundWords).filter((v) => v !== FoundVia.TOLD).length,

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

      recordKanaRep: (kana) => {
        const n = (get().kana[kana] ?? 0) + 1;
        set((s) => ({ kana: { ...s.kana, [kana]: n } }));
        return n;
      },

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
          foundWords: { ...current.foundWords, ...(p.foundWords ?? {}) },
          hints: { ...current.hints, ...(p.hints ?? {}) },
          misses: { ...current.misses, ...(p.misses ?? {}) },
          kana: { ...current.kana, ...(p.kana ?? {}) },
          daily: { ...current.daily, ...(p.daily ?? {}) },
          // Saves from before the level (2026-10-03) start at 0.
          exp: typeof p.exp === 'number' ? p.exp : current.exp,
          streak: { ...current.streak, ...(p.streak ?? {}) },
          equippedGear: { ...current.equippedGear, ...(p.equippedGear ?? {}) },
        };
      },
    },
  ),
);
