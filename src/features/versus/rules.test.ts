import { describe, expect, it } from 'vitest';
import { SELF_HIT, VS_MAX_HP, writeDamage } from './rules';

describe('versus rules — skill over gems', () => {
  it('pays clean writing more than any weapon can', () => {
    const cleanBare = writeDamage(0, false, 1);
    const sloppyBest = writeDamage(2, false, 1.2);
    expect(cleanBare).toBeGreaterThan(sloppyBest);
  });

  it('counts a hint like two slips', () => {
    expect(writeDamage(0, true, 1)).toBe(writeDamage(2, false, 1));
  });

  it('ends a match in a handful of clean writes, never in one', () => {
    const writes = Math.ceil(VS_MAX_HP / writeDamage(0, false, 1.2));
    expect(writes).toBeGreaterThanOrEqual(5);
    expect(writes).toBeLessThanOrEqual(8);
    expect(SELF_HIT).toBeLessThan(writeDamage(0, false, 1));
  });
});
