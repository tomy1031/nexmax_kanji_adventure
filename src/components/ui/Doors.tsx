import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GiCog } from 'react-icons/gi';
import { useStillDoors } from '../../hooks/useStillDoors';

/**
 * Changing scene the way a game does: a pair of doors closes over what is
 * being left, the next scene is put in behind them, and they open on it once
 * its pictures are ready — instead of a page blanking and loading
 * (2026-09-30「webアプリではなくゲームなので…ワンページのように スムーズに」).
 * App.tsx uses them between screens; PhaseDoors between the parts of one
 * episode (お話 → 書く → じゅんび → たたかい, 2026-10-02「急に 切り替わって？」).
 *
 * Only the doors move, by transform, with no filter (moving filters are what
 * made iPhone and iPad heavy, 2026-09-26). The scenes are never transformed:
 * a transform would become the containing block for their fixed backdrops and
 * tab bars. With reduced motion the doors become a quick fade.
 */
const CLOSE = 0.16;
const OPEN = 0.26;
/** The longest the doors wait for the next scene's pictures. */
const WAIT_MS = 200;

const doorVariants = (side: -1 | 1) => ({
  shut: { x: '0%', visibility: 'visible' as const, transition: { duration: CLOSE, ease: 'easeIn' as const } },
  open: { x: `${side * 101}%`, transition: { duration: OPEN, ease: 'easeOut' as const }, transitionEnd: { visibility: 'hidden' as const } },
});
const fadeVariants = {
  shut: { opacity: 1, visibility: 'visible' as const, transition: { duration: 0.12 } },
  open: { opacity: 0, transition: { duration: 0.18 }, transitionEnd: { visibility: 'hidden' as const } },
};
const emblemVariants = {
  shut: { opacity: 1, transition: { duration: CLOSE } },
  open: { opacity: 0, transition: { duration: OPEN * 0.5 } },
};

/** Deep night blue with lamplight at the seam and brass on the edge. */
const DOOR_BG =
  'radial-gradient(ellipse 60% 45% at var(--seam) 50%, rgba(255,170,70,0.22) 0%, rgba(255,170,70,0) 70%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 16px), linear-gradient(180deg, #1c1740 0%, #120e2b 60%, #0b0920 100%)';

const Curtain = ({ still }: { still: boolean }) =>
  still ? (
    <motion.div aria-hidden variants={fadeVariants} className="fixed inset-0 z-[200] bg-[#120e2b]" />
  ) : (
    <>
      <motion.div
        aria-hidden
        variants={doorVariants(-1)}
        className="fixed inset-y-0 left-0 z-[200] w-1/2"
        style={{ background: DOOR_BG, ['--seam' as string]: '100%', boxShadow: 'inset -4px 0 0 #d9a44c, inset -10px 0 0 rgba(0,0,0,0.35)', willChange: 'transform' }}
      />
      <motion.div
        aria-hidden
        variants={doorVariants(1)}
        className="fixed inset-y-0 right-0 z-[200] w-1/2"
        style={{ background: DOOR_BG, ['--seam' as string]: '0%', boxShadow: 'inset 4px 0 0 #d9a44c, inset 10px 0 0 rgba(0,0,0,0.35)', willChange: 'transform' }}
      />
      <motion.div
        aria-hidden
        variants={emblemVariants}
        className="pointer-events-none fixed top-1/2 left-1/2 z-[201] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[#d9a44c] text-[#ffcf6e]"
        style={{ background: 'radial-gradient(circle, #3a2a52 0%, #16122e 75%)' }}
      >
        <GiCog className="h-14 w-14" />
      </motion.div>
    </>
  );

/**
 * One scene between the doors, for an AnimatePresence with mode="wait": it
 * opens once its pictures are decoded (or after WAIT_MS), and closes as it
 * leaves. `instant` skips the doors on the way in.
 */
export const DoorPanel = ({ instant, still, onShown, children }: { instant: boolean; still: boolean; onShown?: () => void; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(instant);

  useEffect(() => {
    onShown?.();
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) return;
    let live = true;
    const pictures = Array.from(ref.current?.querySelectorAll('img') ?? []);
    const loaded = Promise.all(pictures.map((img) => img.decode().catch(() => undefined)));
    const cap = new Promise((resolve) => setTimeout(resolve, WAIT_MS));
    void Promise.race([loaded, cap]).then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, [ready]);

  return (
    <motion.div ref={ref} initial="shut" animate={ready ? 'open' : 'shut'} exit="shut" variants={{ shut: { opacity: 1 }, open: { opacity: 1 } }}>
      {children}
      <Curtain still={still} />
    </motion.div>
  );
};

/**
 * The parts of one episode, each behind the doors. The part an episode opens
 * on comes in with the screen's own doors, so it gets none of its own.
 */
export const PhaseDoors = ({ phase, children }: { phase: string; children: ReactNode }) => {
  const still = useStillDoors();
  const [first] = useState(phase);
  const [moved, setMoved] = useState(false);
  if (!moved && phase !== first) setMoved(true);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <DoorPanel key={phase} instant={!moved && phase === first} still={still}>
        {children}
      </DoorPanel>
    </AnimatePresence>
  );
};
