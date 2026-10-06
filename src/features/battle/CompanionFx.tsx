import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { faceStyle } from '../../lib/faceCrop';
import { SKILL_INFO, type SkillKind } from '../../lib/companionSkill';

/**
 * なかま in the fight (docs/design/11 §3.1): a brass badge with its face on
 * the deck beside Nexmax — a partner calling in, not a figure standing in
 * front of the opponent with its back to it (2026-10-07「敵の 前で 背を 向ける
 * ビジュアルも 変」). It says a line now and then, the ring round its face
 * fills as the learner writes, and its わざ's sign is always on it. Full, it
 * glows, says わざ！ and the badge is the button. Using it plays a cut-in
 * across the column — the companion's moment, the whole figure — and what it
 * left behind shows over Nexmax (BuffStrip).
 */

/** The battle column's units (NaniwaBattleView W = 941). */
const cq = (px: number) => `${(px / 941) * 100}cqw`;

export interface CompanionView {
  /** Portrait, relative to public/. */
  art: string;
  /** Short name (furigana notation). */
  name: string;
  kind: SkillKind;
  gauge: number;
  full: number;
  /** A line in its bubble; `n` changes with every new one. */
  talk: { n: number; text: string } | null;
  onSkill: () => void;
}

export interface SkillCut {
  n: number;
  art: string;
  name: string;
  kind: SkillKind;
  /** What it does, this time (SKILL_INFO.says). */
  does: string;
}

export const CompanionStand = ({ c, px, showFurigana, still }: { c: CompanionView; px: number; showFurigana: boolean; still: boolean }) => {
  const info = SKILL_INFO[c.kind];
  const ready = c.gauge >= c.full;
  // The ring: how full the わざ is. Writing fills it; a tap empties it.
  const R = 46;
  const LEN = 2 * Math.PI * R;
  const fill = Math.min(1, c.gauge / c.full);
  // What the last write added, floated off the ring.
  const [gain, setGain] = useState<{ n: number; v: number } | null>(null);
  const last = useRef(c.gauge);
  useEffect(() => {
    if (c.gauge > last.current) setGain((g) => ({ n: (g?.n ?? 0) + 1, v: c.gauge - last.current }));
    last.current = c.gauge;
  }, [c.gauge]);
  const face = Math.round(px * 0.74);
  return (
    <div className="relative h-full w-full">
      {/* the bubble, over its badge */}
      <AnimatePresence>
        {c.talk && (
          <motion.p
            key={c.talk.n}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], y: 0, scale: 1 }}
            transition={{ duration: 2.6, times: [0, 0.08, 0.85, 1] }}
            className="pointer-events-none absolute right-0 bottom-[100%] z-10 mb-[1cqw] w-max max-w-[50cqw] rounded-[2cqw] border-[0.3cqw] border-[#d4a04a] bg-[#fff8e6] px-[2cqw] py-[1cqw] leading-snug font-black text-[#2a1a0c]"
            style={{ fontSize: cq(24) }}
          >
            <RubyText showFurigana={showFurigana}>{c.talk.text}</RubyText>
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        data-tap
        disabled={!ready}
        onClick={c.onSkill}
        aria-label={ready ? `わざ ${info.name}` : `${c.name.replace(/\([^)]*\)/g, '')} わざゲージ ${c.gauge} / ${c.full}`}
        className="relative block aspect-square w-full"
        animate={ready && !still ? { scale: [1, 1.07, 1] } : { scale: 1 }}
        transition={ready ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
        whileTap={ready ? { scale: 0.92 } : undefined}
      >
        {/* a halo when the わざ is ready */}
        {ready && (
          <motion.span
            aria-hidden
            className="absolute -inset-[12%] rounded-full"
            style={{ background: `radial-gradient(circle, ${info.color}cc 0%, ${info.color}55 45%, transparent 70%)` }}
            animate={still ? { opacity: 0.9 } : { opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        )}
        {/* the brass badge, its face in the middle — a partner on the radio, not a figure turning its back on the opponent */}
        <span aria-hidden className="absolute inset-[6%] rounded-full border-[0.5cqw] border-[#d4a04a] bg-[#140c06] shadow-[0_0_0_0.4cqw_#3a250f]" />
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff8e6]"
          style={{ width: face, height: face, ...faceStyle(c.art, face, 1.25) }}
        />
        <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" />
          <motion.circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={info.color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={LEN}
            initial={false}
            animate={{ strokeDashoffset: LEN * (1 - fill) }}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
          />
        </svg>
        {/* the わざ's sign, always: what this partner is for, at a glance */}
        <span
          aria-hidden
          className="absolute -right-[4%] -bottom-[2%] flex aspect-square w-[38%] items-center justify-center rounded-full border-[0.4cqw] border-[#d4a04a] bg-[#140c06] leading-none"
          style={{ fontSize: cq(34) }}
        >
          {info.icon}
        </span>
        {ready && (
          <motion.span
            className="g-outline-text absolute inset-x-0 -top-[14%] text-center font-black whitespace-nowrap"
            style={{ fontSize: cq(30), color: '#fff' }}
            animate={still ? undefined : { y: [0, -4, 0] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          >
            わざ！👆
          </motion.span>
        )}
        <AnimatePresence>
          {gain && (
            <motion.span
              key={gain.n}
              aria-hidden
              className="g-outline-text pointer-events-none absolute top-[10%] -left-[10%] font-black"
              style={{ fontSize: cq(30), color: info.color }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], y: -16 }}
              transition={{ duration: 1 }}
              onAnimationComplete={() => setGain(null)}
            >
              +{gain.v}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* its name and わざ, small, under the badge */}
      <p className="g-outline-text mt-[0.4cqw] text-center leading-none font-black whitespace-nowrap text-[#ffe9c2]" style={{ fontSize: cq(20) }}>
        <RubyText showFurigana={false}>{`${info.icon} ${info.name}`}</RubyText>
      </p>
    </div>
  );
};

/**
 * What the companion's わざ still holds for the coming writes, over Nexmax:
 * a blocked strike, a free look, a power-up, a guarded COMBO. Pictures and a
 * number — the help is seen, not read.
 */
export interface BuffView {
  icon: string;
  label: string;
  color: string;
}

export const BuffStrip = ({ buffs, still }: { buffs: readonly BuffView[]; still: boolean }) => (
  <div className="flex flex-wrap items-center gap-[0.8cqw]" aria-label={buffs.map((b) => `${b.icon}${b.label}`).join(' ')}>
    <AnimatePresence>
      {buffs.map((b) => (
        <motion.span
          key={b.icon}
          className="g-outline-text flex items-center gap-[0.4cqw] rounded-full border-[0.3cqw] bg-[#140c06]/85 px-[1.2cqw] leading-[1.5] font-black text-white"
          style={{ borderColor: b.color, fontSize: cq(32), boxShadow: `0 0 ${cq(10)} ${b.color}` }}
          initial={still ? { opacity: 0 } : { opacity: 0, scale: 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        >
          <span aria-hidden>{b.icon}</span>
          <RubyText showFurigana={false}>{b.label}</RubyText>
        </motion.span>
      ))}
    </AnimatePresence>
  </div>
);

/** The companion's moment: a band across the column, its picture sliding in, the わざ's name. */
export const SkillCutIn = ({ cut, showFurigana, still }: { cut: SkillCut | null; showFurigana: boolean; still: boolean }) => {
  if (!cut) return null;
  const info = SKILL_INFO[cut.kind];
  return (
    <motion.div
      key={cut.n}
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
      style={{ top: '34%', height: cq(300) }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.5, times: [0, 0.1, 0.8, 1] }}
    >
      <motion.div
        className="absolute inset-0 -skew-y-6"
        style={{ background: `linear-gradient(100deg, #140c06ee 0%, ${info.color}ee 55%, #fff8 100%)`, boxShadow: `0 0 ${cq(40)} ${info.color}` }}
        initial={{ scaleX: still ? 1 : 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      />
      <motion.img
        src={assetPath(cut.art)}
        alt=""
        aria-hidden
        className="absolute right-[2%] bottom-0 h-[130%] w-auto object-contain"
        initial={{ x: still ? 0 : '60%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
      />
      <motion.div
        className="relative ml-[5cqw] flex max-w-[58cqw] flex-col"
        initial={{ x: still ? 0 : '-30%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.12 }}
      >
        <span className="g-outline-text font-black" style={{ fontSize: cq(30), color: '#fff' }}>
          <RubyText showFurigana={showFurigana}>{cut.name}</RubyText>
        </span>
        <span className="g-outline-text leading-none font-black" style={{ fontSize: cq(84), color: '#fff' }}>
          {info.icon} <RubyText showFurigana={showFurigana}>{info.name}</RubyText>
        </span>
        <span className="mt-[1cqw] rounded-full bg-[#140c06]/80 px-[2cqw] leading-[1.9] font-black text-[#fff1cf]" style={{ fontSize: cq(24) }}>
          <RubyText showFurigana={showFurigana}>{cut.does}</RubyText>
        </span>
      </motion.div>
    </motion.div>
  );
};
