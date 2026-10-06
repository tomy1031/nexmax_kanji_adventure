import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import * as sfx from '../../lib/sfx';

/**
 * ガチャ開始 → カプセル (docs/design/17 §2.1〜2.2, §3.1). The pull is already
 * decided when this plays: it only shows it.
 *
 * The machine from the map stands in the glowing square at night. Nexmax
 * turns its crank, the machine rattles, and a capsule rolls out of its
 * mouth (ten, one after another, for ten pulls). A capsule's colour is its
 * card's rarity — silver ★3, gold ★4, rainbow ★5, the same honest hint the
 * card backs give — and a ★5 gets its banner before anything opens. Then the
 * capsules shake and split in two, and the light goes on to the cards
 * (KanjiReveal for one, the dealt cards for ten). スキップ at any time.
 */

/** Where things are on the machine picture (img/gacha/machine.webp, 452 × 512), as fractions of it. */
const MACHINE = { w: 452, h: 512, grip: [0.93, 0.52], mouth: [0.285, 0.83] } as const;
/** Where Nexmax's hands meet on his picture (img/chara/naniwa/nexmax_crank.webp, 768 × 945), and his height against the machine's. */
const NEXMAX = { aspect: 768 / 945, hands: [0.1, 0.43], height: 0.7 } as const;
/**
 * Where each capsule splits: the middle of its brass band, as a fraction of
 * the square box it is drawn in (the pictures are a little wider than tall).
 */
const SPLIT: Record<number, number> = { 3: 0.52, 4: 0.545, 5: 0.53 };
const GLOW: Record<number, string> = {
  3: 'rgba(205,220,245,0.9)',
  4: 'rgba(255,205,90,0.95)',
  5: 'rgba(255,150,220,0.95)',
};

/** The timeline, in seconds. */
const CRANK = 0.35;
const OUT = CRANK + 1.05;

export const SummonOverlay = ({ rarities, still, showFurigana, onDone }: { rarities: number[]; still: boolean; showFurigana: boolean; onDone: () => void }) => {
  const n = rarities.length;
  const top = Math.max(...rarities);
  const step = n > 1 ? 0.11 : 0;
  const landed = OUT + step * (n - 1) + 0.7;
  // A ★5 waits for its banner; every capsule shakes before it opens.
  const openAt = landed + (top === 5 ? 1.1 : top === 4 ? 0.6 : 0.35);
  const [open, setOpen] = useState(false);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  // Sizes from the screen: the machine as large as fits under the capsules.
  const [size] = useState(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const machine = Math.min(vw * 0.58, vh * 0.33, 320);
    const capsule = n > 1 ? Math.min(vw * 0.15, vh * 0.085, 76) : Math.min(vw * 0.36, vh * 0.2, 170);
    return { machine, capsule };
  });
  const mw = size.machine;
  const mh = (mw * MACHINE.h) / MACHINE.w;
  const nh = mh * NEXMAX.height;
  const nw = nh * NEXMAX.aspect;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (s: number, f: () => void) => timers.push(setTimeout(f, s * 1000));
    if (still) {
      at(0.3, finish);
    } else {
      [0.15, 0.5, 0.85].forEach((s) => at(CRANK + s, () => sfx.tap()));
      rarities.forEach((r, i) => at(OUT + step * i + 0.55, () => sfx.star(Math.min(2, r - 3))));
      if (top === 5) at(landed + 0.1, () => sfx.fanfare());
      at(openAt, () => {
        setOpen(true);
        sfx.beam();
      });
      at(openAt + 0.5, finish);
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Where capsule i comes to rest, from the centre of the screen. */
  const restOf = (i: number): { x: number; y: number } => {
    if (n === 1) return { x: 0, y: -window.innerHeight * 0.12 };
    const row = Math.floor(i / 5);
    const col = i % 5;
    const gap = size.capsule * 1.18;
    return { x: (col - 2) * gap, y: -window.innerHeight * 0.26 + row * gap * 1.1 };
  };
  // The machine and Nexmax stand together in the middle; the machine's mouth, from the centre of the screen.
  const machineLeft = window.innerWidth / 2 - mw * 0.755;
  const machineTop = window.innerHeight * 0.9 - mh;
  const mouth = { x: machineLeft + MACHINE.mouth[0] * mw - window.innerWidth / 2, y: machineTop + MACHINE.mouth[1] * mh - window.innerHeight / 2 };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={finish}
    >
      <motion.img
        src={assetPath('img/gacha/portal.webp')}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.85 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* The light of the best card coming, swelling as the capsules land. */}
      <motion.div
        aria-hidden
        className="absolute top-[34%] left-1/2 aspect-square w-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${GLOW[top]}, transparent 62%)`, willChange: 'transform, opacity' }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: open ? 1 : [0, 0, 0.55], scale: open ? 1.4 : 1 }}
        transition={{ duration: open ? 0.35 : landed, ease: 'easeOut' }}
      />

      {/* The machine, and Nexmax at its crank. */}
      <div className="absolute" style={{ left: machineLeft, top: machineTop, width: mw, height: mh }} aria-hidden>
        <motion.img
          src={assetPath('img/gacha/machine.webp')}
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{ transformOrigin: '50% 100%', willChange: 'transform' }}
          animate={still ? undefined : { rotate: [0, -1.6, 1.6, -1.6, 1.6, -1, 0], y: [0, -3, 0, -3, 0, -2, 0] }}
          transition={{ delay: CRANK, duration: 1.05, ease: 'easeInOut' }}
        />
        <motion.img
          src={assetPath('img/chara/naniwa/nexmax_crank.webp')}
          alt=""
          className="absolute"
          style={{ width: nw, height: nh, left: MACHINE.grip[0] * mw - NEXMAX.hands[0] * nw, top: MACHINE.grip[1] * mh - NEXMAX.hands[1] * nh, transformOrigin: '30% 90%', willChange: 'transform' }}
          animate={still ? undefined : { rotate: [0, -7, 0, -7, 0, -7, 0], x: [0, -5, 0, -5, 0, -5, 0] }}
          transition={{ delay: CRANK, duration: 1.05, ease: 'easeInOut' }}
        />
      </div>

      {/* The capsules: out of the mouth, up to where they wait, then split. */}
      {!still &&
        rarities.map((r, i) => {
          const rest = restOf(i);
          const c = size.capsule;
          const src = assetPath(`img/gacha/capsule_${r}.webp`);
          const split = SPLIT[r] * 100;
          const shake = r === 5 ? 9 : r === 4 ? 6 : 3;
          return (
            <motion.div
              key={i}
              aria-hidden
              className="absolute top-1/2 left-1/2"
              style={{ width: c, height: c, marginLeft: -c / 2, marginTop: -c / 2, willChange: 'transform, opacity' }}
              initial={{ x: mouth.x, y: mouth.y, scale: 0.3, opacity: 0 }}
              animate={{
                x: [mouth.x, (mouth.x + rest.x) / 2, rest.x],
                y: [mouth.y, Math.min(mouth.y, rest.y) - c * 1.2, rest.y],
                scale: [0.3, 0.8, 1],
                opacity: [0, 1, 1],
              }}
              transition={{ delay: OUT + step * i, duration: 0.7, ease: 'easeOut' }}
            >
              {/* The wait: a shake, harder for a rarer one. */}
              <motion.div
                className="relative h-full w-full"
                animate={{ rotate: [0, -shake, shake, -shake, shake, 0] }}
                transition={{ delay: landed, duration: openAt - landed, ease: 'easeInOut' }}
              >
                <motion.img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ clipPath: `inset(0 0 ${100 - split}% 0)` }}
                  animate={open ? { y: -c * 0.7, x: -c * 0.25, rotate: -35, opacity: 0 } : undefined}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ clipPath: `inset(${split}% 0 0 0)` }}
                  animate={open ? { y: c * 0.6, x: c * 0.15, rotate: 20, opacity: 0 } : undefined}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {open && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: `radial-gradient(circle, #fff, ${GLOW[r]} 35%, transparent 68%)` }}
                    initial={{ scale: 0.2, opacity: 1 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                )}
              </motion.div>
            </motion.div>
          );
        })}

      {/* ★5: its banner, before anything opens. */}
      {top === 5 && !still && (
        <motion.p
          className="g-outline-text absolute inset-x-0 top-[52%] text-center text-4xl font-black text-white"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(208,86,122,0.85) 20%, rgba(197,139,255,0.85) 80%, transparent)', paddingBlock: 6 }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={open ? { x: '100%', opacity: 0 } : { x: 0, opacity: 1 }}
          transition={{ delay: open ? 0 : landed, duration: 0.35, ease: 'easeOut' }}
        >
          <RubyText showFurigana={showFurigana}>★5 かくてい！</RubyText>
        </motion.p>
      )}

      <button
        type="button"
        data-tap
        className="absolute right-4 bottom-[max(16px,env(safe-area-inset-bottom))] rounded-full border-2 border-white/70 bg-black/40 px-4 py-1.5 text-sm font-black text-white"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        スキップ ▶
      </button>
    </motion.div>
  );
};

export default SummonOverlay;
