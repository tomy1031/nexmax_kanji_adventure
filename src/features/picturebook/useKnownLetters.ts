import { useMemo } from 'react';
import { useKnownKana } from '../kana/useKnownKana';
import { useOwnedKanji } from '../moji/useOwnedKanji';

/** The letters the player has brought back: kana written enough, kanji owned (★1). */
export const useKnownLetters = (): ReadonlySet<string> => {
  const kana = useKnownKana();
  const kanji = useOwnedKanji();
  return useMemo(() => new Set([...kana, ...kanji]), [kana, kanji]);
};
