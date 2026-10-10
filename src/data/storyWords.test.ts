import { beforeAll, describe, expect, it } from 'vitest';
import { getCompounds, loadMoreCompounds } from './compounds';
import { MOJI_SCRIPTS } from './mojiScripts';
import { MOJI_FINALE_SCRIPTS } from './mojiFinaleScripts';
import { MOJI1_PRELUDE } from './scripts/moji1';
import { parseRuby } from '../lib/ruby';
import { HIDDEN_WEAPONS } from './hiddenWeapons';
import { MOJI_EPISODES } from './mojiEpisodes';
import { storyWordsUpTo, wordsInText } from './storyWords';

/** Every kanji the route has taught up to an episode, as the player owns them after it. */
const ownedAfter = (id: string) => new Set(MOJI_EPISODES.slice(0, MOJI_EPISODES.findIndex((e) => e.id === id) + 1).flatMap((e) => e.kanji));

beforeAll(() => loadMoreCompounds());

describe('町の ことば (docs/design/19 §4 D)', () => {
  it('reads the words out of the story text, the longest first, furigana and all', () => {
    const ws = wordsInText('きょうは 月(げつ)曜(よう)日(び)です。学(がく)生(せい)と 先(せん)生(せい)。').map((w) => w.word);
    expect(ws).toContain('月曜日');
    expect(ws).not.toContain('曜日');
    expect(ws).toEqual(expect.arrayContaining(['学生', '先生']));
    // Letters one by one, spaced (a glyph line), make no word.
    expect(wordsInText('日(にち) 月(げつ) 火(か)')).toEqual([]);
  });

  it('gives the school episode its words, and only words the player can read', () => {
    const ws = storyWordsUpTo('moji-1-6', ownedAfter('moji-1-6')).map((w) => w.word);
    expect(ws).toEqual(expect.arrayContaining(['学生', '先生']));
    for (const w of ws) for (const c of w) expect(ownedAfter('moji-1-6').has(c), `${w} ${c}`).toBe(true);
  });

  it('finds an early story\'s word once its last kanji comes back (月曜日 at 4章 7話, 曜)', () => {
    expect(storyWordsUpTo('moji-1-1', ownedAfter('moji-1-1')).map((w) => w.word)).not.toContain('月曜日');
    expect(storyWordsUpTo('moji-4-7', ownedAfter('moji-4-7')).map((w) => w.word)).toContain('月曜日');
  });

  it('never hands out a かくし word (会社員 is in 1章 6話\'s story)', () => {
    for (const e of MOJI_EPISODES) {
      for (const w of storyWordsUpTo(e.id, ownedAfter(e.id))) expect(w.word in HIDDEN_WEAPONS, `${e.id} ${w.word}`).toBe(false);
    }
  });
});

describe('the story reads a word as ことば図鑑 does (2026-10-10)', () => {
  it('gives a whole word written a kanji at a time the reading of the word: 切(きっ)手(て), not 切(き)手(て)', () => {
    const table = new Map(getCompounds().map((c) => [c.word, c.reading]));
    const scripts = [MOJI1_PRELUDE, ...Object.values(MOJI_SCRIPTS).flatMap((s) => [s.intro, s.encounter, s.outro]), ...Object.values(MOJI_FINALE_SCRIPTS).flatMap((f) => (f ? [f.intro, f.outro] : []))];
    const bad: string[] = [];
    for (const s of scripts)
      for (const l of s.lines)
        for (const t of [l.text, l.glyph ?? '']) {
          const segs = parseRuby(t);
          // Runs of kanji with readings, nothing between them: 切(きっ)手(て).
          for (let i = 0; i < segs.length; ) {
            if (!segs[i].reading) {
              i++;
              continue;
            }
            let j = i;
            while (j < segs.length && segs[j].reading) j++;
            const run = segs.slice(i, j);
            const word = run.map((x) => x.text).join('');
            const said = run.map((x) => x.reading).join('');
            if (run.length > 1 && table.has(word) && table.get(word) !== said) bad.push(`${s.stageId}: ${word} ${said} / ${table.get(word)}`);
            i = j;
          }
        }
    expect(bad).toEqual([]);
  });
});
