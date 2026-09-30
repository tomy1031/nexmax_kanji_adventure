/**
 * Where hanzi-writer draws a stroke on the writing square, so the sign drill
 * (features/write/SignLight.tsx) can lay a neon tube exactly under it.
 *
 * Stroke data lives in a 1024 × 1024 box — x 0..1024, y −124..900, y pointing
 * up. hanzi-writer fits that box inside the square less `padding` on every
 * side and flips y (its Positioner: translate(xOffset, height − yOffset)
 * scale(s, −s)). KanjiWriterCanvas always uses a square and padding 20.
 */

export const WRITER_PADDING = 20;

/** A point of stroke data → pixels on a square writer of `size`. */
export const toSquare = ([x, y]: readonly number[], size: number, padding = WRITER_PADDING): [number, number] => {
  const s = (size - 2 * padding) / 1024;
  return [padding + x * s, size - padding - (y + 124) * s];
};

/** Pixel points → an SVG path ("M x y L x y …"). */
export const pathFromPoints = (pts: readonly (readonly [number, number])[]): string =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

/** A stroke's centre line (its median, from the stroke data) as a path on the square. */
export const medianPath = (median: readonly (readonly number[])[], size: number, padding = WRITER_PADDING): string =>
  pathFromPoints(median.map((p) => toSquare(p, size, padding)));

/** hanzi-writer reports the finger's path in square pixels as "M x y L x y …". */
export const pointsOfPath = (pathString: string): [number, number][] => {
  const nums = pathString.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
  return pts;
};
