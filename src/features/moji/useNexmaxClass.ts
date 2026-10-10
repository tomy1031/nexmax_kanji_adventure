import { useGameStore } from '../../store/gameStore';
import { classOf } from '../../lib/nexmaxClass';

/** ネクマックスの クラス (lib/nexmaxClass.ts) as the screens show it: ★3, ★4 after 5章's まとめの ボス. */
export const useNexmaxClass = () => useGameStore((s) => classOf(s.clearedStages));
