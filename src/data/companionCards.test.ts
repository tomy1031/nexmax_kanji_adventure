import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { CARDS, CHARACTERS, DRESSED, INDIVIDUALS, TOWN, cardsOf, getIndividual } from './individuals';
import { SKILL_OF } from '../lib/companionSkill';
import { CARD_LINES, COMPANION_LINES, linesFor } from './companionLines';
import { unreadKanji } from '../lib/ruby';

describe('なかまの カード (docs/design/11 §4.1)', () => {
  it('keeps the sixteen robots as they were — saves name them by these ids', () => {
    expect(INDIVIDUALS.map((i) => i.id)).toHaveLength(16);
    for (const i of INDIVIDUALS) expect(getIndividual(i.id)).toBe(i);
  });

  it('gives every card a unique id, a character, a わざ and lines', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    for (const c of CARDS) {
      expect(CHARACTERS, c.id).toContain(c.char);
      expect(SKILL_OF[c.char], c.id).toBeDefined();
      expect(COMPANION_LINES[c.char], c.id).toBeDefined();
    }
  });

  it('dresses a character up in a higher ★, stronger than its first card', () => {
    for (const d of DRESSED) {
      const base = getIndividual(d.char)!;
      expect(d.rarity, d.id).toBeGreaterThan(base.rarity);
      expect(d.bonus, d.id).toBeGreaterThan(base.bonus);
      expect(d.favours, d.id).toBe(base.favours);
      expect(d.resists, d.id).toBe(base.resists);
    }
  });

  it('has more than one card for most characters — the same friend at ★3〜5', () => {
    const several = CHARACTERS.filter((c) => cardsOf(c).length > 1);
    expect(several.length).toBeGreaterThanOrEqual(CHARACTERS.length * 0.75);
  });

  it('brings people of the town in as companions, not only robots', () => {
    expect(TOWN.length).toBeGreaterThanOrEqual(6);
    for (const t of TOWN) expect(t.kind).toBe('town');
  });

  it('has a picture for every card', () => {
    const missing = CARDS.filter((c) => !existsSync(`public/${c.art}`)).map((c) => c.art);
    expect(missing).toEqual([]);
  });

  it('reads every kanji in names and taglines', () => {
    const bare = CARDS.flatMap((c) => [...unreadKanji(c.name), ...unreadKanji(c.tagline)].map((k) => `${c.id}: ${k}`));
    expect(bare).toEqual([]);
  });
});

describe('★5 の ひとこと', () => {
  it('gives every ★5 card its own lines, read', () => {
    for (const c of CARDS.filter((x) => x.rarity === 5)) {
      const l = CARD_LINES[c.id];
      expect(l, c.id).toBeDefined();
      expect([l.start, l.skill, l.win].flatMap((t) => unreadKanji(t)), c.id).toEqual([]);
      expect(linesFor(c)).toBe(l);
    }
    expect(linesFor(getIndividual('ISTJ')!)).toBe(COMPANION_LINES.ISTJ);
  });
});

describe('★4 の ひとこと', () => {
  it('gives every dressed-up ★4 card its own lines, read', () => {
    const dressed4 = CARDS.filter((x) => x.rarity === 4 && x.id !== x.char);
    expect(dressed4.length).toBeGreaterThanOrEqual(19);
    for (const c of dressed4) {
      const l = CARD_LINES[c.id];
      expect(l, c.id).toBeDefined();
      expect([l.start, l.skill, l.win].flatMap((t) => unreadKanji(t)), c.id).toEqual([]);
      expect(linesFor(c)).toBe(l);
      expect(l, c.id).not.toEqual(COMPANION_LINES[c.char]);
    }
  });
});
