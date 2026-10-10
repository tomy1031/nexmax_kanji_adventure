import { describe, expect, it } from 'vitest';
import { GEAR } from './equipment';
import { MOJI_EPISODES, getMojiEpisode } from './mojiEpisodes';
import { HIDDEN_WEAPONS } from './hiddenWeapons';
import { getKanjiByChar } from '../lib/kanjiDb';

/** The new route's charms (docs/design/19 §3): one an episode, made of its kanji. */
const MOJI_CHARMS = GEAR.filter((g) => g.slot === 'charm' && g.stage.startsWith('moji-'));
const plain = (furigana: string) => furigana.replace(/\(([^)]*)\)/g, '').replace(/\s/g, '');
/** Effect points: がまん 1 ≒ こうげき 10% ≒ HP 25 ≒ ぼうぎょ 5. */
const points = (g: (typeof GEAR)[number]) => (g.patience ?? 0) * 10 + (g.attackPct ?? 0) + (g.hp ?? 0) * 0.4 + (g.defense ?? 0) * 2;

describe('アクセサリ (2026-10-08「アクセサリはもっと数を増やして」)', () => {
  it('has one for every episode of the new route, besides the first five', () => {
    expect(GEAR.filter((g) => g.slot === 'charm').length).toBeGreaterThanOrEqual(35);
    const withKanji = MOJI_EPISODES.filter((e) => e.kanji.length > 0);
    expect(new Set(MOJI_CHARMS.map((g) => g.stage))).toEqual(new Set(withKanji.map((e) => e.id)));
    expect(new Set(GEAR.map((g) => g.id)).size).toBe(GEAR.length);
  });

  it('is made of kanji the route has taught by its episode, one of them the episode\'s own', () => {
    for (const g of MOJI_CHARMS) {
      const ep = getMojiEpisode(g.stage)!;
      // MOJI_EPISODES runs in route order: everything up to this episode is taught.
      const taught = new Set(MOJI_EPISODES.slice(0, MOJI_EPISODES.indexOf(ep) + 1).flatMap((e) => e.kanji));
      for (const c of g.kanji) {
        expect(getKanjiByChar(c), `${g.id} ${c}`).toBeDefined();
        expect(taught.has(c), `${g.id} needs ${c} before ${g.stage}`).toBe(true);
      }
      expect(g.kanji.some((c) => ep.kanji.includes(c)), g.id).toBe(true);
    }
  });

  it('never gives a かくし word away in a name or a line', () => {
    for (const g of MOJI_CHARMS) {
      for (const w of Object.keys(HIDDEN_WEAPONS)) {
        expect(plain(g.name).includes(w) || plain(g.blurb).includes(w), `${g.id}: ${w}`).toBe(false);
      }
    }
  });

  it('grows with the route, a little at a time, and never past one whole extra slip and a third more', () => {
    const chapterAvg = (ch: string) => {
      const cs = MOJI_CHARMS.filter((g) => g.stage.startsWith(`${ch}-`));
      return cs.reduce((n, g) => n + points(g), 0) / cs.length;
    };
    expect(chapterAvg('moji-2')).toBeGreaterThan(chapterAvg('moji-1'));
    expect(chapterAvg('moji-3')).toBeGreaterThan(chapterAvg('moji-2'));
    expect(chapterAvg('moji-4')).toBeGreaterThan(chapterAvg('moji-3'));
    expect(chapterAvg('moji-5')).toBeGreaterThan(chapterAvg('moji-4'));
    for (const g of MOJI_CHARMS) {
      expect(points(g), g.id).toBeGreaterThan(0);
      expect(points(g), g.id).toBeLessThanOrEqual(45);
      expect(g.patience ?? 0, g.id).toBeLessThanOrEqual(2);
    }
  });
});
