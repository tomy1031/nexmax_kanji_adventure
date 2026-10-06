import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { NexmaxSays } from '../../components/ui/Chrome';
import { assetPath } from '../../lib/assetPath';
import { kanjiOf } from '../../data/charKanji';
import type { Individual } from '../../data/individuals';
import type { SinglePull } from './SingleResult';

/**
 * 10回の けっか (docs/design/17 §3.4).
 *
 * The ten cards are dealt face down — the back tells the rarity (silver ★3,
 * gold ★4, rainbow ★5), a ★4 or ★5 shimmers — and turn on a tap or with
 * 「ぜんぶ めくる」(a ★5 comes out of its character first: KanjiReveal).
 * Face up, each card holds its companion's character in a bead of light,
 * with its stars and name, NEW or the きずな it raised, and PICK UP when it
 * is this week's. Under them Nexmax is pleased, with OK and 「もう 10回」.
 */

const BACK: Record<number, string> = {
  3: 'linear-gradient(145deg, #d9dee8, #9aa3b5)',
  4: 'linear-gradient(145deg, #ffe39a, #d9a12b)',
  5: 'linear-gradient(145deg, #ff8fc1, #ffd36a 35%, #8be0a8 60%, #7fb2ff 85%, #c58bff)',
};
const FRAME: Record<number, string> = { 3: '#b8c0cf', 4: '#e8a317', 5: '#d0567a' };
/** The bead the character sits in: the light of the card's rarity. */
const BEAD: Record<number, string> = {
  3: 'radial-gradient(circle at 35% 30%, #ffffff, #e6ecf6 55%, #aab4c8)',
  4: 'radial-gradient(circle at 35% 30%, #fffdf0, #ffe39a 55%, #d9a12b)',
  5: 'radial-gradient(circle at 35% 30%, #ffffff, #ffd6f0 45%, #b9a2ff)',
};

export const MultiResult = ({
  results,
  revealed,
  still,
  showFurigana,
  isPickup,
  onFlip,
  onClose,
  again,
}: {
  results: readonly SinglePull[];
  /** How many of the cards are face up. */
  revealed: number;
  still: boolean;
  showFurigana: boolean;
  isPickup: (card: Individual) => boolean;
  /** Turn the cards over up to this many. */
  onFlip: (n: number) => void;
  onClose: () => void;
  /** 「もう 10回」 and its price, when there are gems for it. */
  again: { cost: number; go: () => void } | null;
}) => {
  const allRevealed = revealed >= results.length;
  const fresh = results.filter((r) => !r.duplicate).length;
  return (
    <div className="relative flex h-full w-full max-w-md flex-col items-center justify-center">
      <motion.p
        className="g-outline-text mb-3 rounded-full px-5 py-1 text-center text-xl font-black text-white"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(232,163,23,0.85) 18%, rgba(232,163,23,0.85) 82%, transparent)' }}
        initial={{ scale: still ? 1 : 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        key={allRevealed ? 'done' : 'flip'}
      >
        <RubyText showFurigana={showFurigana}>{allRevealed ? '10回(かい)の けっか' : 'カードを タップして めくる'}</RubyText>
      </motion.p>

      {/* 4・4・2, the last two in the middle. */}
      <div className="flex w-full flex-wrap justify-center gap-2">
        {results.map((r, i) => {
          const face = i < revealed;
          const k = kanjiOf(r.card.char);
          return (
            <motion.button
              key={`${r.card.id}-${i}`}
              type="button"
              onClick={() => onFlip(i + 1)}
              // Dealt in one by one, then turned on a tap.
              initial={{ opacity: 0, y: -60, rotateY: 180, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, rotateY: face ? 0 : 180, scale: face ? 1 : 0.96 }}
              transition={{ duration: 0.3, delay: face || still ? 0 : i * 0.07 }}
              className="relative flex aspect-[3/4.3] w-[calc(25%-6px)] flex-col items-center overflow-hidden rounded-xl"
              style={{
                background: face ? 'linear-gradient(180deg, #fffaf0, #f3e3c0)' : BACK[r.card.rarity],
                border: `3px solid ${FRAME[r.card.rarity]}`,
                boxShadow: r.card.rarity === 5 ? '0 0 16px rgba(255,150,200,0.85)' : r.card.rarity === 4 ? '0 0 12px rgba(255,210,90,0.65)' : undefined,
              }}
              aria-label={face ? `${r.card.shortName} ★${r.card.rarity}` : `${i + 1}まいめ ★${r.card.rarity}`}
            >
              {face ? (
                <>
                  <img src={assetPath(r.card.art)} alt="" aria-hidden className="mt-1 h-[58%] w-full object-contain" />
                  {/* The companion's character, in a bead of light. */}
                  <span
                    aria-hidden
                    className={`absolute top-[38%] right-0.5 flex h-7 min-w-7 items-center justify-center rounded-full px-0.5 leading-none font-black text-[#2a1d12] shadow ${k.kanji.length > 1 ? 'text-[11px]' : 'text-base'}`}
                    style={{ background: BEAD[r.card.rarity], border: '1.5px solid rgba(255,255,255,0.9)' }}
                  >
                    {k.kanji}
                  </span>
                  <span className="mt-auto text-[10px] leading-none" style={{ color: r.card.rarity === 5 ? '#d0567a' : '#e8a317' }} aria-hidden>
                    {'★'.repeat(r.card.rarity)}
                  </span>
                  <span className="w-full truncate px-0.5 pb-1 text-center text-[10px] leading-[1.9] font-black text-[#3a2414]">
                    <RubyText showFurigana={showFurigana}>{r.card.shortName}</RubyText>
                  </span>
                  {!r.duplicate ? (
                    <span className="absolute top-0.5 left-0.5 rounded bg-[#e2453c] px-1 text-[9px] leading-[1.5] font-black text-white">NEW</span>
                  ) : (
                    <span className="absolute top-0.5 left-0.5 rounded bg-[#d0567a] px-1 text-[9px] leading-[1.5] font-black text-white">
                      {r.bondTo ? `♥${r.bondTo}` : `◆${r.refund}`}
                    </span>
                  )}
                  {isPickup(r.card) && (
                    <span className="absolute top-0.5 right-0.5 rounded bg-[#7a3fd0] px-1 text-[8px] leading-[1.5] font-black text-white">PICK UP</span>
                  )}
                </>
              ) : (
                <>
                  {/* The card is turned away (rotateY 180): turn the label back so it reads. */}
                  <span className="my-auto text-xl font-black text-white/90 drop-shadow" style={{ transform: 'scaleX(-1)' }} aria-hidden>
                    ★{r.card.rarity}
                  </span>
                  {r.card.rarity >= 4 && !still && (
                    // A ★4 or ★5 face down shimmers: something good is under it.
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.75) 50%, transparent 70%)', willChange: 'transform' }}
                      animate={{ x: ['-120%', '120%'] }}
                      transition={{ duration: r.card.rarity === 5 ? 0.9 : 1.4, repeat: Infinity, repeatDelay: 0.3 }}
                    />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {allRevealed && (
        <p className="mt-3 text-center text-xs text-white/85">
          <RubyText showFurigana={showFurigana}>
            {[
              `新(あたら)しい カード ${fresh}枚(まい)`,
              results.some((r) => r.bondTo) ? `きずな ＋${results.filter((r) => r.bondTo).length}` : '',
              results.some((r) => r.refund) ? `◆${results.reduce((n, r) => n + r.refund, 0)} もどりました` : '',
            ]
              .filter(Boolean)
              .join(' ・ ')}
          </RubyText>
        </p>
      )}

      <div className="mt-3 flex w-full items-end gap-2">
        {allRevealed && <NexmaxSays text={fresh ? 'すてきな なかまに 出会(であ)えたね！' : 'きずなが ふかまったね！'} pose="cheer" size={76} />}
        <div className="mb-2 flex flex-1 flex-col gap-2">
          {!allRevealed ? (
            <button type="button" className="g-btn g-btn-ghost w-full !bg-white/90" onClick={() => onFlip(results.length)}>
              <RubyText showFurigana={showFurigana}>ぜんぶ めくる</RubyText>
            </button>
          ) : (
            <>
              <button type="button" className="g-btn g-btn-primary w-full" onClick={onClose}>
                OK
              </button>
              {again && (
                <button
                  type="button"
                  className="g-btn w-full !min-h-[44px] text-sm"
                  style={{ background: 'linear-gradient(180deg,#ffe39a,#e8a317)', color: '#3a2414', borderColor: '#fff3b0' }}
                  onClick={again.go}
                >
                  <RubyText showFurigana={showFurigana}>{`もう 10回(かい)（◆${again.cost}）`}</RubyText>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiResult;
