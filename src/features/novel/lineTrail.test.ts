import { describe, expect, it } from 'vitest';
import { START_TRAIL, canStepBack, currentLine, stepBack, stepTo } from './lineTrail';

describe('◀ もどる — back along the lines read', () => {
  it('has nothing to go back to on the first line', () => {
    expect(canStepBack(START_TRAIL)).toBe(false);
    expect(stepBack(START_TRAIL)).toEqual(START_TRAIL);
    expect(currentLine(START_TRAIL)).toBe(0);
  });

  it('goes back one line at a time, and on again', () => {
    let t = stepTo(stepTo(START_TRAIL, 1), 2);
    expect(currentLine(t)).toBe(2);
    t = stepBack(t);
    expect(currentLine(t)).toBe(1);
    t = stepTo(t, 2);
    expect(currentLine(t)).toBe(2);
  });

  it('returns to the line the reader came from after a jump, not the one above it', () => {
    // A choice on line 3 jumps to line 8.
    const t = stepTo(stepTo(stepTo(stepTo(START_TRAIL, 1), 2), 3), 8);
    expect(currentLine(stepBack(t))).toBe(3);
  });
});
