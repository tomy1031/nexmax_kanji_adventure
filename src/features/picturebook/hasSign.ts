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
