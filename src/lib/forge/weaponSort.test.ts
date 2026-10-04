import { describe, expect, it } from 'vitest';
import { sortWeapons } from './weaponSort';
import type { Weapon } from './weapon';

const w = (id: string, attack: number, rarity: 1 | 2 | 3 | 4 | 5, stage: number) => ({ id, attack, rarity, stage }) as Weapon;
const list = [w('a', 40, 3, 2), w('b', 90, 5, 1), w('c', 60, 4, 9), w('d', 60, 3, 9)];
const made = new Map([['a', 3], ['b', 1], ['c', 4], ['d', 2]]);
const ids = (by: Parameters<typeof sortWeapons>[1]) => sortWeapons(list, by, made).map((x) => x.id).join('');

describe('武器の ならべかた', () => {
  it('sorts by attack, by ★, by when it was made, and by stage', () => {
    // c and d tie on attack (and stage): the one made first (d) comes first.
    expect(ids('strong')).toBe('bdca');
    expect(ids('rarity')).toBe('bcda');
    expect(ids('new')).toBe('cadb');
    expect(ids('stage')).toBe('dcab');
  });

  it('does not change the list it is given', () => {
    const before = list.map((x) => x.id).join('');
    sortWeapons(list, 'new', made);
    expect(list.map((x) => x.id).join('')).toBe(before);
  });
});
