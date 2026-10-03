import { describe, expect, it, vi } from 'vitest';

/** 1章's sixty kanji, in the book's order (src/data/mojiRoute.ts). */
const CH1 = '日月火水木金土山川田一二三四五六七八九十百千万円学生先会社員医者本中国人今朝昼晩時分半午前後休毎何行来校週去年駅電車自転';

// 1章 as it will be once 6〜11話 are written (docs/design/10 §1): the real
// first five, then six more cut the way the design cuts them.
vi.mock('./mojiEpisodes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mojiEpisodes')>();
  const firstFive = actual.MOJI_EPISODES.filter((e) => e.chapter === 'moji-1' && e.order <= 5);
  const rest = ['学生先会社員', '医者本中国人', '今朝昼晩時分半', '午前後休毎何', '行来校週去年', '駅電車自転'].map((k, i) => ({
    ...firstFive[0],
    id: `moji-1-${i + 6}`,
    order: i + 6,
    kanji: [...k],
  }));
  const MOJI_EPISODES = [...firstFive, ...rest];
  const episodesOf = (chapterId: string) => MOJI_EPISODES.filter((e) => e.chapter === chapterId).sort((a, b) => a.order - b.order);
  return {
    ...actual,
    MOJI_EPISODES,
    episodesOf,
    getMojiEpisode: (id: string) => MOJI_EPISODES.find((e) => e.id === id),
    isMojiEpisodeUnlocked: (ep: (typeof MOJI_EPISODES)[number], cleared: readonly string[]) =>
      ep.order === 1 || cleared.includes(episodesOf(ep.chapter).find((e) => e.order === ep.order - 1)?.id ?? ''),
  };
});

const { MOJI_EPISODES } = await import('./mojiEpisodes');
const { MOJI_CHAPTERS } = await import('./mojiRoute');
const { afterEpisode, continuePathWithFinale, episodePath, nextUp, nextUpWithFinale } = await import('./mojiFlow');
const { isFinaleOpen, getMojiFinale, finaleNumber } = await import('./mojiFinale');

const FINALE = getMojiFinale('moji-1-boss')!;
const kana = Array.from({ length: 10 }, (_, i) => `kana-${i + 1}`);
const ch1 = MOJI_EPISODES.map((e) => e.id);

describe('まとめの ボス in the flow, with 1章 complete', () => {
  it('has the whole chapter taught', () => {
    expect(MOJI_CHAPTERS.find((c) => c.id === 'moji-1')!.kanji.join('')).toBe(CH1);
    expect(MOJI_EPISODES.flatMap((e) => e.kanji).join('')).toBe(CH1);
    expect(finaleNumber(FINALE)).toBe(12);
  });

  it('follows the last episode once it is cleared, and leads on to what comes after the chapter', () => {
    expect(isFinaleOpen(FINALE, ch1)).toBe(true);
    expect(afterEpisode('moji-1-11', ch1)).toBe(FINALE.id);
    // Not before it is cleared, and not without the clears (the plain route).
    expect(afterEpisode('moji-1-11', ch1.slice(0, -1))).toBeNull();
    expect(afterEpisode('moji-1-11')).toBeNull();
    expect(afterEpisode('moji-1-10', ch1)).toBe('moji-1-11');
    // After the boss: what follows the chapter (nothing is written yet).
    expect(afterEpisode(FINALE.id, [...ch1, FINALE.id])).toBeNull();
  });

  it('offers the boss as つづき until it is beaten, then nothing new', () => {
    const all = [...kana, ...ch1];
    expect(nextUp(all, 'kana')).toBeNull();
    expect(nextUpWithFinale(all, 'kana')).toBe(FINALE.id);
    expect(continuePathWithFinale(all, 'kana', {})).toBe(`/moji/${FINALE.id}`);
    expect(nextUpWithFinale([...all, FINALE.id], 'kana')).toBeNull();
    expect(episodePath(FINALE.id, [...all, FINALE.id])).toBe(`/moji/${FINALE.id}?at=ready`);
    // Mid-chapter, the next episode as before.
    expect(nextUpWithFinale([...kana, 'moji-1-1'], 'kana')).toBe('moji-1-2');
  });
});
