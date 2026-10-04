import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { KanjiWord, Readings } from '../../components/ui/Readings';
import { useGameStore } from '../../store/gameStore';
import type { KanjiData } from '../../types/kanji';
import { kanjiRuby, kunWords, onReadings } from '../../lib/reading';
import { repsToNextStar, starsOf } from '../../lib/mastery';
import { canSpeak, speak } from '../../lib/speech';
import { preloadCharData } from '../../lib/strokeLoader';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { cardWords, episodeOfKanji } from '../../data/kanjiCard';
import { episodePath, isEpisodeOpen } from '../../data/mojiFlow';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import KanjiBackText from '../moji/KanjiBackText';
import { useOwnedKanji } from '../moji/useOwnedKanji';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

/**
 * ずかんの 字カード (data/kanjiCard.ts): one kanji, to review it.
 *
 * Its sound (🔊), its readings, a few real words with it — a kanji not
 * written yet stays a sound, as in the story (KanjiBackText) — and its
 * meaning behind EN (docs/design/07 §3: a word's meaning, never a sentence).
 * 書きじゅん plays the stroke order over the model, for a kanji already
 * written (one not written yet stays a sound). ✎ goes back to write it
 * where it is taught, and comes back here. ◀ ▶ (and ← →) turn to the
 * kanji beside it in ずかん's order, so a chapter can be reviewed card by card.
 */
export const KanjiCard = ({
  kanji,
  onClose,
  onPrev,
  onNext,
  position,
}: {
  kanji: KanjiData;
  onClose: () => void;
  /** The kanji before and after it in ずかん, when there is one. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Where it sits, e.g. "3 / 60". */
  position?: string;
}) => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const reps = useGameStore((s) => s.progress[kanji.id]?.reps ?? 0);
  const cleared = useGameStore((s) => s.clearedStages);
  const owned = useOwnedKanji();
  const [en, setEn] = useState(() => useGameStore.getState().settings.english);
  const closeRef = useEscapeToClose(onClose);
  // Which kanji the stroke order is open for: turning the card starts it over.
  const [strokesFor, setStrokesFor] = useState<string | null>(null);
  const strokes = strokesFor === kanji.id;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);
  const writerRef = useRef<KanjiWriterHandle>(null);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fetched as the card opens, so 書きじゅん starts at once.
  useEffect(() => {
    void preloadCharData([kanji.char]);
    return () => {
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, [kanji.char]);
  const playStrokes = () => {
    setStrokesFor(kanji.id);
    if (playTimer.current) clearTimeout(playTimer.current);
    // The writer builds itself once mounted; play when it is there.
    playTimer.current = setTimeout(() => writerRef.current?.animateStroke(), strokes ? 0 : 450);
  };
  const stars = starsOf(reps);
  const have = stars > 0;
  const left = repsToNextStar(reps);
  const words = cardWords(kanji.char, owned);
  const ep = episodeOfKanji(kanji.char);
  const open = ep ? isEpisodeOpen(ep, cleared) : false;
  const sound = /\(([^)]*)\)/.exec(kanjiRuby(kanji))?.[1] ?? kanji.char;

  const write = () => {
    if (!ep) return;
    const to = episodePath(ep.id, cleared);
    navigate(`${to}${to.includes('?') ? '&' : '?'}back=${encodeURIComponent('/zukan?tab=kanji')}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-5"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={have ? kanji.char : sound}
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="g-parchment max-h-[90dvh] w-full max-w-sm overflow-y-auto px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex w-24 shrink-0 flex-col items-center">
            {have ? (
              <span className="text-[56px] leading-[1.6] font-black">
                <KanjiWord kanji={kanji} showFurigana={showFurigana} />
              </span>
            ) : (
              // Not written yet: only its sound, as in the story.
              <span className="kanji-lost flex h-[83px] items-center text-2xl font-black">{sound}</span>
            )}
            <span aria-label={`★${stars}`} className="text-base leading-none tracking-tight" style={{ color: '#e8a317' }}>
              {'★'.repeat(stars)}
              <span style={{ color: 'rgba(122,82,38,0.3)' }}>{'★'.repeat(3 - stars)}</span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-end gap-1.5">
              {canSpeak() && (
                <button
                  type="button"
                  className="rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px] whitespace-nowrap"
                  onClick={() => speak([...kunWords(kanji), ...onReadings(kanji)].join('、'))}
                >
                  🔊 よみあげ
                </button>
              )}
              <button
                type="button"
                aria-pressed={en}
                className="rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px] whitespace-nowrap"
                onClick={() => setEn(!en)}
              >
                EN
              </button>
            </div>
            <div className="mt-1">
              <Readings kanji={kanji} hideKanji={!have} size="sm" />
            </div>
            {en && (
              <p lang="en" className="mt-1 text-[14px] leading-snug font-extrabold" style={{ color: '#1b4f8f' }}>
                {kanji.meanings.slice(0, 3).join(', ')}
              </p>
            )}
          </div>
        </div>

        {have && (
          <div className="mt-2 flex items-center justify-center gap-3">
            {strokes && (
              <div key={kanji.id} className="overflow-hidden rounded-xl border-2 border-[#caa468] bg-white" style={{ width: 132, height: 132 }}>
                <KanjiWriterCanvas ref={writerRef} char={kanji.char} size={128} showSample />
              </div>
            )}
            <button
              type="button"
              data-tap
              className="rounded-full border-2 border-[#caa468] bg-white/80 px-3 py-1 text-[13px] font-black whitespace-nowrap"
              onClick={playStrokes}
            >
              <RubyText showFurigana={showFurigana}>{strokes ? '▶ もう一度(いちど)' : '✎ 書(か)きじゅん'}</RubyText>
            </button>
          </div>
        )}

        {words.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {words.map((w) => (
              <li key={w.word} className="rounded-xl bg-white/70 px-3 py-1 text-[15px] leading-[2] font-black">
                <KanjiBackText owned={owned}>{`${w.word}(${w.reading})`}</KanjiBackText>
                {en && (
                  <span lang="en" className="ml-2 text-[13px] font-bold" style={{ color: '#1b4f8f' }}>
                    {w.gloss}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-center text-[13px] leading-[1.9] font-bold" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>
            {left === 0 ? 'マスター！' : have ? `✎ あと ${left}回(かい)で ★${stars + 1}` : '✎ 3回(かい) 書(か)くと 手(て)に 入(はい)る'}
          </RubyText>
        </p>
        {ep && open && left > 0 ? (
          <button type="button" data-tap className="g-btn g-btn-primary mt-2 w-full" onClick={write}>
            ✎ <RubyText showFurigana={showFurigana}>書(か)きに いく</RubyText>
          </button>
        ) : !ep ? (
          <p className="mt-1 text-center text-xs font-black" style={{ color: 'var(--ink-3)' }}>
            <RubyText showFurigana={showFurigana}>この 字(じ)の 話(はなし)は じゅんび中(ちゅう)</RubyText>
          </p>
        ) : (
          !open &&
          left > 0 && (
            // Not a dead end: where this letter is met (2026-10-05).
            <p className="mt-1 text-center text-xs font-black" style={{ color: 'var(--ink-3)' }}>
              🔒 <RubyText showFurigana={showFurigana}>{`${MOJI_CHAPTERS.find((c) => c.id === ep.chapter)?.order ?? ''}章(しょう) ${ep.order}話(わ)で 会(あ)えます`}</RubyText>
            </p>
          )
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            data-tap
            aria-label="まえの 字"
            disabled={!onPrev}
            className="g-btn g-btn-ghost !min-h-[44px] !px-3 disabled:opacity-30"
            onClick={onPrev}
          >
            ◀
          </button>
          <button ref={closeRef} type="button" data-tap className="g-btn g-btn-ghost flex-1 !flex-col !gap-0 leading-tight" onClick={onClose}>
            とじる
            {position && <span className="text-[10px] font-bold tabular-nums opacity-70">{position}</span>}
          </button>
          <button
            type="button"
            data-tap
            aria-label="つぎの 字"
            disabled={!onNext}
            className="g-btn g-btn-ghost !min-h-[44px] !px-3 disabled:opacity-30"
            onClick={onNext}
          >
            ▶
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default KanjiCard;
