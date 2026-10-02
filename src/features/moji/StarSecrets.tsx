import { useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { STAR_PERKS, STAR_PERKS_HOW } from '../../data/starPerks';
import { FIGHT_RULES } from '../../data/fightRules';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

type Page = 'stars' | 'fight';

const PAGE_TITLE: Record<Page, string> = { stars: '★の ひみつ', fight: 'たたかいの ひみつ' };

/**
 * ★の ひみつ・たたかいの ひみつ — opened from じゅんび (data/starPerks.ts,
 * data/fightRules.ts). Two pages, in order: what writing buys, then why it
 * is needed. Stars, writes and a picture on every row, so the point lands
 * before the words are read; the English only behind EN.
 */
export const StarSecrets = ({ showFurigana, onClose }: { showFurigana: boolean; onClose: () => void }) => {
  const [page, setPage] = useState<Page>('stars');
  const [en, setEn] = useState(false);
  const firstRef = useEscapeToClose(onClose);
  const enLine = (line: string) =>
    en && (
      <span lang="en" className="block text-[11px] leading-snug" style={{ color: 'var(--ink-2)' }}>
        {line}
      </span>
    );

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
        className="g-parchment max-h-[90dvh] w-full max-w-sm overflow-y-auto px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="star-secrets-title" className="text-xl leading-[2] font-black" style={{ color: 'var(--accent-2)' }}>
            {PAGE_TITLE[page]}
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
        {/* Which page: two dots, tappable. */}
        <div className="mb-1 flex justify-center gap-2" role="tablist">
          {(['stars', 'fight'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={page === p}
              aria-label={PAGE_TITLE[p]}
              onClick={() => setPage(p)}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: page === p ? 'var(--accent-2)' : 'rgba(0,0,0,0.18)' }}
            />
          ))}
        </div>

        {page === 'stars' ? (
          <>
            <ol className="flex flex-col gap-2">
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
                    {enLine(p.en)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-center text-[13px] leading-[1.9] font-black">
              ✎ <RubyText showFurigana={showFurigana}>{STAR_PERKS_HOW.text}</RubyText>
              {enLine(STAR_PERKS_HOW.en)}
            </p>
            <button ref={firstRef} type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={() => setPage('fight')}>
              つぎへ ▶
            </button>
          </>
        ) : (
          <>
            <ol className="flex flex-col gap-2">
              {FIGHT_RULES.map((r) => (
                <li key={r.icons} className="flex items-center gap-2 rounded-xl bg-white/70 px-2 py-1.5">
                  <span aria-hidden className="w-10 shrink-0 text-center text-2xl leading-tight">
                    {r.icons}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] leading-[1.9] font-bold">
                    <RubyText showFurigana={showFurigana}>{r.text}</RubyText>
                    {enLine(r.en)}
                  </span>
                </li>
              ))}
            </ol>
            <button type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={onClose}>
              わかった
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StarSecrets;
