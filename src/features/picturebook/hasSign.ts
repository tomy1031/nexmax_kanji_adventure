import { SCENES } from './scenes';

/** Whether the scene has a sign for this letter (so a town shot shows it light up). */
export const hasSign = (scene: string | undefined, char: string): boolean =>
  Boolean(scene && SCENES[scene]?.signs?.spots.some((s) => s.char === char));
