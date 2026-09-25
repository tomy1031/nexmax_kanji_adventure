import { useMemo } from 'react';
import { ALL_KANJI } from '../../lib/kanjiDb';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import { useGameStore } from '../../store/gameStore';

/** The kanji the player owns (written REPS_TO_OBTAIN times), by character. */
export const useOwnedKanji = (): ReadonlySet<string> => {
  const progress = useGameStore((s) => s.progress);
  return useMemo(
    () => new Set(ALL_KANJI.filter((k) => (progress[k.id]?.reps ?? 0) >= REPS_TO_OBTAIN).map((k) => k.char)),
    [progress],
  );
};
