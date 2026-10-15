import { useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { faceStyle } from '../../lib/faceCrop';
import { useGameStore } from '../../store/gameStore';
import { getIndividual } from '../../data/individuals';
import { SKILL_INFO, SKILL_OF } from '../../lib/companionSkill';
import { CompanionSheet } from './CompanionSheet';
import { RARITY_FRAME } from './parts';

/**
 * 「いっしょ」 — who is along, as a small pill: the face in its rarity's ring,
 * the stars, the short name and the わざ's icon. A tap opens なかまを えらぶ.
 * Shown on the hub (under the player plate) and the gacha's header, so who is
 * along is never more than a glance away. Nothing before the first companion.
 */
/** `compact`: the face and the stars only (a crowded header). */
export const CompanionChip = ({ className = '', style, compact = false }: { className?: string; style?: React.CSSProperties; compact?: boolean }) => {
  const owned = useGameStore((s) => s.individuals);
  const activeId = useGameStore((s) => s.activeIndividual);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const [open, setOpen] = useState(false);
  if (owned.length === 0) return null;
  const card = activeId ? getIndividual(activeId) : undefined;
  const info = card ? SKILL_INFO[SKILL_OF[card.char]] : undefined;
  return (
    <>
      <motion.button
        type="button"
        data-tap
        aria-label={card ? `いっしょ ${card.shortName} かえる` : 'なかまを えらぶ'}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-full border-2 border-[#c9a052] bg-[#1b1640]/90 py-0.5 pr-2.5 pl-0.5 text-left text-[#ffe7b8] shadow-lg ${className}`}
        style={style}
      >
        <span
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-full border-2 bg-[#e9dcc0]"
          style={{ borderColor: card ? RARITY_FRAME[card.rarity] : '#c9a052', ...(card ? faceStyle(card.art, 32) : {}) }}
        >
          {!card && <span className="flex h-full items-center justify-center text-lg font-black text-[#5a3a14]">＋</span>}
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[10px] font-black text-[#ffd36a]">
            🤝 <RubyText showFurigana={showFurigana}>いっしょ</RubyText>
            {card && <span className="ml-1 tracking-tighter">{'★'.repeat(card.rarity)}</span>}
          </span>
          {!compact && (
            <span className="truncate text-xs font-black">
              {card ? <RubyText showFurigana={showFurigana}>{`${info?.icon ?? ''} ${card.shortName}`}</RubyText> : <RubyText showFurigana={showFurigana}>えらぶ ▸</RubyText>}
            </span>
          )}
        </span>
      </motion.button>
      <CompanionSheet open={open} onClose={() => setOpen(false)} showFurigana={showFurigana} />
    </>
  );
};

export default CompanionChip;
