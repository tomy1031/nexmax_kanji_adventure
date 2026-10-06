import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { kanjiOf } from '../../data/charKanji';
import type { Individual } from '../../data/individuals';

/**
 * A companion's card (docs/design/18 §4), the one thing the gacha gives from
 * the book to the result: the same card everywhere.
 *
 *   back  — its rarity's back (silver ★3, gold ★4, rainbow ★5), the honest hint
 *   paper — the front with an empty window of paper, where its character is
 *           written (`children`, KanjiReveal)
 *   front — the companion in the window, their stars on top, their name on
 *           the plate, their character in a bead, NEW / PICK UP
 *
 * The frame pictures (img/gacha/card_frame_*.webp) leave their window empty;
 * the picture and the colour go behind them. Sizes go by the card's width.
 */

/** The window in the frame pictures, and the name plate under it, as shares of the card. */
const WINDOW = { top: 0.115, left: 0.085, right: 0.085, bottom: 0.2 };
const PLATE = { top: 0.815, height: 0.095, side: 0.13 };

/** What shows through the window behind the companion. */
const GLOW: Record<number, string> = {
  3: 'radial-gradient(circle at 50% 35%, #ffffff, #dfe7f4 45%, #9fb0cc)',
  4: 'radial-gradient(circle at 50% 35%, #fff8d8, #ffd36a 45%, #c27f12)',
  5: 'radial-gradient(circle at 50% 35%, #ffffff, #ffd6f0 30%, #b9a2ff 60%, #6fc3ff)',
};
const BEAD: Record<number, string> = {
  3: 'radial-gradient(circle at 35% 30%, #ffffff, #e6ecf6 55%, #aab4c8)',
  4: 'radial-gradient(circle at 35% 30%, #fffdf0, #ffe39a 55%, #d9a12b)',
  5: 'radial-gradient(circle at 35% 30%, #ffffff, #ffd6f0 45%, #b9a2ff)',
};
const STAR: Record<number, string> = { 3: '#f4f7ff', 4: '#ffd36a', 5: '#ffd36a' };

export type CardFace = 'back' | 'paper' | 'front';

export const GachaCard = ({
  card,
  face,
  width,
  showFurigana,
  still = false,
  fresh = false,
  badge,
  pickup = false,
  children,
}: {
  card: Individual;
  face: CardFace;
  width: number;
  showFurigana: boolean;
  still?: boolean;
  /** NEW on the corner. */
  fresh?: boolean;
  /** Instead of NEW: what a card already owned turned into (♥2, ◆20). */
  badge?: string;
  /** This week's pickup. */
  pickup?: boolean;
  /** The paper's writing. */
  children?: ReactNode;
}) => {
  const r = card.rarity;
  const h = width * 1.5;
  const box = { width, height: h };
  if (face === 'back') return <img src={assetPath(`img/gacha/card_back_${r}.webp`)} alt="" aria-hidden className="block select-none" style={box} draggable={false} />;

  const k = kanjiOf(card.char);
  const win = {
    top: h * WINDOW.top,
    left: width * WINDOW.left,
    right: width * WINDOW.right,
    bottom: h * WINDOW.bottom,
  };
  return (
    <div className="relative select-none" style={box}>
      <div className="absolute overflow-hidden" style={{ ...win, background: face === 'paper' ? 'linear-gradient(180deg, #fffaf0, #f4e7c8)' : GLOW[r] }}>
        {face === 'front' ? (
          <>
            {r >= 4 && (
              <div
                aria-hidden
                className="absolute inset-0 opacity-60"
                style={{ background: `repeating-conic-gradient(from 0deg at 50% 40%, rgba(255,255,255,0.5) 0deg 6deg, transparent 6deg 18deg)` }}
              />
            )}
            <img src={assetPath(card.art)} alt="" aria-hidden className="absolute inset-x-0 bottom-0 mx-auto h-[96%] w-full object-contain object-bottom" draggable={false} />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        )}
      </div>
      <img src={assetPath(`img/gacha/card_frame_${r}.webp`)} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />

      {face === 'front' && (
        <>
          <p
            aria-label={`★${r}`}
            className="absolute inset-x-0 text-center leading-none"
            style={{ top: h * (WINDOW.top + 0.012), fontSize: width * 0.1, color: STAR[r], textShadow: '0 1px 0 #6b4a12, 0 0 6px rgba(0,0,0,0.45)', letterSpacing: -1 }}
          >
            {'★'.repeat(r)}
          </p>
          {/* The companion's character, in a bead of light. */}
          <span
            aria-hidden
            className="absolute flex items-center justify-center rounded-full leading-none font-black text-[#2a1d12] shadow"
            style={{
              right: width * 0.06,
              top: h * (1 - WINDOW.bottom) - width * 0.25,
              minWidth: width * 0.23,
              height: width * 0.23,
              paddingInline: width * 0.02,
              fontSize: width * (k.kanji.length > 1 ? 0.085 : 0.13),
              background: BEAD[r],
              border: `${Math.max(1, width * 0.012)}px solid rgba(255,255,255,0.95)`,
            }}
          >
            {k.kanji}
          </span>
          <p
            className="g-outline-text absolute truncate text-center font-black text-white"
            style={{ top: h * PLATE.top, height: h * PLATE.height, left: width * PLATE.side, right: width * PLATE.side, fontSize: width * 0.085, lineHeight: `${h * PLATE.height}px` }}
          >
            <RubyText showFurigana={showFurigana}>{card.shortName}</RubyText>
          </p>
          {fresh ? (
            <span className="absolute rounded-md bg-[#e2453c] font-black text-white shadow" style={{ top: -width * 0.03, left: -width * 0.03, fontSize: width * 0.075, padding: `0 ${width * 0.03}px`, rotate: '-10deg' }}>
              NEW
            </span>
          ) : (
            badge && (
              <span className="absolute rounded-md bg-[#d0567a] font-black text-white shadow" style={{ top: -width * 0.03, left: -width * 0.03, fontSize: width * 0.075, padding: `0 ${width * 0.03}px` }}>
                {badge}
              </span>
            )
          )}
          {pickup && (
            <span className="absolute rounded-md bg-[#7a3fd0] font-black text-white shadow" style={{ top: -width * 0.03, right: -width * 0.03, fontSize: width * 0.06, padding: `0 ${width * 0.025}px` }}>
              PICK UP
            </span>
          )}
          {r === 5 && !still && (
            // A ★5 card shines: a light runs across it.
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ borderRadius: width * 0.04 }}
            >
              <motion.span
                className="absolute inset-y-0 w-1/2"
                style={{ background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.55), transparent)', willChange: 'transform' }}
                initial={{ x: '-120%' }}
                animate={{ x: '260%' }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
              />
            </motion.span>
          )}
        </>
      )}
    </div>
  );
};

export default GachaCard;
