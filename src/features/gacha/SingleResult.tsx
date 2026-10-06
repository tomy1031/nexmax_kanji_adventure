import { useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { NexmaxSays } from '../../components/ui/Chrome';
import { assetPath } from '../../lib/assetPath';
import { kanjiOf } from '../../data/charKanji';
import type { Individual } from '../../data/individuals';
import { SKILL_INFO, SKILL_OF, skillEffect } from '../../lib/companionSkill';
import { star5PowerOf } from '../../lib/star5Power';

/**
 * 1回の けっか (docs/design/17 §2.6〜2.7), after the companion has stepped out
 * of their character (KanjiReveal).
 *
 *   字の ことば — the character large, and three words that use it, on slips
 *                (a new companion only: a card already owned goes straight on).
 *   ステータス   — the card: picture, stars, name, character, who they are and
 *                their わざ; and Nexmax under it: 「あたらしい なかまが くわわったよ！」
 */

const FRAME: Record<number, string> = { 3: '#b8c0cf', 4: '#e8a317', 5: '#d0567a' };
/** Each word slip leans a little its own way. */
const LEAN = [-5, 3, -2];

export interface SinglePull {
  card: Individual;
  duplicate: boolean;
  /** The card's きずな after this pull, or null when it was already full. */
  bondTo: number | null;
  /** Gems given back for a duplicate with full きずな. */
  refund: number;
}

export const SingleResult = ({ r, showFurigana, still, onClose }: { r: SinglePull; showFurigana: boolean; still: boolean; onClose: () => void }) => {
  const k = kanjiOf(r.card.char);
  const [step, setStep] = useState<'words' | 'card'>(r.duplicate ? 'card' : 'words');
  const kind = SKILL_OF[r.card.char];
  const info = SKILL_INFO[kind];
  const effect = skillEffect(kind, r.card.rarity, r.bondTo ?? 0);
  const star5 = star5PowerOf(r.card.id);
  const says = !r.duplicate
    ? 'あたらしい なかまが 加(くわ)わったよ！'
    : r.bondTo
      ? `また 会(あ)えたね！ きずなが ♥${r.bondTo}に なったよ。`
      : `きずなは いっぱい！ ◆${r.refund} もらったよ。`;

  if (step === 'words')
    return (
      <motion.button
        type="button"
        className="flex w-full max-w-sm flex-col items-center text-center"
        initial={{ opacity: 0, scale: still ? 1 : 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setStep('card')}
      >
        <p className="g-outline-text text-lg font-black text-white">
          <RubyText showFurigana={showFurigana}>{`${r.card.shortName}の 字(じ)`}</RubyText>
        </p>
        {/* The character, on paper, with its reading. */}
        <motion.div
          className="g-parchment relative mt-3 flex h-44 w-44 flex-col items-center justify-center"
          initial={{ scale: still ? 1 : 0.4, rotate: still ? 0 : -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          <span aria-hidden className="leading-none font-black text-[#2a1d12]" style={{ fontSize: k.kanji.length > 1 ? 76 : 112 }}>
            {k.kanji}
          </span>
          <span className="mt-1 text-lg font-black" style={{ color: 'var(--ink-2)' }}>
            {k.reading}
          </span>
        </motion.div>
        <p className="mt-4 text-sm font-bold text-white/85">
          <RubyText showFurigana={showFurigana}>この 字(じ)を つかう ことば</RubyText>
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          {k.words.map((w, i) => (
            <motion.span
              key={w}
              className="rounded-lg border-2 border-[#c9a45c] bg-[#fff8e6] px-3 py-1.5 text-xl leading-[1.9] font-black text-[#2a1d12] shadow-md"
              initial={{ opacity: 0, y: still ? 0 : -60, scale: still ? 1 : 0.4, rotate: 0 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: LEAN[i] }}
              transition={{ delay: still ? 0 : 0.35 + i * 0.18, type: 'spring', stiffness: 300, damping: 18 }}
            >
              <RubyText showFurigana={showFurigana}>{w}</RubyText>
            </motion.span>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/70">
          <RubyText showFurigana={showFurigana}>タップで つぎへ</RubyText>
        </p>
      </motion.button>
    );

  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <motion.div
        initial={{ scale: still ? 1 : 0.85, y: still ? 0 : 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="g-panel-solid relative w-full p-4 text-left"
        style={{ borderColor: FRAME[r.card.rarity], boxShadow: r.card.rarity === 5 ? '0 0 28px rgba(255,150,200,0.7)' : r.card.rarity === 4 ? '0 0 20px rgba(255,210,90,0.55)' : undefined }}
      >
        {!r.duplicate && (
          <span className="absolute -top-3 -left-2 rotate-[-10deg] rounded-lg border-2 border-white bg-[#e2453c] px-2 py-0.5 text-sm font-black text-white shadow">NEW!</span>
        )}
        <div className="flex items-center gap-3">
          <img src={assetPath(r.card.art)} alt="" aria-hidden className="h-32 w-28 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <p aria-label={`★${r.card.rarity}`} className="text-lg leading-none" style={{ color: r.card.rarity === 5 ? '#d0567a' : '#e8a317' }}>
              {'★'.repeat(r.card.rarity)}
            </p>
            <p className="g-title mt-1 text-lg leading-snug">
              <RubyText showFurigana={showFurigana}>{r.card.name}</RubyText>
            </p>
            {/* The companion's character, and its reading. */}
            <p className="mt-1.5 inline-flex items-center gap-2 rounded-xl border-2 border-[#c9a45c] bg-[#fff8e6] px-2 py-0.5">
              <span className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>字(じ)</RubyText>
              </span>
              <span aria-hidden className="text-2xl leading-none font-black text-[#2a1d12]">
                {k.kanji}
              </span>
              <span className="text-xs font-black text-[#2a1d12]">{k.reading}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-[1.9]">
          <RubyText showFurigana={showFurigana}>{r.card.tagline}</RubyText>
        </p>
        {star5 && (
          // ★5 だけの ちから (docs/design/18 §2).
          <div className="mt-2 rounded-xl border-2 border-[#d0567a] px-3 py-2 text-sm" style={{ background: 'linear-gradient(90deg, #fff0f7, #fff8e6)' }}>
            <p className="font-black" style={{ color: '#a8325a' }}>
              <RubyText showFurigana={showFurigana}>{`★5 だけの ちから「${star5.name}」`}</RubyText>
            </p>
            <p className="text-xs leading-[1.9]" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>{star5.says}</RubyText>
            </p>
          </div>
        )}
        <div className="mt-2 rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--line)' }}>
          <p className="font-black">
            {info.icon} <RubyText showFurigana={showFurigana}>{`わざ「${info.name}」`}</RubyText>
          </p>
          <p className="text-xs leading-[1.9]" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>{info.says(effect)}</RubyText>
          </p>
        </div>
      </motion.div>
      <div className="mt-3 flex w-full items-end justify-between gap-2">
        <NexmaxSays text={says} pose="cheer" size={84} />
        <button type="button" className="g-btn g-btn-primary mb-2 min-w-[120px] flex-1" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default SingleResult;
