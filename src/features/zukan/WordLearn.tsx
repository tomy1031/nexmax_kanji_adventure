import { useMemo, useState } from 'react';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import type { Compound } from '../../types/forge';
import { FoundVia, readingChoices } from '../../lib/forge/discovery';
import { canSpeak, speak } from '../../lib/speech';
import KanjiBackText from '../moji/KanjiBackText';
import * as sfx from '../../lib/sfx';

/**
 * ずかんの 字カードの ことば (docs/design/19 §4, 2026-10-08「漢字学習 →
 * 漢字を 使った 言葉を 学習」): one word with the kanji, and — once every
 * kanji in it is the player's — 「おぼえる」: the word with its sound and
 * meaning, then its reading to pick out of three. Picked right, it goes into
 * ことば図鑑 (FoundVia.LEARNED); wrong, that one is struck off and the word
 * waits for the right one.
 */
export const WordLearn = ({ word, owned, en }: { word: Compound; owned: ReadonlySet<string>; en: boolean }) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const found = useGameStore((s) => Boolean(s.foundWords[word.word]));
  const recordFound = useGameStore((s) => s.recordFound);
  const readable = [...word.word].every((c) => owned.has(c));
  const [quiz, setQuiz] = useState(false);
  const [tried, setTried] = useState<string[]>([]);
  const [justLearned, setJustLearned] = useState(false);
  const choices = useMemo(() => (quiz ? readingChoices(word) : []), [quiz, word]);

  const pick = (r: string) => {
    if (r === word.reading) {
      recordFound(word.word, FoundVia.LEARNED);
      setQuiz(false);
      setJustLearned(true);
      sfx.chime();
    } else {
      setTried((t) => [...t, r]);
      sfx.fizz();
    }
  };

  if (quiz) {
    // The question is its reading, so the word stands bare here, as ことば図鑑's ？ cards do;
    // the row it came from (and 🔊) gave the reading a moment ago.
    const asked = word.word;
    return (
      <li className="rounded-xl border-2 border-[#caa468] bg-white/90 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[26px] leading-[1.5] font-black tracking-wide">{asked}</span>
          {en && (
            <span lang="en" className="text-[13px] font-bold" style={{ color: '#1b4f8f' }}>
              {word.gloss}
            </span>
          )}
        </div>
        <p className="text-[12px] font-black" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>読(よ)みは どれ？</RubyText>
        </p>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {choices.map((r) => {
            const out = tried.includes(r);
            return (
              <button
                key={r}
                type="button"
                data-tap
                disabled={out}
                onClick={() => pick(r)}
                className="g-btn g-btn-ghost !min-h-[42px] !px-1 text-[15px] font-black disabled:opacity-35"
                style={out ? { textDecoration: 'line-through' } : undefined}
              >
                {r}
              </button>
            );
          })}
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1 text-[15px] leading-[2] font-black">
      <span className="min-w-0 flex-1">
        <KanjiBackText owned={owned}>{`${word.word}(${word.reading})`}</KanjiBackText>
        {en && (
          <span lang="en" className="ml-2 text-[13px] font-bold" style={{ color: '#1b4f8f' }}>
            {word.gloss}
          </span>
        )}
      </span>
      {readable && canSpeak() && (
        <button type="button" data-tap aria-label={`${word.reading}を よむ`} className="shrink-0 text-[15px]" onClick={() => speak(word.reading)}>
          🔊
        </button>
      )}
      {found ? (
        <span className="shrink-0 rounded-full bg-[#ffe7a3] px-2 text-[11px] leading-[1.8] font-black text-[#7a4a26]">
          <RubyText showFurigana={showFurigana}>{justLearned ? '📗 図鑑(ずかん)に 入(はい)った！' : '📗 図鑑(ずかん)'}</RubyText>
        </span>
      ) : (
        readable && (
          <button
            type="button"
            data-tap
            className="shrink-0 rounded-full border-2 border-[#caa468] bg-[#fff6dc] px-2.5 text-[12px] leading-[1.9] font-black whitespace-nowrap"
            onClick={() => {
              if (canSpeak()) speak(word.reading);
              setQuiz(true);
            }}
          >
            <RubyText showFurigana={showFurigana}>おぼえる</RubyText>
          </button>
        )
      )}
    </li>
  );
};

export default WordLearn;
