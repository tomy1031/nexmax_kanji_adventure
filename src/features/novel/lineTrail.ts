/**
 * The lines of a story the reader has come through, in order — the last one
 * is on screen. ◀ もどる steps back along it (2026-10-09「セリフを 戻せる
 * ボタン」), so after a jump (a choice, a goto) it returns to the line the
 * reader actually came from, not to the one above it in the script.
 */
export type LineTrail = readonly number[];

export const START_TRAIL: LineTrail = [0];

/** The line on screen. */
export const currentLine = (trail: LineTrail): number => trail[trail.length - 1];

/** On to `next`. */
export const stepTo = (trail: LineTrail, next: number): LineTrail => [...trail, next];

/** Whether there is a line to go back to. */
export const canStepBack = (trail: LineTrail): boolean => trail.length > 1;

/** Back to the line before; the first line stays where it is. */
export const stepBack = (trail: LineTrail): LineTrail => (canStepBack(trail) ? trail.slice(0, -1) : trail);
