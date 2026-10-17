import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CastMember } from '../../types/novel';
import type { BossLine } from '../../lib/bossShow';
import { assetPath } from '../../lib/assetPath';
import { faceStyle } from '../../lib/faceCrop';
import { LogoText } from '../../components/ui/LogoText';
import * as sfx from '../../lib/sfx';

/**
 * ボスの 見せ場 — the pictures of lib/bossShow.ts (docs/design/24): the VS call,
 * the mid-fight cut-in, the finisher's call and its flash. The same for the
 * town's まとめの ボス (BattleScene) and 0章's bosses (KanaBattle); the caller
 * says how text is drawn (furigana and the kanji written back, or kana only).
 * Every motion is cut short when the device asks for less (`still`), and a tap
 * always moves on.
 */

const BLUE = { deep: '#0d2a6e', mid: '#1d55c4', glow: '#5fb2ff' };
const RED = { deep: '#5e0f22', mid: '#c4283f', glow: '#ff7a5c' };

/** Diagonal speed lines rushing across a side (the same as たいせん's, index.css vs-speed-*). */
const SpeedLines = ({ still, dir }: { still: boolean; dir: 1 | -1 }) => (
  <div
    aria-hidden
    className={`absolute inset-0 opacity-40 ${still ? '' : dir > 0 ? 'vs-speed-r' : 'vs-speed-l'}`}
    style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.0) 0 22px, rgba(255,255,255,0.55) 22px 24px, rgba(255,255,255,0) 24px 70px)' }}
  />
);

/** Calls `onDone` after `ms`, once, unless a tap got there first. */
const useAutoDone = (ms: number, onDone: () => void) => {
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  useEffect(() => {
    const t = setTimeout(finish, ms);
    return () => clearTimeout(t);
    // Once, with the timing it started with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return finish;
};

/**
 * 登場: Nexmax slams in on the blue side, the boss on the red, 「VS」 crashes in
 * on the gold seam, and the boss's name comes with its nature (👑 じぶんが おうさま).
 */
export const BossVsIntro = ({
  label,
  hero,
  boss,
  trait,
  still,
  onDone,
}: {
  /** The band over it: まとめの ボス, ひらがなの ボス… (already drawn). */
  label: ReactNode;
  /** Each side's picture and name plate (already drawn: furigana, or kana only in 0章). */
  hero: { img: string; plate: ReactNode };
  boss: { img: string; plate: ReactNode };
  trait: { icon: string; ja: ReactNode; en: string };
  still: boolean;
  onDone: () => void;
}) => {
  const finish = useAutoDone(still ? 1600 : 2700, onDone);
  useEffect(() => {
    sfx.battleStart();
    if (still) return;
    const t = setTimeout(() => sfx.hit(), 520);
    return () => clearTimeout(t);
  }, [still]);
  const slide = (from: number, delay: number) =>
    still ? { initial: false as const } : { initial: { x: from, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 260, damping: 22, delay } };
  return (
    <motion.div
      className="fixed inset-0 z-50 cursor-pointer overflow-hidden bg-[#0b0820]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={finish}
      role="button"
      aria-label="つぎへ"
    >
      <motion.div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${BLUE.mid} 0%, ${BLUE.deep} 70%)`, clipPath: 'polygon(0 0, 100% 0, 100% 34%, 0 72%)' }} {...slide(-420, 0)}>
        <SpeedLines still={still} dir={1} />
      </motion.div>
      <motion.div className="absolute inset-0" style={{ background: `linear-gradient(340deg, ${RED.mid} 0%, ${RED.deep} 70%)`, clipPath: 'polygon(0 72%, 100% 34%, 100% 100%, 0 100%)' }} {...slide(420, 0.05)}>
        <SpeedLines still={still} dir={-1} />
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(#fff6c8, #ffd36a)', clipPath: 'polygon(0 71.2%, 100% 33.2%, 100% 34.8%, 0 72.8%)', filter: 'drop-shadow(0 0 8px #ffd36a)' }}
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />

      <div className="relative mx-auto flex h-full w-full max-w-md flex-col">
        {/* the band: what kind of fight this is */}
        <motion.div
          className="mx-auto mt-[max(14px,env(safe-area-inset-top))] rounded-full border-2 border-[#ffd36a] bg-black/60 px-4 py-1 text-sm font-black text-[#ffe7b8]"
          initial={still ? false : { y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          👑 {label}
        </motion.div>
        {/* Nexmax: upper left, on the blue */}
        <motion.div
          className="absolute top-[11%] left-[3%] flex flex-col items-start"
          initial={still ? false : { x: -260, scale: 1.25, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 17, delay: 0.15 }}
        >
          <span className="rounded-lg border-2 px-3 py-0.5 text-base font-black text-white" style={{ borderColor: BLUE.glow, background: 'rgba(8,20,60,0.75)' }}>
            {hero.plate}
          </span>
          <img src={assetPath(hero.img)} alt="" aria-hidden draggable={false} className="h-[30dvh] max-h-[260px] w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]" />
        </motion.div>
        {/* the boss: lower right, on the red, bigger */}
        <motion.div
          className="absolute right-[2%] bottom-[4%] flex flex-col items-end"
          initial={still ? false : { x: 260, scale: 1.3, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.3 }}
        >
          <img src={assetPath(boss.img)} alt="" aria-hidden draggable={false} className="h-[36dvh] max-h-[320px] w-auto object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.7)]" />
          <span className="rounded-lg border-2 px-3 py-0.5 text-lg font-black text-white" style={{ borderColor: RED.glow, background: 'rgba(60,8,20,0.8)' }}>
            {boss.plate}
          </span>
          <span className="mt-1 rounded-full bg-black/65 px-3 py-0.5 text-sm font-black text-[#ffe7b8]">
            {trait.icon} {trait.ja} <span lang="en" className="ml-1 text-xs font-bold opacity-75">{trait.en}</span>
          </span>
        </motion.div>
        {/* VS */}
        <div className="pointer-events-none absolute inset-x-0 top-[47%] flex -translate-y-1/2 justify-center">
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
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 380, damping: 13 }}
            style={{ fontSize: 'min(30vw, 128px)', lineHeight: 1 }}
          >
            <LogoText shine={!still}>VS</LogoText>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

/** A speaker's round face, cut from their portrait (NamePlate's), or 💭 for narration. */
const Face = ({ src, px }: { src?: string; px: number }) => (
  <span className="shrink-0 overflow-hidden rounded-full border-[3px] border-[#ffd36a] bg-[#1b1440]" style={{ width: px, height: px }} aria-hidden>
    {src ? <span className="block h-full w-full" style={faceStyle(src, px)} /> : <span className="flex h-full w-full items-center justify-center text-2xl">💭</span>}
  </span>
);

/**
 * とちゅうの お話: the fight stops, a band sweeps in, and the lines are said one
 * at a time (tap to go on). From the second beat the boss is in its phase-2
 * picture, and the band comes in with a shake.
 */
export const BossBeat = ({
  lines,
  cast,
  renderText,
  renderPlain,
  faceOf,
  angry,
  still,
  onDone,
}: {
  lines: readonly BossLine[];
  cast: readonly CastMember[];
  /** A speaker's line (furigana and written-back kanji, or kana). */
  renderText: (text: string) => ReactNode;
  /** 0章's narration in Japanese (kana); the town has none. */
  renderPlain?: (text: string) => ReactNode;
  /** The face to show for a speaker: the boss's own picture as it now stands. */
  faceOf: (speaker: string) => string | undefined;
  angry: boolean;
  still: boolean;
  onDone: () => void;
}) => {
  const [i, setI] = useState(0);
  const [en, setEn] = useState(false);
  useEffect(() => {
    if (angry) sfx.crack();
    else sfx.star(1);
  }, [angry]);
  const line = lines[i];
  const next = () => {
    sfx.tap();
    if (i + 1 < lines.length) {
      setI(i + 1);
      setEn(false);
    } else onDone();
  };
  if (!line) return null;
  const member = line.speaker ? cast.find((c) => c.id === line.speaker) : undefined;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex cursor-pointer flex-col justify-center bg-black/50 px-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={next}
      role="button"
      aria-label="つぎへ"
    >
      <motion.div
        className="mx-auto w-full max-w-md"
        initial={still ? false : { x: '-110%' }}
        animate={still || !angry ? { x: 0 } : { x: [null, 0, -10, 8, -4, 0] }}
        transition={still ? undefined : { type: 'spring', stiffness: 260, damping: 24 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="g-novel-night flex items-start gap-3 rounded-2xl border-2 border-[#ffd36a] px-3 py-3"
            style={{ boxShadow: angry ? '0 0 24px rgba(255,80,80,0.55)' : '0 0 18px rgba(255,211,106,0.4)' }}
            initial={still ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={still ? undefined : { opacity: 0, y: -8 }}
          >
            <Face src={line.speaker ? faceOf(line.speaker) : undefined} px={68} />
            <div className="min-w-0 flex-1">
              {member && <p className="text-sm font-black text-[#ffd36a]">{renderText(member.name)}</p>}
              <p className="text-lg leading-[2] font-black text-white">{line.speaker ? renderText(line.text) : line.text}</p>
              {!line.speaker && line.ja && renderPlain && <p className="text-sm leading-[1.9] font-bold text-white/80">{renderPlain(line.ja)}</p>}
              {en && line.en && (
                <p lang="en" className="mt-1 text-[13px] leading-snug font-bold text-[#bfe3ff]">
                  {line.en}
                </p>
              )}
            </div>
            {line.en && (
              <button
                type="button"
                className="g-pill-night shrink-0 self-end px-2 py-0.5 text-xs font-black"
                onClick={(e) => {
                  e.stopPropagation();
                  setEn((v) => !v);
                }}
              >
                EN
              </button>
            )}
          </motion.div>
        </AnimatePresence>
        <p className="mt-2 text-center text-xs font-bold text-white/70" aria-hidden>
          {lines.length > 1 ? `${i + 1} / ${lines.length} ▶` : '▶'}
        </p>
      </motion.div>
    </motion.div>
  );
};

/**
 * とどめの 一字: the band 「とどめの 一字！」 slams down with the finisher, big, and
 * Nexmax's call under it. Tap (or wait) to write it.
 */
export const FinisherCall = ({
  label,
  finisher,
  line,
  renderText,
  faceOf,
  still,
  onDone,
}: {
  /** とどめの 一字(いちじ)！ in the town, とどめ！ in 0章 (already drawn). */
  label: ReactNode;
  /** The kanji or word, drawn big. */
  finisher: ReactNode;
  line: BossLine;
  renderText: (text: string) => ReactNode;
  faceOf: (speaker: string) => string | undefined;
  still: boolean;
  onDone: () => void;
}) => {
  const finish = useAutoDone(still ? 2600 : 3400, onDone);
  useEffect(() => {
    sfx.fanfare();
  }, []);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-3 px-4"
      style={{ background: 'radial-gradient(circle at 50% 42%, rgba(255,211,106,0.35), rgba(8,6,24,0.82) 62%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={finish}
      role="button"
      aria-label="つぎへ"
    >
      <motion.div
        className="w-full py-2 text-center"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(120,20,30,0.9) 15%, rgba(120,20,30,0.9) 85%, transparent)' }}
        initial={still ? false : { x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <span className="text-[34px] leading-[1.5]">{label}</span>
      </motion.div>
      <motion.div
        className="flex min-h-[140px] min-w-[140px] items-center justify-center rounded-3xl border-4 border-[#ffd36a] bg-[#fffaf0] px-4 text-[#24180d] shadow-[0_0_40px_rgba(255,211,106,0.8)]"
        initial={still ? false : { scale: 3, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 14 }}
      >
        {finisher}
      </motion.div>
      <motion.div
        className="g-novel-night flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-[#ffd36a] px-3 py-2"
        initial={still ? false : { y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <Face src={line.speaker ? faceOf(line.speaker) : undefined} px={52} />
        <p className="text-lg leading-[2] font-black text-white">{renderText(line.text)}</p>
      </motion.div>
    </motion.div>
  );
};

/**
 * The finisher lands: the screen holds its breath (a slow white swell), a
 * pillar of light falls on the boss, and it all goes white before the win.
 */
export const FinisherFlash = ({ still }: { still: boolean }) => {
  useEffect(() => {
    sfx.beam();
    const t = setTimeout(() => sfx.fanfare(), still ? 100 : 700);
    return () => clearTimeout(t);
  }, [still]);
  return (
    <motion.div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {!still && (
        <motion.div
          className="absolute top-0 right-[10%] h-full w-[38%]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,246,200,0.95) 35%, #ffffff 50%, rgba(255,246,200,0.95) 65%, transparent)', filter: 'blur(2px)' }}
          initial={{ scaleY: 0, originY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 1], opacity: [0, 1, 0.9] }}
          transition={{ duration: 0.9, times: [0, 0.45, 1], ease: 'easeOut' }}
        />
      )}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: still ? [0, 0.6, 0] : [0, 0, 0.95, 0] }}
        transition={{ duration: still ? 0.5 : 1.6, times: still ? [0, 0.3, 1] : [0, 0.45, 0.65, 1] }}
      />
    </motion.div>
  );
};
