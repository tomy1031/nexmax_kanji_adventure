import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { FACE_CROPS } from './faceCrops.generated';
import { MOJI_CAST } from './mojiScripts';
import { KANA_CAST } from './scripts/kana';

describe('名前の 札の 顔 (scripts/face_crops.mjs)', () => {
  it('knows where the face is on every portrait — run the script again after adding one', () => {
    const portraits = [
      ...readdirSync('public/img/chara/naniwa').filter((f) => f.endsWith('.webp')).map((f) => `img/chara/naniwa/${f}`),
      ...readdirSync('public/img/battle').filter((f) => f.startsWith('mojikui') && f.endsWith('.webp')).map((f) => `img/battle/${f}`),
    ].sort();
    expect(Object.keys(FACE_CROPS).sort()).toEqual(portraits);
  });

  it('covers the face of everyone who speaks in the town story', () => {
    for (const c of [...MOJI_CAST, ...KANA_CAST]) expect(FACE_CROPS[c.sprites.normal], c.id).toBeDefined();
  });

  it('keeps every crop inside the picture', () => {
    for (const [src, [x, y, size, aspect]] of Object.entries(FACE_CROPS)) {
      expect(x, src).toBeGreaterThan(0);
      expect(x, src).toBeLessThan(1);
      expect(y, src).toBeGreaterThan(0);
      expect(y, src).toBeLessThan(1);
      expect(size, src).toBeGreaterThanOrEqual(0.32);
      expect(aspect, src).toBeGreaterThan(0);
    }
  });
});
