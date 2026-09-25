import { describe, it, expect } from 'vitest';
import { MOJI_CHAPTERS, LESSON_KANJI, PART_OF_LEVEL, kanjiIntroducedBy } from './mojiRoute';
import { ALL_STAGES, MUKASHI_STAGES, stagesOfArc } from './stages';
import { GENDAI_STAGES } from './gendaiStages';
import { getKanjiByChar } from '../lib/kanjiDb';
import { unreadKanji } from '../lib/ruby';
import { Arc } from '../types/kanji';

describe('文字が 消えた 町: chapter table', () => {
  it('runs 1..n with no gaps', () => {
    expect(MOJI_CHAPTERS.map((c) => c.order)).toEqual(MOJI_CHAPTERS.map((_, i) => i + 1));
    expect(MOJI_CHAPTERS.map((c) => c.id)).toEqual(MOJI_CHAPTERS.map((c) => `moji-${c.order}`));
  });

  it('covers lessons 1–50 without gaps or overlaps', () => {
    let next = 1;
    for (const c of MOJI_CHAPTERS) {
      expect(c.lessons.from, c.id).toBe(next);
      expect(c.lessons.to, c.id).toBeGreaterThanOrEqual(c.lessons.from);
      next = c.lessons.to + 1;
    }
    expect(next).toBe(51);
  });

  it('keeps each chapter inside its level’s book part', () => {
    const outside: string[] = [];
    for (const c of MOJI_CHAPTERS) {
      const part = PART_OF_LEVEL[c.level].lessons;
      if (!part || c.lessons.from < part.from || c.lessons.to > part.to) outside.push(c.id);
    }
    expect(outside).toEqual([]);
  });

  it('puts furigana on every kanji in titles and summaries', () => {
    const bare: string[] = [];
    for (const c of MOJI_CHAPTERS) {
      for (const t of [c.title, c.summary]) for (const k of unreadKanji(t)) bare.push(`${c.id}: ${k}`);
    }
    expect(bare).toEqual([]);
  });
});

describe('文字が 消えた 町: kanji', () => {
  it('only lists characters the dataset actually has', () => {
    const missing: string[] = [];
    for (const [lesson, chars] of Object.entries(LESSON_KANJI)) {
      for (const c of chars) if (!getKanjiByChar(c)) missing.push(`課${lesson}: ${c}`);
    }
    for (const ch of MOJI_CHAPTERS) {
      for (const c of ch.kanji) if (!getKanjiByChar(c)) missing.push(`${ch.id}: ${c}`);
    }
    expect(missing).toEqual([]);
  });

  it('teaches only characters its lessons have reached', () => {
    const early: string[] = [];
    for (const ch of MOJI_CHAPTERS) {
      const known = kanjiIntroducedBy(ch.lessons.to);
      for (const c of ch.kanji) if (!known.has(c)) early.push(`${ch.id}: ${c}`);
    }
    expect(early).toEqual([]);
  });

  it('never teaches the same character twice', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const ch of MOJI_CHAPTERS) {
      for (const c of ch.kanji) {
        const first = seen.get(c);
        if (first) dupes.push(`${c}: ${first} and ${ch.id}`);
        else seen.set(c, ch.id);
      }
    }
    expect(dupes).toEqual([]);
  });
});

describe('文字が 消えた 町 leaves the picture-book arcs alone', () => {
  it('adds nothing to the stage table', () => {
    expect(stagesOfArc(Arc.MOJI)).toEqual([]);
    expect(ALL_STAGES.every((s) => s.arc === Arc.MUKASHI || s.arc === Arc.GENDAI)).toBe(true);
  });

  it('keeps むかし編 and 現代編 as they were', () => {
    expect(MUKASHI_STAGES.map((s) => s.id)).toEqual(Array.from({ length: 10 }, (_, i) => `mukashi-${i + 1}`));
    expect(GENDAI_STAGES.map((s) => s.id)).toEqual(Array.from({ length: GENDAI_STAGES.length }, (_, i) => `gendai-${i + 1}`));
  });

  it('uses ids no picture-book stage can be mistaken for', () => {
    // Cleared-stage counts are taken by id prefix per arc.
    const prefixes = [Arc.MUKASHI, Arc.GENDAI, Arc.MIRAI];
    for (const ch of MOJI_CHAPTERS) {
      expect(prefixes.some((p) => ch.id.startsWith(p)), ch.id).toBe(false);
    }
    for (const s of ALL_STAGES) expect(s.id.startsWith(Arc.MOJI), s.id).toBe(false);
  });
});
