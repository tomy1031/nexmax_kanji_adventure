import { describe, it, expect } from 'vitest';
import {
  Feature,
  UNLOCKED_BY,
  FEATURE_INTRO,
  isFeatureUnlocked,
  featuresUnlockedBy,
  kanjiNeededFor,
  KANJI_NEEDED_TO_FIGHT,
} from './unlocks';
import { MUKASHI_STAGES } from './stages';
import { unreadKanji } from '../lib/ruby';
import { REPS_TO_OBTAIN } from '../types/kanji';

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
