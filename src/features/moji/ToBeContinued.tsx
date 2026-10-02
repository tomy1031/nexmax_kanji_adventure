import { motion } from 'framer-motion';
import PictureBook from '../picturebook/PictureBook';
import { RubyText } from '../../components/ui/Ruby';
import { NexmaxSays } from '../../components/ui/Chrome';
import { useGameStore } from '../../store/gameStore';
import { isForgeOpen, practiceTarget } from '../../data/mojiFlow';
import { charRuby } from '../../lib/reading';
import { useBgm } from '../../lib/bgm';

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

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center justify-center px-5 pb-6">
      <PictureBook scene={scene} className="!fixed -z-10" still />
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#0e0b22]/55" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="g-parchment w-full max-w-sm px-5 py-5 text-center"
      >
        <p className="text-3xl leading-[1.6] font-black tracking-[0.2em]" style={{ color: 'var(--accent-2)' }}>
          つづく
        </p>
        <p className="mt-1 text-sm leading-[2] font-bold">
          <RubyText showFurigana={showFurigana}>つぎの 話(はなし)は じゅんび中(ちゅう)です。</RubyText>
        </p>
        <div className="mt-2 flex justify-center">
          <NexmaxSays text={target ? '⭐を ふやそう！' : 'ぜんぶ ⭐⭐⭐！'} pose="cheer" size={64} />
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
