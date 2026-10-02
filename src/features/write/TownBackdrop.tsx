import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PictureBook from '../picturebook/PictureBook';
import { RubyText } from '../../components/ui/Ruby';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { charRuby } from '../../lib/reading';
import { useGameStore } from '../../store/gameStore';

/**
 * The drill's backdrop on 文字が 消えた 町: the episode's own town, dark while
 * its letters are missing and brighter with every letter written; each write
 * that lights the sign sends a warm glow over the town (2026-10-02「書いた 時に
 * 街に 変化が 起こる ような 演出」). Nothing moves but opacity.
 */

/** Writes that bring a letter back (★1 for a kanji, KANA_REPS for a kana). */
const NEED = 3;

export const TownBackdrop = ({ scene, letters, pulse }: { scene: string; letters: readonly string[]; pulse: number }) => {
  const progress = useGameStore((s) => s.progress);
  const kana = useGameStore((s) => s.kana);
  const repsOf = (c: string) => {
    const k = getKanjiByChar(c);
    return k ? (progress[k.id]?.reps ?? 0) : (kana[c] ?? 0);
  };
  const back = letters.length ? letters.reduce((n, c) => n + Math.min(1, repsOf(c) / NEED), 0) / letters.length : 0;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#0e0b28]">
      <PictureBook scene={scene} still />
      {/* The night over the town lifts as the letters come back. */}
      <motion.div className="absolute inset-0 bg-[#0e0b28]" initial={false} animate={{ opacity: 0.72 - 0.42 * back }} transition={{ duration: 0.9 }} />
      {pulse > 0 && (
        <motion.div
          key={pulse}
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(255,200,110,0.5), transparent 65%)', willChange: 'opacity' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2 }}
        />
      )}
    </div>
  );
};

/**
 * A letter just came back: the town, full screen, and its sign lighting up —
 * then the card. A tap moves on at once.
 */
export const TownShot = ({ scene, char, onDone }: { scene: string; char: string; onDone: () => void }) => {
  const furigana = useGameStore((s) => s.settings.furigana);
  // Dark for a beat, then lit, so the change itself is seen.
  const [held, setHeld] = useState(true);
  useEffect(() => {
    const light = setTimeout(() => setHeld(false), 450);
    const done = setTimeout(onDone, 2100);
    return () => {
      clearTimeout(light);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <motion.button
      type="button"
      aria-label="つぎへ"
      className="fixed inset-0 z-40 block cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      <PictureBook scene={scene} still signHold={held ? char : undefined} />
      <motion.span
        className="rt-light absolute inset-x-0 bottom-[14dvh] mx-auto w-max rounded-full border-2 border-[#c9a052] bg-[#1b1640]/85 px-5 text-xl leading-[2.2] font-black text-[#ffe7b8]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: held ? 0 : 1, y: held ? 10 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <RubyText showFurigana={furigana}>{charRuby(char)}</RubyText> 💡
      </motion.span>
    </motion.button>
  );
};
