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
import { getKanjiByChar } from '../../lib/kanjiDb';
import { kanjiRuby } from '../../lib/reading';

/**
 * 新ルート「文字が 消えた 町」の 章表 (08 §10, 段1).
 *
 * Every chapter is listed with its lessons and the kanji it teaches, so the
 * road is visible; none can start until its story is written.
 */

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
  const known = useKnownKana();
  const [params] = useSearchParams();
  const fresh = params.get('new');
  // This map is now "home": つづきから, ストーリー and もどる come back here.
  useEffect(() => setLastArc('moji'), [setLastArc]);

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

        {/* 0章 かな編 (08 §3.4) --------------------------------------- */}
        <section className="g-parchment p-3">
          <h2 className="text-xl font-black" style={{ color: 'var(--accent-2)' }}>
            <RubyText showFurigana={showFurigana}>0章(しょう)</RubyText> <KanaText known={known}>かなの もり</KanaText>
            <span className="ml-2 text-xs" style={{ color: 'var(--ink-2)' }}>
              <KanaText known={known}>ひらがな・カタカナ</KanaText>
            </span>
          </h2>
          <p className="mt-1 text-xs font-bold" style={{ color: 'var(--ink-2)' }} lang="en">
            Can't read kana yet? Start here. Romaji disappears from each kana once you have written it.
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
                      <KanaText known={known}>{ep.title}</KanaText>
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
                        {!ready && (
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

        <button type="button" className="g-btn g-btn-accent mx-auto px-6" onClick={() => navigate('/map')}>
          <RubyText showFurigana={showFurigana}>世界(せかい)を えらぶ</RubyText>
        </button>
      </div>
      <BottomTabs current="story" />
    </div>
  );
};

export default MojiRouteMap;
