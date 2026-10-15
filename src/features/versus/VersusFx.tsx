import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { assetPath } from '../../lib/assetPath';
import { RubyText } from '../../components/ui/Ruby';
import { LogoText } from '../../components/ui/LogoText';
import { rankFor } from './types';

/**
 * たいせんの 盛り上げ (2026-10-15「対戦画面のUIをもう少しテイストに合わせて、かつスマブラのように
 * 盛り上がる感じで」): the arena, the VS call with both fighters slamming in, the
 * 3・2・1, 「しょうぶ あり！」 when a side falls, and the winner's spotlight.
 * The night town's indigo and brass, with a blue side (じぶん) and a red side
 * (あいて). Every motion is skipped when the device asks for less (`still`).
 */

export const ARENA_ART = 'img/versus/vs_arena.webp';
const BLUE = { deep: '#0d2a6e', mid: '#1d55c4', glow: '#5fb2ff' };
const RED = { deep: '#5e0f22', mid: '#c4283f', glow: '#ff7a5c' };

/** The arena behind the lobby and the result, darker toward the panels. */
export const ArenaBackdrop = ({ still }: { still: boolean }) => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0e0b26]">
    <img src={assetPath(ARENA_ART)} alt="" className="h-full w-full object-cover" />
    {/* the two searchlights, sweeping */}
    {!still && (
      <>
        <motion.div
          className="absolute -bottom-[10%] left-[-20%] h-[130%] w-[60%] origin-bottom"
          style={{ background: `linear-gradient(0deg, ${BLUE.glow}55 0%, transparent 85%)`, clipPath: 'polygon(45% 100%, 55% 100%, 100% 0, 0 0)', mixBlendMode: 'screen' }}
          animate={{ rotate: [18, 34, 18] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[-20%] -bottom-[10%] h-[130%] w-[60%] origin-bottom"
          style={{ background: `linear-gradient(0deg, ${RED.glow}55 0%, transparent 85%)`, clipPath: 'polygon(45% 100%, 55% 100%, 100% 0, 0 0)', mixBlendMode: 'screen' }}
          animate={{ rotate: [-18, -34, -18] }}
          transition={{ repeat: Infinity, duration: 6.6, ease: 'easeInOut' }}
        />
      </>
    )}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(14,11,40,0.35) 0%, rgba(18,14,46,0.15) 38%, rgba(10,8,28,0.9) 100%)' }} />
  </div>
);

/** A fighter on the arena's stage: a pool of light under the feet. */
export const Spotlight = ({ children, color = '#ffd36a' }: { children: ReactNode; color?: string }) => (
  <div className="relative flex flex-col items-center">
    <div
      aria-hidden
      className="absolute bottom-[-6%] h-[18%] w-[120%] rounded-[50%]"
      style={{ background: `radial-gradient(closest-side, ${color}cc, ${color}33 60%, transparent)`, filter: 'blur(2px)' }}
    />
    <div className="relative">{children}</div>
  </div>
);

/** The rank's medal (Codex), with its name beside it. */
export const RankMedal = ({ rating, size = 34, showFurigana, withRating = true }: { rating: number; size?: number; showFurigana: boolean; withRating?: boolean }) => {
  const rank = rankFor(rating);
  return (
    <span className="g-pill-night inline-flex items-center gap-1 py-0.5 pr-3 pl-1 text-sm font-black tabular-nums">
      <img src={assetPath(rank.medal)} alt="" aria-hidden className="object-contain" style={{ width: size, height: size }} draggable={false} />
      <RubyText showFurigana={showFurigana}>{rank.label}</RubyText>
      {withRating && <span>{rating}</span>}
    </span>
  );
};

/** Diagonal speed lines that rush across a side's colour. */
const SpeedLines = ({ still, dir }: { still: boolean; dir: 1 | -1 }) => (
  <div
    aria-hidden
    className={`absolute inset-0 opacity-40 ${still ? '' : dir > 0 ? 'vs-speed-r' : 'vs-speed-l'}`}
    style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.0) 0 22px, rgba(255,255,255,0.55) 22px 24px, rgba(255,255,255,0) 24px 70px)' }}
  />
);

export interface Fighter {
  art: string;
  name: string;
  rating: number;
  /** Mirror the picture so the two face each other. */
  mirrored?: boolean;
}

/**
 * VS: the blue side slides in from the left, the red side from the right, both
 * fighters slam down, 「VS」 crashes in between with a flash, then 3・2・1・書け！.
 */
export const VsSplash = ({
  me,
  them,
  count,
  still,
  showFurigana,
  top,
}: {
  me: Fighter;
  them: Fighter;
  /** 4 = not yet (VS shows), 3, 2, 1, then 0 = 書け！ */
  count: number;
  still: boolean;
  showFurigana: boolean;
  /** Laid over the top (the room's rules). */
  top?: ReactNode;
}) => {
  const slide = (from: number, delay: number) =>
    still ? { initial: false as const } : { initial: { x: from, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 260, damping: 22, delay } };
  return (
    <motion.div key="vs" className="fixed inset-0 z-40 overflow-hidden bg-[#0b0820]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* the two sides */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${BLUE.mid} 0%, ${BLUE.deep} 70%)`, clipPath: 'polygon(0 0, 100% 0, 100% 34%, 0 72%)' }}
        {...slide(-420, 0)}
      >
        <SpeedLines still={still} dir={1} />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        style={{ background: `linear-gradient(340deg, ${RED.mid} 0%, ${RED.deep} 70%)`, clipPath: 'polygon(0 72%, 100% 34%, 100% 100%, 0 100%)' }}
        {...slide(420, 0.05)}
      >
        <SpeedLines still={still} dir={-1} />
      </motion.div>
      {/* the gold seam between them */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(#fff6c8, #ffd36a)', clipPath: 'polygon(0 71.2%, 100% 33.2%, 100% 34.8%, 0 72.8%)', filter: 'drop-shadow(0 0 8px #ffd36a)' }}
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />

      <div className="relative mx-auto flex h-full w-full max-w-md flex-col">
        {top && <div className="px-4 pt-[max(14px,env(safe-area-inset-top))]">{top}</div>}
        {/* じぶん: upper left, on the blue */}
        <motion.div
          className="absolute top-[9%] left-[3%] flex flex-col items-start"
          initial={still ? false : { x: -260, scale: 1.25, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 17, delay: 0.15 }}
        >
          <FighterPlate side="1P" color={BLUE.glow} name={me.name} rating={me.rating} showFurigana={showFurigana} />
          <img
            src={assetPath(me.art)}
            alt=""
            aria-hidden
            draggable={false}
            className="h-[32dvh] max-h-[280px] w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            style={{ transform: me.mirrored ? 'scaleX(-1)' : undefined }}
          />
        </motion.div>
        {/* あいて: lower right, on the red */}
        <motion.div
          className="absolute right-[3%] bottom-[5%] flex flex-col items-end"
          initial={still ? false : { x: 260, scale: 1.25, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 17, delay: 0.3 }}
        >
          <img
            src={assetPath(them.art)}
            alt=""
            aria-hidden
            draggable={false}
            className="h-[32dvh] max-h-[280px] w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            style={{ transform: them.mirrored ? 'scaleX(-1)' : undefined }}
          />
          <FighterPlate side="2P" color={RED.glow} name={them.name} rating={them.rating} showFurigana={showFurigana} align="end" />
        </motion.div>

        {/* VS: crashes in on the seam, with a ring of light */}
        <div className="absolute inset-x-0 top-[47%] flex -translate-y-1/2 justify-center">
          {!still && (
            <motion.span
              aria-hidden
              className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] border-[#ffe7b8]"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 2.6], opacity: [0.9, 0] }}
              transition={{ delay: 0.62, duration: 0.6, ease: 'easeOut' }}
            />
          )}
          <motion.div
            initial={still ? false : { scale: 4, rotate: -14, opacity: 0 }}
            animate={count <= 3 ? { scale: 0.5, rotate: -8, opacity: 0 } : { scale: 1, rotate: -8, opacity: 1 }}
            transition={count <= 3 ? { duration: 0.2 } : { delay: 0.5, type: 'spring', stiffness: 380, damping: 13 }}
            style={{ fontSize: 'min(30vw, 128px)', lineHeight: 1 }}
          >
            <LogoText shine={!still}>VS</LogoText>
          </motion.div>
        </div>

        {/* 3・2・1・書け！ */}
        <div className="pointer-events-none absolute inset-x-0 top-[47%] flex -translate-y-1/2 justify-center">
          <AnimatePresence mode="wait">
            {count <= 3 && (
              <motion.div
                key={count}
                className="leading-none"
                style={{ fontSize: count > 0 ? 'min(26vw, 110px)' : 'min(20vw, 86px)' }}
                initial={still ? false : { scale: 2.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={still ? undefined : { scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              >
                <span className="rounded-3xl bg-[#0b0820]/70 px-5 py-2">
                  <LogoText showFurigana={showFurigana} tone={count > 0 ? 'blue' : 'gold'}>
                    {count > 0 ? String(count) : '書(か)け！'}
                  </LogoText>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* the flash when VS lands */}
      {!still && (
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.75, 0] }} transition={{ delay: 0.55, duration: 0.35 }} />
      )}
    </motion.div>
  );
};

/** A fighter's name plate: 1P / 2P in its side's colour, the name and the rank's medal. */
const FighterPlate = ({
  side,
  color,
  name,
  rating,
  showFurigana,
  align = 'start',
}: {
  side: string;
  color: string;
  name: string;
  rating: number;
  showFurigana: boolean;
  align?: 'start' | 'end';
}) => (
  <div className={`my-1 flex flex-col gap-1 ${align === 'end' ? 'items-end' : 'items-start'}`}>
    <div className="flex items-center gap-1.5">
      <span className="rounded-md px-1.5 text-sm leading-6 font-black text-white italic" style={{ background: color, boxShadow: `0 0 12px ${color}` }}>
        {side}
      </span>
      <span className="g-plate-brass rounded-lg px-2.5 text-base leading-7 font-black whitespace-nowrap">
        <RubyText showFurigana={showFurigana}>{name}</RubyText>
      </span>
    </div>
    <RankMedal rating={rating} size={26} showFurigana={showFurigana} />
  </div>
);

/**
 * 「しょうぶ あり！」 — the moment a side falls: a white flash, the call slams
 * in across the column, and the screen holds for a breath before the result.
 */
export const GameCall = ({ show, won, still, showFurigana }: { show: boolean; won: boolean; still: boolean; showFurigana: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div key="call" className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {!still && <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} />}
        <div className="absolute inset-x-0 top-1/2 h-[22%] -translate-y-1/2" style={{ background: `linear-gradient(90deg, transparent, ${won ? '#2a1a00e6' : '#0a0f2ae6'} 18%, ${won ? '#2a1a00e6' : '#0a0f2ae6'} 82%, transparent)` }} />
        <motion.div
          className="relative text-center leading-none"
          style={{ fontSize: 'min(12vw, 56px)', whiteSpace: 'nowrap' }}
          initial={still ? false : { scale: 3, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: -4 }}
          transition={{ type: 'spring', stiffness: 360, damping: 14, delay: 0.08 }}
        >
          <LogoText showFurigana={showFurigana} shine={!still}>
            しょうぶ あり！
          </LogoText>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/** ピンチ: a red glow at the edges while this side's HP is low. */
export const PinchGlow = ({ on, still }: { on: boolean; still: boolean }) =>
  on ? (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10"
      style={{ boxShadow: 'inset 0 0 70px 18px rgba(255,40,60,0.55)' }}
      animate={still ? undefined : { opacity: [0.45, 1, 0.45] }}
      transition={{ repeat: Infinity, duration: 1.1 }}
    />
  ) : null;

/** Paper confetti falling over the winner. */
export const Confetti = ({ still, n = 28 }: { still: boolean; n?: number }) => {
  if (still) return null;
  const colors = ['#ffd36a', '#ff7a5c', '#5fb2ff', '#9be37a', '#ffffff', '#f2a8ff'];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {Array.from({ length: n }, (_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 7) * 0.25;
        const dur = 2.6 + (i % 5) * 0.4;
        return (
          <motion.span
            key={i}
            className="absolute top-[-4%] block h-3 w-2 rounded-[2px]"
            style={{ left: `${left}%`, background: colors[i % colors.length] }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{ y: '110dvh', rotate: 360 * (i % 2 ? 1 : -1) * 2, x: [0, i % 2 ? 24 : -24, 0] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
};
