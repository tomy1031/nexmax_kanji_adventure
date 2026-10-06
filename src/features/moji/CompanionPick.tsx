import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import { getIndividual, type Individual } from '../../data/individuals';
import { CLASS_LABEL } from '../../lib/forge/weapon';
import { ELEMENT_LABEL, type Element } from '../../lib/forge/elements';
import { SKILL_INFO, SKILL_OF, skillEffect } from '../../lib/companionSkill';

/**
 * じゅんび's なかま (docs/design/11 §3.3): who comes along, what their わざ
 * does and which weapon they are good with — and a tap to change. Before the
 * first companion joins (1章 4話) there is nothing to show.
 */

/** ★3〜5, gold. */
export const Stars = ({ n }: { n: number }) => (
  <span aria-label={`★${n}`} className="text-[11px] leading-none tracking-tight" style={{ color: n === 5 ? '#d0567a' : '#e8a317' }}>
    {'★'.repeat(n)}
  </span>
);

const classLine = (ind: Individual) => `${CLASS_LABEL[ind.favours].ja}(${CLASS_LABEL[ind.favours].reading}) ＋${ind.bonus}%`;

/** Halves the opponent's strike when it is of the element this companion resists (lib/battle.ts counterDamage). */
const resistsLine = (el: Element) => `${ELEMENT_LABEL[el].ja}(${ELEMENT_LABEL[el].reading})の こうげき 半分(はんぶん)`;

export const CompanionPick = ({ bossElement, showFurigana }: { bossElement: Element; showFurigana: boolean }) => {
  const owned = useGameStore((s) => s.individuals);
  const activeId = useGameStore((s) => s.activeIndividual);
  const setActive = useGameStore((s) => s.setActiveIndividual);
  const bonds = useGameStore((s) => s.bonds);
  const english = useGameStore((s) => s.settings.english);
  const [open, setOpen] = useState(false);
  const list = owned.map((id) => getIndividual(id)).filter((i): i is Individual => i != null);
  if (list.length === 0) return null;
  const active = (activeId && getIndividual(activeId)) || null;
  const kind = active ? SKILL_OF[active.char] : undefined;
  const info = kind ? SKILL_INFO[kind] : undefined;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="g-parchment flex w-full items-center gap-3 px-3 py-2 text-left active:scale-[0.98]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e9dcc0]">
          {active ? <img src={assetPath(active.art)} alt="" aria-hidden className="h-full w-full object-contain" /> : <span className="text-2xl">＋</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black" style={{ color: 'var(--accent-2)' }}>
            <RubyText showFurigana={showFurigana}>つれて 行(い)く なかま</RubyText>
          </span>
          {active && info && kind ? (
            <>
              <span className="block truncate text-sm font-black">
                <Stars n={active.rarity} /> <RubyText showFurigana={showFurigana}>{active.name}</RubyText>
                {(bonds?.[active.id] ?? 0) > 0 && <span className="ml-1 text-[11px] text-[#d0567a]">♥{bonds?.[active.id]}</span>}
              </span>
              <span className="block text-[11px] leading-snug font-bold" style={{ color: 'var(--ink-2)' }}>
                {info.icon} <RubyText showFurigana={showFurigana}>{`わざ「${info.name}」 ${info.says(skillEffect(kind, active.rarity, bonds?.[active.id] ?? 0))}`}</RubyText>
              </span>
              {english && (
                <span lang="en" className="block text-[11px] leading-snug font-bold" style={{ color: '#1b4f8f' }}>
                  {info.en(skillEffect(kind, active.rarity, bonds?.[active.id] ?? 0))}
                </span>
              )}
              <span className="block text-[11px] leading-snug font-bold" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>{`とくいな 武器(ぶき): ${classLine(active)}`}</RubyText>
              </span>
            </>
          ) : (
            <span className="block text-sm font-black">
              <RubyText showFurigana={showFurigana}>なかまを えらんで ください</RubyText>
            </span>
          )}
        </span>
        <span className="shrink-0 text-xs font-black" style={{ color: 'var(--accent-2)' }}>
          かえる ▸
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-label="なかまを えらぶ"
              className="g-parchment max-h-[80dvh] w-full max-w-md overflow-y-auto !rounded-b-none p-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:!rounded-2xl"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black">
                  <RubyText showFurigana={showFurigana}>なかまを えらぶ</RubyText>
                </p>
                <button type="button" className="g-btn g-btn-ghost !min-h-[34px] !px-3 text-xs" onClick={() => setOpen(false)}>
                  とじる
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {list.map((ind) => {
                  const k = SKILL_OF[ind.char];
                  const i = SKILL_INFO[k];
                  const on = ind.id === activeId;
                  const good = ind.resists === bossElement;
                  return (
                    <li key={ind.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setActive(ind.id);
                          setOpen(false);
                        }}
                        className="relative flex w-full flex-col items-center rounded-2xl border-2 bg-white/60 p-2 text-center active:scale-[0.97]"
                        style={{ borderColor: on ? '#e8a317' : 'rgba(122,82,38,0.25)', boxShadow: on ? '0 0 0 2px rgba(255,210,90,0.6)' : undefined }}
                      >
                        {good && (
                          <span className="absolute -top-2 left-1 rounded-full bg-[#2f7d4a] px-1.5 text-[10px] leading-[1.8] font-black text-white">
                            <RubyText showFurigana={showFurigana}>おすすめ</RubyText>
                          </span>
                        )}
                        {on && (
                          <span className="absolute -top-2 right-1 rounded-full bg-[#e8a317] px-1.5 text-[10px] leading-[1.8] font-black text-white">
                            <RubyText showFurigana={showFurigana}>いっしょ</RubyText>
                          </span>
                        )}
                        <img src={assetPath(ind.art)} alt="" aria-hidden className="h-20 w-20 object-contain" />
                        <Stars n={ind.rarity} />
                        <span className="text-xs leading-snug font-black">
                          <RubyText showFurigana={showFurigana}>{ind.name}</RubyText>
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: i.color === '#ffd36a' ? '#a87a00' : 'var(--ink-2)' }}>
                          {i.icon} <RubyText showFurigana={showFurigana}>{i.name}</RubyText>
                        </span>
                        <span className="text-[10px] leading-snug font-bold" style={{ color: 'var(--ink-2)' }}>
                          <RubyText showFurigana={showFurigana}>{good ? resistsLine(ind.resists) : classLine(ind)}</RubyText>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
