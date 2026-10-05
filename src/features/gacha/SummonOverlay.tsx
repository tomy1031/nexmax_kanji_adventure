import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import * as sfx from '../../lib/sfx';

/**
 * ひく ときの 演出 (docs/design/16 §5). The pull is already decided when this
 * plays: it only shows it. A glowing circle over the town, one orb of light
 * for each card coming down into it, its colour the card's rarity (silver
 * ★3, gold ★4, rainbow ★5 — the honest hint the card backs give too), then
 * the light bursts and the cards are dealt. スキップ at any time.
 */

const ORB: Record<number, string> = {
  3: 'radial-gradient(circle at 35% 30%, #ffffff, #cfd6e4 45%, #8a93a8 100%)',
  4: 'radial-gradient(circle at 35% 30%, #fffbe0, #ffd36a 45%, #c98a0c 100%)',
  5: 'conic-gradient(from 0deg, #ff8fc1, #ffd36a, #8be0a8, #7fb2ff, #c58bff, #ff8fc1)',
};
const GLOW: Record<number, string> = {
  3: 'rgba(200,215,240,0.7)',
  4: 'rgba(255,205,90,0.8)',
  5: 'rgba(255,150,220,0.85)',
};

export const SummonOverlay = ({ rarities, still, onDone }: { rarities: number[]; still: boolean; onDone: () => void }) => {
  const top = Math.max(...rarities);
  const step = rarities.length > 1 ? 0.14 : 0;
  const fall = 0.65;
  // The orbs land, the circle holds a beat (longer for a ★5), then the light bursts.
  const burstAt = still ? 0.3 : step * (rarities.length - 1) + fall + (top === 5 ? 0.9 : 0.35);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!still) {
      rarities.forEach((r, i) => timers.push(setTimeout(() => sfx.star(Math.min(2, r - 3)), (step * i + fall) * 1000)));
      timers.push(setTimeout(() => (top === 5 ? sfx.fanfare() : sfx.beam()), burstAt * 1000));
    }
    timers.push(setTimeout(finish, (burstAt + (still ? 0 : 0.45)) * 1000));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        initial={{ scale: 1.25, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.9 }}
        transition={{ duration: still ? 0.2 : 0.7, ease: 'easeOut' }}
      />
      {/* The circle's own light, the colour of the best card coming. */}
      <motion.div
        aria-hidden
        className="absolute top-[30%] left-1/2 aspect-square w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${GLOW[top]}, transparent 65%)`, willChange: 'transform, opacity' }}
        animate={still ? { opacity: 0.8 } : { scale: [0.6, 1.05, 0.95, 1.1], opacity: [0, 0.9, 0.7, 1] }}
        transition={{ duration: burstAt, ease: 'easeInOut' }}
      />
      {top === 5 && !still && (
        // A ★5: rainbow rays turn behind the circle before it bursts.
        <motion.div
          aria-hidden
          className="absolute top-[30%] left-1/2 aspect-square w-[160vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'repeating-conic-gradient(from 0deg, rgba(255,143,193,0.35) 0deg 8deg, transparent 8deg 20deg, rgba(127,178,255,0.3) 20deg 28deg, transparent 28deg 40deg)', willChange: 'transform, opacity' }}
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: [0, 0, 1], rotate: 90 }}
          transition={{ duration: burstAt, ease: 'easeIn' }}
        />
      )}
      {!still &&
        rarities.map((r, i) => {
          const n = rarities.length;
          // Spread across the top, all landing on the circle.
          const fromX = n === 1 ? 0 : ((i / (n - 1)) * 2 - 1) * 34;
          return (
            <motion.div
              key={i}
              aria-hidden
              className="absolute top-[30%] left-1/2 aspect-square w-[9vmin] rounded-full"
              style={{ background: ORB[r], boxShadow: `0 0 3vmin ${GLOW[r]}`, marginLeft: '-4.5vmin', marginTop: '-4.5vmin', willChange: 'transform, opacity' }}
              initial={{ x: `${fromX}vw`, y: '-45vh', scale: 0.6, opacity: 0 }}
              animate={{ x: 0, y: 0, scale: [0.6, 1.2, 0.2], opacity: [0, 1, 0] }}
              transition={{ delay: step * i, duration: fall + 0.25, times: [0, 0.75, 1], ease: 'easeIn' }}
            />
          );
        })}
      {/* The burst */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: top === 5 ? 'radial-gradient(circle at 50% 30%, #fff, #ffd6f0 40%, #c58bff)' : top === 4 ? 'radial-gradient(circle at 50% 30%, #fff, #ffe39a)' : '#fff' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: burstAt + 0.45, times: [0, burstAt / (burstAt + 0.45), (burstAt + 0.12) / (burstAt + 0.45), 1] }}
      />
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
