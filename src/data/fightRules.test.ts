import { describe, expect, it } from 'vitest';
import { COMBO_CAP_PERCENT, FIGHT_RULES } from './fightRules';
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
