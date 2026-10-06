import { describe, expect, it } from 'vitest';
import { CARD_FACES } from './cardFaces.generated';
import { FACE_CROPS } from './faceCrops.generated';
import { CARDS } from './individuals';

describe('カードの 顔 (scripts/face_crops.mjs, docs/design/18 §3)', () => {
  it('knows where the face is on every card picture — run the script again after adding one', () => {
    // A town person's ★3 is their story portrait, already in FACE_CROPS (lib/faceCrop.ts looks in both).
    for (const c of CARDS) expect(FACE_CROPS[c.art] ?? CARD_FACES[c.art], c.id).toBeDefined();
  });

  it('keeps every crop inside the picture', () => {
    for (const [f, [x, y, size, aspect]] of Object.entries(CARD_FACES)) {
      expect(x, f).toBeGreaterThan(0);
      expect(x, f).toBeLessThan(1);
      expect(y, f).toBeGreaterThan(0);
      expect(y, f).toBeLessThan(1);
      expect(size, f).toBeGreaterThan(0);
      expect(size, f).toBeLessThanOrEqual(1);
      expect(aspect, f).toBeGreaterThan(0);
    }
  });
});
