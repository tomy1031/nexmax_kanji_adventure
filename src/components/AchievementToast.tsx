import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from './ui/Ruby';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { claimable, getAchievement, reachedIds } from '../data/achievements';
import * as sfx from '../lib/sfx';

/**
 * 称号 GET！ (2026-10-08「達成時に ポップアップで 表示」): whenever a 称号 is
 * earned — an episode cleared, a kanji at ★3, a word found, a charm made —
 * a banner drops in at the top with the title and its ◆ to take there and
 * then. One at a time; each goes on its own after a while, and what was not
 * taken waits in 称号. While a fight is on (useQuiet), and on the title screen,
 * they wait.
 *
 * A save from before the titles (titlesSeen null) is not greeted with a
 * dozen banners: what it has already earned is noted quietly, and one banner
 * says how much ◆ is waiting in 称号.
 */

const SHOW_MS = 8000;

type Item = { kind: 'title'; id: string } | { kind: 'summary'; count: number; gems: number };

export const AchievementToast = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const en = useGameStore((s) => s.settings.english);
  const quiet = useUiStore((s) => s.quiet);
  const [queue, setQueue] = useState<Item[]>([]);
  /** The ◆ just taken from the banner on show, for its "+◆". */
  const [took, setTook] = useState<number | null>(null);

  // Watch the save: a title newly reached joins the queue, once.
  useEffect(() => {
    const check = () => {
      const s = useGameStore.getState();
      const reached = reachedIds(s);
      if (s.titlesSeen == null) {
        s.markTitlesSeen(reached);
        const waiting = claimable(s, s.titleRewards);
        if (waiting.length) setQueue((q) => [...q, { kind: 'summary', count: waiting.length, gems: waiting.reduce((n, a) => n + a.gems, 0) }]);
        return;
      }
      const fresh = reached.filter((id) => !s.titlesSeen!.includes(id));
      if (!fresh.length) return;
      s.markTitlesSeen(fresh);
      setQueue((q) => [...q, ...fresh.map((id) => ({ kind: 'title' as const, id }))]);
    };
    check();
    return useGameStore.subscribe(check);
  }, []);

  // Not over the title screen or the prologue: the game has not started there.
  const { pathname } = useLocation();
  const held = quiet > 0 || pathname === '/' || pathname.startsWith('/prologue');
  const current = held ? undefined : queue[0];
  const next = () => {
    setTook(null);
    setQueue((q) => q.slice(1));
  };

  // Each banner leaves on its own.
  useEffect(() => {
    if (!current) return;
    sfx.chime();
    const t = setTimeout(next, SHOW_MS);
    return () => clearTimeout(t);
  }, [current]);

  const a = current?.kind === 'title' ? getAchievement(current.id) : undefined;
  const taken = useGameStore((s) => (a ? s.titleRewards.includes(a.id) : false));

  const take = () => {
    if (!a) return;
    const gems = useGameStore.getState().claimTitle(a.id);
    if (gems == null) return;
    setTook(gems);
    sfx.fanfare();
    setTimeout(next, 1300);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(8px,env(safe-area-inset-top))] z-[80] flex justify-center px-3">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.kind === 'title' ? current.id : 'summary'}
            role="status"
            initial={{ opacity: 0, y: -40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="g-parchment pointer-events-auto relative flex w-full max-w-sm items-center gap-3 px-3 py-2"
            style={{ borderColor: '#ffd24a', boxShadow: '0 0 18px rgba(255,200,70,0.75), 0 8px 18px rgba(0,0,0,0.35)' }}
          >
            <span aria-hidden className="text-3xl">
              {a ? a.family.icon : '🏅'}
            </span>
            {a ? (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-[1.6] font-black" style={{ color: '#b0741a' }}>
                  <RubyText showFurigana={showFurigana}>🏅 称号(しょうごう) GET！</RubyText>
                </p>
                <p className="truncate text-lg leading-[1.7] font-black text-[#5a3410]">
                  <RubyText showFurigana={showFurigana}>{`「${a.ruby}」`}</RubyText>
                </p>
                <p className="truncate text-[11px] leading-[1.7] font-bold" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>{`${a.family.label} ${a.at}${a.family.unit === 'Lv' ? '' : ` ${a.family.unit}`}`}</RubyText>
                  {en && (
                    <span lang="en" className="ml-1.5 font-bold" style={{ color: '#1b4f8f' }}>
                      {a.en}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              current.kind === 'summary' && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-[1.8] font-black text-[#5a3410]">
                    <RubyText showFurigana={showFurigana}>{`称号(しょうごう)が ${current.count}こ あります！`}</RubyText>
                  </p>
                  <p className="text-[11px] font-black" style={{ color: '#b0741a' }}>
                    <RubyText showFurigana={showFurigana}>{`◆ ${current.gems} を うけとって ください`}</RubyText>
                  </p>
                </div>
              )
            )}
            {a ? (
              took != null ? (
                <motion.span initial={{ scale: 0.6 }} animate={{ scale: [1.3, 1] }} className="shrink-0 text-lg font-black text-[#e8a317]">
                  {`＋◆${took}`}
                </motion.span>
              ) : taken ? null : (
                <button type="button" data-tap className="g-btn g-btn-primary shrink-0 !min-h-[40px] !px-3 text-sm" onClick={take}>
                  <RubyText showFurigana={showFurigana}>{`◆${a.gems} うけとる`}</RubyText>
                </button>
              )
            ) : (
              <button
                type="button"
                data-tap
                className="g-btn g-btn-primary shrink-0 !min-h-[40px] !px-3 text-sm"
                onClick={() => {
                  next();
                  navigate('/titles');
                }}
              >
                <RubyText showFurigana={showFurigana}>称号(しょうごう)へ</RubyText>
              </button>
            )}
            <button type="button" data-tap aria-label="とじる" className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#5a3410] text-xs font-black text-white" onClick={next}>
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AchievementToast;
