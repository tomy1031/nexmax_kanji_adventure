import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { getCompounds, useCompoundsVersion } from '../../data/compounds';

/**
 * First visit to the forge.
 *
 * Four cards, then it never appears again. It exists because the rule that
 * makes the forge worth playing — *a real Japanese word beats a random pair* —
 * is invisible until you happen to stumble on one, and a learner who forges
 * three junk pairs first concludes the mechanic is a slot machine.
 */

/**
 * Said in 1冊目 grammar and arrows (docs/constraints.md 2026-10-04); the
 * English sits behind EN, as on ★の ひみつ. `{words}` is the dictionary's size.
 */
const CARDS: { title: string; body: string; en: string }[] = [
  {
    title: '漢字(かんじ)を あわせて 武器(ぶき)を 作(つく)る',
    body: '10回(かい) 書(か)いた 漢字(かんじ)（★3）を 2(ふた)つ えらぶ → 武器(ぶき)！',
    en: 'Pick two kanji you have written ten times (★3): they become a weapon.',
  },
  {
    title: '本当(ほんとう)に ある 言葉(ことば)は 強(つよ)い',
    body: '「火(ひ)」＋「山(やま)」＝「火山(かざん)」。\n本当(ほんとう)に ある 言葉(ことば)です。とても 強(つよ)い 武器(ぶき)です。',
    en: 'Fire + mountain = kazan, "volcano" — a real word, so a strong weapon.',
  },
  {
    title: '言葉(ことば)で ない ものは 弱(よわ)い',
    body: '「山(やま)」＋「火(ひ)」＝「山火(やまひ)」。\nこれは 言葉(ことば)では ありません。弱(よわ)い 武器(ぶき)です。\nじゅんばんが 大事(だいじ)です。',
    en: 'Mountain + fire is not a word: the weapon is weak. The order matters.',
  },
  {
    title: 'たくさん 見(み)つけましょう',
    body: '本当(ほんとう)に ある 言葉(ことば)は {words}。\n新(あたら)しい 話(わ)の 字(じ) → もっと 強(つよ)い 武器(ぶき)。\nどの 話(わ)にも、かくし武器(ぶき)が 1(ひと)つ あります。',
    en: 'There are {words} real words to find. Kanji from later episodes make stronger weapons, and every episode hides one secret weapon.',
  },
];

export const ForgeTutorial = () => {
  const seen = useGameStore((s) => s.tutorials.forge);
  const markSeen = useGameStore((s) => s.markTutorialSeen);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const [index, setIndex] = useState(0);
  const [en, setEn] = useState(false);
  // The rest of the dictionary arrives just after start (data/compounds.ts).
  useCompoundsVersion();

  if (seen) return null;

  const words = getCompounds().length.toLocaleString('en-US');
  const card = { ...CARDS[index], body: CARDS[index].body.replace('{words}', words), en: CARDS[index].en.replace('{words}', words) };
  const last = index === CARDS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-6"
      >
        <motion.div
          key={index}
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="g-panel-solid w-full max-w-sm p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="g-eyebrow">
              <RubyText showFurigana={showFurigana}>漢字(かんじ)やさんの つかいかた</RubyText>
              <span className="ml-2 tabular-nums">
                {index + 1} / {CARDS.length}
              </span>
            </p>
            <button
              type="button"
              aria-pressed={en}
              className="rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px] font-bold whitespace-nowrap"
              onClick={() => setEn(!en)}
            >
              EN
            </button>
          </div>

          <h2 className="g-title mt-2 text-lg leading-snug">
            <RubyText showFurigana={showFurigana}>{card.title}</RubyText>
          </h2>
          <p className="mt-2 text-sm whitespace-pre-line" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>{card.body}</RubyText>
          </p>
          {en && (
            <p lang="en" className="mt-2 text-[13px] leading-snug font-bold" style={{ color: '#1b4f8f' }}>
              {card.en}
            </p>
          )}

          {/* 2枚目と3枚目は、実物を見せたほうが早い */}
          {index === 1 && (
            <div className="g-panel mt-3 flex items-center justify-center gap-2 p-3 text-center">
              <span className="text-2xl font-black">
                <RubyText showFurigana={showFurigana}>火(ひ)</RubyText>
              </span>
              <span style={{ color: 'var(--ink-3)' }}>＋</span>
              <span className="text-2xl font-black">
                <RubyText showFurigana={showFurigana}>山(やま)</RubyText>
              </span>
              <span style={{ color: 'var(--ink-3)' }}>＝</span>
              <span className="g-chip g-chip-gold text-sm">
                <RubyText showFurigana={showFurigana}>火山(かざん)</RubyText> ★★★★
              </span>
            </div>
          )}
          {index === 2 && (
            <div className="g-panel mt-3 flex items-center justify-center gap-2 p-3 text-center">
              <span className="text-2xl font-black">
                <RubyText showFurigana={showFurigana}>山(やま)</RubyText>
              </span>
              <span style={{ color: 'var(--ink-3)' }}>＋</span>
              <span className="text-2xl font-black">
                <RubyText showFurigana={showFurigana}>火(ひ)</RubyText>
              </span>
              <span style={{ color: 'var(--ink-3)' }}>＝</span>
              <span className="g-chip text-sm" style={{ color: 'var(--ink-3)' }}>
                <RubyText showFurigana={showFurigana}>山火(やまひ)</RubyText> ★
              </span>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              className="g-btn g-btn-ghost !min-h-[44px] !px-4 text-sm"
              onClick={() => markSeen('forge')}
            >
              とばす
            </button>
            <button
              type="button"
              className="g-btn g-btn-primary flex-1"
              onClick={() => (last ? markSeen('forge') : setIndex((i) => i + 1))}
            >
              {last ? (
                <RubyText showFurigana={showFurigana}>つくる！</RubyText>
              ) : (
                <RubyText showFurigana={showFurigana}>つぎへ</RubyText>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForgeTutorial;
