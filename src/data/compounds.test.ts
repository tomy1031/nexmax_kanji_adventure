import { describe, it, expect, beforeAll } from 'vitest';
import { compoundsVersion, getCompounds, loadMoreCompounds } from './compounds';
import { forgeWeapon } from '../lib/forge/weapon';
import { getKanjiByChar } from '../lib/kanjiDb';
import { cardWords } from './kanjiCard';
import { glossFor } from './glossary';

const kanji = (word: string) => [...word].map((c) => getKanjiByChar(c)!);

describe('the forge’s words (2026-10-04「今の 5倍は ある。会社員とか」)', () => {
  it('starts with the learner core, then loads the rest', async () => {
    const core = getCompounds().length;
    expect(compoundsVersion()).toBe(0);
    expect(forgeWeapon(kanji('会社員'))!.compound).toBeNull();
    await loadMoreCompounds();
    expect(compoundsVersion()).toBe(1);
    expect(getCompounds().length).toBeGreaterThanOrEqual(core * 5);
  });

  describe('once loaded', () => {
    beforeAll(() => loadMoreCompounds());

    it('recognises everyday words beyond the JLPT lists, and the caches see them', () => {
      for (const w of ['会社員', '可能性', '運動会', '外国語', '図書館']) {
        const weapon = forgeWeapon(kanji(w))!;
        expect(weapon.compound?.word, w).toBe(w);
      }
      expect(glossFor('会社員')).toBeTruthy();
    });

    it('keeps every word to 2–3 kanji, each one the game teaches', () => {
      for (const c of getCompounds()) {
        expect(c.word.length, c.word).toBeGreaterThanOrEqual(2);
        expect(c.word.length, c.word).toBeLessThanOrEqual(3);
        expect([...c.word].every((ch) => getKanjiByChar(ch)), c.word).toBe(true);
      }
    });

    it('names no weapon after killing, death or anything unfit for a children’s game', () => {
      const words = new Set(getCompounds().map((c) => c.word));
      const unfit = getCompounds().filter((c) => /[殺死]/.test(c.word) && c.word !== '必死').map((c) => c.word);
      expect(unfit).toEqual([]);
      for (const w of ['自殺', '死体', '愛人', '売春婦', '麻薬', '小便']) expect(words.has(w), w).toBe(false);
    });

    it('lists each word once, with a reading and a gloss', () => {
      const seen = new Set<string>();
      for (const c of getCompounds()) {
        expect(seen.has(c.word), c.word).toBe(false);
        seen.add(c.word);
        expect(c.reading, c.word).toMatch(/^[ぁ-ゖー]+$/);
        expect(c.gloss.length, c.word).toBeGreaterThan(0);
      }
    });

    it('shows the learner core first on a kanji’s card', () => {
      const owned = new Set([...'会社員日本人']);
      const first = cardWords('社', owned, 3);
      expect(first[0].tier).toBe(0);
    });
  });
});
