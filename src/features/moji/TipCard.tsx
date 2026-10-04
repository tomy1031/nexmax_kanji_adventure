import { useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { tipOf, type TipId } from '../../data/fightRules';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

/**
 * ひとつ ひみつ — one rule, told by itself on じゅんび (data/fightRules.ts
 * READY_TIPS): a big picture, one line, わかった. The rest come one a visit,
 * and the whole of ★の ひみつ・たたかいの ひみつ stays a tap away.
 */
export const TipCard = ({ id, showFurigana, onClose }: { id: TipId; showFurigana: boolean; onClose: () => void }) => {
  const tip = tipOf(id);
  const [en, setEn] = useState(false);
  const okRef = useEscapeToClose(onClose);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-6"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tip-title"
        initial={{ scale: 0.85, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="g-parchment w-full max-w-xs px-5 py-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="tip-title" className="text-lg leading-[2] font-black" style={{ color: 'var(--accent-2)' }}>
            💡 ひみつ
          </h2>
          <button
            type="button"
            aria-pressed={en}
            className="rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px] whitespace-nowrap"
            onClick={() => setEn(!en)}
          >
            EN
          </button>
        </div>
        <motion.p
          aria-hidden
          className="mt-1 text-6xl leading-tight"
          initial={{ scale: 0.4, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
        >
          {tip.icons}
        </motion.p>
        <p className="mt-2 text-base leading-[2] font-black">
          <RubyText showFurigana={showFurigana}>{tip.text}</RubyText>
        </p>
        {en && (
          <p lang="en" className="mt-1 text-[13px] leading-snug font-bold" style={{ color: '#1b4f8f' }}>
            {tip.en}
          </p>
        )}
        <button ref={okRef} type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={onClose}>
          わかった
        </button>
      </motion.div>
    </motion.div>
  );
};

export default TipCard;
