import { describe, expect, it } from 'vitest';
import { NEXT_STAR_GAIN, STAR_PERKS, STAR_PERKS_HOW, nextStarGoal } from './starPerks';
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

describe('🎯 つぎの 目標', () => {
  const kanji = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('picks the kanji closest to its next star', () => {
    const reps: Record<string, number> = { a: 3, b: 8, c: 5 };
    // a: 3 to ★2, b: 2 to ★3, c: 1 to ★2
    expect(nextStarGoal(kanji, (id) => reps[id])).toEqual({ kanji: { id: 'c' }, left: 1, next: 2 });
  });

  it('keeps the order on a tie', () => {
    expect(nextStarGoal(kanji, () => 3)?.kanji.id).toBe('a');
  });

  it('skips ★3 and kanji not yet written', () => {
    const reps: Record<string, number> = { a: 10, b: 0, c: 7 };
    expect(nextStarGoal(kanji, (id) => reps[id])).toEqual({ kanji: { id: 'c' }, left: 3, next: 3 });
  });

  it('has no goal once everything is ★3', () => {
    expect(nextStarGoal(kanji, () => 10)).toBeNull();
  });

  it('names what ★2 and ★3 bring, with furigana', () => {
    for (const s of Object.values(NEXT_STAR_GAIN)) expect(unreadKanji(s)).toEqual([]);
  });
});
