import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { StageDef } from '../../data/stages';
import type { KanjiData } from '../../types/kanji';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { getKanjiById } from '../../lib/kanjiDb';
import { getIndividual } from '../../data/individuals';
import { forgeWeapon } from '../../lib/forge/weapon';
import { ELEMENT_LABEL } from '../../lib/forge/elements';
import { rustLevel } from '../../lib/srs';
import {
  computeDamage,
  counterDamage,
  isFailedWrite,
  starsFor,
  PLAYER_MAX_HP,
} from '../../lib/battle';
import { assetPath } from '../../lib/assetPath';
import { GameIcon } from '../../components/ui/GameIcon';
import { featuresUnlockedBy, FEATURE_INTRO } from '../../data/unlocks';

/**
 * The fight.
 *
 * A character from the stage appears; you write it. A clean write lands a
 * heavy hit, a sloppy one lands a weak hit, three slips and the opponent hits
 * back. That is the entire loop, and it means the fight is a test of the same
 * thing the drill taught — with the weapon deciding how much that skill is
 * worth.
 */

interface BattleSceneProps {
  stage: StageDef;
  kanjiPool: KanjiData[];
  onFinish: () => void;
  onFlee: () => void;
}

type Outcome = { kind: 'win'; stars: 1 | 2 | 3 } | { kind: 'lose' } | null;

export const BattleScene = ({ stage, kanjiPool, onFinish, onFlee }: BattleSceneProps) => {
  const navigate = useNavigate();
  const size = useCanvasSize(220, 0.26);

  const showFurigana = useGameStore((s) => s.settings.furigana);
  const equippedId = useGameStore((s) => s.equippedWeapon);
  const activeIndividualId = useGameStore((s) => s.activeIndividual);
  const weapons = useGameStore((s) => s.weapons);
  const progress = useGameStore((s) => s.progress);
  const clearStage = useGameStore((s) => s.clearStage);
  const addGems = useGameStore((s) => s.addGems);
  const grantIndividual = useGameStore((s) => s.grantIndividual);
  const recordReview = useGameStore((s) => s.recordReview);
  const alreadyCleared = useGameStore((s) => s.clearedStages.includes(stage.id));

  const weapon = useMemo(() => {
    const recipe = weapons.find((w) => w.id === equippedId);
    if (!recipe) return null;
    const kanji = recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
    return kanji.length === recipe.kanjiIds.length ? forgeWeapon(kanji) : null;
  }, [weapons, equippedId]);

  const individual = activeIndividualId ? (getIndividual(activeIndividualId) ?? null) : null;

  // The weapon rusts with the kanji it was made from.
  const rust = useMemo(() => {
    if (!weapon) return 0;
    const recipe = weapons.find((w) => w.id === weapon.id);
    if (!recipe) return 0;
    const levels = recipe.kanjiIds.map((id) => rustLevel(progress[id]));
    return levels.length ? Math.max(...levels) : 0;
  }, [weapon, weapons, progress]);

  const [bossHp, setBossHp] = useState(stage.boss.hp);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [turn, setTurn] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [rewards, setRewards] = useState<{ gems: number; individual: string | null }>({ gems: 0, individual: null });

  const settledRef = useRef(false);
  const writerRef = useRef<KanjiWriterHandle>(null);

  const target = kanjiPool[turn % kanjiPool.length];
  // Kun'yomi reads more naturally as a prompt; fall back to on'yomi.
  const reading = target?.kun[0]?.replace(/\(.*\)/, '') || target?.on[0] || '';

  const settle = useCallback(
    (kind: 'win' | 'lose', mistakes: number, hpLeft: number) => {
      if (settledRef.current) return;
      settledRef.current = true;

      if (kind === 'lose') {
        setOutcome({ kind: 'lose' });
        return;
      }

      const stars = starsFor(mistakes, hpLeft);
      setOutcome({ kind: 'win', stars });

      // First clear pays; a replay does not, so grinding a cleared stage for
      // gems is not a strategy.
      const gems = alreadyCleared ? 0 : stage.reward;
      let granted: string | null = null;
      if (!alreadyCleared && stage.grants) {
        granted = grantIndividual(stage.grants) ? stage.grants : null;
      }
      if (gems) addGems(gems);
      clearStage(stage.id);
      setRewards({ gems, individual: granted });
    },
    [alreadyCleared, stage, addGems, clearStage, grantIndividual],
  );

  const handleComplete = useCallback(
    (summary: { totalMistakes: number }) => {
      const mistakes = summary.totalMistakes;
      const nextMistakes = totalMistakes + mistakes;
      setTotalMistakes(nextMistakes);

      // Writing an owned character in battle is a review of it.
      if (target && progress[target.id]?.obtainedAt != null) {
        recordReview(target.id, mistakes);
      }

      const result = computeDamage({
        weapon,
        individual,
        defenderElement: stage.boss.element,
        mistakes,
        rust,
      });

      const nextBossHp = Math.max(0, bossHp - result.damage);
      setBossHp(nextBossHp);

      setFlash(
        result.perfect
          ? `かんぺき！ ${result.damage} ダメージ`
          : result.elementMultiplier > 1
            ? `こうかは ばつぐん！ ${result.damage} ダメージ`
            : result.elementMultiplier < 1
              ? `こうかは いまひとつ。${result.damage} ダメージ`
              : `${result.damage} ダメージ`,
      );

      if (nextBossHp <= 0) {
        settle('win', nextMistakes, playerHp);
        return;
      }

      // Only a failed write lets the opponent through.
      if (isFailedWrite(mistakes)) {
        const back = counterDamage(stage.boss.attack, individual, stage.boss.element);
        const nextPlayerHp = Math.max(0, playerHp - back);
        setPlayerHp(nextPlayerHp);
        setFlash(`3回(かい)いじょう まちがえた。${back} ダメージを うけた`);
        if (nextPlayerHp <= 0) {
          settle('lose', nextMistakes, 0);
          return;
        }
      }

      setTurn((t) => t + 1);
    },
    [
      totalMistakes, target, progress, recordReview, weapon, individual, stage.boss,
      rust, bossHp, playerHp, settle,
    ],
  );

  // What this clear opens. One per stage at most, announced with a line of
  // why it exists — a new button appearing unexplained teaches nothing.
  const opened = alreadyCleared ? [] : featuresUnlockedBy(stage.id);

  const elementLabel = ELEMENT_LABEL[stage.boss.element];

  if (!target) return null;

  return (
    <div className="g-stage relative flex min-h-dvh flex-col">
      <img
        src={assetPath(`img/bg/${stage.bg}.webp`)}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-35"
        // Same treatment as the novel scene: the picture-book spreads carry
        // their narration in the art, and a portrait crop lands on it.
        style={{ filter: 'blur(6px)', transform: 'scale(1.06)' }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-3 pb-4">
        {/* 敵 ------------------------------------------------------------ */}
        <div className="g-panel mb-2 flex items-center gap-3 p-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${elementLabel.color}22`, color: elementLabel.color }}
          >
            <GameIcon name={stage.boss.icon} size={34} fallback="☠" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="g-title truncate text-sm">
              <RubyText showFurigana={showFurigana}>{stage.boss.name}</RubyText>
            </p>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--color-danger)' }}
                animate={{ width: `${(bossHp / stage.boss.hp) * 100}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              />
            </div>
            <p className="mt-0.5 text-[11px] tabular-nums" style={{ color: 'var(--ink-2)' }}>
              {bossHp} / {stage.boss.hp}
              <span className="ml-2">
                <RubyText showFurigana={showFurigana}>
                  {`${elementLabel.ja}(${elementLabel.reading})`}
                </RubyText>
              </span>
            </p>
          </div>
        </div>

        {/* 自分 ---------------------------------------------------------- */}
        <div className="g-panel mb-2 flex items-center gap-2 p-2.5 text-xs">
          <div className="min-w-0 flex-1">
            <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--color-success)' }}
                animate={{ width: `${(playerHp / PLAYER_MAX_HP) * 100}%` }}
              />
            </div>
            <p className="mt-0.5 tabular-nums" style={{ color: 'var(--ink-2)' }}>
              HP {playerHp} / {PLAYER_MAX_HP}
            </p>
          </div>
          <span className="g-chip !py-0.5 text-[11px]">
            {weapon ? (
              <RubyText showFurigana={showFurigana}>{weapon.name}</RubyText>
            ) : (
              <RubyText showFurigana={showFurigana}>武器(ぶき)なし</RubyText>
            )}
          </span>
        </div>

        {rust > 0.3 && (
          <p className="mb-2 text-center text-[11px]" style={{ color: 'var(--color-danger)' }}>
            <RubyText showFurigana={showFurigana}>
              武器(ぶき)が さびて います。もとの 漢字(かんじ)を 復習(ふくしゅう)すると 直(なお)ります。
            </RubyText>
          </p>
        )}

        {/* 書く ------------------------------------------------------------
            The character itself is deliberately NOT shown. The learner is
            given its reading and meaning and has to recall the shape — that
            is the whole point of the fight, and it is what makes the ten reps
            in the drill worth something. 書きじゅん reveals it for anyone
            who is stuck. */}
        <p className="text-center text-xs" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>この ことばを 書(か)いて こうげき</RubyText>
        </p>
        <p className="g-title mb-1.5 text-center text-lg leading-tight">
          {reading && <span>{reading}</span>}
          <span className="ml-2 text-sm font-normal" style={{ color: 'var(--ink-2)' }}>
            {target.meanings.join(' / ')}
          </span>
        </p>
        <div className="flex justify-center">
          <KanjiWriterCanvas
            ref={writerRef}
            key={`${target.id}-${turn}`}
            char={target.char}
            size={size}
            quizMode
            onComplete={handleComplete}
          />
        </div>
        <button
          type="button"
          className="g-btn g-btn-ghost mx-auto mt-2 !min-h-[40px] !px-4 text-xs"
          onClick={() => writerRef.current?.animateStroke()}
        >
          <RubyText showFurigana={showFurigana}>わからない（書(か)きじゅんを 見(み)る）</RubyText>
        </button>

        <div className="mt-2 h-10 text-center" aria-live="polite">
          <AnimatePresence mode="wait">
            {flash && (
              <motion.p
                key={flash + turn}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="g-title text-sm"
              >
                <RubyText showFurigana={showFurigana}>{flash}</RubyText>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <button type="button" className="g-btn g-btn-ghost mt-auto w-full" onClick={onFlee}>
          <RubyText showFurigana={showFurigana}>にげる（マップへ もどる）</RubyText>
        </button>
      </div>

      {/* 結果 ------------------------------------------------------------ */}
      <AnimatePresence>
        {outcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          >
            <motion.div
              initial={{ scale: 0.88, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="g-panel-solid w-full max-w-sm p-6 text-center"
            >
              {outcome.kind === 'win' ? (
                <>
                  <p className="g-eyebrow">クリア</p>
                  <p className="my-2 text-3xl" style={{ color: 'var(--color-gold)' }}>
                    {'★'.repeat(outcome.stars)}
                    <span style={{ color: 'var(--line)' }}>{'★'.repeat(3 - outcome.stars)}</span>
                  </p>
                  <p className="g-title text-lg">
                    <RubyText showFurigana={showFurigana}>
                      {`${stage.boss.name} に かった！`}
                    </RubyText>
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                    <RubyText showFurigana={showFurigana}>
                      {`まちがえた ところ ${totalMistakes}`}
                    </RubyText>
                  </p>

                  {rewards.gems > 0 && (
                    <p className="g-chip g-chip-gold mt-3">◆ {rewards.gems} もらった</p>
                  )}
                  {rewards.individual && (
                    <p className="mt-2 text-sm">
                      <RubyText showFurigana={showFurigana}>
                        新(あたら)しい なかまが 来(き)た！
                      </RubyText>
                    </p>
                  )}

                  {opened.map((f) => (
                    <div
                      key={f}
                      className="mt-3 rounded-xl px-3 py-2.5 text-left"
                      style={{ background: 'rgba(255,207,74,0.16)' }}
                    >
                      <p className="g-title text-sm" style={{ color: 'var(--color-gold-2)' }}>
                        <RubyText showFurigana={showFurigana}>
                          {`「${FEATURE_INTRO[f].label}」が つかえるように なりました`}
                        </RubyText>
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
                        <RubyText showFurigana={showFurigana}>{FEATURE_INTRO[f].line}</RubyText>
                      </p>
                      <button
                        type="button"
                        className="g-btn g-btn-accent mt-2 w-full !min-h-[40px] text-xs"
                        onClick={() => {
                          onFinish();
                          navigate(FEATURE_INTRO[f].to);
                        }}
                      >
                        <RubyText showFurigana={showFurigana}>見(み)に 行(い)く</RubyText>
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p className="g-eyebrow" style={{ color: 'var(--color-danger)' }}>
                    まけ
                  </p>
                  <p className="g-title mt-2 text-lg">
                    <RubyText showFurigana={showFurigana}>たおされて しまった。</RubyText>
                  </p>
                  <p className="mt-2 text-sm" style={{ color: 'var(--ink-2)' }}>
                    <RubyText showFurigana={showFurigana}>
                      合成(ごうせい)で 強(つよ)い 武器(ぶき)を 作(つく)ってから、もう一度(いちど)。
                    </RubyText>
                  </p>
                </>
              )}

              <div className="mt-5 flex gap-2">
                <button type="button" className="g-btn g-btn-ghost flex-1" onClick={() => navigate('/forge')}>
                  <RubyText showFurigana={showFurigana}>合成(ごうせい)</RubyText>
                </button>
                <button
                  type="button"
                  className="g-btn g-btn-primary flex-1"
                  onClick={() => {
                    onFinish();
                    navigate('/map');
                  }}
                >
                  <RubyText showFurigana={showFurigana}>マップへ</RubyText>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleScene;
