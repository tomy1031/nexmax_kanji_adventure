import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { BottomTabs, LogoTitle, NexmaxSays } from '../../components/ui/Chrome';
import { useGameStore } from '../../store/gameStore';
import { MOJI_CHAPTERS, PART_OF_LEVEL, isChapterReady } from '../../data/mojiRoute';
import type { JlptLevel } from '../../types/kanji';
import PictureBook from '../picturebook/PictureBook';
import { KANA_EPISODES, isKanaEpisodeUnlocked } from '../../data/kana';
import KanaText from '../kana/KanaText';
import { useKnownKana } from '../kana/useKnownKana';
import { episodesOf, isMojiEpisodeUnlocked } from '../../data/mojiEpisodes';
import KanjiBackText from '../moji/KanjiBackText';
import { useOwnedKanji } from '../moji/useOwnedKanji';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { kanjiRuby } from '../../lib/reading';
import { starsOf } from '../../lib/mastery';
import { Feature, FEATURE_INTRO, isFeatureUnlocked } from '../../data/unlocks';
import { isVersusConfigured } from '../../lib/supabaseClient';

/**
 * 新ルート「文字が 消えた 町」の 章表 (08 §10, 段1).
 *
 * Every chapter is listed with its lessons and the kanji it teaches, so the
 * road is visible; none can start until its story is written.
 */

/** A kanji's reading for its card: the one the learner meets first. */
const readingOf = (ch: string): string => {
  const k = getKanjiByChar(ch);
  return k ? (kanjiRuby(k).match(/\((.+)\)/)?.[1] ?? ch) : ch;
};

/** How many of a chapter's kanji the card shows. */
const PREVIEW = 8;

const PARTS: { level: JlptLevel; title: string }[] = [
  { level: 'N5', title: 'N5 編(へん)' },
  { level: 'N4', title: 'N4 編(へん)' },
  { level: 'N3', title: 'N3 編(へん)' },
];

export const MojiRouteMap = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const setLastArc = useGameStore((s) => s.setLastArc);
  const cleared = useGameStore((s) => s.clearedStages);
  const progress = useGameStore((s) => s.progress);
  /** An episode's stars: each kanji's ★ (lib/mastery.ts), added up. */
  const starsOfEpisode = (chars: string[]) =>
    chars.reduce((n, ch) => n + starsOf(progress[getKanjiByChar(ch)?.id ?? '']?.reps ?? 0), 0);
  const known = useKnownKana();
  const owned = useOwnedKanji();
  const [params] = useSearchParams();
  const fresh = params.get('new');
  // This map is now "home": つづきから, ストーリー and もどる come back here.
  useEffect(() => setLastArc('moji'), [setLastArc]);

  // The systems this route has opened (unlocks.ts), as on the picture-book maps.
  // The word book is a tab, and the collection is reached from そうび.
  const extras = (
    [
      { f: Feature.FORGE, icon: '⚒' },
      { f: Feature.DAILY, icon: '✓' },
      { f: Feature.GACHA, icon: '◆' },
      ...(isVersusConfigured ? [{ f: Feature.VERSUS, icon: '⚔' }] : []),
    ] as const
  ).filter(({ f }) => isFeatureUnlocked(f, cleared));

  return (
    <div className="isolate relative min-h-dvh pb-28">
      <PictureBook scene="mukashi_meadow" className="!fixed -z-10" />
      <div className="mx-auto flex max-w-md flex-col gap-4 px-3 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="relative">
          <LogoTitle size={28} sub="書(か)いて、町(まち)に 字(じ)を 取(と)り戻(もど)そう">
            文字(もじ)が 消(き)えた 町(まち)
          </LogoTitle>
          <div className="absolute -top-1 -right-1">
            <NexmaxSays text="0章(しょう)から はじめよう！" pose="hello" size={48} />
          </div>
        </div>

        {/* ひらいた 機能（右の 丸ボタン） ----------------------------------- */}
        {extras.length > 0 && (
          <div className="flex justify-end gap-2">
            {extras.map(({ f, icon }) => (
              <button
                key={f}
                type="button"
                onClick={() => navigate(FEATURE_INTRO[f].to)}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-white text-[10px] leading-tight font-black text-white"
                style={{ background: 'linear-gradient(180deg,#5cc0ff,#1d6fc4)', boxShadow: '0 3px 0 #15529a' }}
              >
                <span aria-hidden className="text-base leading-none">
                  {icon}
                </span>
                <RubyText showFurigana={showFurigana}>{FEATURE_INTRO[f].label}</RubyText>
              </button>
            ))}
          </div>
        )}

        {/* 0章 かな編 (08 §3.4) --------------------------------------- */}
        <section className="g-parchment p-3">
          <h2 className="text-xl font-black" style={{ color: 'var(--accent-2)' }}>
            <RubyText showFurigana={showFurigana}>0章(しょう)</RubyText> <KanaText known={known}>かなの もり</KanaText>
            <span className="ml-2 text-xs" style={{ color: 'var(--ink-2)' }}>
              <KanaText known={known}>ひらがな・カタカナ</KanaText>
            </span>
          </h2>
          <span className="mt-1 inline-block rounded bg-[#4f9a3c] px-1.5 py-0.5 text-[11px] font-black text-white">
            <KanaText known={known}>にんい</KanaText> · optional
          </span>
          <p className="mt-1 text-xs font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
            Can't read kana yet? Start here — it is optional, and Chapter 1 does not need it. Nexmax can only say the letters you
            have written; everything else is eaten.
          </p>
          <ol className="mt-2 grid grid-cols-2 gap-2">
            {KANA_EPISODES.map((ep) => {
              const open = isKanaEpisodeUnlocked(ep, cleared);
              const done = cleared.includes(ep.id);
              return (
                <li key={ep.id}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => navigate(`/kana/${ep.id}`)}
                    className="relative w-full rounded-xl border-2 px-2 py-1.5 text-left disabled:opacity-50"
                    style={{
                      borderColor: fresh === ep.id ? '#e2453c' : done ? '#4f9a3c' : '#caa468',
                      background: done ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {fresh === ep.id && (
                      <span className="absolute -top-2 -right-1 rounded bg-[#e2453c] px-1 text-[10px] font-black text-white">NEW</span>
                    )}
                    <span className="block text-xs font-black" style={{ color: 'var(--ink-2)' }}>
                      {ep.order}. {ep.kana[0]}〜{ep.kana[ep.kana.length - 1]} {done ? '✓' : ''}
                    </span>
                    <span className="block text-sm leading-[2] font-black">
                      <KanaText known={known} mode="mask">
                        {ep.title}
                      </KanaText>
                    </span>
                    <span className="block text-[11px] font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
                      {ep.en}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        {PARTS.map(({ level, title }) => {
          const part = PART_OF_LEVEL[level];
          const chapters = MOJI_CHAPTERS.filter((c) => c.level === level);
          return (
            <section key={level} className="g-parchment p-3">
              <h2 className="text-xl font-black" style={{ color: 'var(--accent-2)' }}>
                <RubyText showFurigana={showFurigana}>{title}</RubyText>
                <span className="ml-2 text-xs" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>
                    {part.lessons ? `${part.book} ${part.lessons.from}〜${part.lessons.to}課(か)` : part.book}
                  </RubyText>
                </span>
              </h2>
              {chapters.length === 0 ? (
                <p className="mt-2 text-sm font-black" style={{ color: 'var(--ink-3)' }}>
                  <RubyText showFurigana={showFurigana}>じゅんび中(ちゅう)</RubyText>
                </p>
              ) : (
                <ol className="mt-2 flex flex-col gap-2">
                  {chapters.map((c, i) => {
                    const ready = isChapterReady(c);
                    return (
                      <motion.li
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl border-2 border-[#caa468] bg-white/80 px-3 py-2"
                        style={{ opacity: ready ? 1 : 0.85 }}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-black">
                            <RubyText showFurigana={showFurigana}>{`${c.order}章(しょう) ${c.title}`}</RubyText>
                          </span>
                          <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: 'var(--ink-2)' }}>
                            <RubyText showFurigana={showFurigana}>{`${c.lessons.from}〜${c.lessons.to}課(か)`}</RubyText>
                          </span>
                        </div>
                        <p className="text-[13px] leading-[1.95]">
                          <RubyText showFurigana={showFurigana}>{c.summary}</RubyText>
                        </p>
                        <div className="mt-1 flex flex-wrap items-end gap-1">
                          <span className="mr-1 text-xs font-black" style={{ color: 'var(--ink-2)' }}>
                            <RubyText showFurigana={showFurigana}>{`漢字(かんじ) ${c.kanji.length}字(じ)`}</RubyText>
                          </span>
                          {c.kanji.slice(0, PREVIEW).map((ch) => {
                            const k = getKanjiByChar(ch);
                            return (
                              <span key={ch} className="rounded border border-[#caa468] bg-[#fdf4dd] px-1 text-sm leading-[1.9] font-black">
                                <RubyText showFurigana={showFurigana}>{k ? kanjiRuby(k) : ch}</RubyText>
                              </span>
                            );
                          })}
                          {c.kanji.length > PREVIEW && <span className="text-xs font-black">…</span>}
                        </div>
                        {ready ? (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {episodesOf(c.id).map((ep) => {
                              const open = isMojiEpisodeUnlocked(ep, cleared);
                              const done = cleared.includes(ep.id);
                              const stars = starsOfEpisode(ep.kanji);
                              const max = ep.kanji.length * 3;
                              return (
                                <button
                                  key={ep.id}
                                  type="button"
                                  disabled={!open}
                                  onClick={() => navigate(`/moji/${ep.id}`)}
                                  className="relative rounded-xl border-2 px-2 py-1.5 text-left disabled:opacity-50"
                                  style={{
                                    borderColor: fresh === ep.id ? '#e2453c' : done ? '#4f9a3c' : '#caa468',
                                    background: done ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : '#fff',
                                  }}
                                >
                                  {fresh === ep.id && (
                                    <span className="absolute -top-2 -right-1 rounded bg-[#e2453c] px-1 text-[10px] font-black text-white">NEW</span>
                                  )}
                                  <span className="block text-xs font-black" style={{ color: 'var(--ink-2)' }}>
                                    <RubyText showFurigana={showFurigana}>{`${ep.order}話(わ) ${done ? '✓' : ''}`}</RubyText>
                                  </span>
                                  <span className="block text-sm leading-[2] font-black">
                                    <KanjiBackText owned={owned}>{ep.title}</KanjiBackText>
                                  </span>
                                  <span className="block text-base font-black tracking-wider">
                                    <KanjiBackText owned={owned}>{ep.kanji.map((k) => `${k}(${readingOf(k)})`).join(' ')}</KanjiBackText>
                                  </span>
                                  <span className="mt-0.5 flex items-center gap-1 text-xs font-black tabular-nums" style={{ color: '#c98a0c' }}>
                                    ★ {stars}/{max}
                                    {stars === max && <span aria-label="all mastered">👑</span>}
                                    <span className="ml-auto h-1.5 w-12 overflow-hidden rounded-full bg-black/10">
                                      <span className="block h-full rounded-full bg-[#f2b53a]" style={{ width: `${(stars / max) * 100}%` }} />
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs font-black" style={{ color: 'var(--ink-3)' }}>
                            <RubyText showFurigana={showFurigana}>じゅんび中(ちゅう)</RubyText>
                          </span>
                        )}
                      </motion.li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}

        <div className="flex items-center justify-center gap-4 text-sm font-black">
          <button type="button" className="g-parchment !rounded-full px-4 py-1" onClick={() => navigate('/prologue')} lang="en">
            ▶ Prologue
          </button>
          {/* The picture-book worlds are closing (2026-09-30): kept reachable, but only as a quiet link. */}
          <button type="button" className="px-2 py-1 text-[11px] font-bold text-[#33401f]/60 underline underline-offset-2" onClick={() => navigate('/map')}>
            <RubyText showFurigana={showFurigana}>ほかの 物語(ものがたり)</RubyText>
          </button>
        </div>
      </div>
      <BottomTabs current="story" />
    </div>
  );
};

export default MojiRouteMap;
