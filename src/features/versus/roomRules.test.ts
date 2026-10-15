import { describe, expect, it } from 'vitest';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { unreadKanji } from '../../lib/ruby';
import { writeDamage } from './rules';
import {
  DEFAULT_RULES,
  MAX_GUARD,
  NO_POWER,
  STAGE_CHAPTERS,
  appliedPower,
  cleanPower,
  cleanRules,
  guarded,
  powerFrom,
  rangeLabel,
  roundFor,
  rulesPool,
  type RoomRules,
} from './roomRules';

const rules = (r: Partial<RoomRules>): RoomRules => ({ ...DEFAULT_RULES, ...r });
const ch1 = MOJI_CHAPTERS.find((c) => c.id === 'moji-1')!.kanji;

describe('へやの ルール — what a room asks', () => {
  it('asks the town’s kanji first by default, as before rooms had rules', () => {
    expect(rulesPool(DEFAULT_RULES).slice(0, 12)).toEqual(ch1.slice(0, 12));
    expect(roundFor(DEFAULT_RULES, [], [])).toEqual(ch1.slice(0, 12));
  });

  it('narrows by JLPT level', () => {
    const pool = rulesPool(rules({ levels: ['N5'] }));
    expect(pool.length).toBeGreaterThan(50);
    for (const c of pool) expect(getKanjiByChar(c)?.level, c).toBe('N5');
  });

  it('narrows by stage, and by stage and level together', () => {
    expect(rulesPool(rules({ stages: ['moji-1-1'] }))).toEqual([...'日月火水木']);
    const chapter1 = STAGE_CHAPTERS.find((c) => c.id === 'moji-1')!.episodes.map((e) => e.id);
    const n4 = rulesPool(rules({ stages: chapter1, levels: ['N4'] }));
    expect(n4.length).toBeGreaterThan(0);
    for (const c of n4) {
      expect(getKanjiByChar(c)?.level, c).toBe('N4');
      expect(ch1, c).toContain(c);
    }
  });

  it('keeps a round inside the range, the shared kanji first', () => {
    const r = rules({ stages: ['moji-1-1', 'moji-1-2'] });
    const round = roundFor(r, [...'日月金山上下'], [...'月金川上'], () => 0.5);
    expect(round.slice(0, 2).sort()).toEqual(['月', '金'].sort());
    for (const c of round) expect([...'日月火水木金土山川田']).toContain(c);
    expect(new Set(round).size).toBe(round.length);
  });

  it('reads broken rules off the wire as the defaults', () => {
    expect(cleanRules(undefined)).toEqual(DEFAULT_RULES);
    expect(cleanRules('x')).toEqual(DEFAULT_RULES);
    expect(cleanRules({ levels: [], stages: ['nope'], gear: 'yes', level: 1, companion: 0 })).toEqual(DEFAULT_RULES);
    expect(cleanRules({ levels: ['N4', 'N5'], stages: ['moji-1-2'], gear: false, level: true, companion: false })).toEqual({
      levels: ['N5', 'N4'],
      stages: ['moji-1-2'],
      gear: false,
      level: true,
      companion: false,
    });
  });

  it('says its range with furigana', () => {
    for (const r of [DEFAULT_RULES, rules({ levels: ['N5', 'N3'], stages: ['moji-1-1', 'moji-2-1', 'moji-2-2'] })]) {
      expect(unreadKanji(rangeLabel(r))).toEqual([]);
    }
    const chapter2 = STAGE_CHAPTERS.find((c) => c.id === 'moji-2')!.episodes.map((e) => e.id);
    expect(rangeLabel(rules({ stages: chapter2 }))).toContain('2章(しょう)');
  });
});

describe('へやの ルール — the switches stay small next to writing well', () => {
  const best = powerFrom({ weaponAttack: 999, defense: 999, gearHp: 999, level: 99 });
  const all = rules({ gear: true, level: true });

  it('caps every number, here and off the wire', () => {
    expect(best).toEqual({ weapon: 1.2, guard: MAX_GUARD, gearHp: 10, levelHp: 15 });
    expect(cleanPower({ weapon: 9, guard: 1, gearHp: 500, levelHp: -3 })).toEqual({ weapon: 1.2, guard: MAX_GUARD, gearHp: 10, levelHp: 0 });
    expect(cleanPower(null)).toEqual(NO_POWER);
  });

  it('counts only what the room turns on', () => {
    expect(appliedPower(best, rules({ gear: false, level: false }), 100)).toEqual({ weapon: 1, guard: 0, maxHp: 100 });
    expect(appliedPower(best, rules({ gear: false, level: true }), 100)).toEqual({ weapon: 1, guard: 0, maxHp: 115 });
    expect(appliedPower(best, all, 100)).toEqual({ weapon: 1.2, guard: MAX_GUARD, maxHp: 125 });
  });

  it('never lets the best of everything outweigh clean writing (1.5× against 0.8×)', () => {
    const strong = appliedPower(best, all, 100);
    const bare = appliedPower(NO_POWER, all, 100);
    // How many writes each needs to finish the other.
    const strongSloppy = Math.ceil(bare.maxHp / guarded(writeDamage(2, false, strong.weapon), bare.guard));
    const bareClean = Math.ceil(strong.maxHp / guarded(writeDamage(0, false, bare.weapon), strong.guard));
    expect(bareClean).toBeLessThan(strongSloppy);
  });
});
