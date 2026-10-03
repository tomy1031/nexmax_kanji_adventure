import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { SKILL_INFO, type SkillKind } from '../../lib/companionSkill';

/**
 * なかま in the fight (docs/design/11 §3.1): it stands on the deck beside
 * Nexmax, says a line now and then, and its わざ gauge fills as the learner
 * writes. Full, it glows and the whole figure is the button. Using it plays a
 * cut-in across the column — the companion's moment.
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

export const CompanionStand = ({ c, showFurigana, still }: { c: CompanionView; showFurigana: boolean; still: boolean }) => {
  const info = SKILL_INFO[c.kind];
  const ready = c.gauge >= c.full;
  return (
    <div className="relative h-full w-full">
      {/* the bubble, over its head */}
      <AnimatePresence>
        {c.talk && (
          <motion.p
            key={c.talk.n}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], y: 0, scale: 1 }}
            transition={{ duration: 2.6, times: [0, 0.08, 0.85, 1] }}
            className="pointer-events-none absolute right-0 bottom-[100%] z-10 mb-[1cqw] w-max max-w-[44cqw] rounded-[2cqw] border-[0.3cqw] border-[#d4a04a] bg-[#fff8e6] px-[2cqw] py-[1cqw] leading-snug font-black text-[#2a1a0c]"
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
        className="relative block h-full w-full"
        whileTap={ready ? { scale: 0.93 } : undefined}
      >
        {/* a halo behind it when the わざ is ready */}
        {ready && (
          <motion.span
            aria-hidden
            className="absolute inset-[8%] rounded-full"
            style={{ background: `radial-gradient(circle, ${info.color}cc 0%, ${info.color}55 45%, transparent 70%)` }}
            animate={still ? { opacity: 0.9 } : { opacity: [0.55, 1, 0.55], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        )}
        <motion.img
          src={assetPath(c.art)}
          alt=""
          aria-hidden
          draggable={false}
          className="relative h-full w-full object-contain select-none"
          animate={still ? undefined : { y: ['0%', '-3%', '0%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {ready && (
          <motion.span
            className="g-outline-text absolute inset-x-0 top-[2%] text-center font-black whitespace-nowrap"
            style={{ fontSize: cq(30), color: '#fff' }}
            animate={still ? undefined : { scale: [1, 1.12, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          >
            {info.icon} わざ！
          </motion.span>
        )}
      </motion.button>

      {/* the gauge: one pip per point */}
      <div
        className="absolute inset-x-[4%] top-[100%] flex items-center gap-[0.5cqw] rounded-full border-[0.25cqw] border-[#b8863f]/80 bg-[#140c06]/85 px-[1cqw] py-[0.6cqw]"
        aria-hidden
      >
        <span className="shrink-0 leading-none font-black text-[#ffe9c2]" style={{ fontSize: cq(16) }}>
          {info.icon}
        </span>
        {Array.from({ length: c.full }, (_, i) => (
          <motion.span
            key={i}
            className="h-[1.8cqw] flex-1 rounded-full"
            animate={{ background: i < c.gauge ? info.color : 'rgba(255,255,255,0.14)', scaleY: i === c.gauge - 1 && !still ? [1.8, 1] : 1 }}
          />
        ))}
      </div>
    </div>
  );
};

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
