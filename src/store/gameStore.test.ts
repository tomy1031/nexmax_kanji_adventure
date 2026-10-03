import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BOSS_REPEAT_EXP_PER_DAY, KANJI_EXP_PER_DAY } from '../lib/level';

// The store persists to localStorage; vitest runs in node, so give it one.
const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size;
  },
});

let useGameStore: (typeof import('./gameStore'))['useGameStore'];
beforeAll(async () => {
  ({ useGameStore } = await import('./gameStore'));
});
afterEach(() => {
  vi.useRealTimers();
  useGameStore.getState().resetSave();
});

const exp = () => useGameStore.getState().exp;

describe('ネクマックスの 経験値 (store)', () => {
  it('starts at 0', () => {
    expect(exp()).toBe(0);
  });

  it('pays 2 for a clean write and 1 with a slip, without changing what recordRep returns', () => {
    const s = useGameStore.getState();
    expect(s.recordRep('n5_day_hi', 0)).toBe(false);
    expect(exp()).toBe(2);
    s.recordRep('n5_day_hi', 1);
    expect(exp()).toBe(3);
    s.recordRep('n5_day_hi', 3);
    expect(exp()).toBe(3);
  });

  it('stops one kanji at its daily allowance, but not the next kanji', () => {
    const s = useGameStore.getState();
    for (let i = 0; i < 15; i++) s.recordRep('n5_day_hi', 0);
    expect(exp()).toBe(KANJI_EXP_PER_DAY);
    s.recordRep('n5_month_tsuki', 0);
    expect(exp()).toBe(KANJI_EXP_PER_DAY + 2);
  });

  it('gives the allowance back on a new day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 3, 10));
    const s = useGameStore.getState();
    for (let i = 0; i < 15; i++) s.recordRep('n5_day_hi', 0);
    expect(exp()).toBe(KANJI_EXP_PER_DAY);
    vi.setSystemTime(new Date(2026, 9, 4, 10));
    s.recordRep('n5_day_hi', 0);
    expect(exp()).toBe(KANJI_EXP_PER_DAY + 2);
  });

  it('pays 3 for a review whose time has come, then as a write', () => {
    const s = useGameStore.getState();
    for (let i = 0; i < 10; i++) s.recordRep('n5_fire_hi', 1); // owned at 10, +1 each
    const before = exp();
    // Its first review is due: move the clock past it.
    vi.useFakeTimers();
    vi.setSystemTime(new Date((useGameStore.getState().progress.n5_fire_hi.nextReview ?? 0) + 60_000));
    s.recordReview('n5_fire_hi', 0);
    expect(exp()).toBe(before + 3);
    // The schedule moved on: the same kanji again is only a write.
    s.recordReview('n5_fire_hi', 0);
    expect(exp()).toBe(before + 5);
  });

  it('adds fight experience, a replayed opponent only up to its daily cap', () => {
    const s = useGameStore.getState();
    expect(s.gainExp(10)).toBe(10);
    let total = 0;
    for (let i = 0; i < 10; i++) total += s.gainExp(3, { bossRepeat: true });
    expect(total).toBe(BOSS_REPEAT_EXP_PER_DAY);
    expect(exp()).toBe(10 + BOSS_REPEAT_EXP_PER_DAY);
    expect(s.gainExp(0)).toBe(0);
    expect(s.gainExp(-4)).toBe(0);
  });

  it('reads a save from before the level as experience 0', () => {
    const merge = useGameStore.persist.getOptions().merge!;
    const current = useGameStore.getState();
    const old = { clearedStages: ['moji-1-1'], daily: { date: '2026-10-01', repsToday: 3, obtainedToday: 0, stagesToday: 0, reviewsToday: 0, claimed: [] } };
    const merged = merge(old, current) as typeof current;
    expect(merged.exp).toBe(0);
    expect(merged.daily.expByKanji).toEqual({});
    expect(merged.daily.bossExpToday).toBe(0);
    expect(merged.clearedStages).toEqual(['moji-1-1']);
  });
});

describe('ステージクリアの 得 (store)', () => {
  it('records a かんぺき clear once per stage', () => {
    const s = useGameStore.getState();
    expect(s.markPerfect('moji-1-1')).toBe(true);
    expect(s.markPerfect('moji-1-1')).toBe(false);
    expect(s.markPerfect('moji-1-2')).toBe(true);
    expect(useGameStore.getState().perfectStages).toEqual(['moji-1-1', 'moji-1-2']);
  });

  it('reads a save from before it with no かんぺき yet', () => {
    const merge = useGameStore.persist.getOptions().merge!;
    const merged = merge({ clearedStages: ['moji-1-1'] }, useGameStore.getState()) as ReturnType<typeof useGameStore.getState>;
    expect(merged.perfectStages).toEqual([]);
  });
});

describe('Hard の 得 (store)', () => {
  it('records a Hard win once per stage', () => {
    const s = useGameStore.getState();
    expect(s.markHard('moji-1-1')).toBe(true);
    expect(s.markHard('moji-1-1')).toBe(false);
    expect(useGameStore.getState().hardStages).toEqual(['moji-1-1']);
    expect(useGameStore.getState().perfectStages).toEqual([]);
  });

  it('reads a save from before Hard with no Hard win yet', () => {
    const merge = useGameStore.persist.getOptions().merge!;
    const merged = merge({ clearedStages: ['moji-1-1'], perfectStages: ['moji-1-1'] }, useGameStore.getState()) as ReturnType<typeof useGameStore.getState>;
    expect(merged.hardStages).toEqual([]);
    expect(merged.perfectStages).toEqual(['moji-1-1']);
  });
});

describe('きずな (docs/design/11 §4.2)', () => {
  it('rises one at a time, up to five', () => {
    const { addBond } = useGameStore.getState();
    expect([1, 2, 3, 4, 5].map(() => addBond('ISTJ'))).toEqual([1, 2, 3, 4, 5]);
    expect(addBond('ISTJ')).toBeNull();
    expect(useGameStore.getState().bonds.ISTJ).toBe(5);
  });

  it('rises from a win once a day per card', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 4, 9));
    const { bondFromWin } = useGameStore.getState();
    expect(bondFromWin('rin')).toBe(1);
    expect(bondFromWin('rin')).toBeNull();
    expect(bondFromWin('ISTJ-4')).toBe(1);
    vi.setSystemTime(new Date(2026, 9, 5, 9));
    expect(useGameStore.getState().bondFromWin('rin')).toBe(2);
  });
});

describe('武器の 強化 (docs/design/11 §6)', () => {
  it('adds the points once a day per weapon', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 4, 9));
    useGameStore.setState({ weapons: [{ id: 'a+b', kanjiIds: ['a', 'b'], craftedAt: 1 }] });
    const { trainWeapon, canTrainToday } = useGameStore.getState();
    expect(canTrainToday('a+b')).toBe(true);
    expect(trainWeapon('a+b', 2)).toEqual({ before: 0, after: 2 });
    expect(useGameStore.getState().canTrainToday('a+b')).toBe(false);
    expect(useGameStore.getState().trainWeapon('a+b', 2)).toBeNull();
    vi.setSystemTime(new Date(2026, 9, 5, 9));
    expect(useGameStore.getState().trainWeapon('a+b', 1)).toEqual({ before: 2, after: 3 });
    expect(useGameStore.getState().weapons[0].points).toBe(3);
  });
});
