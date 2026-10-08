import { motion } from 'framer-motion';
import PictureBook from '../picturebook/PictureBook';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import type { Compound } from '../../types/forge';
import { canSpeak, speak } from '../../lib/speech';
import * as sfx from '../../lib/sfx';
import { useEffect } from 'react';

/**
 * 町の ことば (docs/design/19 §4 D): after an episode's story, the words it
 * said that the player can now read whole — 学生, 先生, 毎日 … — are put in
 * ことば図鑑, and shown here once, each with its reading, its sound (tap) and,
 * with EN on, its meaning. A word only says it is new; nothing to answer.
 */
export const TownWords = ({ scene, words, onNext }: { scene: string; words: readonly Compound[]; onNext: () => void }) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const en = useGameStore((s) => s.settings.english);
  useEffect(() => {
    sfx.chime();
  }, []);

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center justify-center px-5 pb-6">
      <PictureBook scene={scene} className="!fixed -z-10" still signsFaint />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0e0b22]/55" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="g-novel-box g-novel-night max-h-[90dvh] w-full max-w-sm overflow-y-auto px-5 py-5 text-center"
      >
        <p className="text-2xl leading-[1.8] font-black" style={{ color: '#ffd36a' }}>
          📗 <RubyText showFurigana={showFurigana}>町(まち)の ことば</RubyText>
        </p>
        <p className="mt-1 text-sm leading-[2] font-bold">
          <RubyText showFurigana={showFurigana}>お話(はなし)の ことばが、ことば図鑑(ずかん)に 入(はい)りました！</RubyText>
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {words.map((w, i) => (
            <motion.li
              key={w.word}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.12 }}
            >
              <button
                type="button"
                data-tap
                className="flex w-full items-center gap-2 rounded-xl border border-[#c8913e]/70 bg-black/30 px-3 py-1 text-left"
                onClick={() => canSpeak() && speak(w.reading)}
              >
                <span className="text-[22px] leading-[1.9] font-black text-[#fff1cf]">
                  <RubyText showFurigana={showFurigana}>{`${w.word}(${w.reading})`}</RubyText>
                </span>
                {en && (
                  <span lang="en" className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#9fd0ff]">
                    {w.gloss}
                  </span>
                )}
                {canSpeak() && (
                  <span aria-hidden className="ml-auto shrink-0 text-[15px]">
                    🔊
                  </span>
                )}
              </button>
            </motion.li>
          ))}
        </ul>
        <button type="button" data-tap className="g-btn g-btn-primary mt-4 w-full" onClick={onNext}>
          <RubyText showFurigana={showFurigana}>つぎへ ▶</RubyText>
        </button>
      </motion.div>
    </div>
  );
};

export default TownWords;
