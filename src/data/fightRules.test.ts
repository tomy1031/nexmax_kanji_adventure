import { describe, expect, it } from 'vitest';
import { BATTLE_TIPS, COMBO_CAP_PERCENT, FIGHT_RULES, READY_TIPS, STARS_TIP, nextReadyTip, tipDue, tipOf } from './fightRules';
import { comboMultiplier } from '../lib/mastery';
import { unreadKanji } from '../lib/ruby';

describe('たたかいの ひみつ', () => {
  it('states the COMBO cap the fight uses', () => {
    expect(COMBO_CAP_PERCENT).toBe(Math.round((comboMultiplier(100) - 1) * 100));
    expect(FIGHT_RULES.some((r) => r.text.includes(`+${COMBO_CAP_PERCENT}%`))).toBe(true);
  });

  it('tells why practice matters: the opponent hunts the fewest ★', () => {
    expect(FIGHT_RULES.some((r) => r.text.includes('★が 少(すく)ない'))).toBe(true);
  });

  it('gives every rule a picture and an English line for the EN button', () => {
    for (const r of FIGHT_RULES) {
      expect(r.icons, r.text).toBeTruthy();
      expect(r.en, r.text).toBeTruthy();
    }
  });

  it('puts furigana on every kanji', () => {
    expect(FIGHT_RULES.flatMap((r) => unreadKanji(r.text))).toEqual([]);
  });
});

describe('ひみつを 1つずつ (2026-10-04)', () => {
  it('tells every rule and the ★ line, each once: on じゅんび or in the fight', () => {
    const all = [...READY_TIPS, ...BATTLE_TIPS];
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(all)).toEqual(new Set([...FIGHT_RULES.map((r) => r.id), STARS_TIP.id]));
    for (const id of all) {
      const t = tipOf(id);
      expect(t.icons && t.text && t.en, id).toBeTruthy();
      expect(unreadKanji(t.text), id).toEqual([]);
    }
  });

  it('tells the じゅんび tips one a visit, in order, starting with writing without a model', () => {
    expect(nextReadyTip([], false)).toBe('noModel');
    expect(nextReadyTip(['noModel'], false)).toBe('stars');
    expect(nextReadyTip(['noModel', 'stars'], false)).toBe('hunted');
    expect(nextReadyTip(['noModel', 'stars', 'hunted'], false)).toBeNull();
  });

  it('has nothing left to tell a player who read both pages of ひみつ', () => {
    expect(nextReadyTip([], true)).toBeNull();
    for (const id of BATTLE_TIPS) expect(tipDue(id, [], true)).toBe(false);
    expect(tipDue('counter', [], false)).toBe(true);
    expect(tipDue('counter', ['counter'], false)).toBe(false);
  });
});
