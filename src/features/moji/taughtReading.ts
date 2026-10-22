import type { KanjiData } from '../../types/kanji';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { kataToHira, kunForm, primaryForm, usedReadings, type KunForm } from '../../lib/reading';
import { SCENES } from '../picturebook/scenes';

/**
 * The reading a kanji of 文字が 消えた 町 is taught with: the one the story
 * gives it on the signs of the episode that brings it back (2026-10-10
 * 「これも こたえられない」). 2章1話 teaches 大 as おお(きい) and 新 as
 * あたら(しい), 2章7話 書 as か(く) — so じゅんび, the writing and the fight
 * show and ask those, not the usual だい・しん・しょ the learner has not met
 * in this episode.
 *
 * Where the sign's reading is only a sound change inside a word (国(ごく) in
 * 中国, 達(だち) in 友達) or not one of the kanji's own (入(いり)), the usual
 * reading stands. A number's つ is left off: 七 is なな, as in 七ばん.
 */

const SCENE_OF: ReadonlyMap<string, string> = new Map(MOJI_EPISODES.flatMap((e) => e.kanji.map((c) => [c, e.bg] as const)));

export const taughtForm = (k: Pick<KanjiData, 'char' | 'on' | 'kun'>): KunForm => {
  const scene = SCENE_OF.get(k.char);
  const stem = scene ? SCENES[scene]?.signs?.spots.find((s) => s.char === k.char)?.reading : undefined;
  if (stem) {
    for (const r of [...usedReadings(k), ...k.on, ...k.kun]) {
      const f = kunForm(r);
      if (kataToHira(f.stem) !== stem) continue;
      return { stem, okuri: /^[ァ-ヶ]/.test(r) || f.okuri === 'つ' ? '' : f.okuri };
    }
  }
  return primaryForm(k);
};

/** The kanji with that reading above it: 書(か). */
export const taughtRuby = (k: Pick<KanjiData, 'char' | 'on' | 'kun'>): string => {
  const { stem } = taughtForm(k);
  return stem ? `${k.char}(${stem})` : k.char;
};
