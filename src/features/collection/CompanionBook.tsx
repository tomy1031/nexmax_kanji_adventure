import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore, BOND_MAX } from '../../store/gameStore';
import { CARDS, CHARACTERS, cardsOf, type Individual } from '../../data/individuals';
import { isMet } from '../../lib/gacha';
import { classRuby } from '../../lib/forge/weapon';
import { ELEMENT_LABEL } from '../../lib/forge/elements';
import { SKILL_INFO, SKILL_OF, skillEffect } from '../../lib/companionSkill';

/**
 * 図鑑の なかま (docs/design/11 §4): one tile per character, its best card
 * shown; tap for every card of it — ★3, ★4, ★5 — the ones not met yet as
 * shadows, so the player can see there is more of each friend to find.
 */

const Stars = ({ n, size = 11 }: { n: number; size?: number }) => (
  <span aria-label={`★${n}`} className="leading-none tracking-tight" style={{ color: n === 5 ? '#d0567a' : '#e8a317', fontSize: size }}>
    {'★'.repeat(n)}
  </span>
);

/** Behind a card's picture: brighter with the rarity. */
const glow = (r: number) =>
  r === 5
    ? 'radial-gradient(circle at 50% 45%, rgba(255,150,200,0.55), rgba(140,170,255,0.35) 45%, transparent 72%)'
    : r === 4
      ? 'radial-gradient(circle at 50% 45%, rgba(255,214,110,0.55), transparent 70%)'
      : 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.6), transparent 70%)';

/** A card not met yet: its outline only. */
const SHADOW = { filter: 'brightness(0) opacity(0.28)' } as const;

export const CompanionBook = ({ showFurigana }: { showFurigana: boolean }) => {
  const owned = useGameStore((s) => s.individuals);
  const active = useGameStore((s) => s.activeIndividual);
  const setActive = useGameStore((s) => s.setActiveIndividual);
  const bonds = useGameStore((s) => s.bonds);
  const cleared = useGameStore((s) => s.clearedStages);
  const [open, setOpen] = useState<string | null>(null);

  const has = (c: Individual) => owned.includes(c.id);
  // Only the friends the story has met (or already in hand): the gacha keeps the rest back too (lib/gacha.ts isMet).
  const reachable = CARDS.filter((c) => has(c) || isMet(c, cleared));
  const characters = CHARACTERS.filter((char) => reachable.some((c) => c.char === char));
  const opened = open ? cardsOf(open) : [];

  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {characters.map((char) => {
          const cards = cardsOf(char);
          const mine = cards.filter(has);
          const best = mine.at(-1);
          const shown = best ?? cards[0];
          const isActive = cards.some((c) => c.id === active);
          return (
            <li key={char}>
              <button
                type="button"
                onClick={() => setOpen(char)}
                className="g-panel relative flex w-full flex-col items-center gap-0.5 p-2 active:scale-[0.97]"
                style={{ borderColor: isActive ? 'var(--accent)' : undefined }}
              >
                <span className="relative flex h-20 w-full items-center justify-center rounded-xl" style={{ background: glow(best?.rarity ?? 3) }}>
                  <img src={assetPath(shown.art)} alt="" aria-hidden className="h-full object-contain" style={best ? undefined : SHADOW} />
                </span>
                <span className="w-full truncate text-center text-[11px] leading-snug font-black">
                  {best ? <RubyText showFurigana={showFurigana}>{best.shortName}</RubyText> : <span style={{ color: 'var(--ink-3)' }}>？？？</span>}
                </span>
                {/* which ★ of it there are, filled for the ones met */}
                <span className="flex gap-0.5" aria-label={`${mine.length} / ${cards.length}`}>
                  {cards.map((c) => (
                    <span
                      key={c.id}
                      className="rounded px-0.5 text-[9px] leading-[1.5] font-black"
                      style={
                        has(c)
                          ? { background: c.rarity === 5 ? '#d0567a' : '#e8a317', color: '#fff' }
                          : { background: 'rgba(122,82,38,0.12)', color: 'rgba(122,82,38,0.45)' }
                      }
                    >
                      ★{c.rarity}
                    </span>
                  ))}
                </span>
                {isActive && (
                  <span className="absolute -top-1.5 -right-1 rounded-full bg-[var(--accent)] px-1.5 text-[9px] leading-[1.8] font-black text-white">
                    <RubyText showFurigana={showFurigana}>いっしょ</RubyText>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-center text-xs" style={{ color: 'var(--ink-2)' }}>
        <RubyText showFurigana={showFurigana}>{`カード ${owned.length} / ${reachable.length} ・ 同(おな)じ なかまでも ★の ちがう すがたが あります`}</RubyText>
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              role="dialog"
              aria-label="なかまの カード"
              className="g-parchment max-h-[86dvh] w-full max-w-md overflow-y-auto !rounded-b-none p-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:!rounded-2xl"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black">
                  {opened.some(has) ? <RubyText showFurigana={showFurigana}>{opened[0].shortName}</RubyText> : '？？？'}
                </p>
                <button type="button" className="g-btn g-btn-ghost !min-h-[34px] !px-3 text-xs" onClick={() => setOpen(null)}>
                  とじる
                </button>
              </div>
              <ul className="flex flex-col gap-2">
                {opened.map((c) => {
                  const mine = has(c);
                  const kind = SKILL_OF[c.char];
                  const info = SKILL_INFO[kind];
                  const bond = bonds?.[c.id] ?? 0;
                  const on = c.id === active;
                  return (
                    <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white/55 p-2">
                      <span className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl" style={{ background: glow(c.rarity) }}>
                        <img src={assetPath(c.art)} alt="" aria-hidden className="h-full object-contain" style={mine ? undefined : SHADOW} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <Stars n={c.rarity} size={13} />
                        <span className="block text-sm leading-snug font-black">
                          {mine ? <RubyText showFurigana={showFurigana}>{c.name}</RubyText> : <span style={{ color: 'var(--ink-3)' }}>？？？</span>}
                        </span>
                        <span className="block text-[11px] leading-snug font-bold" style={{ color: 'var(--ink-2)' }}>
                          {info.icon} <RubyText showFurigana={showFurigana}>{`${info.name}: ${info.says(skillEffect(kind, c.rarity, bond))}`}</RubyText>
                        </span>
                        <span className="block text-[11px] leading-snug font-bold" style={{ color: 'var(--ink-2)' }}>
                          <RubyText showFurigana={showFurigana}>
                            {`${classRuby(c.favours)} ＋${c.bonus}% ・ ${ELEMENT_LABEL[c.resists].ja}(${ELEMENT_LABEL[c.resists].reading})に 強(つよ)い`}
                          </RubyText>
                        </span>
                        {mine && (
                          <span className="mt-0.5 flex items-center gap-2">
                            <span className="text-[11px] font-black text-[#d0567a]" aria-label={`きずな ${bond}`}>
                              {'♥'.repeat(bond)}
                              <span className="text-[rgba(208,86,122,0.25)]">{'♥'.repeat(BOND_MAX - bond)}</span>
                            </span>
                            {on ? (
                              <span className="rounded-full bg-[var(--accent)] px-2 text-[10px] leading-[1.9] font-black text-white">
                                <RubyText showFurigana={showFurigana}>いっしょ</RubyText>
                              </span>
                            ) : (
                              <button type="button" className="g-btn g-btn-ghost !min-h-[28px] !px-2 text-[11px]" onClick={() => setActive(c.id)}>
                                <RubyText showFurigana={showFurigana}>つれて 行(い)く</RubyText>
                              </button>
                            )}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] leading-snug" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  ♥ きずな: 同(おな)じ カードが ガチャで 出(で)るか、つれて 行(い)って ミスなしで 勝(か)つと（1日(にち) 1回(かい)） ふえます。わざが 強(つよ)く なります。
                </RubyText>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
