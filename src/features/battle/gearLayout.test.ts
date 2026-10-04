import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { GEAR } from '../../data/equipment';
import { LAYOUT_BATTLE, LAYOUT_TRAVEL, bodyBox, gearArt } from './gearLayout';

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
});
