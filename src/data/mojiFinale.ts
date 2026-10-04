import { Element } from '../lib/forge/elements';
import type { KanjiData, KanjiProgress } from '../types/kanji';
import type { NovelScript } from '../types/novel';
import { getKanjiByChar } from '../lib/kanjiDb';
import { rustLevel } from '../lib/srs';
import { MASTERY_REPS } from '../lib/mastery';
import { MOJI_EPISODES, type MojiBoss, type MojiEpisode } from './mojiEpisodes';
import { MOJI_CHAPTERS, type MojiChapter } from './mojiRoute';

/**
 * まとめの ボス — the fight that closes a chapter (docs/design/10 §3, 08 §6.5).
 *
 * No new kanji: it goes for the chapter's kanji the player knows least —
 * the least written first, then the rusty ones, then the ones slipped on
 * most — about ten kanji's worth of fight (2026-10-03「苦手な 10字ぶん」).
 * Winning it is being able to write the chapter.
 *
 * Kept apart from the episodes (MOJI_EPISODES, 3〜9 kanji each, one script
 * each), and closed until the chapter is complete: every one of its kanji
 * taught by an episode, and the last episode cleared.
 */

export interface MojiFinale {
  /** "moji-1-boss". Also the id recorded as cleared. */
  id: string;
  chapter: string;
  /** Title in furigana notation. */
  title: string;
  /** How many kanji's worth the fight is: its pool, and what its HP is sized to. */
  asks: number;
  /** Slips the boss tolerates, before charms and the level. */
  patience: number;
  /** Gems for the first win. */
  reward: number;
  /** Picture-book scene behind it. */
  bg: string;
  boss: MojiBoss;
}

export const MOJI_FINALES: MojiFinale[] = [
  {
    id: 'moji-1-boss',
    chapter: 'moji-1',
    title: 'まとめの ボス',
    asks: 10,
    // As an episode from the 8th on (lib/battle.ts basePatience).
    patience: 2,
    // A chapter's end: about three episodes' worth, for a fight twice as long.
    reward: 100,
    // The nest at the end of the station's tunnel (11話 points there).
    bg: 'naniwa_nest',
    // HP: ten kanji at about two clean ★1 writes each (8 a write, bare-handed).
    boss: { name: '大(おお)モジクイ', img: 'img/battle/mojikui_boss.webp', trait: { icon: '👑', ja: 'じぶんが おうさま', en: 'self-made king' }, hp: 160, attack: 45, element: Element.AN, icon: 'GiShadowFollower' },
  },
  {
    // 2章「市場の ともだち」の 終わり（docs/design/12）: 霧の 灯台に 逃げた 大モジクイ。
    id: 'moji-2-boss',
    chapter: 'moji-2',
    title: 'まとめの ボス',
    asks: 10,
    patience: 2,
    reward: 100,
    // The lighthouse on the cape (10話's screen shows its shadow).
    bg: 'port_lighthouse',
    // Ten kanji at about two clean ★1 writes each, a little more than 1章's; it hits harder.
    boss: { name: '大(おお)モジクイ', img: 'img/battle/mojikui_boss.webp', trait: { icon: '👑', ja: 'じぶんが おうさま', en: 'self-made king' }, hp: 176, attack: 55, element: Element.AN, icon: 'GiShadowFollower' },
  },
];

export const getMojiFinale = (id: string): MojiFinale | undefined => MOJI_FINALES.find((f) => f.id === id);

export const finaleOf = (chapterId: string): MojiFinale | undefined => MOJI_FINALES.find((f) => f.chapter === chapterId);

const chapterOf = (f: MojiFinale): MojiChapter | undefined => MOJI_CHAPTERS.find((c) => c.id === f.chapter);

const episodesIn = (chapterId: string, episodes: readonly MojiEpisode[]) =>
  episodes.filter((e) => e.chapter === chapterId).sort((a, b) => a.order - b.order);

/** The chapter's last episode, the one whose clear opens its finale. */
export const lastEpisodeOf = (chapterId: string, episodes: readonly MojiEpisode[] = MOJI_EPISODES): MojiEpisode | undefined =>
  episodesIn(chapterId, episodes).at(-1);

/** The finale's number in its chapter: after the last episode (12 once 1章 has its eleven). */
export const finaleNumber = (f: MojiFinale, episodes: readonly MojiEpisode[] = MOJI_EPISODES): number =>
  (lastEpisodeOf(f.chapter, episodes)?.order ?? 0) + 1;

/** Every kanji of the chapter is taught by one of its episodes. */
export const isChapterTaught = (chapter: MojiChapter, episodes: readonly MojiEpisode[] = MOJI_EPISODES): boolean => {
  const taught = new Set(episodesIn(chapter.id, episodes).flatMap((e) => e.kanji));
  return chapter.kanji.length > 0 && chapter.kanji.every((k) => taught.has(k));
};

/** The finale exists for the player to reach: its chapter is complete. */
export const isFinaleReady = (f: MojiFinale, episodes: readonly MojiEpisode[] = MOJI_EPISODES): boolean => {
  const ch = chapterOf(f);
  return ch ? isChapterTaught(ch, episodes) : false;
};

/** Open: the chapter is complete and its last episode cleared. */
export const isFinaleOpen = (f: MojiFinale, cleared: readonly string[], episodes: readonly MojiEpisode[] = MOJI_EPISODES): boolean => {
  const last = lastEpisodeOf(f.chapter, episodes);
  return isFinaleReady(f, episodes) && last != null && cleared.includes(last.id);
};

/** The chapter's kanji, in the book's order. */
export const finaleKanji = (f: MojiFinale): KanjiData[] =>
  (chapterOf(f)?.kanji ?? []).map((c) => getKanjiByChar(c)).filter((k) => k != null);

type FinaleProgress = Readonly<Record<string, Partial<KanjiProgress> | undefined>>;

/**
 * The chapter's kanji, weakest first: the fewest writes (counted up to ★3,
 * as the opponent counts them), then the rustiest (only a ★3 kanji can
 * rust), then the most slips, then the book's order — the oldest first.
 */
export const finaleOrder = (f: MojiFinale, progress: FinaleProgress, now: number = Date.now()): KanjiData[] =>
  finaleKanji(f)
    .map((k, i) => {
      const p = progress[k.id];
      const rust = p?.obtainedAt != null && p.nextReview != null ? rustLevel({ intervalDays: 0, ...p } as KanjiProgress, now) : 0;
      return { k, i, reps: Math.min(p?.reps ?? 0, MASTERY_REPS[2]), rust, slips: p?.mistakes ?? 0 };
    })
    .sort((a, b) => a.reps - b.reps || b.rust - a.rust || b.slips - a.slips || a.i - b.i)
    .map((x) => x.k);

/** The kanji the finale goes for: the weakest `asks`. Fixed as the fight starts. */
export const finalePool = (f: MojiFinale, progress: FinaleProgress, now?: number): KanjiData[] =>
  finaleOrder(f, progress, now).slice(0, f.asks);

/** A finale's story: before it (ending face to face with the boss) and after. */
export interface FinaleScript {
  intro: NovelScript;
  outro: NovelScript;
}
