import { describe, it, expect } from 'vitest';
import {
  cardFor,
  openCards,
  wordsFor,
  charProgress,
  remainingForChar,
  discoveryKind,
  DiscoveryKind,
  compoundFor,
  titleFor,
  nextTitle,
  HINT_COST,
  TRY_COST_2,
} from './discovery';
import { MUKASHI_STAGES } from '../../data/stages';

const N5 = new Set(
  '一二三人日大小上下四五六七八九十口目山川木土水火天入出虫中体気白見来行月夕円千万百名先年時分午今半毎間右左前後北南東西外高学校書読話語聞本電雨車国金食休長生父母友男女子何',
);

describe('cardFor', () => {
  it('hides the rarer character and shows the common one', () => {
    // 人 appears in far more words than 大, so 大 is the one to guess.
    const card = cardFor(compoundFor('大人')!);
    expect(card.masked).toBe('？人');
    expect(card.hiddenIndex).toBe(0);
  });

  it('shows a known pair and hides the new character in a three-character word', () => {
    const card = cardFor(compoundFor('日本語')!);
    expect(card.masked).toBe('日本？');
    expect(card.hiddenIndex).toBe(2);
  });

  it('always masks exactly one character', () => {
    for (const c of wordsFor(N5).slice(0, 200)) {
      const card = cardFor(c);
      expect([...card.masked].filter((ch) => ch === '？')).toHaveLength(1);
      expect(card.masked).toHaveLength(c.word.length);
    }
  });

  it('is stable — the same word always hides the same character', () => {
    expect(cardFor(compoundFor('火山')!).hiddenIndex).toBe(cardFor(compoundFor('火山')!).hiddenIndex);
  });
});

describe('openCards', () => {
  it('lists only words the learner can build and has not found', () => {
    const owned = new Set(['火', '山', '日', '本']);
    const found = new Set(['火山']);
    const words = openCards(owned, found).map((c) => c.compound.word);
    expect(words).toContain('日本');
    expect(words).not.toContain('火山'); // already found
    expect(words.every((w) => [...w].every((ch) => owned.has(ch)))).toBe(true);
  });

  it('never shows a word needing a character the learner lacks', () => {
    const owned = new Set(['火', '山']);
    const cards = openCards(owned, new Set());
    expect(cards.every((c) => [...c.compound.word].every((ch) => owned.has(ch)))).toBe(true);
  });
});

describe('charProgress', () => {
  it('counts found and total per character', () => {
    const owned = new Set(['火', '山', '日', '本']);
    const found = new Set(['火山']);
    const fire = charProgress(owned, found).find((c) => c.char === '火')!;
    expect(fire.total).toBeGreaterThanOrEqual(1);
    expect(fire.found).toBe(1);
  });

  it('drives the forge badge: remaining drops as words are found', () => {
    const owned = new Set(['火', '山', '日', '本']);
    const before = remainingForChar('火', owned, new Set());
    const after = remainingForChar('火', owned, new Set(['火山']));
    expect(after).toBe(before - 1);
  });

  it('reports zero for a character with nothing left', () => {
    const owned = new Set(['火', '山']);
    const all = new Set(wordsFor(owned).map((c) => c.word));
    expect(remainingForChar('火', owned, all)).toBe(0);
  });
});

describe('discoveryKind', () => {
  it('spots a reversible pair once the other half is known', () => {
    const owned = new Set(['日', '本']);
    expect(discoveryKind('本日', owned, new Set(['日本', '本日']))).toBe(DiscoveryKind.REVERSIBLE);
  });

  it('does not call it reversible when the other half is unknown', () => {
    const owned = new Set(['日', '本']);
    expect(discoveryKind('本日', owned, new Set(['本日']))).not.toBe(DiscoveryKind.REVERSIBLE);
  });

  it('spots a word that grew out of a known pair', () => {
    const owned = new Set(['日', '本', '語']);
    expect(discoveryKind('日本語', owned, new Set(['日本', '日本語']))).toBe(DiscoveryKind.EXTENDED);
  });

  it('falls back to plain when nothing special applies', () => {
    const owned = new Set(['火', '山']);
    expect(discoveryKind('火山', owned, new Set(['火山']))).toBe(DiscoveryKind.PLAIN);
  });
});

describe('titles', () => {
  it('only awards a title once its threshold is passed', () => {
    expect(titleFor(0)).toBeNull();
    expect(titleFor(9)).toBeNull();
    expect(titleFor(10)?.word).toBe('見習い');
    expect(titleFor(120)?.word).toBe('名人');
  });

  it('points at the next one to aim for', () => {
    expect(nextTitle(0)?.at).toBe(10);
    expect(nextTitle(10)?.at).toBe(50);
    expect(nextTitle(999)).toBeNull();
  });

  it('is reachable: the N5 set alone can carry a learner to the last title', () => {
    expect(wordsFor(N5).length).toBeGreaterThanOrEqual(347);
  });
});

describe('the hunt is worth hunting', () => {
  it('gives every むかし編 stage a countable number of new words', () => {
    // fable's design calls one stage "one room of the treasure hunt". If a
    // stage added no words the room would be empty; if it added hundreds the
    // count would stop being meaningful.
    const owned = new Set<string>();
    for (const stage of MUKASHI_STAGES) {
      const before = wordsFor(owned).length;
      for (const c of stage.kanji) owned.add(c);
      const after = wordsFor(owned).length;
      const added = after - before;
      expect(added, `${stage.id} adds ${added}`).toBeGreaterThan(0);
      expect(added, `${stage.id} adds ${added}`).toBeLessThan(120);
    }
  });

  it('makes thinking cheaper than brute force', () => {
    // A hint costs less ink than two wrong guesses, so a stuck learner is
    // better off asking than flailing.
    const fullHintLadder = HINT_COST[2] + HINT_COST[3];
    expect(fullHintLadder).toBeLessThan(TRY_COST_2 * 2);
  });
});
