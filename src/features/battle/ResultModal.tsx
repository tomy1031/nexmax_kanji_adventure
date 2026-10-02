import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GiCrossedSwords, GiOpenBook, GiAnvil, GiPathDistance } from 'react-icons/gi';
import { RubyText } from '../../components/ui/Ruby';
import { LogoText } from '../../components/ui/LogoText';
import { useGameStore } from '../../store/gameStore';
import { FEATURE_INTRO, type Feature } from '../../data/unlocks';
import { KanjiWord } from '../../components/ui/Readings';
import type { KanjiData } from '../../types/kanji';
import type { Stars } from '../../lib/mastery';
import { NEXT_STAR_GAIN } from '../../data/starPerks';
import * as sfx from '../../lib/sfx';

/**
 * The end of a fight, as a game says it (2026-09-24「動線 その他の 動きに
 * ついても、アプリゲームとして 成立するように」).
 *
 *   win  — クリア！ drops in, the stars land one by one with rising notes,
 *          the gems count up, confetti falls. The main button leads on:
 *          つぎの 話へ. Replaying and the forge stay one tap away.
 *   lose — the verdict is plain (まけ), and the next step is the one that
 *          actually helps: れんしゅうする (the characters not yet owned are
 *          why the fight was lost). もう一度 and the forge sit beside it.
 */

type Outcome = { kind: 'win'; stars: 1 | 2 | 3 } | { kind: 'lose' };

const CONFETTI = ['#ffd24a', '#ff7a59', '#5cc0ff', '#7ed36b', '#ff9ad5', '#ffffff'];

export const ResultModal = ({
  outcome,
  bossName,
  mistakes,
  gems,
  newFriend,
  opened,
  tutorial,
  hasNext,
  onNext,
  onStages,
  onRetry,
  onPractice,
  onForge,
  onFeature,
  onTutorialDone,
  route,
  growth,
}: {
  outcome: Outcome;
  bossName: string;
  mistakes: number;
  gems: number;
  newFriend: boolean;
  opened: Feature[];
  tutorial: boolean;
  hasNext: boolean;
  onNext: () => void;
  onStages: () => void;
  onRetry: () => void;
  onPractice: () => void;
  onForge: () => void;
  onFeature: (f: Feature) => void;
  onTutorialDone: () => void;
  /**
   * 文字が 消えた 町 (08 §3.8): the win leads on into the episode's closing
   * scene (つづきへ); the forge is not offered here — it is reached from
   * じゅんび and もちもの once the story has shown it — and gems, which have
   * no use on this route yet, are not announced.
   */
  route?: 'moji';
  /**
   * What this fight did for the learner (文字が 消えた 町): the kanji whose ★
   * went up, and the reading turns got right. Shown win or lose — the
   * writing counted either way. `goal`: the kanji closest to its next star,
   * and what that star brings (🎯), so there is a reason to write again.
   */
  growth?: {
    starUps: { kanji: KanjiData; stars: Stars }[];
    read: { right: number; total: number };
    goal?: { kanji: KanjiData; left: number; next: 2 | 3 } | null;
  };
}) => {
  const moji = route === 'moji';
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const reduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(useReducedMotion() || reduced);
  const win = outcome.kind === 'win';
  const stars = win ? outcome.stars : 0;
  const [shownGems, setShownGems] = useState(still ? gems : 0);

  // Sound and the count-up follow the drop-in of each star.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (win) {
      sfx.fanfare();
      for (let i = 0; i < stars; i++) timers.push(setTimeout(() => sfx.star(i), 650 + i * 280));
      if (gems > 0 && !still) {
        const start = 650 + stars * 280;
        const steps = 12;
        for (let i = 1; i <= steps; i++) timers.push(setTimeout(() => setShownGems(Math.round((gems * i) / steps)), start + i * 45));
      }
    } else {
      sfx.lose();
    }
    return () => timers.forEach(clearTimeout);
  }, [win, stars, gems, still]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: win ? 'radial-gradient(circle at 50% 40%, rgba(255,220,120,0.35), rgba(0,0,0,0.7) 70%)' : 'rgba(10,15,30,0.72)' }}
    >
      {win && !still && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 36 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute top-0 block rounded-sm"
              style={{ left: `${(i * 29) % 100}%`, width: 7, height: 12, background: CONFETTI[i % CONFETTI.length] }}
              initial={{ y: -30, rotate: 0, opacity: 1 }}
              animate={{ y: '105dvh', rotate: 360 + i * 40, x: [0, (i % 2 ? 1 : -1) * 30, 0] }}
              transition={{ duration: 2.4 + (i % 5) * 0.35, delay: 0.3 + (i % 9) * 0.12, ease: 'easeIn' }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="g-frame relative w-full max-w-sm px-5 pt-3 pb-5 text-center"
      >
        <div className="-mt-10 mb-1">
          <LogoText tone={win ? 'gold' : 'blue'} className="text-[46px] leading-[1.5]">
            {win ? 'クリア！' : 'まけ…'}
          </LogoText>
        </div>

        {win && (
          <div className="flex items-end justify-center gap-1" aria-label={`ほし ${stars}こ`}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="text-[46px] leading-none"
                style={{
                  color: i < stars ? '#ffc81f' : '#d8c9a8',
                  filter: i < stars ? 'drop-shadow(0 2px 0 #9a5a00) drop-shadow(0 0 10px rgba(255,210,80,0.9))' : 'none',
                  fontSize: i === 1 ? 58 : 46,
                }}
                initial={still ? false : { scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.55 + i * 0.28 }}
              >
                ★
              </motion.span>
            ))}
          </div>
        )}

        <p className="mt-2 text-lg font-black">
          <RubyText showFurigana={showFurigana}>
            {win ? (tutorial ? `${bossName}は にげて いった！` : `${bossName} に かった！`) : 'たおされて しまった。'}
          </RubyText>
        </p>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>
            {win
              ? `まちがえた ところ ${mistakes}`
              : moji
                ? '★が 少(すく)ない 字(じ)を もっと 書(か)くと、つよく なる。'
                : 'まだ 持(も)って いない 字(じ)を れんしゅうすると、つよく なる。'}
          </RubyText>
        </p>

        {growth && (growth.starUps.length > 0 || growth.read.total > 0 || growth.goal) && (
          <div className="mt-3 rounded-xl px-3 py-2 text-left" style={{ background: 'rgba(255,255,255,0.55)', border: '2px solid #e0c48a' }}>
            <p className="text-xs font-black" style={{ color: 'var(--ink-2)' }}>
              この たたかいで
            </p>
            {growth.starUps.length > 0 && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {growth.starUps.map(({ kanji, stars: s }) => (
                  <span
                    key={kanji.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#fff6dd] px-2 text-lg leading-[1.9] font-black"
                    style={{ border: '1.5px solid #f2b53a' }}
                  >
                    <KanjiWord kanji={kanji} showFurigana={showFurigana} />
                    <span className="text-xs" style={{ color: '#e8a317' }} aria-label={`★${s}`}>
                      {'★'.repeat(s)}
                    </span>
                  </span>
                ))}
                <span className="text-xs font-black">に なった！</span>
              </div>
            )}
            {growth.read.total > 0 && (
              <p className="mt-0.5 text-sm font-black">
                📖 <RubyText showFurigana={showFurigana}>{`読(よ)めた ${growth.read.right} / ${growth.read.total}`}</RubyText>
              </p>
            )}
            {growth.goal && (
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1 text-sm leading-[2] font-black">
                🎯 <span>つぎ</span>
                <span className="text-base">
                  <KanjiWord kanji={growth.goal.kanji} showFurigana={showFurigana} />
                </span>
                <RubyText showFurigana={showFurigana}>
                  {`あと ${growth.goal.left}回(かい)で ★${growth.goal.next}・${NEXT_STAR_GAIN[growth.goal.next]}`}
                </RubyText>
              </p>
            )}
          </div>
        )}

        {gems > 0 && !moji && (
          <motion.p
            className="g-chip g-chip-gold mt-3 !text-base tabular-nums"
            initial={still ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + stars * 0.28, type: 'spring', stiffness: 380, damping: 14 }}
          >
            ◆ {shownGems} もらった
          </motion.p>
        )}
        {newFriend && (
          <p className="mt-2 text-sm font-black" style={{ color: '#2f8fe0' }}>
            <RubyText showFurigana={showFurigana}>新(あたら)しい なかまが 来(き)た！</RubyText>
          </p>
        )}

        {opened.map((f) => (
          <div key={f} className="mt-3 rounded-xl px-3 py-2.5 text-left" style={{ background: 'rgba(255,207,74,0.22)', border: '2px dashed #e0a93a' }}>
            <p className="text-sm font-black" style={{ color: '#b0741a' }}>
              <RubyText showFurigana={showFurigana}>{`「${FEATURE_INTRO[f].label}」が つかえるように なりました`}</RubyText>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>{FEATURE_INTRO[f].line}</RubyText>
            </p>
            <button type="button" className="g-btn g-btn-accent mt-2 w-full !min-h-[40px] text-xs" onClick={() => onFeature(f)}>
              <RubyText showFurigana={showFurigana}>見(み)に 行(い)く</RubyText>
            </button>
          </div>
        ))}

        {tutorial ? (
          <button type="button" className="g-btn g-btn-primary g-shine mt-5 w-full text-lg" onClick={onTutorialDone}>
            <span className="relative z-10">つぎへ ▶</span>
          </button>
        ) : win ? (
          <>
            <button type="button" className="g-btn g-btn-primary g-shine mt-5 w-full !min-h-[56px] text-lg" onClick={hasNext ? onNext : onStages}>
              <span className="relative z-10 flex items-center gap-2">
                <GiPathDistance aria-hidden size={22} />
                <RubyText showFurigana={showFurigana}>{moji ? 'つづきへ' : hasNext ? 'つぎの 話(はなし)へ' : 'ステージへ'}</RubyText>
              </span>
            </button>
            <div className="mt-2.5 flex gap-2">
              <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onRetry}>
                <GiCrossedSwords aria-hidden size={16} />
                <RubyText showFurigana={showFurigana}>もう一度(いちど)</RubyText>
              </button>
              {!moji && (
                <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onForge}>
                  <GiAnvil aria-hidden size={16} />
                  <RubyText showFurigana={showFurigana}>合成(ごうせい)</RubyText>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button type="button" className="g-btn g-btn-primary g-shine mt-5 w-full !min-h-[56px] text-lg" onClick={onPractice}>
              <span className="relative z-10 flex items-center gap-2">
                <GiOpenBook aria-hidden size={22} />
                <RubyText showFurigana={showFurigana}>れんしゅうする</RubyText>
              </span>
            </button>
            <div className="mt-2.5 flex gap-2">
              <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onRetry}>
                <GiCrossedSwords aria-hidden size={16} />
                <RubyText showFurigana={showFurigana}>もう一度(いちど)</RubyText>
              </button>
              {!moji && (
                <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onForge}>
                  <GiAnvil aria-hidden size={16} />
                  <RubyText showFurigana={showFurigana}>合成(ごうせい)</RubyText>
                </button>
              )}
            </div>
            <button type="button" className="mt-3 text-xs font-bold underline" style={{ color: 'var(--ink-2)' }} onClick={onStages}>
              {moji ? 'ステージせんたくへ もどる' : 'ステージへ もどる'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ResultModal;
