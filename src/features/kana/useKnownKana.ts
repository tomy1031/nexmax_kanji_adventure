import { useMemo } from 'react';
import { KANA_REPS } from '../../data/kana';
import { useGameStore } from '../../store/gameStore';

/** The kana the learner has written KANA_REPS times. */
export const useKnownKana = (): ReadonlySet<string> => {
  const kana = useGameStore((s) => s.kana);
  return useMemo(() => new Set(Object.keys(kana).filter((k) => kana[k] >= KANA_REPS)), [kana]);
};
