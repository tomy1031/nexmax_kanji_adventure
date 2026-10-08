import type { Compound } from '../types/forge';
import { getCompounds } from './compounds';
import { isHiddenWeapon } from './hiddenWeapons';
import { MOJI_EPISODES } from './mojiEpisodes';
import { MOJI_SCRIPTS } from './mojiScripts';

/**
 * 町の ことば (docs/design/19 §4 D): the words the town's story says — 学生,
 * 先生, 毎日, 電車 … — go into ことば図鑑 once every kanji in them is the
 * player's, at the end of an episode.
 *
 * Every story read so far is looked at, not only this episode's: 1話's
 * 月(げつ)曜(よう)日(び) can be read only once 曜 comes back in 4章 7話,
 * and that is when it is found. A かくし word is never handed out
 * (data/hiddenWeapons.ts): it is found only by trying.
 */

const KANJI = /^[一-龠々]$/;

/** The text of a story as written, its furigana taken out: 月(げつ)曜(よう)日(び) → 月曜日. */
const plain = (s: string) => s.replace(/\(([^)]*)\)/g, '');

/**
 * The words in a text: at each kanji the longest word of the table that
 * starts there (three, then two), then on past it — so 月曜日 is one word,
 * not 月曜 and 曜日 as well.
 */
export const wordsInText = (text: string): Compound[] => {
  const byWord = new Map(getCompounds().map((c) => [c.word, c]));
  const chars = [...plain(text)];
  const out = new Map<string, Compound>();
  for (let i = 0; i < chars.length; ) {
    let hit: Compound | undefined;
    for (const n of [3, 2]) {
      const run = chars.slice(i, i + n);
      if (run.length === n && run.every((c) => KANJI.test(c))) hit = byWord.get(run.join(''));
      if (hit) break;
    }
    if (hit) {
      out.set(hit.word, hit);
      i += [...hit.word].length;
    } else i++;
  }
  return [...out.values()];
};

/** Everything the story of an episode says: intro, the meeting, the end. */
const episodeText = (episodeId: string): string => {
  const s = MOJI_SCRIPTS[episodeId];
  if (!s) return '';
  return [s.intro, s.encounter, s.outro]
    .flatMap((n) => n.lines)
    .map((l) => `${l.text ?? ''}\n${l.glyph ?? ''}`)
    .join('\n');
};

/**
 * The story's words the player can read whole after `episodeId` — every
 * episode's story up to it, in route order — with no かくし word among them.
 */
export const storyWordsUpTo = (episodeId: string, owned: ReadonlySet<string>): Compound[] => {
  const at = MOJI_EPISODES.findIndex((e) => e.id === episodeId);
  if (at < 0) return [];
  const words = new Map<string, Compound>();
  for (const e of MOJI_EPISODES.slice(0, at + 1)) for (const w of wordsInText(episodeText(e.id))) words.set(w.word, w);
  return [...words.values()].filter((w) => !isHiddenWeapon(w.word) && [...w.word].every((c) => owned.has(c)));
};
