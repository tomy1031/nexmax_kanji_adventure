import { KANA_EPISODES } from './kana';
import { MOJI_EPISODES, getMojiEpisode, isMojiEpisodeUnlocked } from './mojiEpisodes';
import { MOJI_FINALES, getMojiFinale, isFinaleOpen, lastEpisodeOf } from './mojiFinale';
import { MOJI_CHAPTERS } from './mojiRoute';
import { Feature, isFeatureUnlocked, UNLOCKED_ON_MOJI } from './unlocks';
import { MASTERY_REPS } from '../lib/mastery';
import { getKanjiByChar } from '../lib/kanjiDb';

/**
 * 文字が 消えた 町 — where the player goes next (08 §3.8「動線を 違和感 ゼロに」).
 *
 * One place answers the questions every screen used to answer on its own:
 * which episode follows this one, what つづきから should offer, and when
 * 漢字やさん (the forge) is open on this route. Pure, so it is tested.
 */

/** How the player chose to start, at the end of the prologue. */
export type StartPath = 'kana' | 'town' | null;

/** The whole route in playing order: 0章 (kana-1…10), then the town's episodes chapter by chapter. */
export const ROUTE_ORDER: string[] = [
  ...[...KANA_EPISODES].sort((a, b) => a.order - b.order).map((e) => e.id),
  ...[...MOJI_EPISODES]
    .sort((a, b) => {
      const ca = MOJI_CHAPTERS.find((c) => c.id === a.chapter)?.order ?? 0;
      const cb = MOJI_CHAPTERS.find((c) => c.id === b.chapter)?.order ?? 0;
      return ca - cb || a.order - b.order;
    })
    .map((e) => e.id),
];

const isKana = (id: string) => id.startsWith('kana-');
const isMoji = (id: string) => id.startsWith('moji-');

/**
 * The episode after this one, or null when the story has not been written
 * that far yet. Given the clears, a chapter's last episode leads to its
 * まとめの ボス once that is open (data/mojiFinale.ts), and the boss to
 * whatever follows the chapter.
 */
export const afterEpisode = (id: string, cleared?: readonly string[]): string | null => {
  const finale = getMojiFinale(id);
  if (finale) {
    const last = lastEpisodeOf(finale.chapter);
    return last ? afterEpisode(last.id) : null;
  }
  if (cleared) {
    const ep = getMojiEpisode(id);
    const f = ep && MOJI_FINALES.find((x) => x.chapter === ep.chapter);
    if (f && lastEpisodeOf(f.chapter)?.id === id && isFinaleOpen(f, cleared)) return f.id;
  }
  const i = ROUTE_ORDER.indexOf(id);
  return i >= 0 && i + 1 < ROUTE_ORDER.length ? ROUTE_ORDER[i + 1] : null;
};

/**
 * What つづきから offers: the episode to play next, or null when every
 * written episode is cleared.
 *
 *   started on kana (or has kana progress), kana unfinished, no town episode
 *   cleared yet → the next kana episode; otherwise → the first town episode
 *   not cleared. A save from the picture-book arcs only reads kana already.
 */
export const nextUp = (cleared: readonly string[], startPath: StartPath): string | null => {
  const kanaCleared = ROUTE_ORDER.filter(isKana).filter((id) => cleared.includes(id));
  const mojiCleared = ROUTE_ORDER.filter(isMoji).filter((id) => cleared.includes(id));
  const oldArcs = cleared.some((id) => id.startsWith('mukashi-') || id.startsWith('gendai-'));
  const onKana = startPath === 'kana' || kanaCleared.length > 0 || (startPath === null && !oldArcs);
  if (onKana && mojiCleared.length === 0) {
    const kana = ROUTE_ORDER.filter(isKana).find((id) => !cleared.includes(id));
    if (kana) return kana;
  }
  return ROUTE_ORDER.filter(isMoji).find((id) => !cleared.includes(id)) ?? null;
};

const chapterOrder = (chapterId: string | undefined) => MOJI_CHAPTERS.find((c) => c.id === chapterId)?.order ?? Infinity;

/**
 * つづきから with the まとめの ボス: an open boss not beaten yet comes before
 * the next chapter's episodes (or when nothing else is left).
 */
export const nextUpWithFinale = (cleared: readonly string[], startPath: StartPath): string | null => {
  const next = nextUp(cleared, startPath);
  const nextChapter = next ? getMojiEpisode(next)?.chapter : undefined;
  if (next && !nextChapter) return next;
  const boss = MOJI_FINALES.filter((f) => !cleared.includes(f.id) && isFinaleOpen(f, cleared))
    .sort((a, b) => chapterOrder(a.chapter) - chapterOrder(b.chapter))
    .find((f) => !next || chapterOrder(f.chapter) < chapterOrder(nextChapter));
  return boss?.id ?? next;
};

/** The town episode whose clear opens each feature on this route (unlocks.ts, beside the picture-book arcs'). */
export const MOJI_UNLOCKED_BY = UNLOCKED_ON_MOJI;

/** 漢字やさん is open: introduced in the story at the end of 1章 2話, or opened on the old route. */
export const isForgeOpen = (cleared: readonly string[]): boolean => isFeatureUnlocked(Feature.FORGE, cleared);

type Progress = Record<string, { reps?: number } | undefined>;

/** ★3 kanji — written ten times, the ones the forge can use. */
export const mastersOf = (progress: Progress): number =>
  Object.values(progress).filter((p) => (p?.reps ?? 0) >= MASTERY_REPS[2]).length;

/** Something can be forged: two ★3 kanji. */
export const canForge = (progress: Progress): boolean => mastersOf(progress) >= 2;

/**
 * Where "書きに いく" leads from an empty forge: the open town episode with
 * the kanji closest to ★3 (most writes, still short of ten). Its じゅんび is
 * where writing more counts.
 */
export const practiceTarget = (progress: Progress, cleared: readonly string[]): { episode: string; char: string; left: number } | null => {
  let best: { episode: string; char: string; left: number; reps: number } | null = null;
  for (const ep of MOJI_EPISODES) {
    if (!isMojiEpisodeUnlocked(ep, cleared)) continue;
    for (const ch of ep.kanji) {
      const reps = progress[getKanjiByChar(ch)?.id ?? '']?.reps ?? 0;
      if (reps >= MASTERY_REPS[2]) continue;
      if (!best || reps > best.reps) best = { episode: ep.id, char: ch, left: MASTERY_REPS[2] - reps, reps };
    }
  }
  return best && { episode: best.episode, char: best.char, left: best.left };
};

/**
 * Where an episode on ステージせんたく leads. The first time, its story; once
 * cleared, its じゅんび — a player comes back for more ★ or a rematch, and
 * the story is one tap away there (おはなしを もう一度).
 */
export const episodePath = (id: string, cleared: readonly string[]): string =>
  id.startsWith('kana-') ? `/kana/${id}` : cleared.includes(id) ? `/moji/${id}?at=ready` : `/moji/${id}`;

/**
 * Where つづき leads: the next episode, or, with nothing new to play, the
 * じゅんび where writing counts most (「★を ふやそう」). Null once every
 * open kanji is ★3.
 */
export const continuePath = (
  cleared: readonly string[],
  startPath: StartPath,
  progress: Progress,
): string | null => {
  const next = nextUp(cleared, startPath);
  if (next) return episodePath(next, cleared);
  const target = practiceTarget(progress, cleared);
  return target ? `/moji/${target.episode}?at=ready` : null;
};

/** continuePath with the まとめの ボス (nextUpWithFinale). */
export const continuePathWithFinale = (
  cleared: readonly string[],
  startPath: StartPath,
  progress: Progress,
): string | null => {
  const next = nextUpWithFinale(cleared, startPath);
  return next && getMojiFinale(next) ? episodePath(next, cleared) : continuePath(cleared, startPath, progress);
};
