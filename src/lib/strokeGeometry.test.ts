import { describe, expect, it } from 'vitest';
import { medianPath, pointsOfPath, toSquare } from './strokeGeometry';

describe('strokeGeometry — stroke data onto the writing square', () => {
  it('maps the corners of the 1024 box to the padded square, y flipped', () => {
    // Top-left of the character box (x 0, y 900) is the top-left of the padding.
    expect(toSquare([0, 900], 300)).toEqual([20, 20]);
    // Bottom-right (x 1024, y −124) is the bottom-right of the padding.
    expect(toSquare([1024, -124], 300)).toEqual([280, 280]);
    // The centre stays the centre at any size.
    const [cx, cy] = toSquare([512, 388], 240);
    expect(cx).toBeCloseTo(120);
    expect(cy).toBeCloseTo(120);
  });

  it('turns a median into a path', () => {
    expect(medianPath([[0, 900], [1024, -124]], 300)).toBe('M20.0 20.0 L280.0 280.0');
  });

  it('reads the finger path hanzi-writer reports', () => {
    expect(pointsOfPath('M 10 20 L 30.5 -4')).toEqual([[10, 20], [30.5, -4]]);
    expect(pointsOfPath('')).toEqual([]);
  });
});
