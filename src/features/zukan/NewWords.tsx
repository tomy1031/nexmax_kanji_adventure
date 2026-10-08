import { useState } from 'react';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { cardWords } from '../../data/kanjiCard';
import { charRuby } from '../../lib/reading';
import { useOwnedKanji } from '../moji/useOwnedKanji';
import WordLearn from './WordLearn';

/**
 * この 字の ことば (docs/design/19 §4 C): on the card that says a kanji is
 * the player's, the words with it that can now be read whole and are not in
 * ことば図鑑 yet — how many, and one or two (`max`) to learn right there (WordLearn), so
 * writing a kanji leads straight on to its words. Nothing when there are none.
 */
export const NewWords = ({ char, max = 2 }: { char: string; max?: number }) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const en = useGameStore((s) => s.settings.english);
  const owned = useOwnedKanji();
  // Fixed as the card opens: a word learned here stays in the list, marked 📗.
  const [found] = useState(() => new Set(Object.keys(useGameStore.getState().foundWords)));
  const fresh = cardWords(char, owned, Infinity, found).filter((w) => !found.has(w.word) && [...w.word].every((c) => owned.has(c)));
  if (!fresh.length) return null;
  return (
    <div className="mt-3 rounded-xl border-2 border-[#caa468] bg-[#fff8e6]/80 px-2.5 py-2 text-left">
      <p className="text-center text-[13px] leading-[1.9] font-black" style={{ color: '#7a4a26' }}>
        📗 <RubyText showFurigana={showFurigana}>{`「${charRuby(char)}」の ことばが ${fresh.length}こ あります`}</RubyText>
      </p>
      <ul className="mt-1 flex flex-col gap-1">
        {fresh.slice(0, max).map((w) => (
          <WordLearn key={w.word} word={w} owned={owned} en={en} />
        ))}
      </ul>
    </div>
  );
};

export default NewWords;
