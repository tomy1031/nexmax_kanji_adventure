import { describe, expect, it } from 'vitest';
import { FLOW_MS, IMPACT_MS, WIN_DELAY_MASTERY_MS, beamBetween, lightOf } from './lightFlow';

describe('lightFlow — the written light, fired by Nexmax (08 §3.6)', () => {
  it('lands the beam before the win settles, with time to see it', () => {
    expect(IMPACT_MS).toBe(FLOW_MS.rise + FLOW_MS.charge + FLOW_MS.beam);
    expect(WIN_DELAY_MASTERY_MS - IMPACT_MS).toBeGreaterThanOrEqual(250);
    // Short enough not to hold the fight up.
    expect(IMPACT_MS).toBeLessThan(700);
  });

  it('measures the beam from Nexmax to the opponent', () => {
    const b = beamBetween({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(b.length).toBe(5);
    expect(b.angle).toBeCloseTo(53.13, 1);
    // Straight right, and up-right (screen y grows downward).
    expect(beamBetween({ x: 10, y: 10 }, { x: 20, y: 10 }).angle).toBe(0);
    expect(beamBetween({ x: 0, y: 10 }, { x: 10, y: 0 }).angle).toBeCloseTo(-45);
  });

  it('gives a clean write the most light', () => {
    expect(lightOf(0, false)).toBe(1);
    expect(lightOf(1, false)).toBeLessThan(1);
    expect(lightOf(3, false)).toBeLessThan(lightOf(2, false));
    expect(lightOf(0, true)).toBeLessThan(lightOf(0, false));
  });
});
