import { describe, expect, it } from 'vitest';
import { KANA_SCRIPTS } from './scripts/kana';
import { MOJI1_SCRIPTS } from './scripts/moji1';

/**
 * ナニワタウン (08 §3.6, 2026-09-30): on the new route, writing lights an empty
 * signboard — it no longer cuts a rock. The picture-book arcs (むかし編・現代編)
 * keep their rocks and are not checked here.
 */
describe('文字が 消えた 町: the scripts speak of signs, not rocks', () => {
  const scripts = [...Object.values(KANA_SCRIPTS), ...Object.values(MOJI1_SCRIPTS)].flatMap((s) => [s.intro, s.outro]);

  it('has no rock or blade pictures', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      for (const l of s.lines) {
        const shown = `${l.text} ${l.glyph ?? ''}`;
        if (/🪨|⚔/u.test(shown)) bad.push(`${s.stageId}: "${l.text}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no rocks in the English either', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      for (const l of s.lines) {
        const english = `${l.text} ${l.en ?? ''}`;
        if (/\brocks?\b/i.test(english)) bad.push(`${s.stageId}: "${english.trim()}"`);
      }
    }
    expect(bad).toEqual([]);
  });
});
