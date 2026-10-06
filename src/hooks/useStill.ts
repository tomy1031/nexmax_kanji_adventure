import { useReducedMotion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

/**
 * Whether the screen keeps still: the game's own 動きを 少なく, or the device's
 * "reduce motion" — unless the player chose ぜんぶ 動かす over the device
 * (2026-10-07「ブラウザ側で 動きを 減らして いた 場合に 演出は する ってこと
 * ですよね？」: a Mac or iPhone with that setting on saw the gentle version
 * without knowing why). Still, the shows still play; only the shaking,
 * flying, spinning and flashing turn into fades.
 */
export const stillOf = (deviceReduced: boolean, gameReduced: boolean, fullMotion: boolean): boolean => gameReduced || (deviceReduced && !fullMotion);

export const useStill = (): boolean => {
  const prefersReduced = useReducedMotion();
  const reduced = useGameStore((s) => s.settings.reducedMotion);
  const full = useGameStore((s) => s.fullMotion);
  return stillOf(Boolean(prefersReduced), reduced, Boolean(full));
};
