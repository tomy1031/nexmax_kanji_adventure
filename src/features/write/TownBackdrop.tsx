import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PictureBook from '../picturebook/PictureBook';
import { SCENES } from '../picturebook/scenes';
import { signPageX, signPageY } from '../picturebook/hasSign';
import { RubyText } from '../../components/ui/Ruby';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { charRuby } from '../../lib/reading';
import { signRuby } from '../picturebook/signReading';
import { useGameStore } from '../../store/gameStore';
import { playJingle } from '../../lib/bgm';

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
      {/* Signs faint here: behind the drill they only clutter it (on a wide screen they are
          huge beside it). The town shot shows a sign lighting up, full size. */}
      <PictureBook scene={scene} still signsFaint />
      {/* The night over the town lifts as the letters come back (the scene's
          own signs veil it too, SceneSigns); dim enough for the drill to read. */}
      <motion.div className="absolute inset-0 bg-[#0e0b28]" initial={false} animate={{ opacity: 0.5 - 0.25 * back }} transition={{ duration: 0.9 }} />
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
  const reduced = useGameStore((s) => s.settings.reducedMotion);
  // The sign says the letter as the story reads it there (the calendar's 水 is すい).
  const sign = SCENES[scene]?.signs?.spots.find((s) => s.char === char);
  // The camera moves in on the sign (transform only): where it sits on screen,
  // with the picture's object-cover.
  const [origin] = useState(() => {
    const signs = SCENES[scene]?.signs;
    const spot = signs?.spots.find((s) => s.char === char);
    if (!signs || !spot) return '50% 40%';
    const [iw, ih] = signs.image;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const k = Math.max(w / iw, h / ih);
    // A wide screen slides the page so the signs show (PictureBook, signPageY).
    const top = signPageY(signs, ih * k, h) ?? (h - ih * k) / 2;
    const leftEdge = signPageX(signs, iw * k, w) ?? (w - iw * k) / 2;
    const x = leftEdge + (spot.x + spot.w / 2) * k;
    const y = top + (spot.y + spot.h / 2) * k;
    return `${((x / w) * 100).toFixed(1)}% ${((y / h) * 100).toFixed(1)}%`;
  });
  // Dark for a beat, then lit, so the change itself is seen.
  const [held, setHeld] = useState(true);
  useEffect(() => {
    const light = setTimeout(() => {
      setHeld(false);
      playJingle();
    }, 900);
    const done = setTimeout(onDone, 2500);
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
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: origin, willChange: 'transform' }}
        initial={{ scale: 1 }}
        animate={{ scale: reduced ? 1 : 1.55 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      >
        <PictureBook scene={scene} still signHold={held ? char : undefined} />
      </motion.div>
      <motion.span
        className="rt-light absolute inset-x-0 bottom-[14dvh] mx-auto w-max rounded-full border-2 border-[#c9a052] bg-[#1b1640]/85 px-5 text-xl leading-[2.2] font-black text-[#ffe7b8]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: held ? 0 : 1, y: held ? 10 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <RubyText showFurigana={furigana}>{sign ? signRuby(sign) : charRuby(char)}</RubyText> 💡
      </motion.span>
    </motion.button>
  );
};
