import { describe, expect, it } from 'vitest';
import { PROLOGUE, PROLOGUE_EXITS } from './scripts/prologue';
import { KANA_EPISODES } from './kana';
import { getMojiEpisode } from './mojiEpisodes';

describe('プロローグ (08 §10.2)', () => {
  it('is told in English, one short line per picture', () => {
    for (const b of PROLOGUE) {
      expect(b.text, b.text).not.toMatch(/[ぁ-んァ-ヶ一-龯]/);
      expect(b.text.length, b.text).toBeLessThanOrEqual(120);
    }
  });

  it('leads to the first kana episode or the first town episode', () => {
    expect(PROLOGUE_EXITS.kana).toBe(`/kana/${KANA_EPISODES[0].id}`);
    expect(getMojiEpisode(PROLOGUE_EXITS.town.replace('/moji/', ''))?.order).toBe(1);
  });

  it('ends with the hand that writes', () => {
    expect(PROLOGUE[PROLOGUE.length - 1].visual).toBe('write');
  });
});
