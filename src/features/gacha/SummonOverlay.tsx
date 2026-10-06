import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import * as sfx from '../../lib/sfx';
import { StarBurst } from './Sparkles';

/**
 * ことばの 本 → カード (docs/design/18 §3). The pull is already decided when
 * this plays: it only shows it.
 *
 * The book of words stands shut in the glowing square at night, Nexmax
 * beside it pointing at the cord hanging from its clasp: 「ひもを 引いて！」
 * (2026-10-06「引く時の演出は欲しい」). Pulled down (or a tap), the book flies
 * open, its light rises, and the cards fly out of its pages — one, or ten
 * into two rows — face down. A card's back is its
 * rarity (silver ★3, gold ★4, rainbow ★5): the honest hint, before anything
 * turns, and a ★5 gets its banner. Then each card comes out by itself
 * (KanjiReveal). スキップ at any time.
 */

/** Where the cards leave the book picture (img/gacha/book.webp, 463 × 512): the middle of its open pages. */
const BOOK = { w: 463, h: 512, pages: [0.5, 0.36] } as const;
const GLOW: Record<number, string> = {
  3: 'rgba(205,220,245,0.9)',
  4: 'rgba(255,205,90,0.95)',
  5: 'rgba(255,150,220,0.95)',
};

/** The timeline, in seconds: the book lights, then the cards fly. */
const LIGHT_UP = 0.3;
const OUT = 1.0;
const FLY = 0.6;

export const SummonOverlay = ({ rarities, still, showFurigana, onDone }: { rarities: number[]; still: boolean; showFurigana: boolean; onDone: () => void }) => {
  const n = rarities.length;
  const top = Math.max(...rarities);
  const step = n > 1 ? 0.09 : 0;
  const landed = OUT + step * (n - 1) + FLY;
  // 確定演出: every ★5, and a single pull's ★4 (ten always hold a ★4).
  const confirm = top === 5 || (top === 4 && n === 1);
  const confirmFor = top === 5 ? 1.9 : 1.2;
  const doneAt = landed + (confirm ? confirmFor : 0.45);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  /** 引く: the player pulls the bookmark's cord (or taps); the book opens and everything after counts from then. */
  const [pulled, setPulled] = useState(false);
  const pull = () => {
    if (pulled) return;
    sfx.tap();
    setPulled(true);
  };

  const [size] = useState(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const book = Math.min(vw * 0.6, vh * 0.33, 320);
    // One card the size KanjiReveal shows it at, so it carries straight on.
    const card = n > 1 ? Math.min(vw * 0.16, vh * 0.09, 78) : Math.round(Math.min(vw * 0.56, vh * 0.3, 240));
    return { vw, vh, book, card };
  });
  const bw = size.book;
  const bh = (bw * BOOK.h) / BOOK.w;
  // The book and Nexmax stand together in the middle: he stands at its right, overlapping it a little.
  const bookLeft = size.vw / 2 - bw * 0.7;
  const bookTop = size.vh * 0.93 - bh;
  const from = { x: bookLeft + BOOK.pages[0] * bw - size.vw / 2, y: bookTop + BOOK.pages[1] * bh - size.vh / 2 };

  useEffect(() => {
    if (!pulled) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (s: number, f: () => void) => timers.push(setTimeout(f, s * 1000));
    // The same steps with 動きを 少なく too — only gentler (2026-10-06: it used to skip them all).
    at(LIGHT_UP, () => sfx.chime());
    rarities.forEach((r, i) => at(OUT + step * i, () => sfx.star(Math.min(2, r - 3))));
    if (top === 5) at(landed + 0.05, () => sfx.fanfare());
    else if (confirm) at(landed + 0.05, () => sfx.chime());
    at(doneAt, finish);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulled]);

  /** Where card i comes to rest, from the middle of the screen. */
  const restOf = (i: number): { x: number; y: number } => {
    // One: where KanjiReveal holds it (38% down).
    if (n === 1) return { x: 0, y: -size.vh * 0.12 };
    const row = Math.floor(i / 5);
    const col = i % 5;
    const c = size.card;
    return { x: (col - 2) * c * 1.12, y: -size.vh * 0.3 + row * c * 1.65 };
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      // The screen shakes when a ★5 is told.
      animate={pulled && confirm && !still ? { opacity: 1, x: [0, 0, -10, 9, -7, 5, -3, 0] } : { opacity: 1 }}
      transition={pulled && confirm && !still ? { x: { delay: landed, duration: 0.5 }, opacity: { duration: 0.3 } } : { duration: 0.3 }}
      exit={{ opacity: 0 }}
      // Before the pull a tap anywhere pulls; after it, a tap skips.
      onClick={pulled ? finish : pull}
    >
      <motion.img
        src={assetPath('img/gacha/portal.webp')}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* The light of the best card coming, swelling as the cards fly. */}
      {pulled && (
      <motion.div
        aria-hidden
        className="absolute top-[30%] left-1/2 aspect-square w-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${GLOW[top]}, transparent 62%)`, willChange: 'opacity' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: still ? 0.5 : [0, 0, 0.6] }}
        transition={{ duration: landed, ease: 'easeOut' }}
      />
      )}

      {/* The book, its light rising, and Nexmax beside it. */}
      <div className="absolute" style={{ left: bookLeft, top: bookTop, width: bw, height: bh }}>
        <div aria-hidden className="absolute inset-[-12%] rounded-full" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,214,120,0.55), transparent 62%)' }} />
        {!pulled ? (
          <>
            {/* Shut, its light leaking: the cord hangs from its clasp, waiting to be pulled. */}
            <motion.img
              src={assetPath('img/gacha/book_closed.webp')}
              alt=""
              aria-hidden
              className="absolute inset-x-0 bottom-0 w-full"
              style={{ transformOrigin: '50% 100%', willChange: 'transform' }}
              animate={still ? undefined : { scale: [1, 1.015, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.button
              type="button"
              aria-label="ひもを 引く"
              data-tap
              className="absolute touch-none"
              style={{ left: bw * 0.5 - bw * 0.07, top: bh - bw * 0.58, width: bw * 0.14, height: bw * 0.5 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: bw * 0.35 }}
              dragElastic={0.25}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.y > bw * 0.12) pull();
              }}
              onClick={(e) => {
                e.stopPropagation();
                pull();
              }}
              animate={still ? undefined : { rotate: [-3, 3, -3] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* The cord: red silk with gold edges, and a golden tassel. */}
              <span aria-hidden className="absolute top-0 left-1/2 h-[78%] w-[42%] -translate-x-1/2 rounded-b-sm" style={{ background: 'linear-gradient(90deg, #e8a317, #d8323c 18%, #ff5a62 50%, #d8323c 82%, #e8a317)' }} />
              <span aria-hidden className="absolute bottom-[8%] left-1/2 aspect-square w-[78%] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #fff3b0, #ffd36a 45%, #b8780c)', boxShadow: '0 0 12px rgba(255,214,110,0.9)' }} />
              <span aria-hidden className="absolute bottom-0 left-1/2 h-[12%] w-[60%] -translate-x-1/2 rounded-b-md" style={{ background: 'repeating-linear-gradient(90deg, #ffd36a 0 2px, #c98a0c 2px 4px)' }} />
            </motion.button>
            <motion.span
              aria-hidden
              className="pointer-events-none absolute text-3xl"
              style={{ left: bw * 0.5 + bw * 0.08, top: bh - bw * 0.3 }}
              animate={still ? undefined : { y: [0, 16, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              👇
            </motion.span>
          </>
        ) : (
          <>
            <motion.div
              aria-hidden
              className="absolute left-1/2 w-[70%] -translate-x-1/2 rounded-full"
              style={{ bottom: bh * 0.55, height: size.vh * 0.6, background: 'linear-gradient(0deg, rgba(255,226,150,0.85), rgba(255,226,150,0))', willChange: 'opacity, transform', transformOrigin: '50% 100%' }}
              initial={{ opacity: 0, scaleY: 0.2 }}
              animate={still ? { opacity: 0.5, scaleY: 1 } : { opacity: [0, 0.9, 0.55], scaleY: [0.2, 1, 1] }}
              transition={{ delay: LIGHT_UP, duration: 0.9, ease: 'easeOut' }}
            />
            <motion.img
              src={assetPath('img/gacha/book.webp')}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full"
              style={{ transformOrigin: '50% 100%', willChange: 'transform' }}
              initial={still ? { opacity: 0 } : { scaleY: 0.85, opacity: 0 }}
              animate={still ? { opacity: 1 } : { scaleY: [0.85, 1.08, 1, 1.03, 1], opacity: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
            {/* The cover flies open: a flash of the page light. */}
            {!still && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-[-30%] rounded-full"
                style={{ background: 'radial-gradient(circle at 50% 45%, #fff, rgba(255,226,150,0.8) 30%, transparent 62%)' }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 1.5] }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            )}
          </>
        )}
        <motion.img
          key={pulled ? 'smile' : 'guide'}
          src={assetPath(pulled ? 'img/chara/naniwa/nexmax_smile.webp' : 'img/chara/naniwa/nexmax_guide.webp')}
          alt=""
          aria-hidden
          className="pointer-events-none absolute"
          style={{ height: bh * 0.66, width: 'auto', left: bw * 0.8, bottom: -bh * 0.02, willChange: 'transform' }}
          initial={{ y: pulled ? 0 : 10, opacity: pulled ? 1 : 0, scale: pulled ? 1.08 : 1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
        {!pulled && (
          <motion.p
            className="pointer-events-none absolute rounded-2xl border-2 border-[#2f8fe0] bg-white px-3 py-1.5 text-center text-[13px] leading-snug font-black whitespace-nowrap text-[#1b4f8a] shadow-md"
            style={{ left: bw * 0.62, bottom: bh * 0.78 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <RubyText showFurigana={showFurigana}>ひもを 引(ひ)いて！</RubyText>
          </motion.p>
        )}
      </div>

      {/* The cards, face down, out of the pages to where they wait. */}
      {pulled &&
        rarities.map((r, i) => {
          const rest = restOf(i);
          const c = size.card;
          return (
            <motion.img
              key={i}
              src={assetPath(`img/gacha/card_back_${r}.webp`)}
              alt=""
              aria-hidden
              className="absolute top-1/2 left-1/2"
              style={{ width: c, height: c * 1.5, marginLeft: -c / 2, marginTop: -c * 0.75, willChange: 'transform, opacity', boxShadow: r >= 4 ? `0 0 ${c * 0.25}px ${GLOW[r]}` : undefined, borderRadius: c * 0.06 }}
              // 動きを 少なく: they appear where they wait, not flying.
              initial={still ? { x: rest.x, y: rest.y, opacity: 0 } : { x: from.x, y: from.y, scale: 0.2, rotate: -40, opacity: 0 }}
              animate={still ? { x: rest.x, y: rest.y, opacity: 1 } : { x: rest.x, y: rest.y, scale: 1, rotate: [-40, 200, 360], opacity: 1 }}
              transition={{ delay: OUT + step * i, duration: FLY, ease: 'easeOut' }}
            />
          );
        })}

      {/* 確定演出: a ★5 (or one pull's ★4) is said out loud before anything turns — honest, and loud. */}
      {pulled && confirm && (
        <>
          {/* The light flashes the card's colour, the screen shakes. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: top === 5 ? 'linear-gradient(135deg, #ff8fc1, #ffd36a, #8be0a8, #7fb2ff, #c58bff)' : 'radial-gradient(circle, #fff3b0, #e8a317)' }}
            initial={{ opacity: 0 }}
            // 動きを 少なく: one soft glow, no flashing.
            animate={still ? { opacity: [0, 0.35, 0] } : { opacity: [0, 0.85, 0, 0.5, 0] }}
            transition={still ? { delay: landed, duration: 1 } : { delay: landed, duration: 0.7, times: [0, 0.15, 0.4, 0.55, 1] }}
          />
          {top === 5 && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-[30%] left-1/2 aspect-square w-[160vmax] -translate-x-1/2 -translate-y-1/2"
              style={{ background: 'repeating-conic-gradient(from 0deg, rgba(255,143,193,0.3) 0deg 8deg, transparent 8deg 18deg, rgba(127,178,255,0.3) 18deg 26deg, transparent 26deg 36deg)', willChange: 'transform, opacity' }}
              initial={{ opacity: 0, rotate: 0 }}
              animate={still ? { opacity: 1 } : { opacity: 1, rotate: 120 }}
              transition={{ delay: landed, duration: confirmFor, ease: 'linear' }}
            />
          )}
          {!still && (
            <div className="pointer-events-none absolute inset-x-0 top-[30%] h-0">
              <StarBurst delay={landed + 0.1} rainbow={top === 5} n={top === 5 ? 18 : 10} />
            </div>
          )}
          {/* 「★5 かくてい！」, a letter at a time, bouncing in. */}
          <motion.div
            className="absolute inset-x-0 top-[47%] flex items-center justify-center py-2"
            style={{ background: top === 5 ? 'linear-gradient(90deg, transparent, rgba(80,30,120,0.85) 15%, rgba(80,30,120,0.85) 85%, transparent)' : 'linear-gradient(90deg, transparent, rgba(90,58,18,0.85) 15%, rgba(90,58,18,0.85) 85%, transparent)' }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: landed + 0.15, duration: 0.2 }}
          >
            {[...`★${top} かくてい！`].map((c, i) => (
              <motion.span
                key={i}
                className="inline-block text-[min(11vw,44px)] font-black"
                style={{
                  background: top === 5 ? 'linear-gradient(180deg, #fff, #ffd6f0 30%, #ffd36a 55%, #8be0a8 80%, #7fb2ff)' : 'linear-gradient(180deg, #fff, #ffe39a 45%, #e8a317)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextStroke: '1.5px rgba(60,20,80,0.9)',
                  minWidth: c === ' ' ? '0.4em' : undefined,
                }}
                initial={still ? { opacity: 0 } : { y: -80, scale: 2.2, opacity: 0 }}
                animate={still ? { opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
                transition={still ? { delay: landed + 0.25, duration: 0.4 } : { delay: landed + 0.25 + i * 0.07, type: 'spring', stiffness: 520, damping: 14 }}
              >
                {c}
              </motion.span>
            ))}
          </motion.div>
        </>
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
