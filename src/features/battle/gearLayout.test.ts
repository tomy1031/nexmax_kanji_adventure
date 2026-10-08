import { beforeAll, describe, it, expect } from 'vitest';
import { loadMoreCompounds } from '../../data/compounds';
import { existsSync } from 'node:fs';
import { GEAR } from '../../data/equipment';
import { LAYOUT_BATTLE, LAYOUT_TRAVEL, bodyBox, gearArt, gearIsGold } from './gearLayout';
import { forgedGearId } from '../../lib/forge/gear';
import { getKanjiByChar } from '../../lib/kanjiDb';

beforeAll(() => loadMoreCompounds());

describe('そうびの 絵 (gearLayout)', () => {
  it('has a picture for every piece of gear', () => {
    for (const g of GEAR) expect(existsSync(`public/${gearArt(g.id)}`), g.id).toBe(true);
  });

  it('streams the cape out behind and keeps the harnesses on his back', () => {
    for (const layout of [LAYOUT_BATTLE, LAYOUT_TRAVEL]) {
      expect(bodyBox(layout, 'body-tsukiyo')).toBe(layout.cape);
      for (const g of GEAR.filter((g) => g.slot === 'body' && g.id !== 'body-tsukiyo')) expect(bodyBox(layout, g.id), g.id).toBe(layout.wings);
    }
  });

  it('dresses a forged piece by its slot and element: 水 and 闇 bodies are capes', () => {
    const id = (slot: 'shield' | 'body', w: string) => forgedGearId(slot, [...w].map((c) => getKanjiByChar(c)!.id));
    expect(gearArt(id('shield', '火山'))).toBe('img/gear/forged/shield_ka.webp');
    expect(existsSync(`public/${gearArt(id('body', '日本'))}`)).toBe(true);
    for (const layout of [LAYOUT_BATTLE, LAYOUT_TRAVEL]) {
      expect(bodyBox(layout, id('body', '水車'))).toBe(layout.cape);
      expect(bodyBox(layout, id('body', '火山'))).toBe(layout.wings);
    }
    // 水車 is 1章 11話's かくし word: ★5, so it shines gold where it is worn.
    expect(gearIsGold(id('body', '水車'))).toBe(true);
    expect(gearIsGold(id('body', '山火'))).toBe(false);
    expect(gearIsGold('body-kin')).toBe(false);
  });
});
