import { useMemo } from 'react';
import { ALL_KANJI } from '../../lib/kanjiDb';
import { MOJI_OWN_REPS } from '../../lib/mastery';
import { useGameStore } from '../../store/gameStore';

/**
 * The kanji the player has on the new route (★1: written MOJI_OWN_REPS
 * times), by character. The old routes still ask for ten (REPS_TO_OBTAIN).
 */
export const useOwnedKanji = (): ReadonlySet<string> => {
  const progress = useGameStore((s) => s.progress);
  return useMemo(
    () => new Set(ALL_KANJI.filter((k) => (progress[k.id]?.reps ?? 0) >= MOJI_OWN_REPS).map((k) => k.char)),
    [progress],
  );
};
