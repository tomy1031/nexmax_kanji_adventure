import { useState } from 'react';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import { getIndividual } from '../../data/individuals';
import type { Element } from '../../lib/forge/elements';
import { SKILL_INFO, SKILL_OF, skillEffect } from '../../lib/companionSkill';
import { star5PowerOf } from '../../lib/star5Power';
import { CompanionSheet, Stars } from '../companion/CompanionSheet';
import { RARITY_FRAME, classLine } from '../companion/parts';

/**
 * つれて 行く なかま (docs/design/11 §3.3): who comes along, what their わざ
 * does and which weapon they are good with — and a tap to change
 * (CompanionSheet, the same sheet as everywhere). On じゅんび, with the next
 * opponent's element for 「おすすめ」, and on もちもの. Before the first
 * companion joins (1章 4話) there is nothing to show.
 */

export { Stars };

export const CompanionPick = ({ bossElement, showFurigana }: { bossElement?: Element; showFurigana: boolean }) => {
  const owned = useGameStore((s) => s.individuals);
  const activeId = useGameStore((s) => s.activeIndividual);
  const bonds = useGameStore((s) => s.bonds);
  const english = useGameStore((s) => s.settings.english);
  const [open, setOpen] = useState(false);
  if (owned.length === 0) return null;
  const active = (activeId && getIndividual(activeId)) || null;
  const kind = active ? SKILL_OF[active.char] : undefined;
  const info = kind ? SKILL_INFO[kind] : undefined;
  const star5 = star5PowerOf(active?.id);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="g-parchment flex w-full items-center gap-3 px-3 py-2 text-left active:scale-[0.98]"
        style={active ? { borderColor: RARITY_FRAME[active.rarity], boxShadow: active.rarity === 5 ? '0 0 14px rgba(208,86,122,0.45)' : undefined } : undefined}
      >
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-[3px] bg-[#e9dcc0]"
          style={{ borderColor: active ? RARITY_FRAME[active.rarity] : '#c9a052' }}
        >
          {active ? <img src={assetPath(active.art)} alt="" aria-hidden className="h-full w-full object-contain" /> : <span className="text-2xl">＋</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black" style={{ color: 'var(--accent-2)' }}>
            🤝 <RubyText showFurigana={showFurigana}>いっしょに 行(い)く なかま</RubyText>
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
              {star5 && (
                <span className="block text-[11px] leading-snug font-black" style={{ color: '#a8325a' }}>
                  <RubyText showFurigana={showFurigana}>{`★5「${star5.name}」 ${star5.says}`}</RubyText>
                </span>
              )}
            </>
          ) : (
            <span className="block text-sm font-black">
              <RubyText showFurigana={showFurigana}>なかまを えらんで ください</RubyText>
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-full bg-[#2f8fe0] px-2 py-1 text-xs font-black text-white">
          <RubyText showFurigana={showFurigana}>かえる</RubyText> ▸
        </span>
      </button>
      <CompanionSheet open={open} onClose={() => setOpen(false)} bossElement={bossElement} showFurigana={showFurigana} />
    </>
  );
};
