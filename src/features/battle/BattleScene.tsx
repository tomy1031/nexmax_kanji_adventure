import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import type { StageDef } from '../../data/stages';
import type { KanjiData } from '../../types/kanji';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { getKanjiById } from '../../lib/kanjiDb';
import { getIndividual } from '../../data/individuals';
import { weaponOf, type Weapon } from '../../lib/forge/weapon';
import { ELEMENT_LABEL } from '../../lib/forge/elements';
import { rustLevel } from '../../lib/srs';
import { exampleWord, kanjiRuby } from '../../lib/reading';
import { FillIn, Readings } from '../../components/ui/Readings';
import ResultModal from './ResultModal';
import { LogoText } from '../../components/ui/LogoText';
import { getGear } from '../../data/equipment';
import * as sfx from '../../lib/sfx';
import {
  computeDamage,
  counterDamage,
  starsFor,
  statsFromGear,
  strikeDamage,
} from '../../lib/battle';
import { assetPath } from '../../lib/assetPath';
import { GameIcon } from '../../components/ui/GameIcon';
import { featuresUnlockedBy, FEATURE_INTRO } from '../../data/unlocks';
import PictureBook from '../picturebook/PictureBook';
import EnemyArt from './EnemyArt';
import { MASTERY_REPS, comboMultiplier, masteryMultiplier, pickWeakest, starsOf, type Stars } from '../../lib/mastery';
import { FLOW_MS, IMPACT_MS, WIN_DELAY_MASTERY_MS, lightOf } from '../../lib/lightFlow';
import LightFlow, { type Flow } from './LightFlow';

/**
 * The fight.
 *
 * A character from the stage appears; you write it. A clean write lands a
 * heavy hit, a sloppy one lands a weak hit, three slips and the opponent hits
 * back. That is the entire loop, and it means the fight is a test of the same
 * thing the drill taught — with the weapon deciding how much that skill is
 * worth.
 *
 * Layout: public/img/design/森の漢字バトル画面.png — HP plates on top, the
 * picture-book field with Nexmax and the opponent, 今回の漢字, the board.
 *
 * 文字が 消えた 町 (`mastery`, 08 §3.6): writing gives Nexmax his power. The
 * written character's light rises from the board into him and he fires it
 * (LightFlow); the hit, its number and the win wait for the beam to land.
 * The picture-book arcs keep the blade.
 */

interface BattleSceneProps {
  stage: Pick<StageDef, 'id' | 'bg' | 'boss' | 'reward' | 'grants'>;
  kanjiPool: KanjiData[];
  onFinish: () => void;
  onFlee: () => void;
  /** After a win: go on to the next stage. Absent on the last stage of an arc. */
  onNext?: () => void;
  /** Fight again from the start. */
  onRetry?: () => void;
  /** After a loss: practise this stage's characters. */
  onPractice?: () => void;
  /** Open the forge, coming back to this fight. */
  onForge?: () => void;
  /**
   * `tutorial`: 0話's first fight. No rewards and no stage clear; the
   * character is shown (the first fight is the one where the learner is
   * told what to write — docs/design/06 §0), and a win hands straight back.
   */
  mode?: 'stage' | 'tutorial';
  /**
   * Fight with this weapon instead of the equipped one. 0話 uses it so a
   * replay never swaps out the weapon a returning player has equipped.
   */
  weaponOverride?: Weapon;
  /**
   * Slips the opponent tolerates before it strikes, before charms. Every
   * stroke mistake and every look at the stroke order counts one.
   */
  patience: number;
  /**
   * 文字が 消えた 町 (08 §4.2.2): damage follows the kanji's stars, the
   * opponent asks for the least-known kanji, and a clean write (no slip, no
   * look at the stroke order) counts toward its stars.
   */
  mastery?: boolean;
}

type Outcome = { kind: 'win'; stars: 1 | 2 | 3 } | { kind: 'lose' } | null;

/**
 * たたかい 開始！ — a beat before the first stroke, so the fight starts as a
 * fight: a band sweeps across with the opponent's name, a drum and a sweep.
 * It never blocks input for long (1.6 s) and taps go straight through.
 */
const BattleIntro = ({ bossName, showFurigana }: { bossName: string; showFurigana: boolean }) => {
  const [on, setOn] = useState(true);
  useEffect(() => {
    sfx.battleStart();
    const t = setTimeout(() => setOn(false), 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          <motion.div
            className="w-full py-3 text-center"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(20,20,40,0.85) 15%, rgba(20,20,40,0.85) 85%, transparent)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <LogoText className="text-[40px] leading-[1.5]" showFurigana={showFurigana}>
              たたかい 開始(かいし)！
            </LogoText>
            <p className="g-onbg text-sm font-black">
              <RubyText showFurigana={showFurigana}>{`あいて：${bossName}`}</RubyText>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const BattleScene = ({
  stage,
  kanjiPool,
  onFinish,
  onFlee,
  onNext,
  onRetry,
  onPractice,
  onForge,
  mode = 'stage',
  weaponOverride,
  patience: basePatienceValue,
  mastery = false,
}: BattleSceneProps) => {
  const navigate = useNavigate();
  const size = useCanvasSize(210, 0.25, 96);
  const tutorial = mode === 'tutorial';

  const showFurigana = useGameStore((s) => s.settings.furigana);
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);
  const equippedId = useGameStore((s) => s.equippedWeapon);
  const activeIndividualId = useGameStore((s) => s.activeIndividual);
  const weapons = useGameStore((s) => s.weapons);
  const progress = useGameStore((s) => s.progress);
  const clearStage = useGameStore((s) => s.clearStage);
  const addGems = useGameStore((s) => s.addGems);
  const grantIndividual = useGameStore((s) => s.grantIndividual);
  const recordReview = useGameStore((s) => s.recordReview);
  const recordRep = useGameStore((s) => s.recordRep);
  const alreadyCleared = useGameStore((s) => s.clearedStages.includes(stage.id));
  const [clearedAtStart] = useState(alreadyCleared);
  const equippedGear = useGameStore((s) => s.equippedGear);

  // Worn gear: shield, armour, charm. The tutorial fight is gear-less.
  const stats = useMemo(
    () =>
      statsFromGear(
        tutorial
          ? []
          : Object.values(equippedGear)
              .map((id) => getGear(id))
              .filter((g) => g != null),
      ),
    [equippedGear, tutorial],
  );
  const patience = basePatienceValue + stats.patience;

  const weapon = useMemo(() => {
    if (weaponOverride) return weaponOverride;
    const recipe = weapons.find((w) => w.id === equippedId);
    if (!recipe) return null;
    const kanji = recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
    return kanji.length === recipe.kanjiIds.length ? weaponOf(kanji) : null;
  }, [weapons, equippedId, weaponOverride]);

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
  const [playerHp, setPlayerHp] = useState(stats.maxHp);
  /** Slips since the opponent last struck. At `patience` it strikes. */
  const [rage, setRage] = useState(0);
  /** The stroke order was looked up during the current write. */
  const [hinted, setHinted] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [turn, setTurn] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [hit, setHit] = useState<{ n: number; damage: number; critical?: boolean } | null>(null);
  /** Clean writes in a row (新ルート). */
  const [combo, setCombo] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [rewards, setRewards] = useState<{ gems: number; individual: string | null }>({ gems: 0, individual: null });

  const settledRef = useRef(false);
  // The boss is down and the win is on its way (settleTimer). Nothing the
  // learner does in that beat — a slip, a look at the stroke order — may
  // turn it into a loss.
  const bossDownRef = useRef(false);
  // Slips in the current write. hanzi-writer's own count starts over when
  // the stroke order is shown, so the write keeps its own.
  const writeSlipsRef = useRef(0);
  // The win lands a beat after the last hit. If the screen closes in that
  // beat (にげる), the clear must not be recorded behind the learner's back.
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);
  const writerRef = useRef<KanjiWriterHandle>(null);
  // Where the light starts, passes and lands (新ルート). Read once per write.
  const boardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  // The hit lands when the beam does; cleared if the screen closes first.
  const flowTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => flowTimers.current.forEach(clearTimeout), []);
  const atImpact = (fn: () => void, ms = IMPACT_MS) => flowTimers.current.push(setTimeout(fn, ms));
  const heroCtl = useAnimationControls();
  const enemyCtl = useAnimationControls();
  const fieldCtl = useAnimationControls();

  // Which kanji the opponent asks for. On the new route it is the least
  // known one, chosen once per turn (the count moves as the learner writes).
  const askedRef = useRef<Record<string, number>>({});
  const repsNow = (id: string) => useGameStore.getState().progress[id]?.reps ?? 0;
  const [weakestId, setWeakestId] = useState<string | null>(() =>
    mastery ? (pickWeakest(kanjiPool, repsNow, {}, null)?.id ?? null) : null,
  );
  const target = mastery ? (kanjiPool.find((k) => k.id === weakestId) ?? kanjiPool[0]) : kanjiPool[turn % kanjiPool.length];
  const ownsTarget = target ? progress[target.id]?.obtainedAt != null : false;
  const targetStars: Stars = target ? starsOf(progress[target.id]?.reps ?? 0) : 0;

  const settle = useCallback(
    (kind: 'win' | 'lose', mistakes: number, hpLeft: number) => {
      if (settledRef.current) return;
      settledRef.current = true;

      if (kind === 'lose') {
        setOutcome({ kind: 'lose' });
        return;
      }

      const stars = starsFor(mistakes, hpLeft, stats.maxHp);
      setOutcome({ kind: 'win', stars });
      if (tutorial) return;

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
    [tutorial, alreadyCleared, stage, addGems, clearStage, grantIndividual, stats.maxHp],
  );

  /**
   * One slip. When they add up to the opponent's patience it strikes, less
   * the shield's defence. The learner who practised makes fewer slips — and
   * so is struck less — which is the whole point (docs/design/07 §2).
   */
  const addSlip = useCallback(() => {
    if (settledRef.current || bossDownRef.current) return;
    const next = rage + 1;
    if (next < patience) {
      setRage(next);
      return;
    }
    setRage(0);
    const back = strikeDamage(counterDamage(stage.boss.attack, individual, stage.boss.element), stats.defense);
    const nextPlayerHp = Math.max(0, playerHp - back);
    setPlayerHp(nextPlayerHp);
    sfx.hurt();
    void enemyCtl.start({ x: [0, -80, 0], transition: { duration: 0.45 } });
    void fieldCtl.start({ x: [0, -6, 6, -3, 0], transition: { duration: 0.35, delay: 0.25 } });
    setFlash(`ミスが ${patience}こ たまった。${back} ダメージを うけた`);
    if (nextPlayerHp <= 0) settle('lose', totalMistakes, 0);
  }, [rage, patience, stage.boss, individual, stats.defense, playerHp, enemyCtl, fieldCtl, settle, totalMistakes]);

  const handleMistake = useCallback(() => {
    if (settledRef.current || bossDownRef.current) return;
    writeSlipsRef.current += 1;
    sfx.clang();
    addSlip();
  }, [addSlip]);

  const showStrokeOrder = () => {
    if (settledRef.current || bossDownRef.current) return;
    // Looking is allowed, and costs: one slip, and this write hits for half.
    if (!hinted) addSlip();
    setHinted(true);
    writerRef.current?.animateStroke();
  };

  const handleComplete = useCallback(
    (summary: { totalMistakes: number }) => {
      if (settledRef.current || bossDownRef.current) return;
      const mistakes = Math.max(summary.totalMistakes, writeSlipsRef.current);
      writeSlipsRef.current = 0;
      // A look at the stroke order counts against the stars like a slip.
      const nextMistakes = totalMistakes + mistakes + (hinted ? 1 : 0);
      setTotalMistakes(nextMistakes);

      // Writing an owned character in battle is a review of it — except in
      // 0話, where 一 was obtained minutes ago and three quick writes would
      // push its first review a week out.
      let starUp: Stars | null = null;
      if (!tutorial && target && progress[target.id]?.obtainedAt != null) {
        recordReview(target.id, mistakes);
      } else if (mastery && target && mistakes === 0 && !hinted) {
        // Written from memory without a slip: that is a write, and it counts.
        const before = progress[target.id]?.reps ?? 0;
        recordRep(target.id, 0);
        if (starsOf(before + 1) > starsOf(before)) starUp = starsOf(before + 1);
      }
      const clean = mistakes === 0 && !hinted;
      const critical = mastery && targetStars === 3 && clean;
      const nextCombo = mastery && clean ? combo + 1 : 0;
      setCombo(nextCombo);

      const result = computeDamage({
        weapon,
        individual,
        defenderElement: stage.boss.element,
        mistakes,
        rust,
        attackPct: stats.attackPct,
        owned: ownsTarget && !tutorial && !mastery,
        hinted,
        mastery: mastery ? masteryMultiplier(targetStars, clean) * comboMultiplier(nextCombo) : 1,
      });
      setHinted(false);
      const struck = { n: turn, damage: result.damage, critical };

      if (mastery) {
        // The light: from the board into Nexmax, then out at the opponent.
        const centre = (el: HTMLElement | null, fy = 0.5) => {
          const r = el?.getBoundingClientRect();
          return r ? { x: r.left + r.width / 2, y: r.top + r.height * fy } : { x: 0, y: 0 };
        };
        setFlow({ n: turn, from: centre(boardRef.current), hero: centre(heroRef.current, 0.42), to: centre(enemyRef.current), light: lightOf(mistakes, hinted) });
        sfx.beam();
        const total = (IMPACT_MS + FLOW_MS.fade) / 1000;
        void heroCtl.start({
          scale: [1, 1, 1.08, 1],
          x: [0, 0, -10, 0],
          transition: { duration: total, times: [0, FLOW_MS.rise / 1000 / total, (FLOW_MS.rise + FLOW_MS.charge) / 1000 / total, 1] },
        });
        void enemyCtl.start({ x: [0, 14, -8, 0], transition: { duration: 0.45, delay: IMPACT_MS / 1000 } });
        atImpact(() => sfx.hit(), IMPACT_MS - 120); // hit() sounds 120 ms after it is called
        atImpact(() => {
          setHit(struck);
          if (critical) sfx.fanfare();
          else if (starUp) sfx.star(starUp - 1);
        });
      } else {
        sfx.slash(1);
        sfx.hit();
        // The swing: Nexmax lunges, the blade crosses the opponent, it reels.
        void heroCtl.start({ x: [0, 70, 0], rotate: [0, 8, 0], transition: { duration: 0.45 } });
        void enemyCtl.start({ x: [0, 14, -8, 0], filter: ['brightness(1)', 'brightness(2.4)', 'brightness(1)'], transition: { duration: 0.45, delay: 0.15 } });
        setHit(struck);
        if (critical) sfx.fanfare();
        else if (starUp) sfx.star(starUp - 1);
      }

      const nextBossHp = Math.max(0, bossHp - result.damage);
      setBossHp(nextBossHp);

      setFlash(
        critical
          ? `字(じ)の わざ！ ${result.damage} ダメージ`
          : starUp
            ? `★${starUp}に なった！ ${result.damage} ダメージ`
            : result.perfect
          ? `かんぺき！ ${result.damage} ダメージ`
          : hinted
            ? `かきじゅんを みたので はんぶん。${result.damage} ダメージ`
          : result.elementMultiplier > 1
            ? `こうかは ばつぐん！ ${result.damage} ダメージ`
            : result.elementMultiplier < 1
              ? `こうかは いまひとつ。${result.damage} ダメージ`
              : `${result.damage} ダメージ`,
      );

      if (nextBossHp <= 0) {
        bossDownRef.current = true;
        settleTimer.current = setTimeout(() => settle('win', nextMistakes, playerHp), mastery ? WIN_DELAY_MASTERY_MS : 650);
        return;
      }

      if (mastery && target) {
        askedRef.current[target.id] = (askedRef.current[target.id] ?? 0) + 1;
        setWeakestId(pickWeakest(kanjiPool, repsNow, askedRef.current, target.id)?.id ?? null);
      }
      setTurn((t) => t + 1);
    },
    [
      tutorial, totalMistakes, target, progress, recordReview, recordRep, weapon, individual, stage.boss,
      rust, bossHp, playerHp, settle, heroCtl, enemyCtl, turn, stats.attackPct, ownsTarget, hinted,
      mastery, targetStars, kanjiPool, combo,
    ],
  );

  // What this clear opens. One per stage at most, announced with a line of
  // why it exists — a new button appearing unexplained teaches nothing.
  // Judged against the save as it was when the fight began: the win itself
  // marks the stage cleared, and reading it live would hide the news.
  const opened = clearedAtStart || tutorial ? [] : featuresUnlockedBy(stage.id);

  const elementLabel = ELEMENT_LABEL[stage.boss.element];

  if (!target) return null;

  const hpBar = (value: number, max: number, color: string, delay = 0) => (
    <div className="h-3 overflow-hidden rounded-full border border-black/30 bg-black/35">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay }}
      />
    </div>
  );

  return (
    <div className="g-sky relative flex min-h-dvh flex-col">
      <BattleIntro bossName={stage.boss.name} showFurigana={showFurigana} />
      {/* 戦場（絵本） ----------------------------------------------------- */}
      <motion.div className="relative h-[40dvh] min-h-[280px] overflow-hidden" animate={fieldCtl}>
        <PictureBook scene={stage.bg} />
        {/* 上: HP --------------------------------------------------------- */}
        <div className="absolute inset-x-0 top-0 z-20 flex gap-2 px-2 pt-[max(8px,env(safe-area-inset-top))]">
          <div
            className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border-2 border-white p-1.5 text-white"
            style={{ background: 'linear-gradient(180deg,#4fb0f5,#1d6fc4)' }}
          >
            <img src={assetPath('img/chara/cut/nexmax.webp')} alt="" aria-hidden className="h-10 w-10 rounded-xl bg-white/80 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black">ネクマックス</p>
              {hpBar(playerHp, stats.maxHp, 'linear-gradient(90deg,#7ed36b,#3e9b3a)')}
              <p className="text-right text-[10px] font-bold tabular-nums">
                HP {playerHp} / {stats.maxHp}
              </p>
            </div>
          </div>
          <div
            className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2 rounded-2xl border-2 border-white p-1.5 text-white"
            style={{ background: 'linear-gradient(180deg,#8a4fd0,#4a2383)' }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/40" style={{ color: elementLabel.color }}>
              <GameIcon name={stage.boss.icon} size={26} fallback="☠" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black">
                <RubyText showFurigana={showFurigana}>{stage.boss.name}</RubyText>
              </p>
              {/* 新ルート: the bar drops when the beam lands. */}
              {hpBar(bossHp, stage.boss.hp, 'linear-gradient(90deg,#ff8a6a,#e0362b)', mastery ? IMPACT_MS / 1000 : 0)}
              <p className="text-[10px] font-bold tabular-nums">
                HP {bossHp} / {stage.boss.hp}{' '}
                <RubyText showFurigana={showFurigana}>{`${elementLabel.ja}(${elementLabel.reading})`}</RubyText>
              </p>
              {/* がまん: the slips left before it strikes. */}
              <div className="mt-0.5 flex items-center gap-1" aria-label={`ミス ${rage} / ${patience}`}>
                <span className="text-[9px] font-black">ミス</span>
                {Array.from({ length: patience }, (_, i) => (
                  <motion.span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full border border-white/70"
                    animate={{ background: i < rage ? '#ff5a4a' : 'rgba(255,255,255,0.15)', scale: i === rage - 1 ? [1.6, 1] : 1 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-3 flex items-end justify-between px-4">
          <motion.div ref={heroRef} className="relative" animate={heroCtl}>
            <img
              src={assetPath('img/chara/cut/guide.webp')}
              alt=""
              aria-hidden
              className="h-[20dvh] min-h-[130px] w-auto"
              style={{ filter: 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 6px 8px rgba(0,0,0,0.35))' }}
            />
            {weapon && (
              <span
                className="absolute -top-4 -left-3 -rotate-12"
                style={{ color: '#fffbe6', filter: 'drop-shadow(0 0 4px #fff) drop-shadow(0 0 10px rgba(255,200,70,1)) drop-shadow(0 2px 0 #7a4a26)' }}
              >
                <GameIcon name={weapon.icon} size={64} />
              </span>
            )}
          </motion.div>
          <div ref={enemyRef} className="relative">
            <EnemyArt art={stage.boss.art} icon={stage.boss.icon} color={elementLabel.color} size={150} controls={enemyCtl} />
            <AnimatePresence>
              {hit && (
                <motion.span
                  key={hit.n}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1.2 }}
                  transition={{ duration: 1.1, delay: mastery ? 0 : 0.2 }}
                  className={`g-outline-text pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 font-black ${hit.critical ? 'text-5xl' : 'text-3xl'}`}
                  style={hit.critical ? { color: '#ffe27a' } : undefined}
                >
                  {hit.damage}
                </motion.span>
              )}
            </AnimatePresence>
            {/* COMBO — clean writes in a row. */}
            <AnimatePresence>
              {mastery && combo >= 2 && (
                <motion.span
                  key={`combo-${combo}`}
                  initial={{ opacity: 0, scale: 2.2, rotate: -12 }}
                  animate={{ opacity: 1, scale: 1, rotate: -8 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                  className="g-outline-text pointer-events-none absolute -top-8 -left-10 text-2xl font-black whitespace-nowrap"
                  style={{ color: '#ffe27a', willChange: 'transform' }}
                >
                  {combo} COMBO!
                  <span className="block text-xs">+{Math.round((comboMultiplier(combo) - 1) * 100)}%</span>
                </motion.span>
              )}
            </AnimatePresence>
            {/* 刃のあと（新ルートは 光線 — LightFlow） */}
            <AnimatePresence>
              {hit && !mastery && (
                <motion.div
                  key={`slash-${hit.n}`}
                  className="pointer-events-none absolute top-1/2 left-1/2 h-2 w-44 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #fff, #ffe27a, transparent)', boxShadow: '0 0 16px #ffd24a' }}
                  initial={{ scaleX: 0, opacity: 1 }}
                  animate={{ scaleX: 1, opacity: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto -mt-3 flex w-full max-w-md flex-1 flex-col gap-2 px-3 pb-4">
        {/* 今回の漢字 ------------------------------------------------------ */}
        <div className="g-parchment relative px-3 pt-4 pb-2">
          <span className="g-btn-green absolute -top-3 left-3 rounded-lg px-3 py-0.5 text-xs font-black">
            <RubyText showFurigana={showFurigana}>今回(こんかい)の 漢字(かんじ)</RubyText>
          </span>
          <div className="flex items-center gap-3">
            {tutorial && (
              <span className="text-[40px] leading-[1.5] font-black">
                <RubyText showFurigana={showFurigana}>{kanjiRuby(target)}</RubyText>
              </span>
            )}
            <div className="min-w-0 flex-1 text-sm">
              {!tutorial && exampleWord(target) && (
                <p className="mb-0.5 flex items-center gap-2">
                  <span className="text-[26px] leading-[1.6] font-black">
                    <FillIn kanji={target} showFurigana={showFurigana} />
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
                    <RubyText showFurigana={showFurigana}>□に 入(はい)る 字(じ)を 書(か)こう</RubyText>
                  </span>
                </p>
              )}
              <Readings kanji={target} hideKanji={!tutorial} />
              <p className="truncate" style={{ color: 'var(--ink-2)' }}>
                meaning: <b className="text-base">{target.meanings.slice(0, 2).join(' / ')}</b>
              </p>
            </div>
          </div>
          {mastery && (
            <p
              className="mt-1 flex items-center gap-2 rounded-md px-2 py-0.5 text-[11px] font-bold"
              style={{ background: targetStars >= 2 ? 'rgba(255,210,90,0.3)' : 'rgba(255,107,125,0.18)' }}
            >
              <span className="text-sm tracking-wider" style={{ color: '#e8a317' }} aria-label={`★${targetStars}`}>
                {'★'.repeat(targetStars) + '☆'.repeat(3 - targetStars)}
              </span>
              <RubyText showFurigana={showFurigana}>
                {targetStars === 3
                  ? 'マスター。まちがえずに 書(か)くと「字(じ)の わざ」'
                  : `こうげき ×${masteryMultiplier(targetStars, false)}。まちがえずに 書(か)くと ★が ふえる（${MASTERY_REPS[targetStars]}回(かい)で ★${targetStars + 1}）`}
              </RubyText>
            </p>
          )}
          {!tutorial && !mastery && (
            <p
              className="mt-1 rounded-md px-2 py-0.5 text-[11px] font-bold"
              style={{ background: ownsTarget ? 'rgba(126,211,107,0.25)' : 'rgba(255,107,125,0.18)' }}
            >
              <RubyText showFurigana={showFurigana}>
                {ownsTarget
                  ? '持(も)っている 字(じ)。字(じ)の 力(ちから)で こうげき ＋20%'
                  : 'まだ 持(も)っていない 字(じ)。れんしゅうすると 書(か)けるように なる'}
              </RubyText>
            </p>
          )}
        </div>

        {/* 書く ------------------------------------------------------------
            Outside the tutorial the character itself is NOT shown. The
            learner is given its reading and meaning and has to recall the
            shape — that is what makes the ten reps in the drill worth
            something. 書きじゅん reveals it for anyone who is stuck. */}
        <div className="flex items-stretch justify-center gap-2">
          <div ref={boardRef} className="rounded-2xl border-4 border-[#4fb0f5] bg-white p-1 shadow-[0_0_0_3px_#fff]">
            <KanjiWriterCanvas
              ref={writerRef}
              key={`${target.id}-${turn}`}
              char={target.char}
              size={size}
              quizMode
              showSample={tutorial}
              onCorrectStroke={() => (mastery ? sfx.neon(0.35) : sfx.slash(0.35))}
              onMistake={handleMistake}
              onComplete={handleComplete}
            />
          </div>
          <div className="flex flex-col justify-between gap-2">
            <button
              type="button"
              className="g-parchment flex w-16 flex-1 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
              onClick={showStrokeOrder}
            >
              <span aria-hidden className="text-lg">
                ✎
              </span>
              <RubyText showFurigana={showFurigana}>書(か)きじゅん</RubyText>
              <span className="text-[9px] font-bold" style={{ color: 'var(--color-danger)' }}>
                ミス＋1
              </span>
            </button>
            {!tutorial && (
              <button
                type="button"
                className="g-parchment flex w-16 flex-1 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
                onClick={onFlee}
              >
                <span aria-hidden className="text-lg">
                  ↩
                </span>
                にげる
              </button>
            )}
          </div>
        </div>

        <div className="g-btn-red mx-auto flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full text-lg font-black" aria-live="polite">
          {/* No fade out and back in: the old line is replaced in place and
              the new one pops once (transform only) — the fade left a blank
              beat that blinked on every write. */}
          <motion.span
            key={flash ? flash + turn : 'idle'}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="px-3 text-center text-sm leading-snug"
            style={{ willChange: 'transform' }}
          >
            <RubyText showFurigana={showFurigana}>
              {flash ?? (mastery ? '💡 書(か)いた 字(じ)の 光(ひかり)で こうげき！' : '⚔ 書(か)くと こうげき！')}
            </RubyText>
          </motion.span>
        </div>

        {weapon ? (
          <p className="text-center text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>{`そうび：${weapon.name}`}</RubyText>
          </p>
        ) : (
          <p className="text-center text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>そうび：武器(ぶき)なし（とても 弱(よわ)い）</RubyText>
          </p>
        )}

        {rust > 0.3 && (
          <p className="text-center text-[11px]" style={{ color: 'var(--color-danger)' }}>
            <RubyText showFurigana={showFurigana}>
              武器(ぶき)が さびて います。もとの 漢字(かんじ)を 復習(ふくしゅう)すると 直(なお)ります。
            </RubyText>
          </p>
        )}
      </div>

      <LightFlow flow={flow} still={still} />

      {/* 字の わざ — the flash of a ★3 kanji written clean. */}
      <AnimatePresence>
        {hit?.critical && (
          <motion.div
            key={`crit-${hit.n}`}
            className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.5 }}
            aria-hidden
          >
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            />
            <motion.span
              className="relative text-[64px] leading-[1.4]"
              initial={{ scale: 3, rotate: -10 }}
              animate={{ scale: 1, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14 }}
              style={{ willChange: 'transform' }}
            >
              <LogoText showFurigana={showFurigana}>字(じ)の わざ！</LogoText>
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 結果 ------------------------------------------------------------ */}
      <AnimatePresence>
        {outcome && (
          <ResultModal
            outcome={outcome}
            bossName={stage.boss.name}
            mistakes={totalMistakes}
            gems={rewards.gems}
            newFriend={!!rewards.individual}
            opened={outcome.kind === 'win' ? opened : []}
            tutorial={tutorial}
            hasNext={!!onNext}
            onNext={() => onNext?.()}
            onStages={onFinish}
            onRetry={() => onRetry?.()}
            onPractice={() => (onPractice ? onPractice() : onFinish())}
            onForge={() => (onForge ? onForge() : navigate('/forge'))}
            onFeature={(f) => {
              onFinish();
              navigate(FEATURE_INTRO[f].to);
            }}
            onTutorialDone={onFinish}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleScene;
