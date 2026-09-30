/**
 * 文字が 消えた 町 — the fight (08 §3.6): writing gives Nexmax his power. The
 * light of the character just written rises from the board into Nexmax, and
 * he fires it at the opponent as a beam.
 *
 * These are its beats, in ms from the end of the write. BattleScene times the
 * hit sound, the damage number and the win by them, so the win never lands
 * before the beam does.
 */
export const FLOW_MS = { rise: 300, charge: 90, beam: 140, fade: 180 } as const;

/** When the beam reaches the opponent. */
export const IMPACT_MS = FLOW_MS.rise + FLOW_MS.charge + FLOW_MS.beam;

/** The last hit's win settles this long after the write — once the beam is seen landing. */
export const WIN_DELAY_MASTERY_MS = IMPACT_MS + 300;

export interface Point {
  x: number;
  y: number;
}

/** Length and angle (degrees, clockwise from +x on screen) of a beam from `from` to `to`. */
export const beamBetween = (from: Point, to: Point) => ({
  length: Math.hypot(to.x - from.x, to.y - from.y),
  angle: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
});

/** How much light a write gives: a clean write is a full orb. `mistakes` in that write. */
export const lightOf = (mistakes: number, hinted: boolean): number => {
  if (hinted) return 0.45;
  if (mistakes === 0) return 1;
  return mistakes <= 2 ? 0.7 : 0.35;
};
