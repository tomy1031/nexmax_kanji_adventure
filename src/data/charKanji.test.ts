import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { CHAR_KANJI, kanjiOf } from './charKanji';
import { CARDS, CHARACTERS, getIndividual } from './individuals';
import { ALL_KANJI } from './kanji.generated';
import { unreadKanji } from '../lib/ruby';

/** ひらがな → カタカナ */
const katakana = (s: string) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

describe('キャラの 字 (docs/design/17 §1, 18 §1)', () => {
  it('every character has one, and every card finds its own', () => {
    expect(Object.keys(CHAR_KANJI).sort()).toEqual([...CHARACTERS].sort());
    for (const c of CARDS) expect(kanjiOf(c.char), c.id).toBeDefined();
  });

  it('no two characters share one', () => {
    const all = Object.values(CHAR_KANJI).map((k) => k.kanji);
    expect(new Set(all).size).toBe(all.length);
  });

  it('is one or two characters the game teaches, each with stroke data to write it', () => {
    const taught = new Set(ALL_KANJI.map((k) => k.char));
    for (const [char, k] of Object.entries(CHAR_KANJI)) {
      expect([...k.kanji].length, char).toBeGreaterThanOrEqual(1);
      expect([...k.kanji].length, char).toBeLessThanOrEqual(2);
      for (const c of k.kanji) {
        expect(taught.has(c), `${char} ${c}`).toBe(true);
        expect(existsSync(`public/kanji-data/${c}.json`), `${char} ${c}`).toBe(true);
      }
      expect(k.reading, char).toMatch(/^[ぁ-ん]+$/);
    }
  });

  it('its three words use it, and every kanji in them has its reading', () => {
    for (const [char, k] of Object.entries(CHAR_KANJI)) {
      for (const w of k.words) {
        expect([...k.kanji].some((c) => w.includes(c)), `${char} ${w}`).toBe(true);
        expect(unreadKanji(w), `${char} ${w}`).toEqual([]);
      }
      expect(new Set(k.words).size, char).toBe(3);
    }
  });

  it('is the name on the card: the name is its reading, after the title (18 §1)', () => {
    // リン keeps her own name; 山田さん's is already kanji.
    const own = new Set(['rin', 'yamada']);
    for (const char of CHARACTERS) {
      const c = getIndividual(char)!;
      expect(c.name, char).toBe(`${c.title}：${c.shortName}`);
      if (own.has(char)) continue;
      expect(c.shortName, char).toBe(katakana(kanjiOf(char).reading));
    }
  });
});
