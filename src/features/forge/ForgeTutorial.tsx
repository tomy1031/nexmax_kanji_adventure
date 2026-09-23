import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';

/**
 * First visit to the forge.
 *
 * Four cards, then it never appears again. It exists because the rule that
 * makes the forge worth playing — *a real Japanese word beats a random pair* —
 * is invisible until you happen to stumble on one, and a learner who forges
 * three junk pairs first concludes the mechanic is a slot machine.
 */

const CARDS: { title: string; body: string }[] = [
  {
    title: '漢字(かんじ)を あわせて 武器(ぶき)を 作(つく)る',
    body: '手(て)に 入(い)れた 漢字(かんじ)を 2(ふた)つ えらぶと、武器(ぶき)に なります。',
  },
  {
    title: '本当(ほんとう)に ある 言葉(ことば)は 強(つよ)い',
    body: '「火(ひ)」＋「山(やま)」＝「火山(かざん)」。\nこれは 本当(ほんとう)に ある 言葉(ことば)なので、とても 強(つよ)い 武器(ぶき)に なります。',
  },
  {
    title: '言葉(ことば)に ならない 組(く)み合(あ)わせは 弱(よわ)い',
    body: '「山(やま)」＋「火(ひ)」＝「山火(やまひ)」。\nこれは 言葉(ことば)では ありません。武器(ぶき)は できますが、弱(よわ)いです。\nじゅんばんが 大事(だいじ)です。',
  },
  {
    title: 'たくさん 見(み)つけよう',
    body: 'この ゲームには 本当(ほんとう)に ある 言葉(ことば)が 1174(せんひゃくななじゅうよん) あります。\n漢字(かんじ)が ふえると、作(つく)れる 言葉(ことば)も ふえます。',
  },
];

export const ForgeTutorial = () => {
  const seen = useGameStore((s) => s.tutorials.forge);
  const markSeen = useGameStore((s) => s.markTutorialSeen);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const [index, setIndex] = useState(0);

  if (seen) return null;

  const card = CARDS[index];
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
          <p className="g-eyebrow">
            <RubyText showFurigana={showFurigana}>合成(ごうせい)の やりかた</RubyText>
            <span className="ml-2 tabular-nums">
              {index + 1} / {CARDS.length}
            </span>
          </p>

          <h2 className="g-title mt-2 text-lg leading-snug">
            <RubyText showFurigana={showFurigana}>{card.title}</RubyText>
          </h2>
          <p className="mt-2 text-sm whitespace-pre-line" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>{card.body}</RubyText>
          </p>

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
                <RubyText showFurigana={showFurigana}>やってみる</RubyText>
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
