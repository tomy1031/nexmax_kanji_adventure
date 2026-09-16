import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { stagesOfArc, isStageUnlocked } from '../../data/stages';
import { Arc, LEVEL_OF_ARC } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import { isVersusConfigured } from '../../lib/supabaseClient';

/**
 * The map: three arcs, ten stages each, walked in order.
 *
 * Locked stages stay visible with their title hidden — the learner can see how
 * far the road goes without being told what happens next.
 */

const ARC_META: Record<Arc, { title: string; blurb: string; ready: boolean }> = {
  [Arc.MUKASHI]: {
    title: 'むかし編(へん)',
    blurb: '村(むら)と、山(やま)と、高(たか)い 木(き)の 話(はなし)。',
    ready: true,
  },
  [Arc.GENDAI]: {
    title: '現代編(げんだいへん)',
    blurb: 'インターネットで 夢(ゆめ)を 信(しん)じた ネクマックス。',
    ready: false,
  },
  [Arc.MIRAI]: {
    title: '未来編(みらいへん)',
    blurb: '家庭用(かていよう)ロボットに なった 時代(じだい)の 話(はなし)。',
    ready: false,
  },
};

export const WorldMap = () => {
  const navigate = useNavigate();
  const cleared = useGameStore((s) => s.clearedStages);
  const gems = useGameStore((s) => s.gems);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);

  const owned = Object.values(progress).filter((p) => p.obtainedAt != null).length;
  const stages = stagesOfArc(Arc.MUKASHI);

  return (
    <div className="g-stage pb-28">
      {/* 上のバー ------------------------------------------------------- */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur-md" style={{ background: 'var(--panel)' }}>
        <button type="button" className="g-btn g-btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => navigate('/')}>
          もどる
        </button>
        <div className="flex gap-2">
          <span className="g-chip">
            <RubyText showFurigana={showFurigana}>字(じ)</RubyText>
            <span className="tabular-nums">{owned}</span>
          </span>
          <span className="g-chip g-chip-gold">
            <span aria-hidden>◆</span>
            <span className="tabular-nums">{gems}</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        <h1 className="g-title text-xl">
          <RubyText showFurigana={showFurigana}>{ARC_META[Arc.MUKASHI].title}</RubyText>
        </h1>
        <p className="mb-4 text-sm" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>{ARC_META[Arc.MUKASHI].blurb}</RubyText>
        </p>

        <ol className="flex flex-col gap-3">
          {stages.map((stage, i) => {
            const unlocked = isStageUnlocked(stage, cleared);
            const done = cleared.includes(stage.id);

            return (
              <motion.li
                key={stage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => navigate(`/stage/${stage.id}`)}
                  className="g-panel flex w-full items-center gap-3 p-3 text-left disabled:opacity-55"
                  style={{ borderColor: done ? 'var(--color-gold)' : undefined }}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={assetPath(`img/bg/${stage.bg}.webp`)}
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover"
                      style={{ filter: unlocked ? undefined : 'grayscale(1) brightness(0.7)' }}
                    />
                    <span
                      className="absolute inset-x-0 bottom-0 text-center text-[11px] font-black text-white tabular-nums"
                      style={{ background: 'rgba(6,16,34,0.7)' }}
                    >
                      {stage.order}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="g-title truncate text-[15px]">
                      {unlocked ? (
                        <RubyText showFurigana={showFurigana}>{stage.title}</RubyText>
                      ) : (
                        <span style={{ color: 'var(--ink-3)' }}>？？？</span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                      {unlocked ? (
                        <>
                          <RubyText showFurigana={showFurigana}>漢字(かんじ)</RubyText>{' '}
                          <span className="tabular-nums">{stage.kanji.length}</span>
                          <span className="mx-1.5" aria-hidden>
                            ·
                          </span>
                          <span className="tabular-nums">◆{stage.reward}</span>
                        </>
                      ) : (
                        <RubyText showFurigana={showFurigana}>
                          前(まえ)の ステージを クリアすると ひらきます
                        </RubyText>
                      )}
                    </p>
                  </div>

                  {done && (
                    <span className="shrink-0 text-lg" style={{ color: 'var(--color-gold)' }} aria-label="クリアずみ">
                      ★
                    </span>
                  )}
                  {!unlocked && (
                    <span className="shrink-0 text-lg" style={{ color: 'var(--ink-3)' }} aria-label="まだ ひらいて いません">
                      🔒
                    </span>
                  )}
                </button>
              </motion.li>
            );
          })}
        </ol>

        {/* まだ できていない編 ----------------------------------------- */}
        {[Arc.GENDAI, Arc.MIRAI].map((arc) => (
          <div key={arc} className="g-panel mt-4 p-4 opacity-70">
            <p className="g-title text-base">
              <RubyText showFurigana={showFurigana}>{ARC_META[arc].title}</RubyText>
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--ink-3)' }}>
                {LEVEL_OF_ARC[arc]}
              </span>
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>{ARC_META[arc].blurb}</RubyText>
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--ink-3)' }}>
              <RubyText showFurigana={showFurigana}>じゅんび中(ちゅう)です。</RubyText>
            </p>
          </div>
        ))}
      </div>

      {/* 下のメニュー --------------------------------------------------- */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-20 flex justify-around border-t px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-md"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {[
          { to: '/forge', label: '合成(ごうせい)', icon: '⚒' },
          { to: '/words', label: 'ことば', icon: '⌕' },
          { to: '/collection', label: '図鑑(ずかん)', icon: '▤' },
          { to: '/gacha', label: 'ガチャ', icon: '◆' },
          // Versus only appears when a relay is configured; an entry that
          // always dead-ends is worse than no entry.
          ...(isVersusConfigured ? [{ to: '/versus', label: 'たいせん', icon: '⚔' }] : []),
          { to: '/daily', label: '毎日(まいにち)', icon: '✓' },
        ].map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-bold"
          >
            <span aria-hidden className="text-base">
              {item.icon}
            </span>
            <RubyText showFurigana={showFurigana}>{item.label}</RubyText>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default WorldMap;
