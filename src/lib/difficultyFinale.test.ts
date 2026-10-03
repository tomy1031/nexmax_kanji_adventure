import { describe, expect, it } from 'vitest';
import { cleanHit, hardFight, hardFightFor, hardFinaleFight, hardPool, loadoutFromSave, weakestN, type LoadoutSave } from './difficulty';
import { MOJI_EPISODES } from '../data/mojiEpisodes';
import { finaleOrder, finalePool, getMojiFinale } from '../data/mojiFinale';
import { MOJI_CHAPTERS } from '../data/mojiRoute';
import { INDIVIDUALS } from '../data/individuals';
import { basePatience, counterDamage, strikeDamage } from './battle';
import { getKanjiByChar } from './kanjiDb';

const FINALE = getMojiFinale('moji-1-boss')!;
const CH1 = MOJI_CHAPTERS.find((c) => c.id === 'moji-1')!;
const NOW = Date.UTC(2026, 9, 3);
const id = (c: string) => getKanjiByChar(c)!.id;

const save = (o: Partial<LoadoutSave> = {}): LoadoutSave => ({
  weapons: [],
  equippedWeapon: null,
  activeIndividual: null,
  equippedGear: { shield: null, body: null, charm: null },
  exp: 0,
  progress: {},
  ...o,
});
/** Every chapter-1 kanji at `reps` writes. */
const written = (reps: number) => Object.fromEntries(CH1.kanji.map((c) => [id(c), { reps }]));

describe('Hard, sized from a target (lib/difficulty.ts)', () => {
  it('sizes an episode exactly as before', () => {
    for (const reps of [3, 10]) {
      for (const ep of MOJI_EPISODES) {
        const s = save({ progress: written(reps) });
        const target = { boss: ep.boss, patience: basePatience(ep.order), asks: ep.kanji.length, pool: hardPool(ep) };
        expect(hardFightFor(target, s), ep.id).toEqual(hardFight(ep, s));
      }
    }
  });
});

describe('まとめの ボス in Hard', () => {
  it('asks from the whole chapter, weakest first, and sizes HP to the weakest ten', () => {
    const s = save({ progress: { ...written(10), [id('円')]: { reps: 3 } } });
    const f = hardFinaleFight(FINALE, s, NOW);
    expect(f.pool.map((k) => k.id)).toEqual(finaleOrder(FINALE, s.progress, NOW).map((k) => k.id));
    expect(f.pool[0].char).toBe('円');
    const asked = weakestN(f.pool, (k) => s.progress[k]?.reps ?? 0, FINALE.asks);
    expect(asked.map((k) => k.id)).toEqual(finalePool(FINALE, s.progress, NOW).map((k) => k.id));
    expect(f.patience).toBe(2);
    expect(f.writesPerRead).toBe(1);
  });

  it('stays a fight however strong Nexmax is, and three strikes end it', () => {
    const weapon = { id: '日', kanjiIds: [id('日')] };
    const darkProof = INDIVIDUALS.find((i) => i.resists === FINALE.boss.element)!.id;
    const builds: [string, LoadoutSave, number][] = [
      ['★1 bare', save({ progress: written(3) }), 3],
      ['★3 bare', save({ progress: written(10) }), 10],
      [
        '★3 armed, Lv5, armour and shield, a dark-proof なかま',
        save({
          progress: written(10),
          exp: 180,
          weapons: [weapon],
          equippedWeapon: '日',
          activeIndividual: darkProof,
          equippedGear: { shield: 'shield-oo', body: 'body-kin', charm: null },
        }),
        10,
      ],
    ];
    let lastHp = 0;
    for (const [name, s, reps] of builds) {
      const f = hardFinaleFight(FINALE, s, NOW);
      const l = loadoutFromSave(s);
      expect(f.boss.hp, name).toBeGreaterThanOrEqual(Math.ceil(FINALE.boss.hp * 1.5));
      expect(f.boss.hp, `${name}: a stronger Nexmax never meets a softer boss`).toBeGreaterThanOrEqual(lastHp);
      lastHp = f.boss.hp;
      // Clean writes to win at today's strength: about 2.5 a kanji asked.
      const writes = Math.ceil(f.boss.hp / cleanHit(l, FINALE.boss.element, reps));
      expect(writes, name).toBeGreaterThanOrEqual(2 * FINALE.asks);
      expect(writes, name).toBeLessThanOrEqual(4 * FINALE.asks);
      expect(f.boss.attack, name).toBeGreaterThanOrEqual(FINALE.boss.attack);
      const strike = strikeDamage(counterDamage(f.boss.attack, l.individual, FINALE.boss.element), l.stats.defense);
      expect(Math.ceil(l.stats.maxHp / strike), name).toBeLessThanOrEqual(3);
    }
  });
});
