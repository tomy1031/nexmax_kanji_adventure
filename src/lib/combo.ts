/**
 * How a COMBO looks and sounds as it grows (docs/design/11 §2).
 *
 * The bonus itself is lib/mastery.ts comboMultiplier; this only decides the
 * show: a run of clean writes should feel like it is building, so the colour,
 * the size and the pitch climb in steps, and a few counts get a banner.
 */

export interface ComboTier {
  /** 0: no combo (under 2). 1..5 climb. */
  level: 0 | 1 | 2 | 3 | 4 | 5;
  /** The counter's colour. The top tier draws a rainbow instead (ComboFx). */
  color: string;
}

const TIERS: { from: number; tier: ComboTier }[] = [
  { from: 10, tier: { level: 5, color: '#ffffff' } },
  { from: 7, tier: { level: 4, color: '#ff6fa0' } },
  { from: 5, tier: { level: 3, color: '#ff9a3c' } },
  { from: 3, tier: { level: 2, color: '#ffd36a' } },
  { from: 2, tier: { level: 1, color: '#fff1cf' } },
];

export const comboTier = (combo: number): ComboTier =>
  TIERS.find((t) => combo >= t.from)?.tier ?? { level: 0, color: '#fff1cf' };

/** The counts that get a banner across the field, and what it says. */
const MILESTONES: Record<number, string> = {
  3: 'いい ちょうし！',
  5: 'ノリノリ！',
  7: 'とまらない！',
  10: 'さいこう！',
};

/** The banner for this count, if it gets one: 3, 5, 7, 10, then every five. */
export const comboMilestone = (combo: number): string | null =>
  MILESTONES[combo] ?? (combo > 10 && combo % 5 === 0 ? 'でんせつ！' : null);

/**
 * How far a correct stroke's ping is raised, in semitones: a step per stroke
 * of the character (up to an octave), and two per combo tier on top, so a
 * long clean run climbs higher than any single character does.
 */
export const strokeLift = (strokeNum: number, combo: number): number =>
  Math.min(12, Math.max(0, strokeNum)) + comboTier(combo).level * 2;

/** A combo of this size ending is worth a sound and a fall: it was something. */
export const isComboBreak = (before: number, after: number): boolean => before >= 2 && after === 0;

/**
 * hanzi-writer's drawn points are in its own square: x 0..1024 left to right,
 * y −124..900 bottom to top, inside `padding` pixels (KanjiWriterCanvas: 20).
 * Returns the last point as a share of the writing square, or null.
 */
export const strokeEnd = (data: Record<string, unknown>, size: number, padding = 20): { x: number; y: number } | null => {
  const pts = (data.drawnPath as { points?: { x: number; y: number }[] } | undefined)?.points;
  const p = pts?.at(-1);
  if (!p || !(size > 0)) return null;
  const s = (size - padding * 2) / 1024;
  const x = (padding + p.x * s) / size;
  const y = (size - padding - (p.y + 124) * s) / size;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
};
