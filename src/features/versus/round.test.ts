import { describe, expect, it } from 'vitest';
import { pickRound } from './round';

const basic = [...'日月火水木金土山川田一二三四五六七八九十'];

describe('pickRound — what a versus round asks', () => {
  it('asks only kanji both players have, when they share enough', () => {
    const mine = [...'日月火水木金土山川田一二三四'];
    const theirs = [...'日月火水木金土山川田一二三四五六'];
    const round = pickRound(mine, theirs, basic, 12);
    expect(round).toHaveLength(12);
    for (const c of round) expect(mine).toContain(c);
    expect(new Set(round).size).toBe(12);
  });

  it('fills with what either knows, then the basic list, never repeating', () => {
    const round = pickRound([...'日月'], [...'月火'], basic, 6);
    expect(round.slice(0, 1)).toEqual(['月']);
    expect(new Set(round.slice(1, 3))).toEqual(new Set(['日', '火']));
    expect(round).toHaveLength(6);
    expect(new Set(round).size).toBe(6);
  });

  it('still makes a full round for two beginners', () => {
    expect(pickRound([], [], basic, 12)).toEqual(basic.slice(0, 12));
  });
});
