import { motion } from 'framer-motion';
import PictureBook from '../picturebook/PictureBook';
import { RubyText } from '../../components/ui/Ruby';
import { NexmaxSays } from '../../components/ui/Chrome';
import { useGameStore } from '../../store/gameStore';
import { isForgeOpen, practiceTarget } from '../../data/mojiFlow';
import { charRuby } from '../../lib/reading';
import { useBgm } from '../../lib/bgm';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { useOwnedKanji } from './useOwnedKanji';

/**
 * The end of the last written episode (08 §3.8): instead of dropping the
 * player on the map with nothing new, say that the story goes on, and offer
 * what there is to do meanwhile — more ★ (the episode whose kanji is closest
 * to ★3), 漢字やさん once it is open, or the map.
 */
export const ToBeContinued = ({
  scene,
  onPractice,
  onForge,
  onStages,
}: {
  scene: string;
  onPractice: (episodeId: string) => void;
  onForge: () => void;
  onStages: () => void;
}) => {
  useBgm('town');
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const cleared = useGameStore((s) => s.clearedStages);
  const target = practiceTarget(progress, cleared);
  const forge = isForgeOpen(cleared);
  // What the journey has done so far: every letter of the cleared episodes, lit once it is back.
  const owned = useOwnedKanji();
  const brought = MOJI_EPISODES.filter((e) => cleared.includes(e.id)).flatMap((e) => e.kanji);
  const lit = brought.filter((c) => owned.has(c)).length;

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center justify-center px-5 pb-6">
      <PictureBook scene={scene} className="!fixed -z-10" still signsFaint />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0e0b22]/55" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        // The town's night panel, like the story's dialogue box (NovelScene look="night").
        className="g-novel-box g-novel-night w-full max-w-sm px-5 py-5 text-center"
      >
        <p className="text-3xl leading-[1.6] font-black tracking-[0.2em]" style={{ color: '#ffd36a' }}>
          つづく
        </p>
        <p className="mt-1 text-sm leading-[2] font-bold">
          <RubyText showFurigana={showFurigana}>つぎの 話(はなし)は じゅんび中(ちゅう)です。</RubyText>
        </p>
        {brought.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-black text-[#ffe2a8]">
              <RubyText showFurigana={showFurigana}>{`町(まち)に もどった 字(じ) ${lit} / ${brought.length}`}</RubyText>
            </p>
            {/* The town's signs, one per letter: lit, or still dark. */}
            <div className="mt-1 flex flex-wrap justify-center gap-[3px]" role="img" aria-label={`${brought.length}字の うち ${lit}字`}>
              {brought.map((c, i) => (
                <motion.span
                  key={c}
                  className="flex h-7 w-6 items-center justify-center rounded border text-[13px] leading-none font-bold"
                  style={
                    owned.has(c)
                      ? { background: 'radial-gradient(circle at 50% 42%, #fff3d0 0%, #ffd27f 60%, #e8973a 100%)', borderColor: '#f6d488', color: '#3b1f00' }
                      : { background: 'linear-gradient(180deg, #282254 0%, #120f2b 100%)', borderColor: '#7a5220', color: 'transparent' }
                  }
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.025 }}
                >
                  {c}
                </motion.span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 flex justify-center">
          <NexmaxSays text={target ? '⭐を ふやそう！' : 'ぜんぶ ⭐⭐⭐！'} pose="cheer" size={56} />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {target && (
            <button type="button" className="g-btn g-btn-primary w-full !flex-col !gap-0 leading-tight" onClick={() => onPractice(target.episode)}>
              <RubyText showFurigana={showFurigana}>✎ ★を ふやす</RubyText>
              <span className="text-xs font-bold opacity-90">
                <RubyText showFurigana={showFurigana}>{`「${charRuby(target.char)}」あと ${target.left}回(かい)で ★3`}</RubyText>
              </span>
            </button>
          )}
          {forge && (
            <button type="button" className="g-btn g-btn-accent w-full" onClick={onForge}>
              🔨 <RubyText showFurigana={showFurigana}>漢字(かんじ)やさんへ</RubyText>
            </button>
          )}
          <button type="button" className="g-btn g-btn-ghost w-full" onClick={onStages}>
            <RubyText showFurigana={showFurigana}>ステージせんたくへ</RubyText>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ToBeContinued;
