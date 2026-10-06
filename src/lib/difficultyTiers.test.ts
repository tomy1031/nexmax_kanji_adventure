import { beforeEach, describe, expect, it } from 'vitest';
import { EASY_PATIENCE_ADD, writesPerReadFor } from './difficulty';
import { skillGaugeFull } from './companionSkill';
import { WRITES_PER_READ } from './readTurn';
import { useGameStore } from '../store/gameStore';

/**
 * やさしい・ふつう・ハード (2026-10-07「hardを クリアすれば easy normal分も
 * クリア扱いに」): all open from the first fight, and a win counts for the
 * difficulties under it.
 */

describe('やさしい', () => {
  it('lets more slips pass, and keeps ふつう’s rhythm of reading turns and わざ', () => {
    expect(EASY_PATIENCE_ADD).toBeGreaterThan(0);
    expect(writesPerReadFor('easy')).toBe(WRITES_PER_READ);
    expect(skillGaugeFull('easy')).toBe(skillGaugeFull('normal'));
  });
});

describe('a higher win counts for the lower ones', () => {
  beforeEach(() => useGameStore.setState({ clearedStages: [], easyStages: [], hardStages: [] }));
  const win = (id: string, d: 'easy' | 'normal' | 'hard') => {
    const s = useGameStore.getState();
    s.markTier(id, d);
    if (d === 'hard') s.markHard(id);
    s.clearStage(id);
  };
  const st = () => useGameStore.getState();

  it('marks an やさしい-only win, and clears the stage so the story goes on', () => {
    win('moji-1-1', 'easy');
    expect(st().clearedStages).toContain('moji-1-1');
    expect(st().easyStages).toEqual(['moji-1-1']);
  });

  it('takes the sprout off with a ふつう or ハード win', () => {
    win('moji-1-1', 'easy');
    win('moji-1-1', 'normal');
    expect(st().easyStages).toEqual([]);
    win('moji-1-2', 'easy');
    win('moji-1-2', 'hard');
    expect(st().easyStages).toEqual([]);
    expect(st().hardStages).toContain('moji-1-2');
  });

  it('never marks a stage already won higher as やさしい-only', () => {
    win('moji-1-1', 'normal');
    win('moji-1-1', 'easy');
    expect(st().easyStages).toEqual([]);
    win('moji-1-2', 'hard');
    win('moji-1-2', 'easy');
    expect(st().easyStages).toEqual([]);
  });
});
