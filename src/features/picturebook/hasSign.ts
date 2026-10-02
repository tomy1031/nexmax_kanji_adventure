import { SCENES } from './scenes';
import type { SceneSignSet } from './SceneSigns';

/** Whether the scene has a sign for this letter (so a town shot shows it light up). */
export const hasSign = (scene: string | undefined, char: string): boolean =>
  Boolean(scene && SCENES[scene]?.signs?.spots.some((s) => s.char === char));

/**
 * Where the page sits (its top, in px) when a wide screen cuts the tall page:
 * slid so the scene's signs are in the upper part of the screen. null when
 * the page is not cut, or the scene has no signs (then it stays centred).
 */
export const signPageY = (signs: SceneSignSet | undefined, pageH: number, boxH: number): number | null => {
  if (!signs || pageH <= boxH + 1) return null;
  const top = Math.min(...signs.spots.map((s) => s.y));
  const bottom = Math.max(...signs.spots.map((s) => s.y + s.h));
  const want = boxH * 0.3 - ((top + bottom) / 2) * (pageH / signs.image[1]);
  return Math.max(boxH - pageH, Math.min(0, want));
};

/**
 * The same sideways: on a tall narrow phone the page is cut left and right,
 * and a sign near an edge of the painting (the station calendar's 金・土) falls
 * off the screen. Slide the page so every sign is on screen when they fit,
 * else centre them. null when the page is not cut, or there are no signs.
 */
export const signPageX = (signs: SceneSignSet | undefined, pageW: number, boxW: number): number | null => {
  if (!signs || pageW <= boxW + 1) return null;
  const k = pageW / signs.image[0];
  const left = Math.min(...signs.spots.map((s) => s.x)) * k;
  const right = Math.max(...signs.spots.map((s) => s.x + s.w)) * k;
  const centred = boxW / 2 - (left + right) / 2;
  const margin = 6;
  // Keep both ends in when the row fits; otherwise centre it.
  const want = right - left + margin * 2 <= boxW ? Math.min(Math.max(centred, boxW - margin - right), margin - left) : centred;
  return Math.max(boxW - pageW, Math.min(0, want));
};
