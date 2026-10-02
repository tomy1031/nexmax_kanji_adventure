import { describe, expect, it } from 'vitest';
import {
  HARD_MIN_HP_FACTOR,
  cleanHit,
  hardBossAttack,
  hardBossHp,
  hardFight,
  hardPatience,
  hardPool,
  isHardOpen,
  loadoutFromSave,
  weakestN,
  writesPerReadFor,
  type Loadout,
  type LoadoutSave,
} from './difficulty';
import { MOJI_EPISODES, getMojiEpisode } from '../data/mojiEpisodes';
import { INDIVIDUALS } from '../data/individuals';
import { getKanjiByChar } from './kanjiDb';
import { counterDamage, statsFromGear, strikeDamage } from './battle';
import { forgeSingleBlade } from './forge/weapon';
import { Element } from './forge/elements';
import { isReadTurn } from './readTurn';
import { applyLevel } from './level';

const ep = (id: string) => getMojiEpisode(id)!;
const DARK = Element.AN;

/** Nexmax as a test wants him: bare hands, or a weapon of this attack and element. */
const loadout = (o: { attack?: number; element?: Element; level?: number; hp?: number; defense?: number; attackPct?: number; individual?: string } = {}): Loadout => ({
  weapon: o.attack ? { ...forgeSingleBlade(getKanjiByChar('日')!), attack: o.attack, element: o.element ?? Element.MU } : null,
  individual: o.individual ? INDIVIDUALS.find((i) => i.id === o.individual)! : null,
  stats: applyLevel(statsFromGear([{ hp: o.hp ?? 0, defense: o.defense ?? 0, attackPct: o.attackPct ?? 0 }]), o.level ?? 1),
});

const BARE = loadout();
/** ★3, a light weapon (twice as strong on the dark), Lv5. */
const STRONG = loadout({ attack: 28, element: Element.KOU, level: 5 });
/** Everything there is: a big light weapon, gold armour, a shield, a charm, Lv5. */
const MAXED = loadout({ attack: 96, element: Element.KOU, level: 5, hp: 50, defense: 10, attackPct: 20 });

/** Every kanji of the pool at `reps` writes. */
const at = (reps: number) => () => reps;
/** Clean writes to win when every kanji the opponent asks for is at `reps`. */
const writesToWin = (id: string, l: Loadout, reps: number) => {
  const e = ep(id);
  const hit = cleanHit(l, e.boss.element, reps);
  const hp = hardBossHp(e.boss.hp, weakestN(hardPool(e), at(reps), e.kanji.length).map(() => hit));
  return Math.ceil(hp / hit);
};

describe('Hard: how strong the opponent is (09 §4)', () => {
  it('keeps every episode a fight however strong Nexmax is', () => {
    const builds: [string, Loadout, number][] = [
      ['★1 bare', BARE, 3],
      ['★2 bare', BARE, 6],
      ['★3 bare', BARE, 10],
      ['★1 with a weapon', loadout({ attack: 28, element: Element.KOU }), 3],
      ['★3 strong', STRONG, 10],
      ['★3 maxed', MAXED, 10],
    ];
    for (const e of MOJI_EPISODES) {
      const n = e.kanji.length;
      let lastHp = 0;
      for (const [name, l, reps] of builds) {
        const writes = writesToWin(e.id, l, reps);
        expect(writes, `${e.id} ${name}`).toBeGreaterThanOrEqual(2 * n);
        expect(writes, `${e.id} ${name}`).toBeLessThanOrEqual(4 * n);
        const hp = hardBossHp(e.boss.hp, [cleanHit(l, e.boss.element, reps)]);
        expect(hp, `${e.id} ${name}`).toBeGreaterThanOrEqual(Math.ceil(e.boss.hp * HARD_MIN_HP_FACTOR));
        expect(hp, `${e.id} ${name}: a stronger Nexmax never meets a softer opponent`).toBeGreaterThanOrEqual(lastHp);
        lastHp = hp;
      }
      // Gear does not shorten the fight: the strong and the maxed write about as much.
      expect(Math.abs(writesToWin(e.id, STRONG, 10) - writesToWin(e.id, MAXED, 10)), e.id).toBeLessThanOrEqual(2);
    }
  });

  it('matches the worked examples', () => {
    const one = ep('moji-1-1');
    const hard = (l: Loadout, reps: number) =>
      hardBossHp(one.boss.hp, weakestN(hardPool(one), at(reps), 5).map(() => cleanHit(l, DARK, reps)));
    expect(cleanHit(BARE, DARK, 3)).toBe(8);
    expect(hard(BARE, 3)).toBe(105); // the floor: 1.5 × 70
    expect(hardBossAttack(one.boss.attack, BARE, DARK)).toBe(34);
    expect(hardPatience(4)).toBe(3);
    expect(hard(STRONG, 10)).toBe(2525);
    expect(hardBossAttack(one.boss.attack, STRONG, DARK)).toBe(39);
    expect(hard(MAXED, 10)).toBe(10363); // 829 a write × 2.5 × 5
    expect(hardBossAttack(one.boss.attack, MAXED, DARK)).toBe(66);
  });

  it('strikes hard enough that three strikes end it, and never softer than the story', () => {
    const darkProof = INDIVIDUALS.find((i) => i.resists === DARK)!.id;
    const other = INDIVIDUALS.find((i) => i.resists !== DARK)!.id;
    for (const e of MOJI_EPISODES) {
      for (const hp of [0, 16, 66, 116]) {
        for (const defense of [0, 3, 10]) {
          for (const individual of [undefined, darkProof, other]) {
            const l = loadout({ hp, defense, individual });
            const attack = hardBossAttack(e.boss.attack, l, e.boss.element);
            const strike = strikeDamage(counterDamage(attack, l.individual, e.boss.element), l.stats.defense);
            const label = `${e.id} hp+${hp} def${defense} ${individual ?? 'alone'}`;
            expect(Math.ceil(l.stats.maxHp / strike), label).toBeLessThanOrEqual(3);
            expect(attack, label).toBeGreaterThanOrEqual(e.boss.attack);
          }
        }
      }
    }
  });

  it('tolerates one slip fewer, never under two', () => {
    expect(hardPatience(4)).toBe(3);
    expect(hardPatience(3)).toBe(2);
    expect(hardPatience(2)).toBe(2);
  });

  it('throws a kanji to read after every write', () => {
    const turns = (d: 'normal' | 'hard') => Array.from({ length: 7 }, (_, i) => isReadTurn(i, writesPerReadFor(d)));
    expect(turns('hard')).toEqual([false, true, false, true, false, true, false]);
    expect(turns('normal')).toEqual([false, false, true, false, false, true, false]);
  });
});

describe('Hard: which kanji', () => {
  it('asks for the episode’s kanji first, then the chapter’s earlier ones', () => {
    const chars = (id: string) => hardPool(ep(id)).map((k) => k.char);
    expect(chars('moji-1-1')).toEqual([...'日月火水木']);
    const three = chars('moji-1-3');
    expect(three).toHaveLength(15);
    expect(three.slice(0, 5)).toEqual(ep('moji-1-3').kanji);
    expect(new Set(three)).toEqual(new Set([...'一二三四五日月火水木金土山川田']));
    const five = chars('moji-1-5');
    expect(five).toHaveLength(24);
    expect(new Set(five).size).toBe(24);
  });

  it('sizes HP to the least-written kanji, wherever they sit in the pool', () => {
    const pool = hardPool(ep('moji-1-3'));
    const own = new Set(ep('moji-1-3').kanji);
    // The episode's kanji at ★3, the earlier ones only at ★1: the earlier ones are asked.
    const reps = (id: string) => (own.has(pool.find((k) => k.id === id)!.char) ? 10 : 3);
    const asked = weakestN(pool, reps, 5).map((k) => k.char);
    expect(asked).toEqual([...'日月火水木']);
    // Ties keep pool order.
    expect(weakestN(pool, at(3), 5).map((k) => k.char)).toEqual(ep('moji-1-3').kanji);
  });
});

describe('Hard: what it reads off the save', () => {
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

  it('fields bare hands and 100 HP on an empty save', () => {
    const l = loadoutFromSave(save());
    expect(l.weapon).toBeNull();
    expect(l.individual).toBeNull();
    expect(l.stats).toEqual({ maxHp: 100, defense: 0, patience: 0, attackPct: 0 });
  });

  it('adds the level and the worn gear', () => {
    const owned = Object.fromEntries([...'日月火水木金土山川田一二'].map((c) => [id(c), { reps: 3 }]));
    const l = loadoutFromSave(save({ exp: 180, progress: owned, equippedGear: { shield: null, body: 'body-kin', charm: null } }));
    expect(l.stats.maxHp).toBe(166);
    expect(l.stats.patience).toBe(1);
  });

  it('fields the equipped weapon, and none for a recipe it cannot read', () => {
    const recipe = { id: '日', kanjiIds: [id('日')] };
    expect(loadoutFromSave(save({ weapons: [recipe], equippedWeapon: '日' })).weapon?.word).toBe('日');
    const broken = { id: 'x', kanjiIds: ['no-such-kanji'] };
    expect(loadoutFromSave(save({ weapons: [broken], equippedWeapon: 'x' })).weapon).toBeNull();
  });

  it('opens with the episode’s first clear', () => {
    expect(isHardOpen('moji-1-1', [])).toBe(false);
    expect(isHardOpen('moji-1-1', ['moji-1-1'])).toBe(true);
    expect(isHardOpen('moji-1-2', ['moji-1-1'])).toBe(false);
  });

  it('puts the fight together', () => {
    const progress = Object.fromEntries([...'日月火水木'].map((c) => [id(c), { reps: 3 }]));
    const f = hardFight(ep('moji-1-1'), save({ progress }));
    expect(f.boss).toEqual({ hp: 105, attack: 34 });
    expect(f.patience).toBe(3);
    expect(f.pool).toHaveLength(5);
    expect(f.writesPerRead).toBe(1);
    expect(hardFight(ep('moji-1-4'), save({ progress })).patience).toBe(2);
  });
});
