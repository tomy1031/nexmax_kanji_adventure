import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { linesFor } from '../../data/companionLines';
import { kanjiOf } from '../../data/charKanji';
import type { Individual } from '../../data/individuals';
import { WrittenWord } from './WrittenKanji';
import * as sfx from '../../lib/sfx';

/**
 * 字から なかまが 出て くる (docs/design/17 §2.3〜2.5).
 *
 * The paper slip from the capsule flies up and the companion's own character
 * (data/charKanji.ts) writes itself on it in stroke order; its reading comes
 * under it. Then the companion's shadow rises in the light behind the slip,
 * the light bursts, and the companion steps out: large, the character huge
 * behind them, their stars one by one, their name and what they say. A tap
 * goes on. Any tap before that (or スキップ) goes straight to the companion.
 *
 * No filter anywhere (iPhone): glows are gradients, and the shadow is the
 * picture used as a mask over a dark plate.
 */

type Phase = 'fly' | 'write' | 'read' | 'shadow' | 'burst' | 'entry';

/** The light of each rarity: the glow behind the slip, the rim of the shadow. */
const LIGHT: Record<number, { glow: string; rays: string; star: string }> = {
  3: { glow: 'rgba(205,220,245,0.85)', rays: 'rgba(220,230,250,0.16)', star: '#e8eef8' },
  4: { glow: 'rgba(255,205,90,0.9)', rays: 'rgba(255,211,106,0.24)', star: '#ffd36a' },
  5: { glow: 'rgba(255,160,220,0.95)', rays: 'rgba(255,143,193,0.28)', star: '#ffd36a' },
};

export const KanjiReveal = ({
  card,
  fresh,
  note,
  showFurigana,
  still,
  onClose,
}: {
  card: Individual;
  fresh: boolean;
  /** Why this card was certain (the first ticket, the ceiling). */
  note?: string;
  showFurigana: boolean;
  still: boolean;
  onClose: () => void;
}) => {
  const k = kanjiOf(card.char);
  const light = LIGHT[card.rarity];
  const [phase, setPhase] = useState<Phase>(still ? 'entry' : 'fly');
  // The slip's width: big on a phone, not huge on a tablet.
  const [slipW] = useState(() => Math.round(Math.min(window.innerWidth * 0.56, window.innerHeight * 0.3, 250)));

  useEffect(() => {
    const after: Partial<Record<Phase, [Phase, number]>> = {
      fly: ['write', 550],
      read: ['shadow', 700],
      shadow: ['burst', card.rarity === 5 ? 1300 : 900],
      burst: ['entry', 380],
    };
    const step = after[phase];
    if (phase === 'read') sfx.chime();
    if (phase === 'burst') sfx.beam();
    if (phase === 'entry') {
      if (card.rarity === 5) sfx.fanfare();
      else sfx.star(card.rarity === 4 ? 2 : 0);
    }
    if (!step) return;
    const t = setTimeout(() => setPhase(step[0]), step[1]);
    return () => clearTimeout(t);
  }, [phase, card.rarity]);

  const entry = phase === 'entry';
  const tap = () => (entry ? onClose() : setPhase('entry'));
  const slipShown = phase === 'fly' || phase === 'write' || phase === 'read' || phase === 'shadow';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`★${card.rarity} ${card.shortName}`}
      className="fixed inset-0 z-[60] overflow-hidden"
      style={{ background: '#0d0618' }}
      // No fade in: it takes over from the capsules (or the dealt cards) at once, with nothing showing through.
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={tap}
    >
      {!entry && (
        <>
          <img src={assetPath('img/gacha/portal.webp')} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-50" />
          {/* The light behind the slip: it swells as the shadow comes. */}
          <motion.div
            aria-hidden
            className="absolute top-[36%] left-1/2 aspect-square w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: `radial-gradient(circle, ${light.glow}, transparent 62%)`, willChange: 'transform, opacity' }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={phase === 'shadow' || phase === 'burst' ? { scale: 1.25, opacity: 1 } : { scale: 0.75, opacity: 0.75 }}
            transition={{ duration: phase === 'shadow' ? 0.8 : 0.5, ease: 'easeOut' }}
          />
        </>
      )}

      {/* The companion's shadow, rising in the light behind the slip. */}
      {(phase === 'shadow' || phase === 'burst') && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-[3%] h-[66dvh]"
          style={{
            background: '#1a0f2e',
            WebkitMaskImage: `url(${assetPath(card.art)})`,
            maskImage: `url(${assetPath(card.art)})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            willChange: 'transform, opacity',
          }}
          initial={{ opacity: 0, scale: 0.86, y: 30 }}
          animate={{ opacity: 0.92, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}

      {/* The slip, and the character writing itself on it. */}
      {slipShown && (
        <motion.div
          aria-hidden
          // In front of the circle of light in the picture.
          className="absolute top-[36%] left-1/2"
          style={{ width: slipW, marginLeft: -slipW / 2, marginTop: -slipW * 0.78, willChange: 'transform, opacity' }}
          // Out of the capsule that just split, a little above the middle.
          initial={{ y: '-6vh', scale: 0.15, rotate: -25, opacity: 0 }}
          animate={phase === 'shadow' ? { y: 0, scale: 0.62, rotate: 0, opacity: 0.9 } : { y: 0, scale: 1, rotate: 0, opacity: 1 }}
          transition={phase === 'fly' ? { type: 'spring', stiffness: 170, damping: 17 } : { duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="relative" style={{ height: slipW * 1.56 }}>
            <img src={assetPath('img/gacha/slip.webp')} alt="" className="absolute inset-0 h-full w-full object-contain" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {phase !== 'fly' && <WrittenWord word={k.kanji} size={Math.round(slipW * 0.68)} still={still} onDone={() => setPhase((p) => (p === 'write' ? 'read' : p))} />}
            </div>
          </div>
          {(phase === 'read' || phase === 'shadow') && (
            <motion.p
              className="g-outline-text mt-1 text-center text-3xl font-black text-white"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: phase === 'shadow' ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {k.reading}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* The light bursts. */}
      {phase === 'burst' && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 36%, #fff, ${light.glow} 55%, #fff)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {entry && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ background: `radial-gradient(circle at 50% 40%, ${card.rarity === 5 ? '#3a1f5c' : card.rarity === 4 ? '#4a3212' : '#26314a'}, #0d0618 75%)` }}
          initial={{ opacity: still ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {card.rarity >= 4 && (
            <motion.div
              aria-hidden
              className="absolute top-[40%] left-1/2 aspect-square w-[170vmax] -translate-x-1/2 -translate-y-1/2"
              style={{
                background: `repeating-conic-gradient(from 0deg, ${light.rays} 0deg 7deg, transparent 7deg 15deg${card.rarity === 5 ? ', rgba(127,178,255,0.24) 15deg 22deg, transparent 22deg 30deg' : ''})`,
                willChange: 'transform',
              }}
              animate={still ? undefined : { rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {/* The character, huge, behind them. Its reading is on the result card. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-[36%] left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none font-black"
            // Two characters stand one above the other, as on the slip.
            style={{ fontSize: k.kanji.length > 1 ? 'min(52vw, 30dvh)' : 'min(92vw, 54dvh)', color: 'rgba(255,236,190,0.17)', writingMode: k.kanji.length > 1 ? 'vertical-rl' : undefined }}
            initial={{ scale: still ? 1 : 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {k.kanji}
          </motion.span>
          <div aria-hidden className="absolute top-[34%] left-1/2 aspect-square w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${light.glow}, transparent 66%)`, opacity: 0.55 }} />
          {note && (
            <p className="g-chip g-chip-gold relative mb-2 text-xs">
              <RubyText showFurigana={showFurigana}>{note}</RubyText>
            </p>
          )}
          <motion.img
            src={assetPath(card.art)}
            alt=""
            aria-hidden
            className="relative max-h-[50dvh] w-auto object-contain"
            initial={{ scale: still ? 1 : 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 190, damping: 17 }}
          />
          <p className="relative mt-2 flex gap-1 text-3xl" aria-hidden>
            {Array.from({ length: card.rarity }, (_, i) => (
              <motion.span
                key={i}
                style={{ color: light.star, textShadow: card.rarity === 5 ? '0 0 10px #ff8fc1' : '0 0 8px rgba(0,0,0,0.5)' }}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: still ? 0 : 0.3 + i * 0.12, type: 'spring', stiffness: 400, damping: 14 }}
              >
                ★
              </motion.span>
            ))}
          </p>
          <motion.p
            className="g-outline-text relative mt-1 text-2xl font-black text-white"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: still ? 0 : 0.8 }}
          >
            <RubyText showFurigana={showFurigana}>{card.name}</RubyText>
          </motion.p>
          <motion.p
            className="relative mt-2 rounded-2xl bg-white/90 px-4 py-2 text-center text-sm leading-[1.9] font-bold text-[#2a1a0c]"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: still ? 0 : 1.05 }}
          >
            「<RubyText showFurigana={showFurigana}>{linesFor(card).start}</RubyText>」
          </motion.p>
          {fresh && (
            <motion.span
              className="absolute top-[12%] right-[8%] rounded-xl border-4 border-white bg-[#e2453c] px-3 py-1 text-2xl font-black text-white"
              initial={{ scale: 3, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: 1 }}
              transition={{ delay: still ? 0 : 1.2, type: 'spring', stiffness: 500, damping: 18 }}
            >
              NEW!
            </motion.span>
          )}
          <p className="relative mt-6 text-xs text-white/70">
            <RubyText showFurigana={showFurigana}>タップで つぎへ</RubyText>
          </p>
        </motion.div>
      )}

      {!entry && (
        <button
          type="button"
          data-tap
          className="absolute right-4 bottom-[max(16px,env(safe-area-inset-bottom))] rounded-full border-2 border-white/70 bg-black/40 px-4 py-1.5 text-sm font-black text-white"
          onClick={(e) => {
            e.stopPropagation();
            setPhase('entry');
          }}
        >
          スキップ ▶
        </button>
      )}
    </motion.div>
  );
};

export default KanjiReveal;
