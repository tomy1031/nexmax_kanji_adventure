import { useReducedMotion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

/** Reduced motion for the doors (components/ui/Doors.tsx): the system setting or the game's own. */
export const useStillDoors = (): boolean => {
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  return Boolean(prefersReduced || settingReduced);
};
