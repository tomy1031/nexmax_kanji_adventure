import { motion } from 'framer-motion';

/**
 * Stars bursting out from a point, or falling like confetti — the gacha's
 * celebrations (docs/design/18 §3: the ★5 and its 「かくてい」). Plain spans
 * moved by transform: no filter (iPhone).
 */

const RAINBOW = ['#ff8fc1', '#ffd36a', '#8be0a8', '#7fb2ff', '#c58bff', '#ffffff'];
const GOLD = ['#ffd36a', '#fff3b0', '#ffb84d', '#ffffff'];

/** A burst of stars from the middle of its box, after `delay` seconds. */
export const StarBurst = ({ n = 14, delay = 0, rainbow = true, reach = 42 }: { n?: number; delay?: number; rainbow?: boolean; reach?: number }) => {
  const colors = rainbow ? RAINBOW : GOLD;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
        const d = reach * (0.7 + ((i * 37) % 30) / 100);
        return (
          <motion.span
            key={i}
            className="absolute top-1/2 left-1/2 leading-none font-black"
            style={{ color: colors[i % colors.length], fontSize: 14 + ((i * 7) % 12), textShadow: '0 0 6px rgba(255,255,255,0.8)', willChange: 'transform, opacity' }}
            initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
            animate={{ x: `${Math.cos(a) * d}vmin`, y: `${Math.sin(a) * d}vmin`, scale: [0.2, 1.3, 0.6], opacity: [0, 1, 0], rotate: 180 }}
            transition={{ delay, duration: 1.1, ease: 'easeOut' }}
          >
            ★
          </motion.span>
        );
      })}
    </div>
  );
};

/** Stars drifting down over the whole screen, over and over. */
export const StarFall = ({ n = 18, rainbow = true }: { n?: number; rainbow?: boolean }) => {
  const colors = rainbow ? RAINBOW : GOLD;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: n }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 leading-none"
          style={{ left: `${(i * 53) % 100}%`, color: colors[i % colors.length], fontSize: 10 + ((i * 5) % 14), willChange: 'transform, opacity' }}
          initial={{ y: '-10vh', opacity: 0, rotate: 0 }}
          animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ delay: (i * 0.37) % 3, duration: 3.2 + ((i * 13) % 20) / 10, repeat: Infinity, ease: 'linear' }}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
};
