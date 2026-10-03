import { describe, it, expect } from 'vitest';
import { comboMilestone, comboTier, isComboBreak, strokeEnd, strokeLift } from './combo';

describe('comboTier', () => {
  it('shows nothing under two, then climbs in steps', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 25].map((c) => comboTier(c).level)).toEqual([0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('never steps down as the combo grows', () => {
    for (let c = 1; c < 30; c++) expect(comboTier(c + 1).level).toBeGreaterThanOrEqual(comboTier(c).level);
  });
});

describe('comboMilestone', () => {
  it('banners 3, 5, 7, 10 and every five after', () => {
    const hits = Array.from({ length: 26 }, (_, c) => c).filter((c) => comboMilestone(c));
    expect(hits).toEqual([3, 5, 7, 10, 15, 20, 25]);
  });

  it('writes the banners in kana only — no furigana needed on the field', () => {
    for (const c of [3, 5, 7, 10, 15]) expect(comboMilestone(c)).not.toMatch(/[一-龯]/);
  });
});

describe('strokeLift', () => {
  it('rises with each stroke, up to an octave', () => {
    expect(strokeLift(0, 0)).toBe(0);
    expect(strokeLift(5, 0)).toBe(5);
    expect(strokeLift(20, 0)).toBe(12);
  });

  it('rises again with the combo', () => {
    expect(strokeLift(0, 10)).toBeGreaterThan(strokeLift(0, 3));
  });
});

describe('isComboBreak', () => {
  it('only counts a real combo ending', () => {
    expect(isComboBreak(3, 0)).toBe(true);
    expect(isComboBreak(1, 0)).toBe(false);
    expect(isComboBreak(3, 4)).toBe(false);
  });
});

describe('strokeEnd', () => {
  const at = (x: number, y: number) => ({ drawnPath: { points: [{ x: 0, y: 0 }, { x, y }] } });

  it('maps hanzi-writer’s square (y up, from −124) onto the board', () => {
    // 20 px padding on a 424 px board: 400 px for 1024 units.
    expect(strokeEnd(at(0, 900), 424)).toEqual({ x: 20 / 424, y: 20 / 424 });
    expect(strokeEnd(at(1024, -124), 424)).toEqual({ x: 404 / 424, y: 404 / 424 });
    const mid = strokeEnd(at(512, 388), 424)!;
    expect(mid.x).toBeCloseTo(0.5);
    expect(mid.y).toBeCloseTo(0.5);
  });

  it('gives nothing without a drawn path', () => {
    expect(strokeEnd({}, 424)).toBeNull();
    expect(strokeEnd(at(1, 1), 0)).toBeNull();
  });
});
