import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { NaniwaBattleView } from '../battle/NaniwaBattleView';
import LightFlow, { type Flow } from '../battle/LightFlow';
import { FLOW_MS, IMPACT_MS, lightOf } from '../../lib/lightFlow';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { starsOf } from '../../lib/mastery';
import { useGameStore } from '../../store/gameStore';
import * as sfx from '../../lib/sfx';
import { comboMilestone, comboTier, isComboBreak, strokeEnd, strokeLift } from '../../lib/combo';
import type { StrokeSpark } from '../battle/ComboFx';
import { SELF_HIT, SLIPS_TO_SELF_HIT, VS_MAX_HP, versusComboBonus, writeDamage } from './rules';
import { STAMPS } from './types';
import { SKILL_INFO, SKILL_OF, gaugeGain, skillGaugeFull, type SkillKind } from '../../lib/companionSkill';
import { linesFor } from '../../data/companionLines';
import { getIndividual, type Individual } from '../../data/individuals';
import type { CompanionView, SkillCut } from '../battle/CompanionFx';
import { throughWard, versusSkill, versusSkillSays } from './versusSkill';
import { useStill } from '../../hooks/useStill';

/** One stamp at a time: a moment between them, so they stay a greeting, not a flood. */
const STAMP_COOLDOWN_MS = 1500;
const STAMP_SHOWN_MS = 2200;

/**
 * The fight of a versus match, on the same stage as the story's fights
 * (NaniwaBattleView): the other player's なかま stands where a モジクイ would.
 *
 * Both write the same characters in the same order. A clean write throws
 * light at the other side; three slips on one character and the light turns
 * back on you. The weapon matters, but only a little — the point of a match
 * is who writes better, not who saved more gems.
 */

/** Where the fight happens: the town with every light back on. */
const ARENA = 'naniwa_lights_back';

interface Props {
  round: string[];
  opponentName: string;
  opponentImg?: string;
  /** 1.0 bare-handed, at most 1.2 (VersusScreen). */
  weaponBonus: number;
  /**
   * The other side's latest write; `n` changes with each one. `self`: it
   * slipped three times and the hit turned back on it (its HP, not this side's).
   */
  incoming: { n: number; damage: number; self?: boolean; warded?: number } | null;
  /** This side landed a hit: send it (`warded`: how much of it the other side's ward took). */
  onHit: (damage: number, index: number, warded: number) => void;
  /** This side slipped three times and took the hit itself: tell the other side. */
  onSelfHit: (damage: number, index: number) => void;
  onEnd: (won: boolean) => void;
  onForfeit: () => void;
  /** Every character this side finished, and its slips (for the result's review). */
  onWrite?: (char: string, mistakes: number) => void;
  /** The other side's latest stamp (STAMPS index); `n` changes with each one. */
  stampIn?: { n: number; stamp: number } | null;
  /** This side sent a stamp. */
  onStamp?: (stamp: number) => void;
  /** This side's なかま (a card), with its わざ — none before the first joins. */
  myCard?: Individual | null;
  /** The other side's latest わざ; `n` changes with each one. */
  skillIn?: { n: number; kind: SkillKind; card: string | null; ward?: number } | null;
  /** This side used its わざ: tell the other side (and its ward, which the other side applies to its next hit). */
  onSkill?: (kind: SkillKind, ward?: number) => void;
}

/** A stamp said by one side: a speech bubble that pops up and fades. */
const StampBubble = ({ said, className }: { said: { n: number; stamp: number } | null; className: string }) => (
  <AnimatePresence>
    {said && (
      <motion.span
        key={said.n}
        aria-live="polite"
        className={`pointer-events-none absolute z-20 flex items-center justify-center rounded-[3cqw] border-[0.4cqw] border-[#d4a04a] bg-[#fffaf0] text-[9cqw] leading-none shadow-lg ${className}`}
        style={{ width: '15cqw', height: '13cqw' }}
        initial={{ scale: 0.3, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 520, damping: 18 }}
      >
        {STAMPS[said.stamp]}
      </motion.span>
    )}
  </AnimatePresence>
);

export const VersusFight = ({ round, opponentName, opponentImg, weaponBonus, incoming, onHit, onSelfHit, onEnd, onForfeit, onWrite, stampIn, onStamp, myCard = null, skillIn = null, onSkill }: Props) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const recordReview = useGameStore((s) => s.recordReview);
  const still = useStill();

  const writerRef = useRef<KanjiWriterHandle>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);
  const heroCtl = useAnimationControls();
  const enemyCtl = useAnimationControls();
  const fieldCtl = useAnimationControls();

  const [myHp, setMyHpState] = useState(VS_MAX_HP);
  const [theirHp, setTheirHpState] = useState(VS_MAX_HP);
  // Mirrors, so a hit is judged outside a state updater (onEnd records the result).
  const myHpRef = useRef(VS_MAX_HP);
  const theirHpRef = useRef(VS_MAX_HP);
  const ended = useRef(false);
  const [index, setIndex] = useState(0);
  const [slips, setSlips] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [combo, setCombo] = useState(0);
  // なかまの わざ in a match (versusSkill.ts).
  const myKind = myCard ? SKILL_OF[myCard.char] : undefined;
  const gaugeFull = skillGaugeFull('normal');
  const [gauge, setGauge] = useState(0);
  const [power, setPower] = useState(1);
  const [comboShield, setComboShield] = useState(0);
  const [freeLooks, setFreeLooks] = useState(0);
  const freeLookRef = useRef(false);
  /** Slips that will not count (おちつき), and those already let off on this character. */
  const forgiveRef = useRef(0);
  const forgivenRef = useRef(0);
  /** Wards of this side waiting for the other side's next hits (shown), and the other side's on this side's hits. */
  const [myWards, setMyWards] = useState(0);
  const theirWards = useRef<number[]>([]);
  const [cut, setCut] = useState<SkillCut | null>(null);
  const cutNo = useRef(0);
  const [talk, setTalk] = useState<{ n: number; text: string } | null>(null);
  const talkNo = useRef(0);
  const companionSay = useCallback((text: string) => setTalk({ n: (talkNo.current += 1), text }), []);
  useEffect(() => {
    if (!myCard) return;
    const t = setTimeout(() => companionSay(linesFor(myCard).start), 1200);
    return () => clearTimeout(t);
    // Once a match.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [spark, setSpark] = useState<StrokeSpark | null>(null);
  const sparkNo = useRef(0);
  const onStroke = (data: Record<string, unknown>, px: number) => {
    sfx.neon(0.35, strokeLift(Number(data.strokeNum) || 0, combo));
    const end = strokeEnd(data, px);
    if (end) setSpark({ n: (sparkNo.current += 1), ...end });
  };
  const [flash, setFlash] = useState<string | null>(null);
  const [flashNo, setFlashNo] = useState(0);
  const [hit, setHit] = useState<{ n: number; damage: number; critical?: boolean } | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const say = useCallback((text: string) => {
    setFlash(text);
    setFlashNo((n) => n + 1);
  }, []);

  const end = useCallback(
    (won: boolean, ms: number) => {
      if (ended.current) return;
      ended.current = true;
      timers.current.push(setTimeout(() => onEnd(won), ms));
    },
    [onEnd],
  );

  const takeHit = useCallback(
    (damage: number) => {
      const next = Math.max(0, myHpRef.current - damage);
      myHpRef.current = next;
      setMyHpState(next);
      sfx.hurt();
      void heroCtl.start({ x: [0, -12, 0], rotate: [0, -6, 0], transition: { duration: 0.4 } });
      void fieldCtl.start({ x: [0, -6, 6, -3, 0], transition: { duration: 0.35, delay: 0.1 } });
      if (next === 0) end(false, 700);
    },
    [heroCtl, fieldCtl, end],
  );

  // The other side's hits.
  const seen = useRef(0);
  useEffect(() => {
    if (!incoming || incoming.n === seen.current || ended.current) return;
    seen.current = incoming.n;
    if (incoming.self) {
      // Its own three slips: the light turns back on it.
      void enemyCtl.start({ x: [0, 10, -6, 0], transition: { duration: 0.4 } });
      const next = Math.max(0, theirHpRef.current - incoming.damage);
      theirHpRef.current = next;
      setTheirHpState(next);
      setHit({ n: -incoming.n, damage: incoming.damage });
      say(`あいては 3こ まちがえた！ ${incoming.damage}`);
      if (next === 0) end(true, 600);
      return;
    }
    void enemyCtl.start({ x: [0, -80, 0], transition: { duration: 0.45 } });
    if (incoming.warded) {
      // A ward of this side took (part of) it.
      setMyWards((w) => Math.max(0, w - 1));
      if (incoming.damage > 0) takeHit(incoming.damage);
      else sfx.clang();
      say(incoming.damage > 0 ? `💚 ${incoming.warded} へらした！ ${incoming.damage}` : '🛡️ まもった！ ダメージ 0');
      companionSay('まもったよ！');
      return;
    }
    takeHit(incoming.damage);
    say(`あいての こうげき！ ${incoming.damage}`);
  }, [incoming, enemyCtl, takeHit, say, end, companionSay]);

  // The other side's わざ: its cut-in, and its ward on this side's next hit.
  const skillSeen = useRef(0);
  useEffect(() => {
    if (!skillIn || skillIn.n === skillSeen.current || ended.current) return;
    skillSeen.current = skillIn.n;
    const card = skillIn.card ? getIndividual(skillIn.card) : undefined;
    const effect = versusSkill(skillIn.kind, card?.rarity ?? 3);
    if (skillIn.ward) theirWards.current.push(skillIn.ward);
    setCut({ n: (cutNo.current += 1), art: card?.art ?? opponentImg ?? '', name: `あいての ${card?.name ?? 'なかま'}`, kind: skillIn.kind, does: versusSkillSays(effect) });
    sfx.skill();
    say(`あいての わざ「${SKILL_INFO[skillIn.kind].name}」！`);
  }, [skillIn, opponentImg, say]);

  // Stamps: the picker, the last one each side said (shown for a moment).
  const [stampMenu, setStampMenu] = useState(false);
  const [mine, setMine] = useState<{ n: number; stamp: number } | null>(null);
  // The other side's stamp shows until its moment is over (then this holds its n).
  const [theirsDone, setTheirsDone] = useState<number | null>(null);
  const theirs = stampIn && stampIn.stamp >= 0 && stampIn.stamp < STAMPS.length && stampIn.n !== theirsDone ? stampIn : null;
  const lastStamp = useRef(-STAMP_COOLDOWN_MS);
  useEffect(() => {
    if (!stampIn) return;
    sfx.tap();
    const t = setTimeout(() => setTheirsDone(stampIn.n), STAMP_SHOWN_MS);
    return () => clearTimeout(t);
  }, [stampIn]);
  /** `at`: the tap's time (its event timeStamp), for the cooldown and the bubble's key. */
  const sendStamp = (stamp: number, at: number) => {
    setStampMenu(false);
    if (at - lastStamp.current < STAMP_COOLDOWN_MS) return;
    lastStamp.current = at;
    const said = { n: at, stamp };
    setMine(said);
    later(() => setMine((s) => (s?.n === said.n ? null : s)), STAMP_SHOWN_MS);
    onStamp?.(stamp);
  };

  const char = round[index % round.length];
  const target = getKanjiByChar(char)!;
  const targetStars = starsOf(progress[target.id]?.reps ?? 0);

  const handleMistake = useCallback(() => {
    if (forgiveRef.current > 0) {
      // おちつき: this slip does not count.
      forgiveRef.current -= 1;
      forgivenRef.current += 1;
      return;
    }
    setSlips((n) => Math.min(SLIPS_TO_SELF_HIT, n + 1));
  }, []);

  const handleComplete = useCallback(
    ({ totalMistakes }: { totalMistakes: number }) => {
      if (ended.current) return;
      // The review and the result's list keep the real count; the match counts the ones おちつき let off.
      if (progress[target.id]?.obtainedAt != null) recordReview(target.id, totalMistakes);
      onWrite?.(target.char, hinted ? Math.max(totalMistakes, 2) : totalMistakes);
      const mistakes = Math.max(0, totalMistakes - forgivenRef.current);
      forgivenRef.current = 0;
      const lookedFree = freeLookRef.current;
      freeLookRef.current = false;
      if (myKind) setGauge((g) => Math.min(gaugeFull, g + gaugeGain(mistakes, hinted || lookedFree)));
      const n = index;
      setIndex(n + 1);
      setSlips(0);
      setHinted(false);

      if (mistakes >= SLIPS_TO_SELF_HIT) {
        // A failed write costs the writer, not the opponent.
        if (isComboBreak(combo, 0)) sfx.comboBreak();
        setCombo(0);
        onSelfHit(SELF_HIT, n);
        takeHit(SELF_HIT);
        say(`ミスが ${SLIPS_TO_SELF_HIT}こ。${SELF_HIT} うけた`);
        return;
      }

      const clean = mistakes === 0 && !hinted;
      // コンボ (わざ): a slip may pass without ending the run.
      const shielded = !clean && combo > 0 && comboShield > 0;
      const nextCombo = clean ? combo + 1 : shielded ? combo : 0;
      if (shielded) setComboShield((c) => c - 1);
      setCombo(nextCombo);
      // ちから (わざ) once, then the other side's ward, if it has one.
      if (power !== 1) setPower(1);
      const struck = writeDamage(mistakes, hinted, weaponBonus, nextCombo, power);
      const { damage, warded } = throughWard(struck, theirWards.current.shift() ?? 0);
      if (comboMilestone(nextCombo)) later(() => sfx.combo(comboTier(nextCombo).level), 150);
      else if (isComboBreak(combo, nextCombo)) sfx.comboBreak();
      onHit(damage, n, warded);

      // The light: from the board into Nexmax, then out at the other side.
      const centre = (el: HTMLElement | null, fy = 0.5) => {
        const r = el?.getBoundingClientRect();
        return r ? { x: r.left + r.width / 2, y: r.top + r.height * fy } : { x: 0, y: 0 };
      };
      setFlow({ n, from: centre(boardRef.current), hero: centre(heroRef.current, 0.42), to: centre(enemyRef.current), light: lightOf(mistakes, hinted) });
      sfx.beam();
      const total = (IMPACT_MS + FLOW_MS.fade) / 1000;
      void heroCtl.start({
        scale: [1, 1, 1.08, 1],
        x: [0, 0, -10, 0],
        transition: { duration: total, times: [0, FLOW_MS.rise / 1000 / total, (FLOW_MS.rise + FLOW_MS.charge) / 1000 / total, 1] },
      });
      void enemyCtl.start({ x: [0, 14, -8, 0], transition: { duration: 0.45, delay: IMPACT_MS / 1000 } });
      later(() => sfx.hit(), IMPACT_MS - 120);
      later(() => {
        setHit({ n, damage, critical: clean });
        const next = Math.max(0, theirHpRef.current - damage);
        theirHpRef.current = next;
        setTheirHpState(next);
        if (next === 0) end(true, 500);
      }, IMPACT_MS);
      say(
        warded >= struck
          ? '🛡️ あいてに ふせがれた！'
          : `${power !== 1 ? `💥 ×${power}！ ` : ''}${clean ? 'かんぺき！ ' : ''}${damage}${warded ? `（${warded} ふせがれた）` : clean ? '' : ' あたえた'}`,
      );
    },
    [index, target.id, target.char, progress, recordReview, hinted, weaponBonus, onHit, onSelfHit, onWrite, takeHit, say, heroCtl, enemyCtl, end, later, combo, myKind, gaugeFull, comboShield, power],
  );

  /** わざ: the gauge is full and this side's なかま is tapped. */
  const fireSkill = () => {
    if (!myKind || !myCard || gauge < gaugeFull || ended.current) return;
    const e = versusSkill(myKind, myCard.rarity);
    setGauge(0);
    setCut({ n: (cutNo.current += 1), art: myCard.art, name: myCard.name, kind: myKind, does: versusSkillSays(e) });
    companionSay(linesFor(myCard).skill);
    sfx.skill();
    if (e.power) setPower(e.power);
    if (e.freeLooks) setFreeLooks((f) => f + e.freeLooks!);
    if (e.comboAdd) setCombo((c) => c + e.comboAdd!);
    if (e.comboShield) setComboShield((c) => c + e.comboShield!);
    if (e.slipsBack) {
      // The slips already on this character first, then the next ones.
      const back = Math.min(e.slipsBack, slips);
      forgivenRef.current += back;
      forgiveRef.current += e.slipsBack - back;
      setSlips((n) => n - back);
    }
    if (e.ward) setMyWards((w) => w + 1);
    onSkill?.(myKind, e.ward);
    say(`${SKILL_INFO[myKind].icon} ${SKILL_INFO[myKind].name}！ ${versusSkillSays(e)}`);
  };
  const companionView: CompanionView | null =
    myKind && myCard ? { art: myCard.art, name: myCard.name, kind: myKind, gauge, full: gaugeFull, talk, onSkill: fireSkill } : null;

  return (
    <>
      <NaniwaBattleView
        bossName={opponentName}
        bossImg={opponentImg}
        field={ARENA}
        bossHp={theirHp}
        bossMaxHp={VS_MAX_HP}
        playerHp={myHp}
        playerMaxHp={VS_MAX_HP}
        rage={slips}
        patience={SLIPS_TO_SELF_HIT}
        target={target}
        targetStars={targetStars}
        showFurigana={showFurigana}
        hpDelay={0}
        renderWriter={(px) => (
          <KanjiWriterCanvas
            ref={writerRef}
            key={`${target.id}-${index}`}
            char={target.char}
            size={px}
            quizMode
            surface="ink"
            onCorrectStroke={(d) => onStroke(d, px)}
            onMistake={handleMistake}
            onComplete={handleComplete}
          />
        )}
        spark={spark}
        flash={flash}
        flashKey={flashNo}
        idle={index === 0 && !flash ? '✍️ はやく 正(ただ)しく 書(か)いて こうげき！' : null}
        hit={hit}
        combo={combo}
        // たいせん's own COMBO bonus (rules.ts versusComboBonus), as the damage counts it.
        comboPct={versusComboBonus}
        companion={companionView}
        cut={cut}
        still={still}
        heroCtl={heroCtl}
        enemyCtl={enemyCtl}
        fieldCtl={fieldCtl}
        boardRef={boardRef}
        heroRef={heroRef}
        enemyRef={enemyRef}
        onStrokeOrder={() => {
          // ヒント (わざ): a free look for this character.
          if (!hinted && (freeLookRef.current || freeLooks > 0)) {
            if (!freeLookRef.current) {
              freeLookRef.current = true;
              setFreeLooks((f) => f - 1);
              say('💡 ヒント！ 見(み)ても こうげきは へらない');
            }
          } else setHinted(true);
          writerRef.current?.animateStroke();
        }}
        onFlee={onForfeit}
        overlay={
          onStamp ? (
            <>
              {/* the other side, beside its なかま; this side, beside Nexmax */}
              {/* this side's wards waiting for the other side's next hits */}
              {myWards > 0 && (
                <span className="pointer-events-none absolute top-[47%] left-[3cqw] z-20 rounded-full border-[0.3cqw] border-[#6ab0ff] bg-[#0e1a33]/85 px-[2cqw] text-[4cqw] leading-[1.7] font-black text-white">
                  🛡️×{myWards}
                </span>
              )}
              <StampBubble said={theirs} className="top-[12%] left-[6%]" />
              <StampBubble said={mine} className="top-[40%] left-[36%]" />
              <div className="absolute top-[44%] right-[3cqw] z-20 flex flex-row items-center gap-[1.5cqw]">
                <AnimatePresence>
                  {stampMenu && (
                    <motion.div
                      className="flex gap-[1.5cqw] rounded-[3cqw] border-[0.4cqw] border-[#d4a04a] bg-[#1b1640]/95 p-[1.5cqw]"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {STAMPS.map((s, i) => (
                        <button
                          key={s}
                          type="button"
                          aria-label={`スタンプ ${s}`}
                          className="flex h-[12cqw] w-[12cqw] items-center justify-center rounded-[2.4cqw] bg-white/10 text-[7.5cqw] leading-none active:scale-90"
                          onClick={(e) => sendStamp(i, e.timeStamp)}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  aria-label="スタンプ"
                  aria-expanded={stampMenu}
                  className="flex h-[12cqw] w-[12cqw] items-center justify-center rounded-full border-[0.4cqw] border-[#d4a04a] bg-[#1b1640]/90 text-[6.5cqw] leading-none shadow-lg"
                  onClick={() => setStampMenu((m) => !m)}
                >
                  💬
                </button>
              </div>
            </>
          ) : undefined
        }
      />
      <LightFlow flow={flow} still={still} />
    </>
  );
};

export default VersusFight;
