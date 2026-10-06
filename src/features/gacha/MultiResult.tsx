import { useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { NexmaxSays } from '../../components/ui/Chrome';
import { assetPath } from '../../lib/assetPath';
import type { Individual } from '../../data/individuals';
import type { SinglePull } from './SingleResult';
import { GachaCard } from './GachaCard';

/**
 * 10回の けっか (docs/design/17 §3.4, 18 §4), after the cards have come out
 * one by one (or been skipped): the ten cards side by side in their frames
 * (4・4・2), the companion in the window, their stars, name and character,
 * NEW or the きずな it raised, PICK UP for this week's. Under them Nexmax is
 * pleased, with OK and 「もう 10回」.
 */

export const MultiResult = ({
  results,
  still,
  showFurigana,
  isPickup,
  onClose,
  again,
}: {
  results: readonly SinglePull[];
  still: boolean;
  showFurigana: boolean;
  isPickup: (card: Individual) => boolean;
  onClose: () => void;
  /** 「もう 10回」 and its price, when there are gems for it. */
  again: { cost: number; go: () => void } | null;
}) => {
  const fresh = results.filter((r) => !r.duplicate).length;
  // Four to a row: a quarter of the width less the gaps, and three rows that fit the height.
  const [cardW] = useState(() => Math.floor(Math.min((Math.min(window.innerWidth, 448) - 32 - 3 * 8) / 4, (window.innerHeight * 0.6) / 3 / 1.5)));
  const [plateW] = useState(() => Math.min(window.innerWidth - 24, 360));
  return (
    <div className="relative flex h-full w-full max-w-md flex-col items-center justify-center">
      <img src={assetPath('img/gacha/pickup_bg.webp')} alt="" aria-hidden className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-35" />
      <motion.div
        className="relative mb-3 flex items-center justify-center"
        style={{ width: plateW }}
        initial={{ scale: still ? 1 : 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <img src={assetPath('img/gacha/title_plate.webp')} alt="" aria-hidden className="w-full" />
        <p className="g-outline-text absolute inset-x-0 top-[56%] -translate-y-1/2 text-center text-2xl font-black text-[#ffe9a8]">
          <RubyText showFurigana={showFurigana}>10回(かい)の けっか</RubyText>
        </p>
      </motion.div>

      <div className="relative flex w-full flex-wrap justify-center gap-2">
        {results.map((r, i) => (
          <motion.div
            key={`${r.card.id}-${i}`}
            initial={{ opacity: 0, y: still ? 0 : -40, scale: still ? 1 : 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: still ? 0 : i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <GachaCard
              card={r.card}
              face="front"
              width={cardW}
              showFurigana={showFurigana}
              still={still}
              fresh={!r.duplicate}
              badge={r.duplicate ? (r.bondTo ? `♥${r.bondTo}` : `◆${r.refund}`) : undefined}
              pickup={isPickup(r.card)}
            />
          </motion.div>
        ))}
      </div>

      <p className="relative mt-3 text-center text-xs text-white/85">
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

      <div className="relative mt-1 flex w-full justify-start">
        <NexmaxSays text={fresh ? 'すてきな なかまに 出会(であ)えたね！' : 'きずなが ふかまったね！'} pose="cheer" size={64} flip />
      </div>
      <div className="relative mt-1 flex w-full gap-2">
        <button type="button" className="relative flex h-14 flex-1 items-center justify-center" onClick={onClose}>
          <img src={assetPath('img/gacha/btn_blue.webp')} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
          <span className="g-outline-text relative text-xl font-black text-white">OK</span>
        </button>
        {again && (
          <button type="button" className="relative flex h-14 flex-1 items-center justify-center" onClick={again.go}>
            <img src={assetPath('img/gacha/btn_gold.webp')} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
            <span className="relative flex flex-col text-sm leading-tight font-black text-[#3a2414]">
              <RubyText showFurigana={showFurigana}>もう 10回(かい)</RubyText>
              <span className="text-xs">◆{again.cost}</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiResult;
