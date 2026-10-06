import { describe, expect, it } from 'vitest';
import { stillOf } from './useStill';

describe('動きを 少なく と ぜんぶ 出す (2026-10-07)', () => {
  it('keeps still on the game’s setting, whatever the device says', () => {
    expect(stillOf(false, true, false)).toBe(true);
    expect(stillOf(true, true, true)).toBe(true);
  });

  it('follows the device’s reduce-motion, unless ぜんぶ 出す is on', () => {
    expect(stillOf(true, false, false)).toBe(true);
    expect(stillOf(true, false, true)).toBe(false);
  });

  it('moves when nothing asks for less', () => {
    expect(stillOf(false, false, false)).toBe(false);
    expect(stillOf(false, false, true)).toBe(false);
  });
});
