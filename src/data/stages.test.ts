import { describe, it, expect } from 'vitest';
import { ALL_STAGES, MUKASHI_STAGES, stagesOfArc, isStageUnlocked } from './stages';
import { getKanjiByChar, kanjiOfLevel } from '../lib/kanjiDb';
import { ICON_POOL } from '../lib/forge/weapon';
import { Arc } from '../types/kanji';

describe('stage kanji', () => {
  it('only lists characters the dataset actually has', () => {
    const missing: string[] = [];
    for (const stage of ALL_STAGES) {
      for (const char of stage.kanji) {
        if (!getKanjiByChar(char)) missing.push(`${stage.id}: ${char}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('never teaches the same character twice', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const stage of ALL_STAGES) {
      for (const char of stage.kanji) {
        const first = seen.get(char);
        if (first) dupes.push(`${char}: ${first} and ${stage.id}`);
        else seen.set(char, stage.id);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('teaches characters at or below the stage level', () => {
    const order = { N5: 0, N4: 1, N3: 2 };
    const tooHard: string[] = [];
    for (const stage of ALL_STAGES) {
      for (const char of stage.kanji) {
        const k = getKanjiByChar(char);
        if (k && order[k.level] > order[stage.level]) {
          tooHard.push(`${stage.id}: ${char} is ${k.level}, stage is ${stage.level}`);
        }
      }
    }
    expect(tooHard).toEqual([]);
  });
});

describe('むかし編', () => {
  it('runs 1..10 with no gaps', () => {
    expect(MUKASHI_STAGES.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('covers every N5 kanji in the dataset', () => {
    const taught = new Set(MUKASHI_STAGES.flatMap((s) => s.kanji));
    const uncovered = kanjiOfLevel('N5')
      .map((k) => k.char)
      .filter((c) => !taught.has(c));
    expect(uncovered).toEqual([]);
  });

  it('gets harder as it goes', () => {
    const hp = MUKASHI_STAGES.map((s) => s.boss.hp);
    expect(hp).toEqual([...hp].sort((a, b) => a - b));
  });

  it('gives out three individuals across the arc', () => {
    const granted = MUKASHI_STAGES.map((s) => s.grants).filter(Boolean);
    expect(granted).toHaveLength(3);
  });
});

describe('isStageUnlocked', () => {
  it('opens the first stage to a new player', () => {
    expect(isStageUnlocked(MUKASHI_STAGES[0], [])).toBe(true);
  });

  it('keeps later stages shut until the one before is cleared', () => {
    expect(isStageUnlocked(MUKASHI_STAGES[1], [])).toBe(false);
    expect(isStageUnlocked(MUKASHI_STAGES[1], ['mukashi-1'])).toBe(true);
  });
});

describe('stagesOfArc', () => {
  it('returns the arc in play order', () => {
    const arc = stagesOfArc(Arc.MUKASHI);
    expect(arc).toHaveLength(10);
    expect(arc[0].id).toBe('mukashi-1');
  });
});

describe('boss icons', () => {
  it('names icons that exist in react-icons/gi', async () => {
    const gi = await import('react-icons/gi');
    const missing = ALL_STAGES.map((s) => s.boss.icon).filter((n) => !(n in gi));
    expect(missing).toEqual([]);
  });

  it('has every opponent icon in the bundled registry', async () => {
    const { GAME_ICONS } = await import('../lib/gameIcons');
    const missing = ALL_STAGES.map((s) => s.boss.icon).filter((n) => !(n in GAME_ICONS));
    expect(missing, 'run: node scripts/build_icon_registry.mjs').toEqual([]);
  });

  it('does not accidentally reuse a weapon icon for an opponent', () => {
    const weaponIcons = new Set(Object.values(ICON_POOL).flat());
    const clashes = ALL_STAGES.filter((s) => weaponIcons.has(s.boss.icon)).map((s) => s.id);
    expect(clashes).toEqual([]);
  });
});
