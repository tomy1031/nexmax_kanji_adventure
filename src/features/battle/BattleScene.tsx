import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import type { StageDef } from '../../data/stages';
import type { KanjiData } from '../../types/kanji';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { getKanjiById } from '../../lib/kanjiDb';
import { getIndividual } from '../../data/individuals';
import { type Weapon } from '../../lib/forge/weapon';
import { weaponFromRecipe, weaponWord } from '../../lib/forge/recipe';
import { ELEMENT_LABEL } from '../../lib/forge/elements';
import { rustLevel } from '../../lib/srs';
import { exampleWord, kanjiRuby } from '../../lib/reading';
import { FillIn, Readings } from '../../components/ui/Readings';
import ResultModal from './ResultModal';
import { LogoText } from '../../components/ui/LogoText';
import { getGear } from '../../data/equipment';
import * as sfx from '../../lib/sfx';
import { comboMilestone, comboTier, isComboBreak, strokeEnd, strokeLift } from '../../lib/combo';
import type { StrokeSpark } from './ComboFx';
import { star5CleanMul, star5ComboAfterBreak, star5GaugeGain, star5GaugeStart, star5PowerOf, withStar5Stats } from '../../lib/star5Power';
import { SKILL_INFO, SKILL_OF, gaugeGain, skillEffect, skillGaugeFull } from '../../lib/companionSkill';
import { HURT_LINE, linesFor } from '../../data/companionLines';
import { tipDue, tipOf, type TipId } from '../../data/fightRules';
import type { BuffView, CompanionView, SkillCut } from './CompanionFx';
import {
  computeDamage,
  counterDamage,
  starsFor,
  statsFromGear,
  strikeDamage,
} from '../../lib/battle';
import { assetPath } from '../../lib/assetPath';
import { GameIcon } from '../../components/ui/GameIcon';
import { Feature, featuresUnlockedBy, FEATURE_INTRO, isFeatureUnlocked } from '../../data/unlocks';
import { HARD_BONUS_GEMS, PERFECT_BONUS_GEMS } from '../../data/clearRewards';
import { EASY_PATIENCE_ADD, writesPerReadFor, type Difficulty } from '../../lib/difficulty';
import PictureBook from '../picturebook/PictureBook';
import EnemyArt from './EnemyArt';
import { MASTERY_REPS, comboMultiplier, masteryMultiplier, pickWeakest, starsOf, type Stars } from '../../lib/mastery';
import { FLOW_MS, IMPACT_MS, WIN_DELAY_MASTERY_MS, lightOf } from '../../lib/lightFlow';
import LightFlow, { type Flow } from './LightFlow';
import NaniwaBattleView from './NaniwaBattleView';
import { useBgm } from '../../lib/bgm';
import { isReadTurn, readDamage, readQuestion } from '../../lib/readTurn';
import { nextStarGoal } from '../../data/starPerks';
import { EXP_BOSS_FIRST, EXP_BOSS_REPEAT, EXP_READ, applyLevel, levelInfo, levelOf, ownedCount } from '../../lib/level';
import { useCompoundsVersion } from '../../data/compounds';
import { askFrom, sealFloor, strikeSealed } from '../../lib/seals';
import { useStill } from '../../hooks/useStill';
import { useQuiet } from '../../store/uiStore';

/** How long a fight tip stays up. */
const TIP_MS = 4200;

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
 * Every third turn the opponent throws a kanji to read instead (読む ターン,
 * lib/readTurn.ts, 08 §6.4). The picture-book arcs keep the blade.
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
  /**
   * Hard (lib/difficulty.ts): the caller sizes the opponent, its patience
   * and the kanji; here it reads after every write, and the first Hard win
   * pays its bonus. やさしい: the model shows faintly, two more slips pass,
   * and a write earns no ★ (it was traced). New route only.
   */
  difficulty?: Difficulty;
  /** A line for the first win that closes something (まとめの ボス:「1章 クリア！」). */
  clearLine?: string;
  /**
   * 字の ふういん (lib/seals.ts, new route): the kanji the opponent holds — it
   * asks them first and cannot fall until each is written once. The whole pool
   * when absent; Hard passes the ones it sized its HP for.
   */
  seals?: readonly KanjiData[];
}

type Outcome = { kind: 'win'; stars: 1 | 2 | 3 } | { kind: 'lose' } | null;

/**
 * たたかい 開始！ — a beat before the first stroke, so the fight starts as a
 * fight: a band sweeps across with the opponent's name, a drum and a sweep.
 * It never blocks input for long (1.6 s) and taps go straight through.
 */
const BattleIntro = ({ bossName, difficulty = 'normal', showFurigana }: { bossName: string; difficulty?: Difficulty; showFurigana: boolean }) => {
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
              <RubyText showFurigana={showFurigana}>{`${difficulty === 'hard' ? '👹 ハード ・ ' : difficulty === 'easy' ? '🌱 やさしい ・ ' : ''}あいて：${bossName}`}</RubyText>
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
  difficulty = 'normal',
  clearLine,
  seals,
}: BattleSceneProps) => {
  // The new route's Mojikui fights have their own, bigger tune.
  useBgm(mastery ? 'boss' : 'battle');
  const navigate = useNavigate();
  const size = useCanvasSize(210, 0.25, 96);
  const tutorial = mode === 'tutorial';

  const showFurigana = useGameStore((s) => s.settings.furigana);
  const still = useStill();
  const equippedId = useGameStore((s) => s.equippedWeapon);
  const activeIndividualId = useGameStore((s) => s.activeIndividual);
  const weapons = useGameStore((s) => s.weapons);
  const progress = useGameStore((s) => s.progress);
  const clearStage = useGameStore((s) => s.clearStage);
  const addGems = useGameStore((s) => s.addGems);
  const grantIndividual = useGameStore((s) => s.grantIndividual);
  const bondFromWin = useGameStore((s) => s.bondFromWin);
  const recordReview = useGameStore((s) => s.recordReview);
  const recordRep = useGameStore((s) => s.recordRep);
  const alreadyCleared = useGameStore((s) => s.clearedStages.includes(stage.id));
  const [clearedAtStart] = useState(alreadyCleared);
  const [clearsAtStart] = useState(() => useGameStore.getState().clearedStages);
  const equippedGear = useGameStore((s) => s.equippedGear);
  const gainExp = useGameStore((s) => s.gainExp);
  const expNow = useGameStore((s) => s.exp);
  // ネクマックスの レベル (lib/level.ts), as it stood when the fight began: a
  // level gained mid-fight counts from the next one, so the HP bar does not
  // jump and a full-HP win still reads as full HP.
  const [startExp] = useState(() => useGameStore.getState().exp);
  const [startOwned] = useState(() => ownedCount(useGameStore.getState().progress));
  const level = mastery && !tutorial ? levelOf(startExp, startOwned) : 1;

  // ★5 だけの ちから (docs/design/18 §2): where the companion's わざ works.
  const star5 = mastery && !tutorial ? star5PowerOf(activeIndividualId)?.effect : undefined;

  // Worn gear: shield, armour, charm. The tutorial fight is gear-less. The
  // level adds HP and patience on the new route, and a ★5 (空・時) may too.
  // The forge's words beyond the core arrive just after start (data/compounds.ts): read again then.
  const wordsV = useCompoundsVersion();
  const stats = useMemo(() => {
    const gear = statsFromGear(
      tutorial
        ? []
        : Object.values(equippedGear)
            .map((id) => getGear(id))
            .filter((g) => g != null),
    );
    return withStar5Stats(mastery ? applyLevel(gear, level) : gear, star5);
    // A forged shield or body piece is built from its kanji (lib/forge/gear.ts): it changes when the words arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equippedGear, tutorial, mastery, level, star5, wordsV]);
  const easy = mastery && difficulty === 'easy';
  const patience = basePatienceValue + stats.patience + (easy ? EASY_PATIENCE_ADD : 0);

  const weapon = useMemo(() => {
    if (weaponOverride) return weaponOverride;
    const recipe = weapons.find((w) => w.id === equippedId);
    return recipe ? weaponFromRecipe(recipe) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weapons, equippedId, weaponOverride, wordsV]);

  const individual = activeIndividualId ? (getIndividual(activeIndividualId) ?? null) : null;
  // なかまの わざ (docs/design/11 §3.2): on the new route, once a companion has joined.
  const skillKind = mastery && !tutorial && individual ? SKILL_OF[individual.char] : undefined;
  const gaugeFull = skillGaugeFull(difficulty);

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
  /** Counts lines, so the same words said twice still show twice (NaniwaBattleView). */
  const [flashNo, setFlashNo] = useState(0);
  const say = useCallback((text: string) => {
    setFlash(text);
    setFlashNo((n) => n + 1);
  }, []);
  /**
   * A rule of the fight, told the first time it happens here — the miss that
   * brings a strike, the first COMBO, the first reading turn — once, then never
   * again (data/fightRules.ts BATTLE_TIPS, 2026-10-04「1つずつ」).
   */
  const [tip, setTip] = useState<{ n: number; icons: string; text: string } | null>(null);
  const tipTimer = useRef(0);
  const tellTip = useCallback(
    (id: TipId) => {
      if (!mastery || tutorial) return;
      const st = useGameStore.getState();
      if (!tipDue(id, st.tipsSeen, st.tutorials.stars)) return;
      st.markTipSeen(id);
      const r = tipOf(id);
      setTip((t) => ({ n: (t?.n ?? 0) + 1, icons: r.icons, text: r.text }));
      window.clearTimeout(tipTimer.current);
      tipTimer.current = window.setTimeout(() => setTip(null), TIP_MS);
    },
    [mastery, tutorial],
  );
  useEffect(() => () => window.clearTimeout(tipTimer.current), []);
  const [hit, setHit] = useState<{ n: number; damage: number; critical?: boolean } | null>(null);
  /** Clean writes in a row (新ルート). */
  const [combo, setCombo] = useState(0);
  // Where the last correct stroke ended, for its sparks (ComboFx).
  const [spark, setSpark] = useState<StrokeSpark | null>(null);
  const sparkNo = useRef(0);
  const onStroke = (data: Record<string, unknown>, px: number) => {
    sfx.neon(0.35, strokeLift(Number(data.strokeNum) || 0, combo));
    const end = strokeEnd(data, px);
    if (end) setSpark({ n: (sparkNo.current += 1), ...end });
  };
  /** 読む ターン (新ルート): the kanji thrown with its four readings, and the one picked. */
  const [readQ, setReadQ] = useState<{ kanji: KanjiData; choices: string[]; answer: string } | null>(null);
  const [readPicked, setReadPicked] = useState<string | null>(null);
  const lastThrownRef = useRef<string | null>(null);
  /** What this fight did for the learner (新ルート, the result shows it): ★ gained by kanji id, reading turns. */
  const [growth, setGrowth] = useState<{ starUps: Record<string, Stars>; readRight: number; readTotal: number; writes: string[] }>({
    starUps: {},
    readRight: 0,
    readTotal: 0,
    // Every write of the fight, by kanji id, in order: the result says what was practised.
    writes: [],
  });
  // Set at the first reading turn, so where the answer sits differs fight to fight.
  const fightSeedRef = useRef(0);
  const [outcome, setOutcome] = useState<Outcome>(null);
  // 称号 earned mid-fight wait for the result (AchievementToast).
  useQuiet(outcome == null);
  /** わざ: the gauge, what a used one still holds for the coming writes, the cut-in and the companion's bubble. */
  const [gauge, setGauge] = useState(() => star5GaugeStart(star5, gaugeFull));
  /** Strikes the shield took — the worn shield kicks with each (GearFront). */
  const [guardNo, setGuardNo] = useState(0);
  const [buffs, setBuffs] = useState({ guards: 0, freeLooks: star5?.freeLooks ?? 0, power: 1, comboShield: 0 });
  const [cut, setCut] = useState<SkillCut | null>(null);
  /**
   * What the companion did for the learner this fight, for the result
   * (2026-10-07「サポートキャラの いる 意味が 伝わりにくい」): strikes blocked,
   * HP given back, slips taken off, free looks, powered and favoured hits,
   * COMBOs kept.
   */
  const helped = useRef({ guarded: 0, healed: 0, calmed: 0, looks: 0, powered: 0, favoured: 0, comboKept: 0 });
  /** …as it stood when the fight ended (the result reads this, not the ref). */
  const [helpedAtEnd, setHelpedAtEnd] = useState<typeof helped.current | null>(null);
  const [talk, setTalk] = useState<{ n: number; text: string } | null>(null);
  const talkNo = useRef(0);
  const companionSay = useCallback((text: string) => setTalk({ n: (talkNo.current += 1), text }), []);
  // The stroke order was shown for free (ヒント) during this write: no half, no slip, but no ★ either.
  const freeLookRef = useRef(false);
  // The same, for the hint key's label: this write's looks are already free.
  const [freeLookNow, setFreeLookNow] = useState(false);
  const [rewards, setRewards] = useState<{ gems: number; individual: string | null; perfect: boolean; hard: boolean }>({
    gems: 0,
    individual: null,
    perfect: false,
    hard: false,
  });
  const markPerfect = useGameStore((s) => s.markPerfect);
  const markHard = useGameStore((s) => s.markHard);
  const markTier = useGameStore((s) => s.markTier);

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
  // 字の ふういん: the kanji it holds (only ones it can ask), and those written back so far.
  const [sealIds] = useState<string[]>(() =>
    mastery && !tutorial ? (seals ?? kanjiPool).filter((k) => kanjiPool.some((p) => p.id === k.id)).map((k) => k.id) : [],
  );
  const [broken, setBroken] = useState<string[]>([]);
  const [freed, setFreed] = useState<{ n: number; ruby: string } | null>(null);
  const [weakestId, setWeakestId] = useState<string | null>(() =>
    mastery ? (pickWeakest(askFrom(kanjiPool, sealIds, []), repsNow, {}, null)?.id ?? null) : null,
  );
  const target = mastery ? (kanjiPool.find((k) => k.id === weakestId) ?? kanjiPool[0]) : kanjiPool[turn % kanjiPool.length];
  const ownsTarget = target ? progress[target.id]?.obtainedAt != null : false;
  const targetStars: Stars = target ? starsOf(progress[target.id]?.reps ?? 0) : 0;

  // The companion says hello once the intro band has gone — and, until its
  // わざ has been explained once, what it is there for (2026-10-07「サポートキャラの
  // いる 意味が 伝わりにくい」).
  useEffect(() => {
    if (!skillKind || !individual) return;
    const t = setTimeout(() => companionSay(linesFor(individual).start), 1600);
    const why = useGameStore.getState().tipsSeen.includes('skill')
      ? 0
      : window.setTimeout(() => {
          const info = SKILL_INFO[skillKind];
          companionSay(`${info.icon} わざ: ${info.says(skillEffect(skillKind, individual.rarity, useGameStore.getState().bonds?.[individual.id] ?? 0))}`);
        }, 4400);
    return () => {
      clearTimeout(t);
      clearTimeout(why);
    };
    // Once per fight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = useCallback(
    (kind: 'win' | 'lose', mistakes: number, hpLeft: number) => {
      if (settledRef.current) return;
      settledRef.current = true;
      setHelpedAtEnd({ ...helped.current });

      if (kind === 'lose') {
        setOutcome({ kind: 'lose' });
        return;
      }

      const stars = starsFor(mistakes, hpLeft, stats.maxHp);
      setOutcome({ kind: 'win', stars });
      if (tutorial) return;
      // きずな (11 §4.2): written through without a slip, with this companion along — once a day.
      if (mastery && stars === 3 && individual) {
        const lv = bondFromWin(individual.id);
        if (lv != null) companionSay(`きずな Lv${lv}！ ありがとう！`);
      }
      // Beating the opponent is experience: more the first time; a replay's share stops at its daily cap.
      if (mastery) gainExp(alreadyCleared ? EXP_BOSS_REPEAT : EXP_BOSS_FIRST, { bossRepeat: alreadyCleared });

      // First clear pays; a replay does not, so grinding a cleared stage for
      // gems is not a strategy.
      const gems = alreadyCleared ? 0 : stage.reward;
      let granted: string | null = null;
      if (!alreadyCleared && stage.grants) {
        granted = grantIndividual(stage.grants) ? stage.grants : null;
      }
      if (gems) addGems(gems);
      // かんぺき (★3, no mistake): once per stage, a little more (09 §3 B). Not on やさしい: the model was there.
      const perfect = mastery && !easy && stars === 3 && markPerfect(stage.id);
      if (perfect) addGems(PERFECT_BONUS_GEMS);
      // The first Hard win: once per stage (09 §3 D).
      const hard = mastery && difficulty === 'hard' && markHard(stage.id);
      if (hard) addGems(HARD_BONUS_GEMS);
      // Which difficulty it was won on: a higher win counts for the lower ones.
      if (mastery) markTier(stage.id, difficulty);
      clearStage(stage.id);
      setRewards({
        gems: gems + (perfect ? PERFECT_BONUS_GEMS : 0) + (hard ? HARD_BONUS_GEMS : 0),
        individual: granted,
        perfect,
        hard,
      });
    },
    [tutorial, alreadyCleared, stage, addGems, clearStage, grantIndividual, stats.maxHp, mastery, gainExp, markPerfect, difficulty, markHard, markTier, easy, individual, bondFromWin, companionSay],
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
    tellTip('counter');
    if (buffs.guards > 0) {
      // まもり: the strike is blocked.
      setBuffs((b) => ({ ...b, guards: b.guards - 1 }));
      helped.current.guarded += 1;
      sfx.clang();
      void fieldCtl.start({ x: [0, -3, 3, 0], transition: { duration: 0.25 } });
      say('🛡️ まもった！ ダメージ 0');
      companionSay('まもったよ！');
      return;
    }
    const back = strikeDamage(counterDamage(stage.boss.attack, individual, stage.boss.element), stats.defense);
    // The shield takes the blow: it kicks (GearFront).
    if (stats.defense > 0) setGuardNo((n) => n + 1);
    const nextPlayerHp = Math.max(0, playerHp - back);
    setPlayerHp(nextPlayerHp);
    sfx.hurt();
    void enemyCtl.start({ x: [0, -80, 0], transition: { duration: 0.45 } });
    void fieldCtl.start({ x: [0, -6, 6, -3, 0], transition: { duration: 0.35, delay: 0.25 } });
    say(`ミスが ${patience}こ たまった。${back} ダメージを うけた`);
    if (skillKind && nextPlayerHp > 0) companionSay(HURT_LINE[skillKind]);
    if (nextPlayerHp <= 0) settle('lose', totalMistakes, 0);
  }, [rage, patience, stage.boss, individual, stats.defense, playerHp, enemyCtl, fieldCtl, settle, totalMistakes, say, buffs.guards, skillKind, companionSay, tellTip]);

  const handleMistake = useCallback(() => {
    if (settledRef.current || bossDownRef.current) return;
    writeSlipsRef.current += 1;
    sfx.clang();
    addSlip();
  }, [addSlip]);

  const showStrokeOrder = () => {
    if (settledRef.current || bossDownRef.current || readQ) return;
    // ヒント: a free look for this character — no slip, no half.
    if (!hinted && (freeLookRef.current || buffs.freeLooks > 0)) {
      if (!freeLookRef.current) {
        freeLookRef.current = true;
        setFreeLookNow(true);
        setBuffs((b) => ({ ...b, freeLooks: b.freeLooks - 1 }));
        helped.current.looks += 1;
        say('💡 ヒント！ 見(み)ても こうげきは へらない');
      }
      writerRef.current?.animateStroke();
      return;
    }
    // Looking is allowed, and costs: one slip, and this write hits for half — said aloud, not only in the button's label.
    if (!hinted) {
      addSlip();
      say('💡 かきじゅん：ミス＋1。この 字(じ)の こうげきは 半分(はんぶん)');
    }
    setHinted(true);
    writerRef.current?.animateStroke();
  };

  const handleComplete = useCallback(
    (summary: { totalMistakes: number }) => {
      if (settledRef.current || bossDownRef.current) return;
      const mistakes = Math.max(summary.totalMistakes, writeSlipsRef.current);
      writeSlipsRef.current = 0;
      const lookedFree = freeLookRef.current;
      freeLookRef.current = false;
      setFreeLookNow(false);
      if (skillKind) {
        const g = Math.min(gaugeFull, gauge + star5GaugeGain(gaugeGain(mistakes, hinted || lookedFree), star5));
        setGauge(g);
        // The first time the ring fills: how to use it, once.
        if (g >= gaugeFull) tellTip('skill');
      }
      // A look at the stroke order counts against the stars like a slip.
      const nextMistakes = totalMistakes + mistakes + (hinted ? 1 : 0);
      setTotalMistakes(nextMistakes);

      // Writing an owned character in battle is a review of it — except in
      // 0話, where 一 was obtained minutes ago and three quick writes would
      // push its first review a week out.
      let starUp: Stars | null = null;
      // やさしい traces the model: not a review, not a write from memory.
      if (easy) {
        // nothing to record
      } else if (!tutorial && target && progress[target.id]?.obtainedAt != null) {
        recordReview(target.id, mistakes);
      } else if (mastery && target && mistakes === 0 && !hinted && !lookedFree) {
        // Written from memory without a slip: that is a write, and it counts.
        const before = progress[target.id]?.reps ?? 0;
        recordRep(target.id, 0);
        if (starsOf(before + 1) > starsOf(before)) starUp = starsOf(before + 1);
      }
      if (starUp && target) {
        const id = target.id;
        const up = starUp;
        setGrowth((g) => ({ ...g, starUps: { ...g.starUps, [id]: up } }));
      }
      if (target) {
        const id = target.id;
        setGrowth((g) => ({ ...g, writes: [...g.writes, id] }));
      }
      const clean = mistakes === 0 && !hinted;
      const critical = mastery && targetStars === 3 && clean;
      // コンボ (わざ): a slip may pass without ending the run.
      const shielded = mastery && !clean && combo > 0 && buffs.comboShield > 0;
      const nextCombo = mastery && clean ? combo + 1 : shielded ? combo : star5ComboAfterBreak(combo, star5);
      setCombo(nextCombo);
      if (nextCombo >= 3) tellTip('combo');
      // ちから (わざ): this write hits harder, once.
      const power = buffs.power;
      if (shielded || power !== 1) setBuffs((b) => ({ ...b, power: 1, comboShield: shielded ? b.comboShield - 1 : b.comboShield }));
      if (shielded) companionSay('コンボ、まもったよ！');
      if (shielded) helped.current.comboKept += 1;
      if (power !== 1) helped.current.powered += 1;
      // The run's sound: a climb at 3・5・7・10, a soft fall when it ends.
      if (comboMilestone(nextCombo)) atImpact(() => sfx.combo(comboTier(nextCombo).level), 150);
      else if (isComboBreak(combo, nextCombo)) sfx.comboBreak();

      const result = computeDamage({
        weapon,
        individual,
        defenderElement: stage.boss.element,
        mistakes,
        rust,
        attackPct: stats.attackPct,
        owned: ownsTarget && !tutorial && !mastery,
        hinted,
        mastery: mastery ? masteryMultiplier(targetStars, clean) * comboMultiplier(nextCombo) * power * star5CleanMul(clean && !lookedFree, star5) : 1,
      });
      setHinted(false);
      // 字の ふういん: this write gives its kanji back; the opponent keeps a share of HP for each still held.
      const nextBroken = target && sealIds.includes(target.id) && !broken.includes(target.id) ? [...broken, target.id] : broken;
      const sealsLeft = sealIds.length - nextBroken.length;
      const blow = strikeSealed(bossHp, result.damage, sealFloor(stage.boss.hp, sealIds.length, sealsLeft));
      if (nextBroken !== broken) {
        // The kanji comes back out of the opponent when the light lands, flies to its talisman, and it opens.
        const ruby = target ? kanjiRuby(target) : '';
        const n = turn;
        atImpact(() => {
          setBroken(nextBroken);
          setFreed({ n, ruby });
          // A small bright chime as it flies: heard, not read. The last one rings louder (all back).
          // (Not when this write also wins: the win has its own jingle.)
          if (nextBroken.length === sealIds.length && blow.hp > 0) atImpact(() => sfx.fanfare(), 350);
          else sfx.chime();
        });
      }
      if (blow.held) tellTip('seal');
      const struck = { n: turn, damage: blow.dealt, critical };

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

      const nextBossHp = blow.hp;
      setBossHp(nextBossHp);

      // 得意な 武器: the companion's bonus, said out loud so it is seen to count.
      const favoured = result.favoured && individual ? `（とくい ＋${individual.bonus}%）` : '';
      if (result.favoured && individual) helped.current.favoured += 1;
      const dealt = blow.dealt;
      say(
        blow.held
          ? `🔒 あと ${sealsLeft}字(じ)！ ${dealt} ダメージ`
          : sealIds.length > 0 && sealsLeft === 0 && nextBroken !== broken && nextBossHp > 0
            ? `🔓 字(じ)が ぜんぶ もどった！ ${dealt} ダメージ`
            : (power !== 1 ? `💥 ×${power}！ ` : '') +
              (critical
                ? `字(じ)の わざ！ ${dealt} ダメージ`
                : starUp
                  ? `★${starUp}に なった！ ${dealt} ダメージ`
                  : result.perfect
                    ? `かんぺき！ ${dealt} ダメージ`
                    : hinted
                      ? `かきじゅんを みたので はんぶん。${dealt} ダメージ`
                      : result.elementMultiplier > 1
                        ? `こうかは ばつぐん！ ${dealt} ダメージ`
                        : result.elementMultiplier < 1
                          ? `こうかは いまひとつ。${dealt} ダメージ`
                          : `${dealt} ダメージ`) +
              favoured,
      );

      if (nextBossHp <= 0) {
        bossDownRef.current = true;
        if (skillKind && individual) companionSay(linesFor(individual).win);
        settleTimer.current = setTimeout(() => settle('win', nextMistakes, playerHp), mastery ? WIN_DELAY_MASTERY_MS : 650);
        return;
      }

      if (mastery && target) {
        askedRef.current[target.id] = (askedRef.current[target.id] ?? 0) + 1;
        setWeakestId(pickWeakest(askFrom(kanjiPool, sealIds, nextBroken), repsNow, askedRef.current, target.id)?.id ?? null);
        // The next turn may be a reading one: the opponent throws a kanji.
        if (isReadTurn(turn + 1, writesPerReadFor(difficulty))) {
          if (!fightSeedRef.current) fightSeedRef.current = Math.floor(Math.random() * 100000) + 1;
          const q = readQuestion(kanjiPool, repsNow, lastThrownRef.current, fightSeedRef.current + turn + 1);
          if (q) {
            lastThrownRef.current = q.kanji.id;
            setReadPicked(null);
            setReadQ(q);
            tellTip('read');
          }
        }
      }
      setTurn((t) => t + 1);
    },
    [
      tutorial, totalMistakes, target, progress, recordReview, recordRep, weapon, individual, stage.boss,
      rust, bossHp, playerHp, settle, heroCtl, enemyCtl, turn, stats.attackPct, ownsTarget, hinted,
      mastery, targetStars, kanjiPool, combo, say, difficulty, skillKind, gaugeFull, buffs, companionSay, tellTip, star5,
      sealIds, broken, easy, gauge,
    ],
  );

  /** The reading turn is over: back to writing. */
  const finishRead = useCallback(() => {
    if (settledRef.current || bossDownRef.current) return;
    setReadQ(null);
    setReadPicked(null);
    setTurn((t) => t + 1);
  }, []);

  /**
   * A reading picked (読む ターン). Right: Nexmax turns the kanji back at the
   * opponent for a share of a clean hit, and the COMBO holds. Wrong: one slip,
   * as in writing, and the right reading is shown. Neither is a write — the
   * ★ do not move.
   */
  const handleReadPick = useCallback(
    (choice: string) => {
      if (!mastery || !readQ || readPicked || settledRef.current || bossDownRef.current) return;
      setReadPicked(choice);
      const right = choice === readQ.answer;
      setGrowth((g) => ({ ...g, readTotal: g.readTotal + 1, readRight: g.readRight + (right ? 1 : 0) }));
      if (!right) {
        sfx.clang();
        if (isComboBreak(combo, 0)) sfx.comboBreak();
        setTotalMistakes((n) => n + 1);
        setCombo(0);
        say(`「${readQ.answer}」と よむ`);
        addSlip();
        return;
      }
      gainExp(EXP_READ);
      if (skillKind) {
        const g = Math.min(gaugeFull, gauge + 1);
        setGauge(g);
        if (g >= gaugeFull) tellTip('skill');
      }
      const clean = computeDamage({
        weapon,
        individual,
        defenderElement: stage.boss.element,
        mistakes: 0,
        rust,
        attackPct: stats.attackPct,
        owned: false,
        hinted: false,
        mastery: masteryMultiplier(starsOf(repsNow(readQ.kanji.id)), false),
      });
      const sealsLeft = sealIds.length - broken.length;
      // A reading gives no kanji back: the seals still hold.
      const blow = strikeSealed(bossHp, Math.round(readDamage(clean.damage) * (star5?.readingMul ?? 1)), sealFloor(stage.boss.hp, sealIds.length, sealsLeft));
      const damage = blow.dealt;
      void heroCtl.start({ x: [0, -12, 0], rotate: [0, -6, 0], transition: { duration: 0.4 } });
      void enemyCtl.start({ x: [0, 14, -8, 0], transition: { duration: 0.45, delay: IMPACT_MS / 1000 } });
      atImpact(() => sfx.hit(), IMPACT_MS - 120);
      atImpact(() => setHit({ n: turn, damage }));
      // The bar follows hpDelay, so it drops with the number.
      const nextBossHp = blow.hp;
      setBossHp(nextBossHp);
      if (blow.held) tellTip('seal');
      say(blow.held ? `🔒 あと ${sealsLeft}字(じ)！ ${damage} ダメージ` : `はね返(かえ)した！ ${damage} ダメージ`);
      if (nextBossHp <= 0) {
        bossDownRef.current = true;
        settleTimer.current = setTimeout(() => settle('win', totalMistakes, playerHp), WIN_DELAY_MASTERY_MS);
        return;
      }
      atImpact(finishRead, IMPACT_MS + 600);
    },
    [mastery, readQ, readPicked, say, addSlip, gainExp, weapon, individual, stage.boss.element, stage.boss.hp, rust, stats.attackPct, heroCtl, enemyCtl, turn, bossHp, settle, totalMistakes, playerHp, finishRead, combo, skillKind, gaugeFull, star5, sealIds, broken, tellTip, gauge],
  );

  // What this clear opens. One per stage at most, announced with a line of
  // why it exists — a new button appearing unexplained teaches nothing.
  // Judged against the save as it was when the fight began: the win itself
  // marks the stage cleared, and reading it live would hide the news.
  const opened = clearedAtStart || tutorial ? [] : featuresUnlockedBy(stage.id, clearsAtStart);

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

  // Over either layout: the light, 字の わざ, and the result.
  const overlays = (
    <>
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
              perfect={rewards.perfect}
              hard={rewards.hard}
              easyWin={easy}
              milestone={outcome.kind === 'win' && !clearedAtStart && !tutorial ? clearLine : undefined}
              // Gems show on the new route once the gacha gives them a use (1章 4話).
              showGems={!mastery || isFeatureUnlocked(Feature.GACHA, useGameStore.getState().clearedStages)}
              newFriend={!!rewards.individual}
              opened={outcome.kind === 'win' ? opened : []}
              tutorial={tutorial}
              hasNext={!!onNext}
              // A Hard rematch goes back to じゅんび; a first win (on any difficulty) goes on with the story.
              nextLabel={difficulty === 'hard' && clearedAtStart ? 'じゅんびに もどる' : undefined}
              // Hard grows with the player: writing more does not shrink it, fewer slips do.
              loseHint={difficulty === 'hard' ? 'ハードです。ミスを へらしましょう。ゆっくり 書(か)いて ください。' : undefined}
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
              route={mastery ? 'moji' : undefined}
              growth={
                mastery
                  ? {
                      starUps: Object.entries(growth.starUps).flatMap(([id, stars]) => {
                        const kanji = getKanjiById(id);
                        return kanji ? [{ kanji, stars }] : [];
                      }),
                      read: { right: growth.readRight, total: growth.readTotal },
                      help: individual && skillKind && helpedAtEnd ? { name: individual.shortName, art: individual.art, bonus: individual.bonus, ...helpedAtEnd } : undefined,
                      written: {
                        // Furigana notation (日(にち)), as every kanji on screen.
                        chars: [...new Set(growth.writes)].flatMap((id) => {
                          const k = getKanjiById(id);
                          return k ? [kanjiRuby(k)] : [];
                        }),
                        total: growth.writes.length,
                      },
                      goal: nextStarGoal(kanjiPool, (id) => progress[id]?.reps ?? 0),
                      exp: (() => {
                        // What the fight added, read off the store (nothing is counted twice).
                        const after = levelInfo(expNow, ownedCount(progress));
                        return { gained: expNow - startExp, before: level, after: after.level, atCap: after.atCap, kanjiToRaiseCap: after.kanjiToRaiseCap };
                      })(),
                    }
                  : undefined
              }
            />
          )}
        </AnimatePresence>
    </>
  );

  /** わざ: the gauge is full and the companion is tapped. */
  const fireSkill = () => {
    if (!skillKind || !individual || gauge < gaugeFull || settledRef.current || bossDownRef.current) return;
    const e = skillEffect(skillKind, individual.rarity, useGameStore.getState().bonds?.[individual.id] ?? 0);
    const info = SKILL_INFO[skillKind];
    const does = info.says(e);
    setGauge(0);
    setCut({ n: talkNo.current + 1, art: individual.art, name: individual.name, kind: skillKind, does, doesEn: useGameStore.getState().settings.english ? info.en(e) : undefined });
    companionSay(linesFor(individual).skill);
    sfx.skill();
    // ★5 ひかりの いやし: every わざ heals too.
    const heal = (e.heal ?? 0) + (star5?.skillHeal ?? 0);
    if (heal) {
      helped.current.healed += Math.min(heal, stats.maxHp - playerHp);
      setPlayerHp((h) => Math.min(stats.maxHp, h + heal));
    }
    if (e.calm) {
      helped.current.calmed += Math.min(rage, e.calm);
      setRage((r) => Math.max(0, r - e.calm!));
    }
    if (e.comboAdd) setCombo((c) => c + e.comboAdd!);
    setBuffs((b) => ({
      guards: b.guards + (e.guards ?? 0),
      freeLooks: b.freeLooks + (e.freeLooks ?? 0),
      power: e.power ?? b.power,
      comboShield: b.comboShield + (e.comboShield ?? 0),
    }));
    say(`${info.icon} ${info.name}！ ${does}`);
  };
  // What a わざ still holds, as pictures over Nexmax.
  const buffViews: BuffView[] = [
    ...(buffs.guards > 0 ? [{ icon: '🛡️', label: `×${buffs.guards}`, color: SKILL_INFO.guard.color }] : []),
    ...(buffs.freeLooks > 0 ? [{ icon: '💡', label: `×${buffs.freeLooks}`, color: SKILL_INFO.hint.color }] : []),
    ...(buffs.power !== 1 ? [{ icon: '💥', label: `×${buffs.power}`, color: SKILL_INFO.power.color }] : []),
    ...(buffs.comboShield > 0 ? [{ icon: '🔥', label: `×${buffs.comboShield}`, color: SKILL_INFO.combo.color }] : []),
  ];
  const companionView: CompanionView | null =
    skillKind && individual
      ? { art: individual.art, name: individual.name, kind: skillKind, gauge, full: gaugeFull, talk, onSkill: fireSkill }
      : null;

  // 文字が 消えた 町: the fight laid out from its delivered parts (08 §3.6).
  if (mastery) {
    return (
      <>
        <BattleIntro bossName={stage.boss.name} difficulty={difficulty} showFurigana={showFurigana} />
        <NaniwaBattleView
          bossName={stage.boss.name}
          bossImg={stage.boss.img}
          field={stage.bg}
          bossHp={bossHp}
          bossMaxHp={stage.boss.hp}
          playerHp={playerHp}
          playerMaxHp={stats.maxHp}
          rage={rage}
          patience={patience}
          target={target}
          targetStars={targetStars}
          showFurigana={showFurigana}
          hpDelay={IMPACT_MS / 1000}
          renderWriter={(px) => (
            <KanjiWriterCanvas
              ref={writerRef}
              key={`${target.id}-${turn}`}
              char={target.char}
              size={px}
              quizMode
              showSample={easy}
              surface="ink"
              onCorrectStroke={(d) => onStroke(d, px)}
              onMistake={handleMistake}
              onComplete={handleComplete}
            />
          )}
          spark={spark}
          companion={companionView}
          cut={cut}
          worn={tutorial ? {} : equippedGear}
          guard={guardNo}
          mount={weapon ? { cls: weapon.weaponClass, element: weapon.element, rarity: weapon.rarity, level: weapon.level ?? 0, word: weaponWord(weapon) } : null}
          fire={flow?.n}
          flash={flash}
          flashKey={flashNo}
          tip={tip}
          idle={turn === 0 && !flash ? (easy ? '🌱 うすい 字(じ)を なぞって こうげき！' : '💡 書(か)いた 字(じ)の 光(ひかり)で こうげき！') : null}
          hit={hit}
          combo={combo}
          still={still}
          heroCtl={heroCtl}
          enemyCtl={enemyCtl}
          fieldCtl={fieldCtl}
          boardRef={boardRef}
          heroRef={heroRef}
          enemyRef={enemyRef}
          onStrokeOrder={showStrokeOrder}
          hintFree={hinted || freeLookNow || buffs.freeLooks > 0}
          onFlee={onFlee}
          read={readQ ? { ...readQ, n: turn, picked: readPicked, onPick: handleReadPick, onNext: finishRead } : null}
          seals={sealIds.map((id) => ({ id, char: kanjiPool.find((k) => k.id === id)?.char ?? '', open: broken.includes(id) }))}
          freed={freed}
          buffs={buffViews}
        />
        {overlays}
      </>
    );
  }

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
                    <RubyText showFurigana={showFurigana}>□に 入(はい)る 字(じ)を 書(か)きましょう</RubyText>
                  </span>
                </p>
              )}
              <Readings kanji={target} hideKanji={!tutorial} />
              <p className="truncate" style={{ color: 'var(--ink-2)' }}>
                meaning: <b lang="en" className="text-base" style={{ color: '#1b4f8f' }}>{target.meanings.slice(0, 2).join(' / ')}</b>
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
                  ? 'マスター。ミス なしで 書(か)く →「字(じ)の わざ」'
                  : `こうげき ×${masteryMultiplier(targetStars, false)}。ミス なしで 書(か)く → ★が ふえる（${MASTERY_REPS[targetStars]}回(かい)で ★${targetStars + 1}）`}
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
                  : 'まだ 持(も)っていない 字(じ)。れんしゅうしましょう'}
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

      {overlays}
    </div>
  );
};

export default BattleScene;
