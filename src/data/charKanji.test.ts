import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { CHAR_KANJI, kanjiOf } from './charKanji';
import { CARDS, CHARACTERS } from './individuals';
import { ALL_KANJI } from './kanji.generated';
import { unreadKanji } from '../lib/ruby';

describe('キャラの 字 (docs/design/17 §1)', () => {
  it('every character has one, and every card finds its own', () => {
    expect(Object.keys(CHAR_KANJI).sort()).toEqual([...CHARACTERS].sort());
    for (const c of CARDS) expect(kanjiOf(c.char), c.id).toBeDefined();
  });

  it('no two characters share one', () => {
    const all = Object.values(CHAR_KANJI).map((k) => k.kanji);
    expect(new Set(all).size).toBe(all.length);
  });

  it('is one character the game teaches, with stroke data to write it', () => {
    const taught = new Set(ALL_KANJI.map((k) => k.char));
    for (const [char, k] of Object.entries(CHAR_KANJI)) {
      expect([...k.kanji], char).toHaveLength(1);
      expect(taught.has(k.kanji), `${char} ${k.kanji}`).toBe(true);
      expect(existsSync(`public/kanji-data/${k.kanji}.json`), `${char} ${k.kanji}`).toBe(true);
      expect(k.reading, char).toMatch(/^[ぁ-ん]+$/);
    }
  });

  it('its three words use it, and every kanji in them has its reading', () => {
    for (const [char, k] of Object.entries(CHAR_KANJI)) {
      for (const w of k.words) {
        expect(w, char).toContain(k.kanji);
        expect(unreadKanji(w), `${char} ${w}`).toEqual([]);
      }
      expect(new Set(k.words).size, char).toBe(3);
    }
  });
});
