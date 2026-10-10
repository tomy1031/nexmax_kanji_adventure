import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafeBack } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { NightStreetBackdrop } from '../write/NightStreet';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { ACHIEVEMENTS, FAMILIES, claimable, isTaken, measures } from '../../data/achievements';
import * as sfx from '../../lib/sfx';

/**
 * 称号 (docs/design/19 §5): every title family — words, kanji, writing,
 * episodes, towns, ★3 and Hard wins, the forge, かくし words, charms, なかま,
 * days in a row, the level, versus — with its count now and its ladder. A
 * title earned glows until its ◆ is taken (one at a time, or ぜんぶ). The
 * popup that announces a title (AchievementToast) takes it too. Open from
 * せいせき on the map and from the title on ことば図鑑.
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
  // Every field a family counts, so the screen follows the save.
  const state = useGameStore();
  const counts = useMemo(() => measures(state), [state]);
  const waiting = useMemo(() => claimable(state, taken), [state, taken]);
  const got = ACHIEVEMENTS.filter((a) => (counts.get(a.family.id) ?? 0) >= a.at).length;
  /** The ◆ just taken, by title id, for its pop. */
  const [pops, setPops] = useState<Record<string, number>>({});

  const take = (id: string) => {
    const g = claimTitle(id);
    if (g == null) return false;
    setPops((p) => ({ ...p, [id]: g }));
    return true;
  };
  const takeAll = () => {
    let any = false;
    for (const a of waiting) any = take(a.id) || any;
    if (any) sfx.fanfare();
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
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className={`${onBg} text-sm font-black tabular-nums`}>
            <RubyText showFurigana={showFurigana}>{`🏅 とった 称号(しょうごう) ${got} / ${ACHIEVEMENTS.length}`}</RubyText>
          </span>
          {waiting.length > 0 && (
            <button type="button" data-tap className="g-btn g-btn-primary !min-h-[36px] !px-3 text-sm" onClick={takeAll}>
              <RubyText showFurigana={showFurigana}>{`ぜんぶ うけとる ◆${waiting.reduce((n, a) => n + a.gems, 0)}`}</RubyText>
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-3 px-4 pt-4">
        <p className={`${onBg} text-xs leading-[1.9] font-bold`}>
          <RubyText showFurigana={showFurigana}>
            書(か)く・話(わ)を クリアする・ことばを 見(み)つける・作(つく)る … いろいろな ことで 称号(しょうごう)を とります。とった 称号(しょうごう)の ◆ を うけとって ください。
          </RubyText>
        </p>

        {/* The rank words every title shares (data/achievements.ts): learn these five and any title reads. */}
        <div className="g-parchment px-3 py-2 text-center">
          <p className="text-[11px] font-black" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>称号(しょうごう)の ランク</RubyText>
          </p>
          <p className="text-[15px] leading-[2] font-black text-[#5a3410]">
            <RubyText showFurigana={showFurigana}>たまご → 好(す)き → 名人(めいじん) → 先生(せんせい) → 王(おう)さま</RubyText>
          </p>
          {en && (
            <p lang="en" className="text-[11px] font-bold" style={{ color: '#1b4f8f' }}>
              beginner → lover → expert → teacher → king
            </p>
          )}
        </div>

        {FAMILIES.map((f) => {
          const n = counts.get(f.id) ?? 0;
          const nextTier = f.tiers.find((x) => n < x.at);
          return (
            <section key={f.id} className="g-parchment px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-2xl">
                  {f.icon}
                </span>
                <h2 className="min-w-0 flex-1 text-sm font-black text-[#5a3410]">
                  <RubyText showFurigana={showFurigana}>{f.label}</RubyText>
                </h2>
                <span className="shrink-0 text-sm font-black tabular-nums">
                  <RubyText showFurigana={showFurigana}>{`${n} ${f.unit}`}</RubyText>
                </span>
              </div>
              {nextTier && (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (n / nextTier.at) * 100)}%`, background: 'var(--accent)' }} />
                </div>
              )}
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {f.tiers.map((tier) => {
                  const a = ACHIEVEMENTS.find((x) => x.family.id === f.id && x.at === tier.at)!;
                  const earned = n >= tier.at;
                  const done = isTaken(taken, a);
                  return (
                    <li
                      key={a.id}
                      className="relative flex min-h-[64px] flex-col justify-between rounded-xl border-2 px-2 py-1"
                      style={{
                        background: earned ? (done ? 'rgba(255,248,230,0.85)' : 'linear-gradient(160deg,#fffbe8,#ffe7a3)') : 'rgba(255,255,255,0.45)',
                        borderColor: earned && !done ? '#f2b53a' : 'rgba(122,74,38,0.25)',
                        boxShadow: earned && !done ? '0 0 10px rgba(255,200,70,0.6)' : undefined,
                      }}
                    >
                      <p className="text-[14px] leading-[1.7] font-black" style={{ color: earned ? '#5a3410' : 'rgba(90,52,16,0.5)' }}>
                        {earned ? '🏅' : '🔒'} <RubyText showFurigana={showFurigana}>{tier.ruby}</RubyText>
                      </p>
                      {en && (
                        <p lang="en" className="-mt-0.5 truncate text-[11px] font-bold" style={{ color: '#1b4f8f' }}>
                          {tier.en}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-1 text-[11px] font-bold tabular-nums">
                        <span style={{ color: 'var(--ink-2)' }}>
                          <RubyText showFurigana={showFurigana}>{`${tier.at} ${f.unit}`}</RubyText>
                        </span>
                        {done ? (
                          <span style={{ color: 'var(--ink-3)' }}>◆{tier.gems} ✓</span>
                        ) : earned ? (
                          <button
                            type="button"
                            data-tap
                            className="g-btn g-btn-primary !min-h-[28px] !px-2 text-[11px]"
                            onClick={() => take(a.id) && sfx.chime()}
                          >
                            <RubyText showFurigana={showFurigana}>{`◆${tier.gems} うけとる`}</RubyText>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ink-3)' }}>◆{tier.gems}</span>
                        )}
                      </div>
                      <AnimatePresence>
                        {pops[a.id] != null && (
                          <motion.span
                            key="pop"
                            aria-hidden
                            className="pointer-events-none absolute -top-2 right-2 text-base font-black text-[#e8a317]"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: [0, 1, 1, 0], y: -18 }}
                            transition={{ duration: 1.3 }}
                            onAnimationComplete={() =>
                              setPops((p) => {
                                const rest = { ...p };
                                delete rest[a.id];
                                return rest;
                              })
                            }
                          >
                            {`＋◆${pops[a.id]}`}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <button type="button" className="g-btn g-btn-accent mt-1 w-full" onClick={() => navigate('/words')}>
          📗 <RubyText showFurigana={showFurigana}>ことば図鑑(ずかん)で ことばを さがす</RubyText>
        </button>
      </div>
    </div>
  );
};

export default TitlesScreen;
