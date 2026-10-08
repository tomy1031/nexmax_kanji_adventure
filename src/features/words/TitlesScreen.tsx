import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafeBack } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { NightStreetBackdrop } from '../write/NightStreet';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { TITLES, earnsTitle, nextTitle, titleFor } from '../../lib/forge/discovery';
import * as sfx from '../../lib/sfx';

/**
 * 称号 (2026-10-08「今 どのような 称号が あるのか、称号の 特典（主に gem）が
 * 得られる 画面が ない。成績から 行けるように」): every title, what it takes
 * (words found in ことば図鑑 — by making, answering or learning them; not ones
 * opened with the answer, nor the town's words, lib/forge/discovery.ts
 * earnsTitle), how far there is to go, and its ◆ to take once it is earned.
 * Open from せいせき on the map and from the title on ことば図鑑.
 */
export const TitlesScreen = () => {
  const navigate = useNavigate();
  const safeBack = useSafeBack();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const en = useGameStore((s) => s.settings.english);
  const moji = useGameStore((s) => s.lastArc) === 'moji';
  const gems = useGameStore((s) => s.gems);
  const taken = useGameStore((s) => s.titleRewards);
  const claimTitle = useGameStore((s) => s.claimTitle);
  const foundWords = useGameStore((s) => s.foundWords);
  // Counted as the store counts it for claimTitle (earnsTitle).
  const earned = useMemo(() => Object.values(foundWords).filter(earnsTitle).length, [foundWords]);
  const now = titleFor(earned);
  const next = nextTitle(earned);
  const from = now?.at ?? 0;
  /** The title whose ◆ was just taken, for its pop. */
  const [justTook, setJustTook] = useState<string | null>(null);

  const take = (word: string) => {
    if (claimTitle(word) == null) return;
    setJustTook(word);
    sfx.fanfare();
  };

  const onBg = moji ? 'text-[#f4f1ff] [text-shadow:0_1px_4px_rgba(0,0,0,0.7)] [&_rt]:text-[#d9d2f5]' : 'g-onbg';

  return (
    <div className="g-stage min-h-dvh pb-8">
      {moji ? <NightStreetBackdrop /> : <Backdrop fixed />}
      <header className="g-header sticky top-0 z-20 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between">
          <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={safeBack}>
            <span aria-hidden>◀</span>もどる
          </button>
          <h1 className="g-title text-base">
            <RubyText showFurigana={showFurigana}>称号(しょうごう)</RubyText>
          </h1>
          <span className="g-chip g-chip-gold text-xs tabular-nums">◆ {gems}</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-3 px-4 pt-4">
        {/* いまの 称号 */}
        <section className="g-parchment px-4 py-3 text-center">
          <p className="text-xs font-black" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>いまの 称号(しょうごう)</RubyText>
          </p>
          <p className="text-3xl leading-[1.8] font-black" style={{ color: now ? '#b0741a' : 'var(--ink-3)' }}>
            {now ? <RubyText showFurigana={showFurigana}>{`🏅 ${now.ruby}`}</RubyText> : <RubyText showFurigana={showFurigana}>まだ ありません</RubyText>}
          </p>
          <p className="text-sm font-bold tabular-nums">
            <RubyText showFurigana={showFurigana}>{`見(み)つけた ことば ${earned} 語(ご)`}</RubyText>
          </p>
          {next && (
            <>
              <div className="mx-auto mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, ((earned - from) / (next.at - from)) * 100)}%`, background: 'var(--accent)' }}
                />
              </div>
              <p className="mt-1 text-xs font-bold">
                <RubyText showFurigana={showFurigana}>{`あと ${next.at - earned} 語(ご)で「${next.ruby}」`}</RubyText>
              </p>
            </>
          )}
        </section>

        <p className={`${onBg} text-xs leading-[1.9] font-bold`}>
          <RubyText showFurigana={showFurigana}>
            ことば図鑑(ずかん)の ことばを 見(み)つけると、称号(しょうごう)が かわります。漢字(かんじ)やさんで 作(つく)る・図鑑(ずかん)で こたえる・字(じ)カードで おぼえる、で 見(み)つけた ことばを 数(かぞ)えます。
          </RubyText>
        </p>

        {/* ぜんぶの 称号 */}
        <ul className="flex flex-col gap-2">
          {TITLES.map((t) => {
            const got = earned >= t.at;
            const done = taken.includes(t.word);
            return (
              <li
                key={t.word}
                className="g-parchment relative flex items-center gap-3 px-3 py-2.5"
                style={got && !done ? { borderColor: '#ffd24a', boxShadow: '0 0 14px rgba(255,210,90,0.6)' } : undefined}
              >
                <span aria-hidden className="text-3xl" style={{ filter: got ? undefined : 'grayscale(1)', opacity: got ? 1 : 0.45 }}>
                  🏅
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg leading-[1.8] font-black" style={{ color: got ? '#7a4a26' : 'var(--ink-3)' }}>
                    <RubyText showFurigana={showFurigana}>{t.ruby}</RubyText>
                    {en && (
                      <span lang="en" className="ml-2 text-[12px] font-bold" style={{ color: '#1b4f8f' }}>
                        {t.en}
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--ink-2)' }}>
                    <RubyText showFurigana={showFurigana}>
                      {got ? `ことば ${t.at} 語(ご) ✓` : `ことば ${t.at} 語(ご)（あと ${t.at - earned}）`}
                    </RubyText>
                  </p>
                </div>
                {done ? (
                  <span className="shrink-0 text-xs font-black" style={{ color: 'var(--ink-3)' }}>
                    <RubyText showFurigana={showFurigana}>{`◆${t.gems} うけとった`}</RubyText>
                  </span>
                ) : got ? (
                  <button type="button" data-tap className="g-btn g-btn-primary shrink-0 !min-h-[40px] !px-3 text-sm" onClick={() => take(t.word)}>
                    <RubyText showFurigana={showFurigana}>{`◆${t.gems} うけとる`}</RubyText>
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full border border-[#c8913e]/60 px-2 py-0.5 text-xs font-black tabular-nums" style={{ color: 'var(--ink-3)' }}>
                    ◆{t.gems}
                  </span>
                )}
                <AnimatePresence>
                  {justTook === t.word && (
                    <motion.span
                      key="pop"
                      aria-hidden
                      className="pointer-events-none absolute top-0 right-6 text-lg font-black text-[#e8a317]"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: [0, 1, 1, 0], y: -24 }}
                      transition={{ duration: 1.4 }}
                      onAnimationComplete={() => setJustTook(null)}
                    >
                      {`＋◆${t.gems}`}
                    </motion.span>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <button type="button" className="g-btn g-btn-accent mt-1 w-full" onClick={() => navigate('/words')}>
          📗 <RubyText showFurigana={showFurigana}>ことば図鑑(ずかん)で ことばを さがす</RubyText>
        </button>
      </div>
    </div>
  );
};

export default TitlesScreen;
