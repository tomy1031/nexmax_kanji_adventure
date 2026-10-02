import { describe, it, expect } from 'vitest';
import {
  Feature,
  UNLOCKED_BY,
  UNLOCKED_ON_MOJI,
  opensOnMoji,
  FEATURE_INTRO,
  isFeatureUnlocked,
  featuresUnlockedBy,
  kanjiNeededFor,
  KANJI_NEEDED_TO_FIGHT,
} from './unlocks';
import { MUKASHI_STAGES } from './stages';
import { unreadKanji } from '../lib/ruby';
import { REPS_TO_OBTAIN } from '../types/kanji';
import { MOJI_EPISODES } from './mojiEpisodes';
import { MOJI_CHAPTERS } from './mojiRoute';
import { KANA_EPISODES } from './kana';

const stageIds = MUKASHI_STAGES.map((s) => s.id);

describe('one system per stage', () => {
  it('never opens two things on the same clear', () => {
    // The first build opened six at once, which is the same as opening none.
    const counts = new Map<string, number>();
    for (const stage of Object.values(UNLOCKED_BY)) {
      counts.set(stage, (counts.get(stage) ?? 0) + 1);
    }
    const doubled = [...counts.entries()].filter(([, n]) => n > 1);
    expect(doubled).toEqual([]);
  });

  it('opens nothing before the first stage is cleared', () => {
    for (const f of Object.values(Feature)) {
      expect(isFeatureUnlocked(f, []), `${f} at start`).toBe(false);
    }
  });

  it('ties every feature to a stage that exists', () => {
    const unknown = Object.entries(UNLOCKED_BY).filter(([, s]) => !stageIds.includes(s));
    expect(unknown).toEqual([]);
  });

  it('opens the forge first — it is the one the story has just set up', () => {
    expect(UNLOCKED_BY[Feature.FORGE]).toBe('mukashi-1');
    expect(featuresUnlockedBy('mukashi-1')).toEqual([Feature.FORGE]);
  });

  it('opens each feature only after the one it depends on', () => {
    const order = (f: Feature) => stageIds.indexOf(UNLOCKED_BY[f]);
    // The word book is a list of things to forge — meaningless before the forge.
    expect(order(Feature.WORDS)).toBeGreaterThan(order(Feature.FORGE));
    // Daily pays out gems and ink; both need somewhere to go first.
    expect(order(Feature.DAILY)).toBeGreaterThan(order(Feature.WORDS));
    // A gacha that opens with no gems saved is a gacha that cannot be pulled.
    expect(order(Feature.GACHA)).toBeGreaterThan(order(Feature.DAILY));
    // Versus tests the rule stage 8 completes in the story.
    expect(order(Feature.VERSUS)).toBeGreaterThanOrEqual(stageIds.indexOf('mukashi-8'));
  });
});

describe('feature introductions', () => {
  it('gives every feature a label, a reason and a destination', () => {
    for (const f of Object.values(Feature)) {
      const intro = FEATURE_INTRO[f];
      expect(intro.label, f).toBeTruthy();
      expect(intro.line, f).toBeTruthy();
      expect(intro.to.startsWith('/'), f).toBe(true);
    }
  });

  it('writes those lines with furigana on every kanji', () => {
    const bare: string[] = [];
    for (const f of Object.values(Feature)) {
      for (const c of unreadKanji(FEATURE_INTRO[f].label)) bare.push(`${f} label: ${c}`);
      for (const c of unreadKanji(FEATURE_INTRO[f].line)) bare.push(`${f} line: ${c}`);
    }
    expect(bare).toEqual([]);
  });
});

describe('time to the first fight', () => {
  it('needs three characters, not the whole stage', () => {
    expect(KANJI_NEEDED_TO_FIGHT).toBe(3);
    for (const stage of MUKASHI_STAGES) {
      expect(kanjiNeededFor(stage)).toBeLessThanOrEqual(stage.kanji.length);
      expect(kanjiNeededFor(stage)).toBeLessThanOrEqual(KANJI_NEEDED_TO_FIGHT);
    }
  });

  it('keeps the first fight inside ten minutes of writing', () => {
    // At roughly 15 seconds a rep. The first build needed 9 x 10 = 90 reps,
    // about 23 minutes, before a learner saw what the writing was for.
    const stage1 = MUKASHI_STAGES[0];
    const reps = kanjiNeededFor(stage1) * REPS_TO_OBTAIN;
    const minutes = (reps * 15) / 60;
    expect(minutes).toBeLessThanOrEqual(10);
  });
});

describe('文字が 消えた 町 opens the same systems', () => {
  // The picture-book arcs are closing (constraints 2026-09-30). A player who
  // only plays the new route must still reach every system.
  const MOJI_ID = /^moji-(\d+)-(\d+)$/;
  const place = (f: Feature) => {
    const [, chapter, episode] = MOJI_ID.exec(UNLOCKED_ON_MOJI[f]) ?? [];
    return Number(chapter) * 1000 + Number(episode);
  };

  it('opens every feature on either route', () => {
    for (const f of Object.values(Feature)) {
      expect(isFeatureUnlocked(f, [UNLOCKED_ON_MOJI[f]]), `${f} on the new route`).toBe(true);
      expect(isFeatureUnlocked(f, [UNLOCKED_BY[f]]), `${f} on the picture-book arcs`).toBe(true);
    }
  });

  it('opens one system per episode here too', () => {
    const ids = Object.values(UNLOCKED_ON_MOJI);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names episodes the way mojiEpisodes.ts does, in chapters that exist', () => {
    const chapterIds = MOJI_CHAPTERS.map((c) => c.id);
    for (const f of Object.values(Feature)) {
      const m = MOJI_ID.exec(UNLOCKED_ON_MOJI[f]);
      expect(m, f).not.toBeNull();
      expect(chapterIds, f).toContain(`moji-${m![1]}`);
    }
  });

  it('ties a written episode to its own chapter and order', () => {
    // Episodes not written yet open their feature once they are.
    for (const f of Object.values(Feature)) {
      const ep = MOJI_EPISODES.find((e) => e.id === UNLOCKED_ON_MOJI[f]);
      if (!ep) continue;
      expect(opensOnMoji(f), f).toEqual({ chapter: Number(ep.chapter.replace('moji-', '')), episode: ep.order });
    }
  });

  it('opens the forge and the word book on the episodes that exist now', () => {
    expect(UNLOCKED_ON_MOJI[Feature.FORGE]).toBe('moji-1-1');
    expect(UNLOCKED_ON_MOJI[Feature.WORDS]).toBe('moji-1-2');
    const written = MOJI_EPISODES.map((e) => e.id);
    expect(written).toContain('moji-1-1');
    expect(written).toContain('moji-1-2');
    expect(featuresUnlockedBy('moji-1-1')).toEqual([Feature.FORGE]);
    expect(featuresUnlockedBy('moji-1-2')).toEqual([Feature.WORDS]);
  });

  it('keeps the order the systems depend on', () => {
    expect(place(Feature.WORDS)).toBeGreaterThan(place(Feature.FORGE));
    expect(place(Feature.DAILY)).toBeGreaterThan(place(Feature.WORDS));
    expect(place(Feature.GACHA)).toBeGreaterThan(place(Feature.DAILY));
    expect(place(Feature.COLLECTION)).toBeGreaterThan(place(Feature.GACHA));
    // Versus waits for chapter 1 to be over.
    expect(opensOnMoji(Feature.VERSUS).chapter).toBeGreaterThanOrEqual(2);
  });

  it('opens nothing an episode early', () => {
    expect(isFeatureUnlocked(Feature.WORDS, ['moji-1-1'])).toBe(false);
    expect(isFeatureUnlocked(Feature.FORGE, ['kana-1', 'kana-2'])).toBe(false);
  });

  it('opens nothing on the kana prologue — it is optional and owns no kanji', () => {
    for (const ep of KANA_EPISODES) {
      expect(featuresUnlockedBy(ep.id), ep.id).toEqual([]);
    }
    const allKana = KANA_EPISODES.map((e) => e.id);
    for (const f of Object.values(Feature)) {
      expect(isFeatureUnlocked(f, allKana), f).toBe(false);
    }
  });

  it('does not announce what the other route has already opened', () => {
    expect(featuresUnlockedBy('moji-1-1', ['mukashi-1'])).toEqual([]);
    expect(featuresUnlockedBy('mukashi-2', ['moji-1-2'])).toEqual([]);
    // Something else being open does not hide this clear's news.
    expect(featuresUnlockedBy('moji-1-2', ['mukashi-1'])).toEqual([Feature.WORDS]);
  });
});
