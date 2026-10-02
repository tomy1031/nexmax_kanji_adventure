import { useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { STAR_PERKS, STAR_PERKS_HOW } from '../../data/starPerks';

/**
 * ★の ひみつ — what each star buys, opened from じゅんび (data/starPerks.ts).
 *
 * Stars, writes and a picture on every row, so the point lands before the
 * words are read; the English only behind EN.
 */
export const StarSecrets = ({ showFurigana, onClose }: { showFurigana: boolean; onClose: () => void }) => {
  const [en, setEn] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 px-5"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="star-secrets-title"
        initial={{ scale: 0.9, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="g-parchment w-full max-w-sm px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="star-secrets-title" className="text-xl leading-[2] font-black" style={{ color: 'var(--accent-2)' }}>
            ★の ひみつ
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
        <ol className="mt-1 flex flex-col gap-2">
          {STAR_PERKS.map((p) => (
            <li key={p.stars} className="flex items-center gap-2 rounded-xl bg-white/70 px-2 py-1.5">
              <span className="w-14 shrink-0 text-center">
                <span className="block text-base leading-tight tracking-tighter" style={{ color: '#e8a317' }} aria-label={`★${p.stars}`}>
                  {'★'.repeat(p.stars)}
                </span>
                <span className="block text-[11px] font-black tabular-nums" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>{`${p.reps}回(かい)`}</RubyText>
                </span>
              </span>
              <span aria-hidden className="w-12 shrink-0 text-center text-lg leading-tight">
                {p.icons}
              </span>
              <span className="min-w-0 flex-1 text-[13px] leading-[1.9] font-bold">
                <RubyText showFurigana={showFurigana}>{p.text}</RubyText>
                {en && (
                  <span lang="en" className="block text-[11px] leading-snug" style={{ color: 'var(--ink-2)' }}>
                    {p.en}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-center text-[13px] leading-[1.9] font-black">
          ✎ <RubyText showFurigana={showFurigana}>{STAR_PERKS_HOW.text}</RubyText>
        </p>
        {en && (
          <p lang="en" className="text-center text-[11px] leading-snug font-bold" style={{ color: 'var(--ink-2)' }}>
            {STAR_PERKS_HOW.en}
          </p>
        )}
        <button type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={onClose}>
          わかった
        </button>
      </motion.div>
    </motion.div>
  );
};

export default StarSecrets;
