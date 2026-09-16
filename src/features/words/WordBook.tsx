import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { ALL_KANJI } from '../../lib/kanjiDb';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import {
  cardFor,
  charProgress,
  wordsFor,
  titleFor,
  nextTitle,
  HINT_COST,
  MAX_HINT,
  MISSES_BEFORE_ANSWER,
  FoundVia,
  type WordCard,
} from '../../lib/forge/discovery';
import { RubyText } from '../../components/ui/Ruby';

/**
 * ことば図鑑 — the treasure map.
 *
 * Every word the learner can build right now is a card. Found ones show
 * face-up; the rest show their meaning and all but one character, and the
 * hidden character is the thing to work out.
 *
 * Only words buildable from characters already owned are listed. Showing what
 * lies beyond would turn the collection into a nag to go grind the next
 * stage; the map only draws treasure that is actually within reach.
 */

type Tab = 'cards' | 'chars';

export const WordBook = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const foundWords = useGameStore((s) => s.foundWords);
  const hints = useGameStore((s) => s.hints);
  const misses = useGameStore((s) => s.misses);
  const sumi = useGameStore((s) => s.sumi);
  const buyHint = useGameStore((s) => s.buyHint);
  const recordFound = useGameStore((s) => s.recordFound);
  const earnedFoundCount = useGameStore((s) => s.earnedFoundCount);

  const [tab, setTab] = useState<Tab>('cards');
  const [open, setOpen] = useState<WordCard | null>(null);

  const owned = useMemo(
    () => new Set(ALL_KANJI.filter((k) => (progress[k.id]?.reps ?? 0) >= REPS_TO_OBTAIN).map((k) => k.char)),
    [progress],
  );
  const foundSet = useMemo(() => new Set(Object.keys(foundWords)), [foundWords]);

  const all = useMemo(() => wordsFor(owned), [owned]);
  const cards = useMemo(() => all.map(cardFor), [all]);
  const chars = useMemo(() => charProgress(owned, foundSet), [owned, foundSet]);

  const foundCount = all.filter((c) => foundSet.has(c.word)).length;
  const earned = earnedFoundCount();
  const title = titleFor(earned);
  const upcoming = nextTitle(earned);

  const openTier = open ? Math.max(1, hints[open.compound.word] ?? 1) : 1;
  const openMisses = open ? (misses[open.compound.word] ?? 0) : 0;
  const nextTierCost = openTier < MAX_HINT ? HINT_COST[openTier + 1] : null;
  const answerLocked = openTier + 1 === MAX_HINT && openMisses < MISSES_BEFORE_ANSWER;

  return (
    <div className="g-stage min-h-dvh pb-8">
      <header className="sticky top-0 z-20 px-4 py-3 backdrop-blur-md" style={{ background: 'var(--panel)' }}>
        <div className="flex items-center justify-between">
          <button type="button" className="g-btn g-btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => navigate('/map')}>
            もどる
          </button>
          <h1 className="g-title text-base">
            <RubyText showFurigana={showFurigana}>ことば図鑑(ずかん)</RubyText>
          </h1>
          <span className="g-chip text-xs tabular-nums" title="すみ">
            <span aria-hidden>🖌</span>
            {sumi}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <span className="tabular-nums" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>見(み)つけた</RubyText> {foundCount} / {all.length}
          </span>
          {title && (
            <span className="g-chip g-chip-gold !py-0.5">
              <RubyText showFurigana={showFurigana}>{`${title.word}(${title.reading})`}</RubyText>
            </span>
          )}
        </div>
        {upcoming && (
          <p className="mt-1 text-[11px]" style={{ color: 'var(--ink-3)' }}>
            <RubyText showFurigana={showFurigana}>
              {`あと ${upcoming.at - earned} 語(ご)で 「${upcoming.word}(${upcoming.reading})」`}
            </RubyText>
          </p>
        )}

        <div className="mt-2 flex gap-2">
          {(
            [
              ['cards', 'ことば', `${foundCount}/${all.length}`],
              ['chars', '字(じ)ごと', `${chars.length}`],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className="g-btn flex-1 !min-h-[38px] text-xs"
              style={{
                background: tab === id ? 'var(--accent)' : 'var(--panel-solid)',
                color: tab === id ? '#fff' : 'var(--ink)',
              }}
            >
              <RubyText showFurigana={showFurigana}>{label}</RubyText>
              <span className="ml-1 tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        {all.length === 0 && (
          <div className="g-panel p-6 text-center text-sm" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>
              まだ 漢字(かんじ)が 足(た)りません。ステージで 漢字(かんじ)を 集(あつ)めましょう。
            </RubyText>
          </div>
        )}

        {tab === 'cards' && (
          <ul className="grid grid-cols-3 gap-2">
            {cards.map((card) => {
              const word = card.compound.word;
              const via = foundWords[word];
              const isFound = Boolean(via);
              return (
                <li key={word}>
                  <button
                    type="button"
                    onClick={() => setOpen(card)}
                    className="g-panel flex w-full flex-col items-center gap-1 p-2"
                    style={{ borderColor: isFound ? 'var(--color-gold)' : 'var(--line)' }}
                  >
                    <span className="text-xl font-black tracking-wide">
                      {isFound ? word : card.masked}
                    </span>
                    <span className="w-full truncate text-[10px]" style={{ color: 'var(--ink-3)' }}>
                      {card.compound.gloss}
                    </span>
                    {isFound && (
                      <span
                        className="text-[11px]"
                        // Words opened with the answer get a grey star: still
                        // collected, but not counted as found.
                        style={{ color: via === FoundVia.TOLD ? 'var(--ink-3)' : 'var(--color-gold)' }}
                      >
                        ★
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'chars' && (
          <ul className="flex flex-col gap-1.5">
            {chars
              .filter((c) => c.total > 0)
              .map((c) => (
                <li key={c.char} className="g-panel flex items-center gap-3 p-2.5">
                  <span className="text-2xl font-black">{c.char}</span>
                  <div className="min-w-0 flex-1">
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.found / c.total) * 100}%`,
                          background: c.found === c.total ? 'var(--color-gold)' : 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--ink-2)' }}>
                    {c.found} / {c.total}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* カード 1枚 ----------------------------------------------------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-6"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="g-panel-solid w-full max-w-sm p-6 text-center"
            >
              {(() => {
                const word = open.compound.word;
                const via = foundWords[word];
                const isFound = Boolean(via);
                const tier = isFound ? MAX_HINT : openTier;

                return (
                  <>
                    <p className="my-2 text-4xl font-black tracking-widest">
                      {isFound ? word : open.masked}
                    </p>

                    {/* 段1: 意味 — いつでも 無料 */}
                    <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                      {open.compound.gloss}
                    </p>

                    {/* 段2: 読み */}
                    {tier >= 2 && (
                      <p className="mt-1 text-sm">{open.compound.reading}</p>
                    )}

                    {/* 段3: 隠れた字の 画数 */}
                    {tier >= 3 && !isFound && (
                      <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>
                        <RubyText showFurigana={showFurigana}>
                          {`かくれた 字(じ)は ${[...word][open.hiddenIndex]} と 同(おな)じ なかま`}
                        </RubyText>
                      </p>
                    )}

                    {isFound ? (
                      <p className="mt-4 text-xs" style={{ color: 'var(--ink-3)' }}>
                        <RubyText showFurigana={showFurigana}>
                          {via === FoundVia.TOLD
                            ? 'こたえを 見(み)て 開(ひら)きました。'
                            : via === FoundVia.LUCKY
                              ? 'ぐうぜん 見(み)つけました。'
                              : 'ねらって 見(み)つけました。'}
                        </RubyText>
                      </p>
                    ) : (
                      <>
                        <p className="mt-4 text-xs" style={{ color: 'var(--ink-3)' }}>
                          <RubyText showFurigana={showFurigana}>
                            合成(ごうせい)で この 言葉(ことば)を 作(つく)ると 見(み)つかります。
                          </RubyText>
                        </p>

                        {nextTierCost !== null && (
                          <button
                            type="button"
                            className="g-btn g-btn-ghost mt-3 w-full text-sm"
                            disabled={sumi < nextTierCost || answerLocked}
                            onClick={() => {
                              const opened = buyHint(word);
                              // The last tier simply gives the answer: the word
                              // is collected, but with a grey star.
                              if (opened === MAX_HINT) recordFound(word, FoundVia.TOLD);
                            }}
                          >
                            <RubyText showFurigana={showFurigana}>
                              {openTier + 1 === MAX_HINT
                                ? answerLocked
                                  ? `こたえは あと ${MISSES_BEFORE_ANSWER - openMisses} 回(かい) はずすと 見(み)られます`
                                  : `こたえを 見(み)る（🖌${nextTierCost}）`
                                : openTier + 1 === 2
                                  ? `読(よ)みかたを 見(み)る（🖌${nextTierCost}）`
                                  : `ヒントを 見(み)る（🖌${nextTierCost}）`}
                            </RubyText>
                          </button>
                        )}
                      </>
                    )}

                    <button type="button" className="g-btn g-btn-primary mt-3 w-full" onClick={() => setOpen(null)}>
                      とじる
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordBook;
