import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CastMember, NovelScript } from '../../types/novel';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';

/**
 * The novel scene — dating-sim shaped, because that shape is good at one
 * thing this game needs: putting a small amount of text on screen at a
 * comfortable reading pace, with a face attached to it.
 *
 * Layout on a phone: art fills the screen, the speaker's sprite stands on the
 * lower half, and the dialogue box owns the bottom third. Nothing important
 * ever renders under the box.
 */

interface NovelSceneProps {
  script: NovelScript;
  cast: CastMember[];
  onFinish: () => void;
}

export const NovelScene = ({ script, cast, onFinish }: NovelSceneProps) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const [index, setIndex] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [seen, setSeen] = useState<number[]>([0]);

  const castById = useMemo(() => new Map(cast.map((c) => [c.id, c])), [cast]);
  const line = script.lines[index];

  /**
   * Background and sprite carry over from earlier lines, so the current
   * picture is whatever the most recent line that set one asked for.
   *
   * One exception: when the speaker changes and the line does not name a
   * sprite, the new speaker's default portrait is shown. Without this a line
   * carries the *previous* character's sprite, so the name plate says one
   * person and the picture shows another.
   */
  const { bg, sprite } = useMemo(() => {
    let b: string | undefined;
    let s: string | undefined;
    let lastSpeaker: string | null | undefined;

    for (let i = 0; i <= index; i++) {
      const l = script.lines[i];
      if (l.bg) b = l.bg;

      if (l.sprite) {
        s = l.sprite === 'none' ? undefined : l.sprite;
      } else if (l.speaker && l.speaker !== lastSpeaker) {
        s = `${l.speaker}:normal`;
      }

      // Narration (no speaker) leaves the standing character in place.
      if (l.speaker !== undefined && l.speaker !== null) lastSpeaker = l.speaker;
    }
    return { bg: b, sprite: s };
  }, [script, index]);

  const speaker = line?.speaker ? castById.get(line.speaker) : undefined;

  const [spriteId, spriteExpr] = sprite?.split(':') ?? [];
  const spriteMember = spriteId ? castById.get(spriteId) : undefined;
  const spriteSrc = spriteMember?.sprites[spriteExpr ?? 'normal'] ?? spriteMember?.sprites.normal;

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= script.lines.length) {
        onFinish();
        return;
      }
      setIndex(nextIndex);
      setSeen((s) => (s.includes(nextIndex) ? s : [...s, nextIndex]));
    },
    [script.lines.length, onFinish],
  );

  const advance = useCallback(() => {
    if (!line) return;
    // A line with choices waits for one; it is not advanced by tapping.
    if (line.choices?.length) return;

    if (line.goto) {
      const target = script.lines.findIndex((l) => l.label === line.goto);
      goTo(target === -1 ? index + 1 : target);
      return;
    }
    goTo(index + 1);
  }, [line, script.lines, index, goTo]);

  const choose = (label: string) => {
    const target = script.lines.findIndex((l) => l.label === label);
    goTo(target === -1 ? index + 1 : target);
  };

  // Space and Enter advance, for anyone on a keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  if (!line) return null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* 背景 ------------------------------------------------------------ */}
      <AnimatePresence mode="popLayout">
        {bg && (
          <motion.img
            key={bg}
            src={assetPath(`img/bg/${bg}.webp`)}
            alt=""
            aria-hidden
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              /*
                The picture-book spreads still have their narration painted
                into the art, and a portrait crop of a 2.8:1 spread lands
                right on it. A soft blur puts the background where a novel
                scene wants it anyway — behind the character and the text —
                and takes the baked-in captions below the threshold of
                reading, so they cannot compete with the real dialogue.
                Scaled up slightly so the blur does not bleed the edges in.
                Drop this once the text-free backgrounds are generated
                (docs/skills/画像生成プロンプト.md §1).
              */
              filter: 'blur(5px) saturate(1.05)',
              transform: 'scale(1.06)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Darkens the top so the status chips and any surviving baked-in text
          sit back, and lifts contrast under the character. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,18,36,0.55) 0%, rgba(8,18,36,0.22) 38%, rgba(8,18,36,0.10) 70%, rgba(8,18,36,0.28) 100%)',
        }}
      />

      {/* 立ち絵 ----------------------------------------------------------- */}
      <AnimatePresence>
        {spriteSrc && (
          <motion.img
            key={spriteSrc}
            src={assetPath(spriteSrc)}
            alt=""
            aria-hidden
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            // Anchored above the dialogue box so the character is never cut
            // off by it.
            className="pointer-events-none absolute bottom-[34dvh] left-1/2 max-h-[46dvh] -translate-x-1/2 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          />
        )}
      </AnimatePresence>

      {/* 上のバー -------------------------------------------------------- */}
      <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-3 pt-3">
        <span className="g-chip !bg-black/45 !text-white !border-white/20 text-xs tabular-nums">
          {index + 1} / {script.lines.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="g-btn !min-h-[36px] !px-3 !bg-black/45 !text-white text-xs"
            onClick={() => setShowLog(true)}
          >
            ログ
          </button>
          <button
            type="button"
            className="g-btn !min-h-[36px] !px-3 !bg-black/45 !text-white text-xs"
            onClick={onFinish}
          >
            とばす
          </button>
        </div>
      </div>

      {/* 会話ボックス ---------------------------------------------------- */}
      <button
        type="button"
        onClick={advance}
        aria-label="つぎへ"
        className="absolute inset-0 z-10 cursor-pointer"
        // The whole screen advances the scene, which is what a reader expects
        // and what a thumb can reach.
        disabled={Boolean(line.choices?.length)}
      />

      <div className="absolute right-0 bottom-0 left-0 z-20 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {speaker && (
          <div
            className="g-chip mb-1.5 ml-1 !border-transparent text-sm !text-white"
            style={{ background: speaker.color ?? 'var(--accent)' }}
          >
            <RubyText showFurigana={showFurigana}>{speaker.name}</RubyText>
          </div>
        )}

        <div className="g-novel-box min-h-[30dvh] px-4 py-3.5">
          <p className="text-[15px] leading-[2.1] whitespace-pre-line">
            <RubyText showFurigana={showFurigana}>{line.text}</RubyText>
          </p>

          {line.choices?.length ? (
            <div className="mt-3 flex flex-col gap-2">
              {line.choices.map((c) => (
                <button
                  key={c.next}
                  type="button"
                  className="g-btn g-btn-accent w-full !min-h-[52px] text-sm leading-snug"
                  onClick={() => choose(c.next)}
                >
                  <RubyText showFurigana={showFurigana}>{c.label}</RubyText>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex justify-end">
              <motion.span
                aria-hidden
                animate={{ y: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-xl"
                style={{ color: 'var(--accent)' }}
              >
                ▼
              </motion.span>
            </div>
          )}
        </div>
      </div>

      {/* ログ ------------------------------------------------------------ */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col bg-black/85 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="g-title text-white">ログ</h2>
              <button
                type="button"
                className="g-btn g-btn-ghost !min-h-[40px] !bg-white/90"
                onClick={() => setShowLog(false)}
              >
                とじる
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pb-6">
              {seen
                .slice()
                .sort((a, b) => a - b)
                .map((i) => {
                  const l = script.lines[i];
                  const who = l.speaker ? castById.get(l.speaker) : undefined;
                  return (
                    <div key={i} className="text-sm text-white/90">
                      {who && (
                        <span className="mr-2 font-bold" style={{ color: who.color }}>
                          <RubyText showFurigana={showFurigana}>{who.name}</RubyText>
                        </span>
                      )}
                      <RubyText showFurigana={showFurigana}>{l.text}</RubyText>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NovelScene;
