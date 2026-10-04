import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import PictureBook from '../picturebook/PictureBook';
import { KanjiWord, Readings } from '../../components/ui/Readings';
import { NexmaxSays, TopBar } from '../../components/ui/Chrome';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useCompactHeight } from '../../hooks/useCompactHeight';
import { StarBurst } from '../../components/ui/StarBurst';
import { useGameStore } from '../../store/gameStore';
import { kanjiRuby } from '../../lib/reading';
import { REPS_TO_OBTAIN, type KanjiData } from '../../types/kanji';
import { MASTERY_REPS, repsToNextStar, starsOf } from '../../lib/mastery';
import RockSlash from './RockSlash';
import SignLight from './SignLight';
import { NightStreetBackdrop, SignStreet } from './NightStreet';
import { TownBackdrop, TownShot } from './TownBackdrop';
import { hasSign } from '../picturebook/hasSign';
import { streetOf } from '../../lib/signStreet';
import * as sfx from '../../lib/sfx';
import { jinglePlaying, useBgm } from '../../lib/bgm';

/**
 * The writing drill: write the character, and it cuts a rock. Each rock
 * that splits gives one piece of kanji material; ten pieces and the kanji is
 * yours to forge with.
 *
 * The verdict on each rep is stated plainly — 「かんぺき」/「正かい」/「まだ 正かいでは
 * ない」 with the mistake count — because a learner who is told only
 * "よくできたね" never finds out which strokes they are getting wrong. Praise that
 * hides the result is worse than no praise.
 *
 * Layout follows public/img/design/森の漢字アドベンチャー_ui.png.
 *
 * 文字が 消えた 町 writes on empty signboards instead (`look="sign"`, 08 §3.6):
 * each write lights a sign, and the signs line up in streets under the drill —
 * one street per star. The old arcs keep the rocks.
 */

interface KanjiDrillProps {
  kanji: KanjiData;
  /** Called once the tenth rep lands. */
  onObtained?: (kanji: KanjiData) => void;
  /** もどる. */
  onExit?: () => void;
  /** The button on the "obtained" card. Defaults to onExit. */
  onDone?: () => void;
  /** Label for the button on the "obtained" card. */
  nextLabel?: string;
  /** Rendered under the material slots (e.g. a way on for a replay). */
  extra?: ReactNode;
  /**
   * 文字が 消えた 町: the writes that make the kanji the learner's (3, ★1).
   * Reaching it offers つぎへ or もっと 書く; the slots show the stars
   * (lib/mastery.ts). Without it the drill is the old ten-to-obtain one.
   */
  goal?: number;
  /** What a write does: cut a rock (むかし編・現代編) or light a sign (文字が 消えた 町). */
  look?: 'rock' | 'sign';
  /**
   * 文字が 消えた 町: the episode's town, behind the drill (it brightens as
   * `letters` come back), and where a letter just won is seen lighting up.
   */
  scene?: string;
  letters?: readonly string[];
}

type Verdict = { kind: VerdictKind; mistakes: number } | null;

/** Reps that show the model underneath before the learner is on their own. */
const SAMPLE_REPS = 3;

type VerdictKind = 'perfect' | 'clean' | 'close';

/** Everything the drill says that depends on what a write does. */
const COPY: Record<'rock' | 'sign', { verdict: Record<VerdictKind, { head: string; next: string }>; first: string; idle: string }> = {
  rock: {
    verdict: {
      perfect: { head: '正(せい)かい — かんぺき', next: '岩(いわ)が 割(わ)れた。この ちょうしで つづけよう。' },
      clean: { head: '正(せい)かい', next: '岩(いわ)が 割(わ)れた。つぎは まちがえずに 書(か)いてみよう。' },
      // Not a pass. Say so, then say what to do about it.
      close: { head: 'まだ 正(せい)かいでは ない', next: '岩(いわ)は 割(わ)れない。「書(か)きじゅん」を 見(み)てから もう一度(いちど)。' },
    },
    first: '手本(てほん)の 上(うえ)を なぞると、線(せん)が 刀(かたな)に なる。',
    idle: '書(か)ききると 岩(いわ)が 割(わ)れる。',
  },
  // N5 words: あかりが つく / ひかる (08 §3.6), not 灯す.
  sign: {
    verdict: {
      perfect: { head: '正(せい)かい — かんぺき', next: '看板(かんばん)に あかりが ついた。この ちょうしで つづけよう。' },
      clean: { head: '正(せい)かい', next: '看板(かんばん)に あかりが ついた。つぎは まちがえずに 書(か)いてみよう。' },
      close: { head: 'まだ 正(せい)かいでは ない', next: 'あかりが つかない。「書(か)きじゅん」を 見(み)てから もう一度(いちど)。' },
    },
    first: '手本(てほん)の 上(うえ)を なぞると、線(せん)が ひかる。',
    idle: '書(か)ききると 看板(かんばん)に あかりが つく。',
  },
};


export const KanjiDrill = ({ kanji, onObtained, onExit, onDone, nextLabel = 'つぎへ', extra, goal, look = 'rock', scene, letters }: KanjiDrillProps) => {
  useBgm('story');
  // On a short screen the progress moves up beside the kanji and the page
  // packs tighter, so the sign still fits without scrolling (an iPhone SE
  // in its browser leaves about 550px).
  const compact = useCompactHeight();
  const size = useCanvasSize(300, compact ? 1 : 0.4, 88, compact ? 300 : 0);
  const slashRef = useRef<{ animateStroke: () => void }>(null);
  const sign = look === 'sign';
  const copy = COPY[look];

  const recordRep = useGameStore((s) => s.recordRep);
  const recordReview = useGameStore((s) => s.recordReview);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const reps = useGameStore((s) => s.progress[kanji.id]?.reps ?? 0);

  // The canvas starts blank on purpose — the learner writes from memory. But
  // on a character they have never seen, blank is a dead end, so the model is
  // shown for the first few reps and then taken away: trace it, then recall
  // it. The toggle stays available either way.
  const [sampleOverride, setSampleOverride] = useState<boolean | null>(null);
  const autoSample = reps < SAMPLE_REPS;
  const showSample = sampleOverride ?? autoSample;

  const [strokeMistakes, setStrokeMistakes] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  /** Counts verdicts, so each new one pops once — and only then. */
  const [verdictNo, setVerdictNo] = useState(0);
  const [obtained, setObtained] = useState(false);
  /** The goal (★1) was reached on this write: the card offers つぎへ / もっと 書く. */
  const [goalCard, setGoalCard] = useState(false);
  /** A star gained without a card (★2), shown for a moment. */
  const [starUp, setStarUp] = useState<number | null>(null);
  /** Each write that lights the sign sends a glow over the town. */
  const [pulse, setPulse] = useState(0);
  /** The letter just came back: the town is shown lighting its sign, then the card. */
  const [townShot, setTownShot] = useState(false);
  const endTownShot = useCallback(() => {
    setTownShot(false);
    setGoalCard(true);
  }, []);
  const pendingGoal = useRef(false);
  /**
   * A kanji already owned is not collected again. Writing it is a review:
   * the first pass is recorded as one (and says so), and the rocks after
   * that are free practice that touches nothing — no ink, no daily count,
   * no change to the review schedule.
   */
  const [ownedAtStart] = useState(() => reps >= REPS_TO_OBTAIN);
  const [reviewed, setReviewed] = useState<'no' | 'card' | 'done'>('no');
  /** Which rock (or sign) this is — a new one comes after each write that passes. */
  const [rockNo, setRockNo] = useState(0);
  const pendingObtained = useRef(false);

  const ruby = kanjiRuby(kanji);

  const handleMistake = useCallback(() => setStrokeMistakes((m) => m + 1), []);

  const handleWritten = useCallback(
    (summary: { totalMistakes: number }) => {
      const mistakes = summary.totalMistakes;
      // Three or more slips in one character is not a pass: the rock holds,
      // and the rep does not advance the ten.
      const kind = mistakes === 0 ? 'perfect' : mistakes <= 2 ? 'clean' : 'close';
      setVerdict({ kind, mistakes });
      setVerdictNo((n) => n + 1);
      setStrokeMistakes(0);
      if (kind === 'close') return false;

      if (ownedAtStart) {
        if (reviewed === 'no') {
          recordReview(kanji.id, mistakes);
          setReviewed('card');
        }
        return true;
      }
      const before = useGameStore.getState().progress[kanji.id]?.reps ?? 0;
      pendingObtained.current = recordRep(kanji.id, mistakes);
      if (goal != null) {
        const gained = starsOf(before + 1) > starsOf(before) ? starsOf(before + 1) : null;
        if (before < goal && before + 1 >= goal) pendingGoal.current = true;
        else if (gained != null && !pendingObtained.current) setStarUp(gained);
      }
      return true;
    },
    [kanji, recordRep, recordReview, ownedAtStart, reviewed, goal],
  );

  const handleSplit = useCallback(() => {
    setPulse((p) => p + 1);
    if (pendingObtained.current) {
      pendingObtained.current = false;
      setObtained(true);
      onObtained?.(kanji);
      return;
    }
    if (pendingGoal.current) {
      pendingGoal.current = false;
      if (hasSign(scene, kanji.char)) setTownShot(true);
      else setGoalCard(true);
      return;
    }
    setRockNo((n) => n + 1);
  }, [kanji, onObtained, scene]);

  const done = Math.min(reps, REPS_TO_OBTAIN);
  const stars = starsOf(reps);
  const street = streetOf(reps, goal != null ? MASTERY_REPS : [REPS_TO_OBTAIN]);

  useEffect(() => {
    // After the town shot its jingle is still ringing; the fanfare would clash.
    if (goalCard && !jinglePlaying()) sfx.fanfare();
  }, [goalCard]);

  useEffect(() => {
    if (starUp == null) return;
    sfx.star(starUp - 1);
    const t = setTimeout(() => setStarUp(null), 1800);
    return () => clearTimeout(t);
  }, [starUp]);

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center pb-[max(20px,env(safe-area-inset-bottom))]">
      {sign ? (
        scene ? (
          <TownBackdrop scene={scene} letters={letters ?? [kanji.char]} pulse={pulse} />
        ) : (
          <NightStreetBackdrop />
        )
      ) : (
        <PictureBook scene="mukashi_meadow" className="!fixed -z-10" still />
      )}
      <AnimatePresence>{townShot && scene && <TownShot scene={scene} char={kanji.char} onDone={endTownShot} />}</AnimatePresence>
      <TopBar onBack={onExit} />

      <div className={`flex w-full max-w-md flex-1 flex-col px-3 ${compact ? 'gap-2 pt-2' : 'gap-3 pt-3'}`}>
        {/* いま書く字 ---------------------------------------------------- */}
        <div className="flex items-end justify-between gap-2">
          <div className={`g-parchment flex min-w-0 flex-1 items-center gap-3 px-4 ${compact ? 'py-1' : 'py-2.5'}`}>
            <span className={`leading-[1.5] font-black ${compact ? 'text-[36px]' : 'text-[44px]'}`}>
              <KanjiWord kanji={kanji} showFurigana={showFurigana} />
            </span>
            <div className="min-w-0 text-sm leading-relaxed">
              <Readings kanji={kanji} size="sm" />
              <p className="truncate" style={{ color: 'var(--ink-2)' }}>
                meaning: <b lang="en" className="text-[15px]" style={{ color: '#1b4f8f' }}>{kanji.meanings.slice(0, 2).join(' / ')}</b>
              </p>
            </div>
          </div>
          {compact && sign ? (
            // The street, small, where Nexmax would stand.
            <div className="g-parchment flex shrink-0 flex-col items-center px-2 py-1">
              <span className="text-[11px] leading-[1.9] font-black whitespace-nowrap">
                <span aria-hidden style={{ color: stars ? '#e8a317' : 'rgba(122,82,38,0.35)' }}>
                  {'★'.repeat(stars) + '☆'.repeat(3 - stars)}
                </span>{' '}
                {goal != null && stars < 3 ? <RubyText showFurigana={showFurigana}>{`あと ${repsToNextStar(reps)}`}</RubyText> : null}
              </span>
              <SignStreet small street={street} glyph={<KanjiWord kanji={kanji} showFurigana={false} />} label={`${street.size}まいの うち ${street.lit}まい ひかった`} />
            </div>
          ) : (
            // No bubble: the box under the sign already says what to do, and
            // the kanji's card needs the width for its meaning.
            <NexmaxSays text="" size={64} />
          )}
        </div>

        {/* 岩（看板）と 書く面 — 木の わく、看板は 真ちゅうの わく ------------- */}
        {/* Shifted left by half the side buttons' overhang, so the sign and its
            buttons sit centred together and nothing runs off the screen. */}
        <div
          className="relative -left-4 mx-auto flex items-center justify-center rounded-[22px] p-3"
          style={
            sign
              ? {
                  background: 'linear-gradient(180deg, #c7964a 0%, #7a5220 100%)',
                  border: '3px solid #4a3210',
                  boxShadow: 'inset 0 2px 0 rgba(255,230,170,0.45), 0 10px 22px rgba(0,0,0,0.45)',
                }
              : {
                  background: 'linear-gradient(180deg, #a8703a 0%, #7d4b1c 100%)',
                  border: '3px solid #5b3412',
                  boxShadow: 'inset 0 2px 0 rgba(255,220,170,0.35), 0 10px 22px rgba(40,20,0,0.35)',
                }
          }
        >
          <div
            className={`relative rounded-2xl ${sign ? '' : 'overflow-hidden'}`}
            style={{
              background: sign
                ? 'radial-gradient(ellipse at 50% 35%, #2f2860 0%, #17132f 70%, #0e0b22 100%)'
                : 'radial-gradient(ellipse at 50% 90%, #9ccf6a 0%, #cfeaf5 60%, #e8f6fb 100%)',
            }}
          >
            {sign ? (
              <SignLight
                key={`${kanji.id}-${rockNo}`}
                ref={slashRef}
                char={kanji.char}
                material={ruby}
                size={size}
                seed={rockNo}
                showSample={showSample}
                onMistake={handleMistake}
                onWritten={handleWritten}
                onLit={handleSplit}
              />
            ) : (
              <RockSlash
                key={`${kanji.id}-${rockNo}`}
                ref={slashRef}
                char={kanji.char}
                material={ruby}
                size={size}
                seed={rockNo + kanji.strokes * 7}
                showSample={showSample}
                onMistake={handleMistake}
                onWritten={handleWritten}
                onSplit={handleSplit}
              />
            )}
          </div>

          {/* 足場 — 書く面の 横に 置く（指で 隠れない） ------------------- */}
          <div className="absolute top-3 -right-1 flex translate-x-1/2 flex-col gap-2">
            <button
              type="button"
              className="g-parchment flex h-14 w-14 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
              onClick={() => slashRef.current?.animateStroke()}
            >
              <span aria-hidden className="text-lg">
                ✎
              </span>
              <RubyText showFurigana={showFurigana}>書(か)きじゅん</RubyText>
            </button>
            <button
              type="button"
              aria-pressed={showSample}
              className="g-parchment flex h-14 w-14 flex-col items-center justify-center !rounded-xl text-[10px] leading-tight font-black"
              onClick={() => setSampleOverride(!showSample)}
            >
              <span aria-hidden className="text-lg">
                {showSample ? '◐' : '○'}
              </span>
              <RubyText showFurigana={showFurigana}>{showSample ? '手本(てほん) けす' : '手本(てほん) だす'}</RubyText>
            </button>
          </div>
        </div>

        {/* 判定 ------------------------------------------------------------
            One box that stays put. It used to be re-keyed on the rep count
            and the rock number, so each verdict faded out and back in when
            the next rock rolled up — a blink on every write (2026-09-27
            「正解 完璧の エリアが チカチカ」). Now the box and its height
            never change; only a new verdict gives the heading one small pop
            (transform only). */}
        <div
          className={`g-parchment flex flex-col items-center justify-center px-4 text-center ${compact ? 'h-[52px]' : 'h-[68px]'}`}
          style={{ borderColor: verdict ? (verdict.kind === 'close' ? 'var(--color-danger)' : 'var(--color-success)') : undefined }}
          aria-live="polite"
        >
          {verdict ? (
            <>
              <motion.p
                key={verdictNo}
                className="g-title text-base"
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                style={{ willChange: 'transform' }}
              >
                <RubyText showFurigana={showFurigana}>{copy.verdict[verdict.kind].head}</RubyText>
                {verdict.mistakes > 0 && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--ink-2)' }}>
                    まちがえた ところ {verdict.mistakes}
                  </span>
                )}
              </motion.p>
              <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>{copy.verdict[verdict.kind].next}</RubyText>
              </p>
            </>
          ) : (
            <p className="text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>
                {reps === 0
                  ? copy.first
                  : sampleOverride === null && reps === SAMPLE_REPS
                    ? 'ここからは 手本(てほん)なしで 書(か)いてみよう。'
                    : strokeMistakes > 0
                      ? `いま ${strokeMistakes} かい まちがえています`
                      : copy.idle}
              </RubyText>
            </p>
          )}
        </div>

        {sign && compact ? null : sign ? (
          // 灯った 看板の 通り — one street per star (lib/signStreet.ts).
          <div className="g-parchment mt-auto px-3 py-2.5">
            <div className="mb-1.5 flex justify-center">
              {goal != null ? (
                <span className="text-sm font-black">
                  <span aria-hidden style={{ color: stars ? '#e8a317' : 'rgba(122,82,38,0.35)' }}>
                    {'★'.repeat(stars) + '☆'.repeat(3 - stars)}{' '}
                  </span>
                  <RubyText showFurigana={showFurigana}>{stars === 3 ? 'マスター' : `★${stars + 1}まで あと ${repsToNextStar(reps)}`}</RubyText>
                </span>
              ) : (
                <span className="text-sm font-black tabular-nums">
                  {done}/{REPS_TO_OBTAIN}
                </span>
              )}
            </div>
            <SignStreet
              street={street}
              glyph={<KanjiWord kanji={kanji} showFurigana={showFurigana} />}
              label={`${street.size}まいの うち ${street.lit}まい ひかった`}
            />
          </div>
        ) : (
          // 集めた かけら
          <div className="g-parchment mt-auto px-3 py-2.5">
            <div className="mb-2 flex items-center gap-2">
              {goal != null ? (
                <span className="text-sm font-black">
                  <span aria-hidden style={{ color: stars ? '#e8a317' : 'rgba(122,82,38,0.35)' }}>
                    {'★'.repeat(stars) + '☆'.repeat(3 - stars)}{' '}
                  </span>
                  <RubyText showFurigana={showFurigana}>{stars === 3 ? 'マスター' : `★${stars + 1}まで あと ${repsToNextStar(reps)}`}</RubyText>
                </span>
              ) : (
                <span className="text-sm font-black">
                  <span aria-hidden>🍃 </span>
                  <RubyText showFurigana={showFurigana}>集(あつ)めた かけら</RubyText>
                </span>
              )}
              <div className="h-3 flex-1 overflow-hidden rounded-full border border-[#8fb7d8] bg-[#e3f1fb]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7ed36b, #3e9b3a)' }}
                  animate={{ width: `${(done / REPS_TO_OBTAIN) * 100}%` }}
                />
              </div>
              <span className="text-lg font-black tabular-nums" style={{ color: '#1b4f8a' }}>
                {done}
                <span className="text-sm">/{REPS_TO_OBTAIN}</span>
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1" role="img" aria-label={`${REPS_TO_OBTAIN}こ のうち ${done}こ`}>
              {Array.from({ length: REPS_TO_OBTAIN }, (_, i) => {
                const got = i < done;
                const tier = goal != null ? MASTERY_REPS.indexOf((i + 1) as (typeof MASTERY_REPS)[number]) : -1;
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={got ? { scale: [1.3, 1] } : { scale: 1 }}
                    className="relative flex aspect-[3/4] flex-col items-center justify-end rounded-md border pb-0.5 text-[15px] leading-none font-black"
                    style={{
                      background: got ? 'linear-gradient(160deg,#fffbe8,#ffe7a3)' : 'rgba(255,255,255,0.55)',
                      borderColor: got ? '#f2b53a' : 'rgba(122,82,38,0.25)',
                      color: got ? '#4a3220' : 'rgba(122,82,38,0.3)',
                    }}
                  >
                    {tier >= 0 && (
                      <span
                        aria-hidden
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-[11px] leading-none font-black"
                        style={{ color: got ? '#e8a317' : 'rgba(122,82,38,0.45)' }}
                      >
                        ★{tier + 1}
                      </span>
                    )}
                    {got ? <KanjiWord kanji={kanji} showFurigana={showFurigana} /> : <span className="mb-1 text-xs">♛</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        {/* Its own way back is the top bar's もどる, which is enough on a short screen. */}
        {compact ? null : extra}
      </div>

      {/* ★2 — a star on the way, without stopping the hand ------------- */}
      <AnimatePresence>
        {starUp != null && (
          <motion.div
            key={starUp}
            initial={{ opacity: 0, y: -20, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className="pointer-events-none fixed top-[max(64px,env(safe-area-inset-top))] left-1/2 z-50 -translate-x-1/2"
            style={{ willChange: 'transform, opacity' }}
            aria-live="polite"
          >
            <StarBurst />
            <div className="g-btn-red rounded-2xl px-5 py-2 text-center font-black">
              <span className="block text-2xl tracking-widest" style={{ color: '#ffe27a' }}>
                {'★'.repeat(starUp)}
              </span>
              <RubyText showFurigana={showFurigana}>{`★${starUp}に なった！ こうげき アップ`}</RubyText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ★1 — the kanji is the learner's (新ルート) ---------------------- */}
      <AnimatePresence>
        {goalCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6"
          >
            <motion.div
              initial={{ scale: 0.86, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="g-parchment w-full max-w-sm px-6 py-6 text-center"
            >
              <div className="relative">
                <StarBurst />
              </div>
              <div className="g-btn-red mx-auto -mt-10 mb-3 inline-block rounded-xl px-4 py-1 text-sm font-black">
                <span style={{ color: '#ffe27a' }}>★</span> <RubyText showFurigana={showFurigana}>手(て)に 入(い)れた！</RubyText>
              </div>
              <motion.div
                initial={{ rotate: -8, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="mx-auto flex h-40 w-32 flex-col items-center justify-center rounded-2xl text-[64px] leading-[1.4] font-black"
                style={{
                  background: 'linear-gradient(160deg,#fffbe8,#ffe7a3)',
                  border: '4px solid #4f9a3c',
                  boxShadow: '0 0 30px rgba(255,210,90,0.9)',
                }}
              >
                <KanjiWord kanji={kanji} />
              </motion.div>
              <p className="g-title mt-4 text-lg">
                <RubyText showFurigana={showFurigana}>{`「${ruby}」が 町(まち)に 戻(もど)った！`}</RubyText>
              </p>
              {/* Why write more: said as what it buys, in the fight to come. */}
              <ul className="mt-2 space-y-0.5 text-left text-[13px] font-bold" style={{ color: 'var(--ink-2)' }}>
                <li>
                  <span style={{ color: '#e8a317' }}>★★</span>{' '}
                  <RubyText showFurigana={showFurigana}>{`${MASTERY_REPS[1]}回(かい)：こうげき アップ`}</RubyText>
                </li>
                <li>
                  <span style={{ color: '#e8a317' }}>★★★</span>{' '}
                  <RubyText showFurigana={showFurigana}>{`${MASTERY_REPS[2]}回(かい)：漢字(かんじ)マスター（字(じ)の わざ・武器(ぶき)）`}</RubyText>
                </li>
              </ul>
              <button type="button" className="g-btn g-btn-primary mt-5 w-full text-lg" onClick={onDone ?? onExit}>
                <RubyText showFurigana={showFurigana}>{nextLabel}</RubyText>
              </button>
              <button
                type="button"
                className="g-btn g-btn-accent mt-2 w-full"
                onClick={() => {
                  setGoalCard(false);
                  setVerdict(null);
                  setRockNo((n) => n + 1);
                }}
              >
                <RubyText showFurigana={showFurigana}>{`もっと 書(か)く（★2まで あと ${repsToNextStar(reps)}回(かい)）`}</RubyText>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 入手 ------------------------------------------------------------ */}
      <AnimatePresence>
        {(obtained || reviewed === 'card') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6"
          >
            <motion.div
              initial={{ scale: 0.86, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="g-parchment w-full max-w-sm px-6 py-6 text-center"
            >
              <div className="g-btn-red mx-auto -mt-10 mb-3 inline-block rounded-xl px-4 py-1 text-sm font-black">
                <RubyText showFurigana={showFurigana}>{obtained ? (goal != null ? '★3 漢字(かんじ)マスター！' : '10こ 集(あつ)まった！') : 'ふくしゅう できた'}</RubyText>
              </div>
              <motion.div
                initial={{ rotate: -8, scale: 0.6 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="mx-auto flex h-40 w-32 flex-col items-center justify-center rounded-2xl text-[64px] leading-[1.4] font-black"
                style={{
                  background: 'linear-gradient(160deg,#fffbe8,#ffe7a3)',
                  border: '4px solid #4f9a3c',
                  boxShadow: '0 0 30px rgba(255,210,90,0.9)',
                }}
              >
                <KanjiWord kanji={kanji} />
              </motion.div>
              <p className="g-title mt-4 text-lg">
                <RubyText showFurigana={showFurigana}>
                  {obtained ? `「${ruby}」を 手(て)に 入(い)れた！` : `「${ruby}」は もう 持(も)っている。`}
                </RubyText>
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  {obtained
                    ? goal != null
                      ? 'きれいに 書(か)くと「字(じ)の わざ」が 出(で)る。漢字(かんじ)やさんで、この 字(じ)の 武器(ぶき)も 作(つく)れる。'
                      : 'この 字(じ)で 武器(ぶき)が 作(つく)れる。'
                    : 'ふくしゅうとして 1回(かい) 記録(きろく)した。さびた 武器(ぶき)も 直(なお)る。'}
                </RubyText>
              </p>
              <button type="button" className="g-btn g-btn-primary mt-5 w-full text-lg" onClick={onDone ?? onExit}>
                <RubyText showFurigana={showFurigana}>{nextLabel}</RubyText>
              </button>
              {!obtained && (
                <button
                  type="button"
                  className="g-btn g-btn-accent mt-2 w-full"
                  onClick={() => {
                    setReviewed('done');
                    setRockNo((n) => n + 1);
                  }}
                >
                  <RubyText showFurigana={showFurigana}>もっと 書(か)く（記録(きろく)しない）</RubyText>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KanjiDrill;
