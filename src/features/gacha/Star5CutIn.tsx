import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { linesFor } from '../../data/companionLines';
import type { Individual } from '../../data/individuals';
import * as sfx from '../../lib/sfx';

/**
 * A ★5 has come (docs/design/16 §5): the whole screen is the card for a moment —
 * rainbow rays, the picture large, its stars one by one, its name and what it
 * says. A tap goes on.
 */
export const Star5CutIn = ({ card, fresh, showFurigana, still, onClose }: { card: Individual; fresh: boolean; showFurigana: boolean; still: boolean; onClose: () => void }) => {
  useEffect(() => {
    sfx.fanfare();
  }, []);
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`★5 ${card.shortName}`}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: 'radial-gradient(circle at 50% 40%, #3a1f5c, #0d0618 75%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        aria-hidden
        className="absolute top-[40%] left-1/2 aspect-square w-[170vmax] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'repeating-conic-gradient(from 0deg, rgba(255,143,193,0.28) 0deg 7deg, transparent 7deg 15deg, rgba(255,211,106,0.26) 15deg 22deg, transparent 22deg 30deg, rgba(127,178,255,0.26) 30deg 37deg, transparent 37deg 45deg)', willChange: 'transform' }}
        animate={still ? undefined : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />
      <motion.img
        src={assetPath(card.art)}
        alt=""
        aria-hidden
        className="relative max-h-[52dvh] w-auto object-contain"
        style={{ filter: 'drop-shadow(0 0 4vmin rgba(255,180,230,0.9))' }}
        initial={{ scale: still ? 1 : 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
      />
      <p className="relative mt-2 flex gap-1 text-3xl" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            style={{ color: '#ffd36a', textShadow: '0 0 10px #ff8fc1' }}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: still ? 0 : 0.35 + i * 0.12, type: 'spring', stiffness: 400, damping: 14 }}
          >
            ★
          </motion.span>
        ))}
      </p>
      <motion.p
        className="g-outline-text relative mt-1 text-2xl font-black text-white"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: still ? 0 : 0.9 }}
      >
        <RubyText showFurigana={showFurigana}>{card.name}</RubyText>
      </motion.p>
      <motion.p
        className="relative mt-2 rounded-2xl bg-white/85 px-4 py-2 text-center text-sm leading-[1.9] font-bold text-[#2a1a0c]"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: still ? 0 : 1.15 }}
      >
        「<RubyText showFurigana={showFurigana}>{linesFor(card).start}</RubyText>」
      </motion.p>
      {fresh && (
        <motion.span
          className="absolute top-[14%] right-[10%] rounded-xl border-4 border-white bg-[#e2453c] px-3 py-1 text-2xl font-black text-white"
          initial={{ scale: 3, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: -12, opacity: 1 }}
          transition={{ delay: still ? 0 : 1.3, type: 'spring', stiffness: 500, damping: 18 }}
        >
          NEW!
        </motion.span>
      )}
      <p className="relative mt-6 text-xs text-white/70">
        <RubyText showFurigana={showFurigana}>タップで つぎへ</RubyText>
      </p>
    </motion.div>
  );
};

export default Star5CutIn;
