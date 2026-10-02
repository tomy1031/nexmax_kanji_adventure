import { useGameStore } from '../../store/gameStore';
import { levelInfo, ownedCount } from '../../lib/level';

/** ネクマックスの レベル as the screens show it (lib/level.ts). */
export const useNexmaxLevel = () => {
  const exp = useGameStore((s) => s.exp);
  const progress = useGameStore((s) => s.progress);
  return levelInfo(exp, ownedCount(progress));
};
