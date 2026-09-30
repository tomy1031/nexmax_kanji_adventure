import { AnimatePresence, motion } from 'framer-motion';
import { FLOW_MS, IMPACT_MS, beamBetween, type Point } from '../../lib/lightFlow';

/**
 * 文字が 消えた 町 — the fight (08 §3.6): the light of the character just
 * written rises from the board into Nexmax's chest, and he fires it at the
 * opponent. Drawn over the whole screen, so it can cross from the board below
 * to the field above.
 *
 * Transform and opacity only, over pre-drawn gradients — no filters (iPhone,
 * 2026-09-26). With reduced motion nothing travels: the opponent just flashes.
 */

export interface Flow {
  /** The turn it belongs to; a new write draws a new flow. */
  n: number;
  from: Point;
  hero: Point;
  to: Point;
  /** 0..1, from lib/lightFlow lightOf. */
  light: number;
}

const s = (ms: number) => ms / 1000;

export const LightFlow = ({ flow, still }: { flow: Flow | null; still: boolean }) => (
  <AnimatePresence>
    {flow && (
      <div key={flow.n} aria-hidden className="pointer-events-none fixed inset-0 z-[35]">
        {!still && <Travel flow={flow} />}
        {/* 当たった ところ */}
        <motion.div
          className="absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: flow.to.x,
            top: flow.to.y,
            background: 'radial-gradient(circle, rgba(255,250,230,0.95) 0%, rgba(255,200,100,0.6) 30%, rgba(255,150,60,0) 68%)',
            willChange: 'transform, opacity',
          }}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 0.3, 1.2 + flow.light * 0.4], opacity: [0, 1, 0] }}
          transition={{ duration: s(still ? 420 : FLOW_MS.fade + 200), times: [0, 0.15, 1], delay: still ? 0 : s(IMPACT_MS) }}
        />
      </div>
    )}
  </AnimatePresence>
);

const Travel = ({ flow }: { flow: Flow }) => {
  const orb = 26 + flow.light * 22;
  const beam = beamBetween(flow.hero, flow.to);
  const rise = FLOW_MS.rise + FLOW_MS.charge;
  return (
    <>
      {/* 光の 玉: 書く 面 → ネクマックスの 胸 */}
      <motion.div
        className="absolute top-0 left-0 rounded-full"
        style={{
          width: orb,
          height: orb,
          marginLeft: -orb / 2,
          marginTop: -orb / 2,
          background: 'radial-gradient(circle, #fffaf0 0%, #ffd98a 38%, rgba(255,170,60,0.55) 62%, rgba(255,150,60,0) 72%)',
          willChange: 'transform, opacity',
        }}
        initial={{ x: flow.from.x, y: flow.from.y, scale: 0.4, opacity: 0 }}
        animate={{
          x: [flow.from.x, flow.hero.x, flow.hero.x],
          y: [flow.from.y, flow.hero.y, flow.hero.y],
          scale: [0.4, 1, 1.35],
          opacity: [0.2, 1, 0],
        }}
        transition={{ duration: s(rise), times: [0, FLOW_MS.rise / rise, 1], ease: 'easeOut' }}
      />
      {/* 光線: ネクマックス → あいて. The outer box turns it toward the
          opponent; the inner one grows along it (turning and growing on one
          element would stretch it sideways on screen). */}
      <div
        className="absolute"
        style={{
          left: flow.hero.x,
          top: flow.hero.y - 5,
          width: beam.length,
          height: 10,
          transformOrigin: '0 50%',
          transform: `rotate(${beam.angle}deg)`,
        }}
      >
        <motion.div
          className="h-full w-full origin-left rounded-full"
          style={{
            background: 'linear-gradient(90deg, rgba(255,248,225,1) 0%, rgba(255,205,110,0.95) 55%, rgba(255,160,60,0.2) 100%)',
            boxShadow: '0 0 12px rgba(255,190,90,0.9)',
            willChange: 'transform, opacity',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={{
            duration: s(FLOW_MS.beam + FLOW_MS.fade),
            times: [0, FLOW_MS.beam / (FLOW_MS.beam + FLOW_MS.fade), 1],
            delay: s(rise),
            ease: 'easeOut',
          }}
        />
      </div>
    </>
  );
};

export default LightFlow;
