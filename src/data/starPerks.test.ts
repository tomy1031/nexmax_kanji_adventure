import { describe, expect, it } from 'vitest';
import { STAR_PERKS, STAR_PERKS_HOW } from './starPerks';
import { CRITICAL_MULTIPLIER, MASTERY_DAMAGE, MASTERY_REPS } from '../lib/mastery';
import { unreadKanji } from '../lib/ruby';

describe('★の ひみつ', () => {
  it('lists ★1 to ★3 at the writes mastery.ts counts', () => {
    expect(STAR_PERKS.map((p) => p.stars)).toEqual([1, 2, 3]);
    expect(STAR_PERKS.map((p) => p.reps)).toEqual([...MASTERY_REPS]);
  });

  it('shows the fight numbers the fight uses', () => {
    expect(STAR_PERKS[1].text).toContain(`×${MASTERY_DAMAGE[2]}`);
    expect(STAR_PERKS[2].text).toContain(`×${MASTERY_DAMAGE[3]}`);
    expect(STAR_PERKS[2].en).toContain(`×${CRITICAL_MULTIPLIER}`);
  });

  it('gives every line a picture and an English line for the EN button', () => {
    for (const p of [...STAR_PERKS, STAR_PERKS_HOW]) {
      if ('icons' in p) expect(p.icons, p.text).toBeTruthy();
      expect(p.en, p.text).toBeTruthy();
    }
  });

  it('puts furigana on every kanji', () => {
    const bare = [...STAR_PERKS, STAR_PERKS_HOW].flatMap((p) => unreadKanji(p.text));
    expect(bare).toEqual([]);
  });
});
