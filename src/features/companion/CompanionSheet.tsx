import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import type { Element } from '../../lib/forge/elements';
import { RARITY_FRAME, classLine, resistsLine, useOwnedCompanions } from './parts';
import { SKILL_INFO, SKILL_OF, skillEffect } from '../../lib/companionSkill';
import { star5PowerOf } from '../../lib/star5Power';
import { takeAlong } from './takeAlong';

/**
 * なかまを えらぶ — one sheet, the same from every screen that shows the
 * companion (じゅんび, もちもの, ステージせんたく, ガチャ). The one along comes
 * first with 「いっしょ」, then the rest by ★ (★5 first); each tile wears its
 * rarity's frame, its わざ, and what it is good for — 「おすすめ」 against the
 * next opponent's element when there is one. A tap takes it along with its
 * entrance (JoinCutIn).
 */

/** ★3〜5, gold (★5 pink). */
export const Stars = ({ n }: { n: number }) => (
  <span aria-label={`★${n}`} className="text-[11px] leading-none tracking-tight" style={{ color: n === 5 ? '#d0567a' : '#e8a317' }}>
    {'★'.repeat(n)}
  </span>
);

export const CompanionSheet = ({ open, onClose, bossElement, showFurigana }: { open: boolean; onClose: () => void; bossElement?: Element; showFurigana: boolean }) => {
  const list = useOwnedCompanions();
  const activeId = useGameStore((s) => s.activeIndividual);
  const bonds = useGameStore((s) => s.bonds);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="なかまを えらぶ"
            className="g-parchment max-h-[82dvh] w-full max-w-md overflow-y-auto !rounded-b-none p-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:!rounded-2xl"
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-base font-black">
                🤝 <RubyText showFurigana={showFurigana}>なかまを えらぶ</RubyText>
              </p>
              <button type="button" className="g-btn g-btn-ghost !min-h-[34px] !px-3 text-xs" onClick={onClose}>
                <RubyText showFurigana={showFurigana}>とじる</RubyText>
              </button>
            </div>
            <p className="mb-2 text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>おした なかまが たたかいに いっしょに 行(い)きます。</RubyText>
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {list.map((ind) => {
                const k = SKILL_OF[ind.char];
                const i = SKILL_INFO[k];
                const on = ind.id === activeId;
                const good = bossElement != null && ind.resists === bossElement;
                const star5 = star5PowerOf(ind.id);
                const bond = bonds?.[ind.id] ?? 0;
                return (
                  <li key={ind.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        takeAlong(ind.id);
                        onClose();
                      }}
                      className="relative flex w-full flex-col items-center rounded-2xl border-[3px] p-2 text-center active:scale-[0.97]"
                      style={{
                        borderColor: on ? '#ffd36a' : RARITY_FRAME[ind.rarity],
                        background: on ? 'linear-gradient(180deg,#fff7d6,#ffe9a8)' : ind.rarity === 5 ? 'linear-gradient(180deg,#fff0f7,#fffaf0)' : 'rgba(255,255,255,0.6)',
                        boxShadow: on ? '0 0 0 3px rgba(255,210,90,0.55), 0 0 18px rgba(255,190,60,0.6)' : ind.rarity === 5 ? '0 0 12px rgba(208,86,122,0.35)' : undefined,
                      }}
                    >
                      {good && (
                        <span className="absolute -top-2 left-1 rounded-full bg-[#2f7d4a] px-1.5 text-[10px] leading-[1.8] font-black text-white">
                          <RubyText showFurigana={showFurigana}>おすすめ</RubyText>
                        </span>
                      )}
                      {on && (
                        <span className="absolute -top-2 right-1 rounded-full bg-[#e8a317] px-1.5 text-[10px] leading-[1.8] font-black text-white shadow">
                          ✓ <RubyText showFurigana={showFurigana}>いっしょ</RubyText>
                        </span>
                      )}
                      <img src={assetPath(ind.art)} alt="" aria-hidden className="h-20 w-20 object-contain" />
                      <span className="flex items-center gap-1">
                        <Stars n={ind.rarity} />
                        {bond > 0 && <span className="text-[10px] font-black text-[#d0567a]">♥{bond}</span>}
                      </span>
                      <span className="text-xs leading-snug font-black">
                        <RubyText showFurigana={showFurigana}>{ind.name}</RubyText>
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
                        {i.icon} <RubyText showFurigana={showFurigana}>{`${i.name}: ${i.says(skillEffect(k, ind.rarity, bond))}`}</RubyText>
                      </span>
                      <span className="text-[10px] leading-snug font-bold" style={{ color: 'var(--ink-2)' }}>
                        <RubyText showFurigana={showFurigana}>{good ? resistsLine(ind.resists) : classLine(ind)}</RubyText>
                      </span>
                      {star5 && (
                        <span className="mt-0.5 rounded-md bg-[#d0567a] px-1.5 text-[10px] leading-[1.7] font-black text-white">
                          <RubyText showFurigana={showFurigana}>{`★5「${star5.name}」`}</RubyText>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CompanionSheet;
