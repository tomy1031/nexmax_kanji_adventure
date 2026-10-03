import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationControls, useReducedMotion } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { NaniwaBattleView } from '../battle/NaniwaBattleView';
import LightFlow, { type Flow } from '../battle/LightFlow';
import { FLOW_MS, IMPACT_MS, lightOf } from '../../lib/lightFlow';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { starsOf } from '../../lib/mastery';
import { useGameStore } from '../../store/gameStore';
import * as sfx from '../../lib/sfx';
import { SELF_HIT, SLIPS_TO_SELF_HIT, VS_MAX_HP, writeDamage } from './rules';

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
  incoming: { n: number; damage: number; self?: boolean } | null;
  /** This side landed a hit: send it. */
  onHit: (damage: number, index: number) => void;
  /** This side slipped three times and took the hit itself: tell the other side. */
  onSelfHit: (damage: number, index: number) => void;
  onEnd: (won: boolean) => void;
  onForfeit: () => void;
}

export const VersusFight = ({ round, opponentName, opponentImg, weaponBonus, incoming, onHit, onSelfHit, onEnd, onForfeit }: Props) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const recordReview = useGameStore((s) => s.recordReview);
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(useReducedMotion() || settingReduced);

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
    takeHit(incoming.damage);
    say(`あいての こうげき！ ${incoming.damage}`);
  }, [incoming, enemyCtl, takeHit, say, end]);

  const char = round[index % round.length];
  const target = getKanjiByChar(char)!;
  const targetStars = starsOf(progress[target.id]?.reps ?? 0);

  const handleMistake = useCallback(() => setSlips((n) => Math.min(SLIPS_TO_SELF_HIT, n + 1)), []);

  const handleComplete = useCallback(
    ({ totalMistakes }: { totalMistakes: number }) => {
      if (ended.current) return;
      const mistakes = totalMistakes;
      if (progress[target.id]?.obtainedAt != null) recordReview(target.id, mistakes);
      const n = index;
      setIndex(n + 1);
      setSlips(0);
      setHinted(false);

      if (mistakes >= SLIPS_TO_SELF_HIT) {
        // A failed write costs the writer, not the opponent.
        setCombo(0);
        onSelfHit(SELF_HIT, n);
        takeHit(SELF_HIT);
        say(`ミスが ${SLIPS_TO_SELF_HIT}こ。${SELF_HIT} うけた`);
        return;
      }

      const damage = writeDamage(mistakes, hinted, weaponBonus);
      const clean = mistakes === 0 && !hinted;
      setCombo((c) => (clean ? c + 1 : 0));
      onHit(damage, n);

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
      say(clean ? `かんぺき！ ${damage}` : `${damage} あたえた`);
    },
    [index, target.id, progress, recordReview, hinted, weaponBonus, onHit, onSelfHit, takeHit, say, heroCtl, enemyCtl, end, later],
  );

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
            onCorrectStroke={() => sfx.neon(0.35)}
            onMistake={handleMistake}
            onComplete={handleComplete}
          />
        )}
        flash={flash}
        flashKey={flashNo}
        idle={index === 0 && !flash ? '✍️ はやく 正(ただ)しく 書(か)いて こうげき！' : null}
        hit={hit}
        combo={combo}
        still={still}
        heroCtl={heroCtl}
        enemyCtl={enemyCtl}
        fieldCtl={fieldCtl}
        boardRef={boardRef}
        heroRef={heroRef}
        enemyRef={enemyRef}
        onStrokeOrder={() => {
          setHinted(true);
          writerRef.current?.animateStroke();
        }}
        onFlee={onForfeit}
      />
      <LightFlow flow={flow} still={still} />
    </>
  );
};

export default VersusFight;
