import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { comboMultiplier } from '../../lib/mastery';
import { comboMilestone, comboTier, isComboBreak } from '../../lib/combo';

/**
 * COMBO — the show around a run of clean writes (docs/design/11 §2).
 *
 * Four layers, all drawn by NaniwaBattleView:
 *   - ComboMeter: the count, bouncing up and changing colour with each write;
 *     when the run ends it falls apart with 「コンボ ストップ」.
 *   - ComboBanner: a band across the field at 3, 5, 7, 10 and every five after.
 *   - ComboEdge: from 3 on, the column's edge breathes in the combo's colour.
 *   - StrokeSparks: a small burst where each correct stroke ends.
 *
 * No CSS/SVG filters (iPhone) and nothing laid over the written character
 * itself (docs/constraints.md): the sparks sit at the stroke's end and are gone
 * in half a second. With reduced motion only the colours and numbers change.
 */

/** The battle column's units (NaniwaBattleView W = 941). */
const cq = (px: number) => `${(px / 941) * 100}cqw`;

/** The top tier cycles through these instead of holding one colour. */
const RAINBOW = ['#ff6fa0', '#ffd36a', '#7be08a', '#6ac8ff', '#c58bff', '#ff6fa0'];

export const ComboMeter = ({ combo, showPct = true, still }: { combo: number; showPct?: boolean; still: boolean }) => {
  // The run that just ended, to drop it: derived from the previous count.
  const [prev, setPrev] = useState(combo);
  const [broke, setBroke] = useState<{ from: number; k: number } | null>(null);
  if (combo !== prev) {
    setPrev(combo);
    if (isComboBreak(prev, combo)) setBroke({ from: prev, k: (broke?.k ?? 0) + 1 });
  }
  const tier = comboTier(combo);
  const size = 96 + tier.level * 12;
  return (
    <div className="pointer-events-none relative">
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            key={`c${combo}`}
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 1.9, rotate: -16 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 460, damping: 13 }}
            className="g-outline-text flex flex-col items-start leading-none font-black whitespace-nowrap"
            style={{ willChange: 'transform' }}
          >
            <motion.span
              className="tabular-nums"
              style={{ fontSize: cq(size), color: tier.color }}
              animate={tier.level === 5 && !still ? { color: RAINBOW } : undefined}
              transition={tier.level === 5 ? { duration: 1.6, repeat: Infinity, ease: 'linear' } : undefined}
            >
              {combo}
            </motion.span>
            <span style={{ fontSize: cq(30), color: tier.color }}>
              COMBO!
              {showPct && <span className="ml-[1cqw]">+{Math.round((comboMultiplier(combo) - 1) * 100)}%</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {broke && combo === 0 && (
          <motion.div
            key={`b${broke.k}`}
            initial={{ opacity: 1, y: 0, rotate: -8 }}
            animate={still ? { opacity: [1, 1, 0] } : { opacity: [1, 1, 0], y: [0, -6, 60], rotate: [-8, -4, 24] }}
            transition={{ duration: 0.9, times: [0, 0.2, 1], ease: 'easeIn' }}
            className="g-outline-text absolute top-0 left-0 flex flex-col items-start leading-none font-black whitespace-nowrap"
          >
            <span className="tabular-nums" style={{ fontSize: cq(96), color: '#b8b0a4' }}>
              {broke.from}
            </span>
            <span style={{ fontSize: cq(28), color: '#e8e0d4' }}>コンボ ストップ</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** A band across the field at a milestone. Keyed by the count, so it plays once each. */
export const ComboBanner = ({ combo, still }: { combo: number; still: boolean }) => {
  const label = comboMilestone(combo);
  if (!label) return null;
  const tier = comboTier(combo);
  return (
    <motion.div
      key={`m${combo}`}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center justify-center"
      style={{ top: '44%', height: cq(118) }}
      initial={{ opacity: 0, x: still ? '0%' : '-110%' }}
      animate={still ? { opacity: [0, 1, 1, 0] } : { opacity: [0, 1, 1, 0], x: ['-110%', '0%', '0%', '110%'] }}
      transition={{ duration: 1.35, times: [0, 0.16, 0.76, 1], ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0 -skew-y-3"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tier.color}cc 18%, ${tier.color}ee 50%, ${tier.color}cc 82%, transparent 100%)`,
          boxShadow: `0 0 ${cq(30)} ${tier.color}88`,
        }}
      />
      <span className="g-outline-text relative -skew-y-3 font-black whitespace-nowrap" style={{ fontSize: cq(64), color: '#fff' }}>
        {combo} COMBO {label}
      </span>
    </motion.div>
  );
};

/** From 3 on: the column's edge breathes in the combo's colour. */
export const ComboEdge = ({ combo, still }: { combo: number; still: boolean }) => {
  const tier = comboTier(combo);
  if (tier.level < 2) return null;
  const glow = (c: string) => `inset 0 0 ${cq(40 + tier.level * 16)} ${cq(4 + tier.level * 3)} ${c}`;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{ boxShadow: glow(`${tier.color}cc`) }}
      animate={
        still
          ? { opacity: 0.6 }
          : tier.level === 5
            ? { opacity: [0.45, 0.9, 0.45], boxShadow: RAINBOW.map((c) => glow(`${c}aa`)) }
            : { opacity: [0.5, 1, 0.5] }
      }
      transition={{ duration: tier.level === 5 ? 1.6 : 1.4 - tier.level * 0.12, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};

/** Spark colours by tier, deep enough to show on the parchment board. */
const SPARK_ON_PAPER = ['#e0801a', '#e0801a', '#e09a00', '#ff6a1a', '#f0407a', '#c0409a'];

/** Where a correct stroke ended, as a share of the writing square (0..1). */
export interface StrokeSpark {
  n: number;
  x: number;
  y: number;
}

/** A small burst at the end of a correct stroke: dots flying out and a ring. */
export const StrokeSparks = ({ spark, size, combo, still }: { spark: StrokeSpark | null; size: number; combo: number; still: boolean }) => {
  if (!spark || still) return null;
  const tier = comboTier(combo);
  // Deeper than the counter's colours: these land on the light paper.
  const color = SPARK_ON_PAPER[tier.level];
  const count = 8 + tier.level * 2;
  const reach = size * (0.13 + tier.level * 0.02);
  return (
    <div
      key={spark.n}
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left: `${spark.x * 100}%`, top: `${spark.y * 100}%`, width: 0, height: 0 }}
    >
      <motion.span
        className="absolute rounded-full border-[3px]"
        style={{ borderColor: color, width: reach, height: reach, left: -reach / 2, top: -reach / 2 }}
        initial={{ opacity: 0.9, scale: 0.2 }}
        animate={{ opacity: 0, scale: 1.6 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {Array.from({ length: count }, (_, i) => {
        // Spread evenly, turned a little by the stroke number so bursts differ.
        const a = ((i / count) * 360 + spark.n * 37) * (Math.PI / 180);
        const dot = Math.max(5, size * 0.03);
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: dot, height: dot, left: -dot / 2, top: -dot / 2, background: tier.level === 5 ? RAINBOW[i % 5] : i % 2 ? '#ffc23a' : color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * reach, y: Math.sin(a) * reach, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
};
