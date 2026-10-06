import { describe, expect, it } from 'vitest';
import { BANNERS, BANNER_ORDER, WEEKDAY_KANJI, cardRates, dayOf, featuredOf, kanjiBoost, pull, weekdayBoost } from './gacha';
import { CARDS } from '../data/individuals';
import { WeaponClass } from './forge/weapon';
import { useGameStore } from '../store/gameStore';

/** Deterministic sequence so a run is reproducible. */
const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

/**
 * 曜日の ガチャ・字の ガチャ・1日 1回 むりょう (2026-10-07「ガチャの 種類も
 * もっと 増やして」).
 */
describe('five gachas', () => {
  it('shows every gacha on a tab, each with a picture', () => {
    expect([...BANNER_ORDER].sort()).toEqual(Object.keys(BANNERS).sort());
    for (const id of BANNER_ORDER) expect(BANNERS[id].tab.icon, id).toBeTruthy();
  });
});

describe('曜日の ガチャ', () => {
  it('follows the week’s kanji, Sunday first, as Date.getDay', () => {
    expect(WEEKDAY_KANJI.map((k) => k[0]).join('')).toBe('日月火水木金土');
    expect(dayOf(new Date(2026, 9, 6))).toBe(2); // a Tuesday: 火
  });

  it('puts forward the friends good with the day’s weapon: 火 is the sword', () => {
    const tue = weekdayBoost(2);
    const swords = CARDS.filter((c) => c.favours === WeaponClass.SWORD);
    expect(swords.length).toBeGreaterThan(0);
    for (const c of CARDS) expect(tue(c), c.id).toBe(c.favours === WeaponClass.SWORD);
  });

  it('gives about half of a rarity to the day’s friends, when there are some', () => {
    const boost = weekdayBoost(2);
    const rnd = seeded(7);
    let three = 0;
    let featured = 0;
    for (let i = 0; i < 4000; i++) {
      const r = pull('weekday', [], 0, 0, rnd, false, undefined, boost);
      if (r.card.rarity !== 3) continue;
      three++;
      if (r.featured) featured++;
    }
    // Half from the day's friends, plus their share of the other half.
    expect(featured / three).toBeGreaterThan(0.5);
    expect(featured / three).toBeLessThan(0.75);
  });

  it('prints the same odds it pulls with', () => {
    const rates = cardRates('weekday', [], 0, undefined, weekdayBoost(2));
    expect(rates.reduce((n, r) => n + r.rate, 0)).toBeCloseTo(1);
    const sword3 = featuredOf('weekday', 3, 0, undefined, weekdayBoost(2));
    for (const c of sword3) expect(rates.find((r) => r.card.id === c.id)!.rate).toBeGreaterThan(0.8 / CARDS.filter((x) => x.rarity === 3).length);
  });
});

describe('字の ガチャ', () => {
  it('puts forward a friend once all its own kanji are written', () => {
    const boost = kanjiBoost((c) => c === '本' || c === '山');
    expect(boost(CARDS.find((c) => c.id === 'rin')!)).toBe(true); // 本
    expect(boost(CARDS.find((c) => c.id === 'yamada')!)).toBe(false); // 山田: 田 is not written
    expect(boost(CARDS.find((c) => c.id === 'ISTJ')!)).toBe(false); // 正
  });

  it('is いつもの when nothing is written yet', () => {
    const none = kanjiBoost(() => false);
    for (const r of [3, 4, 5] as const) expect(featuredOf('kanji', r, 0, undefined, none)).toEqual([]);
  });
});

describe('1日 1回 むりょう', () => {
  it('lets one free pull through a day', () => {
    useGameStore.setState({ freePullDay: null });
    expect(useGameStore.getState().useFreePull()).toBe(true);
    expect(useGameStore.getState().useFreePull()).toBe(false);
    useGameStore.setState({ freePullDay: '2000-01-01' });
    expect(useGameStore.getState().useFreePull()).toBe(true);
  });
});

describe('ステップアップ', () => {
  it('keeps each step’s promise, then starts over', async () => {
    const { pullStepUp, STEP_UP } = await import('./gacha');
    for (let seed = 1; seed <= 40; seed++) {
      const rnd = seeded(seed);
      const a = pullStepUp(0, [], 0, 0, rnd);
      expect(a.results.filter((r) => r.card.rarity >= 4).length).toBeGreaterThanOrEqual(STEP_UP[0].fours);
      expect(a.nextStep).toBe(1);
      const b = pullStepUp(1, [], 0, 0, rnd);
      expect(b.results.filter((r) => r.card.rarity >= 4).length).toBeGreaterThanOrEqual(STEP_UP[1].fours);
      expect(b.nextStep).toBe(2);
      const c = pullStepUp(2, [], 0, 0, rnd);
      expect(c.results.some((r) => r.card.rarity === 5)).toBe(true);
      expect(c.nextStep).toBe(0);
      expect(a.results.length + b.results.length + c.results.length).toBe(30);
    }
  });
});
