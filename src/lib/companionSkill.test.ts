import { describe, it, expect } from 'vitest';
import { gaugeGain, SKILL_INFO, SKILL_OF, SkillKind, skillEffect, skillGaugeFull } from './companionSkill';
import { INDIVIDUALS } from '../data/individuals';
import { COMPANION_LINES, HURT_LINE } from '../data/companionLines';
import { unreadKanji } from './ruby';

describe('every companion has a わざ', () => {
  it('gives each of the sixteen one', () => {
    for (const ind of INDIVIDUALS) expect(SKILL_OF[ind.id], ind.id).toBeDefined();
  });

  it('uses every kind at least twice, so no わざ is one companion’s secret', () => {
    const counts = new Map<string, number>();
    for (const k of Object.values(SKILL_OF)) counts.set(k, (counts.get(k) ?? 0) + 1);
    for (const k of Object.values(SkillKind)) expect(counts.get(k) ?? 0, k).toBeGreaterThanOrEqual(2);
  });
});

describe('skillEffect', () => {
  it('grows with rarity', () => {
    expect(skillEffect('heal', 3).heal).toBeLessThan(skillEffect('heal', 4).heal!);
    expect(skillEffect('heal', 4).heal).toBeLessThan(skillEffect('heal', 5).heal!);
    expect(skillEffect('power', 3).power).toBeLessThan(skillEffect('power', 5).power!);
    expect(skillEffect('calm', 5).calm).toBe(99);
    expect(skillEffect('guard', 5).guards).toBe(2);
  });

  it('grows 8% a きずな level on the numbers, not on the counts', () => {
    expect(skillEffect('heal', 3, 5).heal).toBe(Math.round(25 * 1.4));
    expect(skillEffect('guard', 3, 5).guards).toBe(1);
  });

  it('never hurts the opponent by itself — the damage comes from writing', () => {
    for (const k of Object.values(SkillKind)) {
      for (const r of [3, 4, 5] as const) expect(Object.keys(skillEffect(k, r)), `${k}★${r}`).not.toContain('damage');
    }
  });
});

describe('the gauge', () => {
  it('fills in three clean writes, and half again on Hard', () => {
    expect(skillGaugeFull('normal')).toBe(3 * gaugeGain(0, false));
    expect(skillGaugeFull('hard')).toBe(9);
  });

  it('pays for writing, not for looking', () => {
    expect(gaugeGain(0, false)).toBe(2);
    expect(gaugeGain(1, false)).toBe(1);
    expect(gaugeGain(2, false)).toBe(0);
    expect(gaugeGain(0, true)).toBe(0);
  });
});

describe('the words', () => {
  it('reads every kanji: わざ lines and companions’ lines', () => {
    const bare: string[] = [];
    for (const k of Object.values(SkillKind)) {
      for (const r of [3, 4, 5] as const) for (const c of unreadKanji(SKILL_INFO[k].says(skillEffect(k, r)))) bare.push(`${k}: ${c}`);
      for (const c of unreadKanji(HURT_LINE[k])) bare.push(`hurt ${k}: ${c}`);
    }
    for (const [id, l] of Object.entries(COMPANION_LINES)) {
      for (const line of [l.start, l.skill, l.win]) for (const c of unreadKanji(line)) bare.push(`${id}: ${c}`);
    }
    expect(bare).toEqual([]);
  });

  it('gives every companion its own lines', () => {
    for (const ind of INDIVIDUALS) expect(COMPANION_LINES[ind.id], ind.id).toBeDefined();
  });
});
