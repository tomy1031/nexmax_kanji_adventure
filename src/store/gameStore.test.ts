import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BOSS_REPEAT_EXP_PER_DAY, KANJI_EXP_PER_DAY } from '../lib/level';
import { getKanjiByChar } from '../lib/kanjiDb';

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

describe('英語の 意味 (settings.english)', () => {
  it('starts on, also for a save from before the setting, and keeps a player who turned it off', () => {
    const merge = useGameStore.persist.getOptions().merge!;
    const current = useGameStore.getState();
    expect(current.settings.english).toBe(true);
    const old = merge({ settings: { furigana: false, muted: true, reducedMotion: false, bgmOff: false } }, current) as typeof current;
    expect(old.settings).toEqual({ furigana: false, muted: true, reducedMotion: false, bgmOff: false, english: true });
    const off = merge({ settings: { ...current.settings, english: false } }, current) as typeof current;
    expect(off.settings.english).toBe(false);
  });
});

describe('ひみつを 1つずつ (store)', () => {
  it('remembers each tip once, and a save from before the tips has none', () => {
    const s = useGameStore.getState();
    s.markTipSeen('noModel');
    s.markTipSeen('noModel');
    expect(useGameStore.getState().tipsSeen.filter((t) => t === 'noModel')).toHaveLength(1);
    const merge = useGameStore.persist.getOptions().merge!;
    const old = merge({ clearedStages: ['moji-1-1'] }, { ...useGameStore.getState(), tipsSeen: [] }) as ReturnType<typeof useGameStore.getState>;
    expect(old.tipsSeen).toEqual([]);
  });
});

describe('ガチャチケット (docs/design/16 §3)', () => {
  it('comes once, with the first clear of the episode that opens the gacha', () => {
    const st = () => useGameStore.getState();
    expect(st().gachaTickets).toBe(0);
    st().clearStage('moji-1-3');
    expect(st().gachaTickets).toBe(0);
    st().clearStage('moji-1-4');
    expect(st().gachaTickets).toBe(1);
    st().clearStage('moji-1-4'); // a replay
    expect(st().gachaTickets).toBe(1);
  });

  it('is spent one at a time, and not below none', () => {
    const st = () => useGameStore.getState();
    st().clearStage('moji-1-4');
    expect(st().useGachaTicket()).toBe(true);
    expect(st().gachaTickets).toBe(0);
    expect(st().useGachaTicket()).toBe(false);
    expect(st().gachaTickets).toBe(0);
  });
});


describe('漢字やさん: the kanji decide what they make (docs/design/19 §2)', () => {
  const own = (...chars: string[]) => {
    const progress: Record<string, { reps: number; mistakes: number; streak: number; nextReview: number; intervalDays: number }> = {};
    for (const c of chars) progress[getKanjiByChar(c)!.id] = { reps: 10, mistakes: 0, streak: 0, nextReview: 0, intervalDays: 0 };
    useGameStore.setState({ progress });
  };
  const ids = (w: string) => [...w].map((c) => getKanjiByChar(c)!.id);

  it('makes 火山 (7画) a weapon only, and 月日 (8画) a shield only', () => {
    own('火', '山', '月', '日');
    const s = useGameStore.getState();
    expect(s.craftGear('shield', ids('火山'))).toBeNull();
    expect(s.craftGear('body', ids('火山'))).toBeNull();
    expect(s.craftWeapon(ids('火山'))?.id).toBe(ids('火山').join('+'));
    expect(useGameStore.getState().craftWeapon(ids('月日'))).toBeNull();
    expect(useGameStore.getState().craftGear('body', ids('月日'))).toBeNull();
    expect(useGameStore.getState().craftGear('shield', ids('月日'))).toBe(`shield:${ids('月日').join('+')}`);
  });
});

describe('称号の ◆ (TitlesScreen)', () => {
  it('gives a title\'s gems once it is earned, and only once', () => {
    const words = (n: number, via: 'aimed' | 'town') => Object.fromEntries(Array.from({ length: n }, (_, i) => [`w${via}${i}`, via]));
    useGameStore.setState({ gems: 0, foundWords: { ...words(9, 'aimed'), ...words(5, 'town') } });
    // Nine looked for, five handed over by the town: 見習い (10) is not earned yet.
    expect(useGameStore.getState().claimTitle('見習い')).toBeNull();
    useGameStore.setState((s) => ({ foundWords: { ...s.foundWords, last: 'learned' } }));
    expect(useGameStore.getState().claimTitle('見習い')).toBe(50);
    expect(useGameStore.getState().gems).toBe(50);
    expect(useGameStore.getState().claimTitle('見習い')).toBeNull();
    expect(useGameStore.getState().claimTitle('一人前')).toBeNull();
    expect(useGameStore.getState().gems).toBe(50);
  });

  it('reads a save from before it with no ◆ taken', () => {
    const merge = useGameStore.persist.getOptions().merge!;
    const current = useGameStore.getState();
    expect((merge({ gems: 5 }, current) as typeof current).titleRewards).toEqual([]);
  });
});

describe('クラス ★4: アクセサリが 2つ (docs/design/21)', () => {
  const st = () => useGameStore.getState();
  /** 月・山・三 owned, and their three charms made (月の ペンダント, 山の すず, 三つ星の バッジ). */
  const makeCharms = () => {
    const progress: Record<string, { reps: number; mistakes: number; streak: number; nextReview: number; intervalDays: number }> = {};
    for (const c of '月山三') progress[getKanjiByChar(c)!.id] = { reps: 10, mistakes: 0, streak: 0, nextReview: 0, intervalDays: 0 };
    useGameStore.setState({ progress });
    for (const id of ['charm-tsuki', 'charm-yama', 'charm-mitsuboshi']) expect(st().makeGear(id), id).toBe(true);
  };

  it('keeps the second slot shut below ★4: a new charm does not go on, nor can one be put there', () => {
    makeCharms();
    expect(st().equippedGear.charm).toBe('charm-tsuki');
    expect(st().equippedGear.charm2).toBeNull();
    st().equipGear('charm2', 'charm-yama');
    expect(st().equippedGear.charm2).toBeNull();
  });

  it('opens it at ★4: a second charm goes on, the same one is never worn twice, and only charms fit', () => {
    st().clearStage('moji-5-boss');
    makeCharms();
    // Made with the first slot taken: straight into the second.
    expect(st().equippedGear).toMatchObject({ charm: 'charm-tsuki', charm2: 'charm-yama' });
    // One piece, one slot: put on in the other, it comes off where it was.
    st().equipGear('charm2', 'charm-tsuki');
    expect(st().equippedGear).toMatchObject({ charm: null, charm2: 'charm-tsuki' });
    st().equipGear('charm', 'charm-mitsuboshi');
    expect(st().equippedGear).toMatchObject({ charm: 'charm-mitsuboshi', charm2: 'charm-tsuki' });
    st().equipGear('charm2', null);
    expect(st().equippedGear.charm2).toBeNull();
    // Not a shield, not a piece not made.
    useGameStore.setState({ gear: [...st().gear, 'shield-oo'] });
    st().equipGear('charm2', 'shield-oo');
    st().equipGear('charm2', 'charm-hachi');
    expect(st().equippedGear.charm2).toBeNull();
  });

  it('loads a save from before it with the second slot empty, and the class-up card not yet seen', () => {
    const merge = useGameStore.persist.getOptions().merge!;
    const current = useGameStore.getState();
    // A save written before the class: no charm2, no classUp.
    const { classUp: _none, ...tutorials } = current.tutorials;
    void _none;
    const old = merge({ equippedGear: { shield: null, body: 'body-kin', charm: 'charm-tsuki' } as never, tutorials: tutorials as never }, current) as typeof current;
    expect(old.equippedGear).toEqual({ shield: null, body: 'body-kin', charm: 'charm-tsuki', charm2: null });
    expect(old.tutorials.classUp).toBe(false);
  });
});
