import { describe, expect, it } from 'vitest';
import { askFrom, sealFloor, strikeSealed } from './seals';
import { pickWeakest } from './mastery';

/** A fight run on the seals alone: how many writes it takes with this much damage a write. */
const writesToWin = (maxHp: number, kanji: number, damage: number): number => {
  const ids = Array.from({ length: kanji }, (_, i) => ({ id: `k${i}` }));
  const broken: string[] = [];
  let hp = maxHp;
  let last: string | null = null;
  for (let n = 1; n < 200; n++) {
    const target: { id: string } = pickWeakest(askFrom(ids, ids.map((k) => k.id), broken), () => 0, {}, last)!;
    last = target.id;
    if (!broken.includes(target.id)) broken.push(target.id);
    hp = strikeSealed(hp, damage, sealFloor(maxHp, kanji, kanji - broken.length)).hp;
    if (hp <= 0) return n;
  }
  return Infinity;
};

describe('字の ふういん', () => {
  it('keeps one share of HP for every kanji still sealed, and none once all are written', () => {
    expect(sealFloor(100, 5, 5)).toBe(100);
    expect(sealFloor(100, 5, 4)).toBe(80);
    expect(sealFloor(100, 5, 1)).toBe(20);
    expect(sealFloor(100, 5, 0)).toBe(0);
    expect(sealFloor(96, 0, 0)).toBe(0);
  });

  it('never lets a huge weapon win before every kanji is written once', () => {
    for (const kanji of [3, 4, 5, 7, 10]) expect(writesToWin(96, kanji, 99999), `${kanji} kanji`).toBe(kanji);
  });

  it('leaves a weak weapon as it was: more writes than kanji, the seals never in the way', () => {
    expect(writesToWin(96, 5, 12)).toBe(8);
    expect(writesToWin(96, 5, 12)).toBeGreaterThan(5);
  });

  it('says when a seal held a blow back, and how much got through', () => {
    expect(strikeSealed(100, 500, 80)).toEqual({ hp: 80, dealt: 20, held: true });
    expect(strikeSealed(100, 10, 80)).toEqual({ hp: 90, dealt: 10, held: false });
    expect(strikeSealed(30, 50, 0)).toEqual({ hp: 0, dealt: 30, held: false });
  });

  it('asks the sealed kanji first, each once, then any', () => {
    const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(askFrom(pool, ['a', 'b', 'c'], ['a']).map((k) => k.id)).toEqual(['b', 'c']);
    expect(askFrom(pool, ['a', 'b', 'c'], ['a', 'b', 'c']).map((k) => k.id)).toEqual(['a', 'b', 'c']);
    // Hard seals only the ones it asks for; the rest of its pool comes after.
    expect(askFrom(pool, ['c'], []).map((k) => k.id)).toEqual(['c']);
  });
});

describe('字の ふういん in Hard', () => {
  it('seals the kanji Hard sized its HP for: as many as the episode has, all from its pool', async () => {
    const { hardFight } = await import('./difficulty');
    const { MOJI_EPISODES } = await import('../data/mojiEpisodes');
    const save = { weapons: [], equippedWeapon: null, activeIndividual: null, equippedGear: {}, exp: 0, progress: {} };
    for (const ep of MOJI_EPISODES.filter((e) => e.kanji.length > 0)) {
      const f = hardFight(ep, save);
      expect(f.seals.length, ep.id).toBe(ep.kanji.length);
      for (const k of f.seals) expect(f.pool.some((p) => p.id === k.id), `${ep.id} ${k.char}`).toBe(true);
    }
  });
});
