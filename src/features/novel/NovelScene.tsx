import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CastMember, NovelScript } from '../../types/novel';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { parseRuby, stripRuby } from '../../lib/ruby';
import { glossFor } from '../../data/glossary';
import { canSpeak, speak, stopSpeaking } from '../../lib/speech';
import { useGameStore } from '../../store/gameStore';
import PictureBook from '../picturebook/PictureBook';

/**
 * The novel scene, set in a moving picture book.
 *
 * Layout on a phone (public/img/design/山の向こうの生命草.png):
 *   - the picture-book scene fills the screen and moves;
 *   - a wooden sign top-left says where we are (むかし編 1-1 + the title);
 *   - オート / ログ / スキップ top-right;
 *   - the speaker stands just above the scroll-shaped dialogue box, which owns
 *     the bottom third. Nothing important renders under the box.
 */

interface NovelSceneProps {
  script: NovelScript;
  cast: CastMember[];
  onFinish: () => void;
  /** Shown on the wooden sign, both in furigana notation. */
  chapter?: { label: string; title: string };
}

/** The annotated words of a line, each with its English. Words without one are left out. */
const lineWords = (text: string): { word: string; gloss: string }[] => {
  const seen = new Set<string>();
  const out: { word: string; gloss: string }[] = [];
  for (const seg of parseRuby(text)) {
    if (!seg.reading || /^[0-9０-９]/.test(seg.text) || seen.has(seg.text)) continue;
    seen.add(seg.text);
    const gloss = glossFor(seg.text);
    if (gloss) out.push({ word: `${seg.text}(${seg.reading})`, gloss });
  }
  return out;
};

/** Reading time for auto mode: a base plus a little per character. */
const autoDelay = (text: string) => 1600 + stripRuby(text).length * 85;

export const NovelScene = ({ script, cast, onFinish, chapter }: NovelSceneProps) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const [index, setIndex] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [auto, setAuto] = useState(false);
  const [seen, setSeen] = useState<number[]>([0]);
  /**
   * ことば: the words of this line with their English. Closed again on every
   * new line — the learner tries the line first, then looks up what they
   * could not read (docs/design/07 §3).
   */
  const [wordsFor, setWordsFor] = useState<number | null>(null);
  useEffect(() => stopSpeaking, []);

  const castById = useMemo(() => new Map(cast.map((c) => [c.id, c])), [cast]);
  const line = script.lines[index];

  /**
   * Scene, effects and sprite carry over from earlier lines, so the current
   * picture is whatever the most recent line that set one asked for.
   *
   * Two rules on top of that:
   *   - when the speaker changes and the line does not name a sprite, the new
   *     speaker's default portrait is shown (otherwise the name plate says one
   *     person and the picture shows another);
   *   - a scene change clears the effects, so rain does not follow Nexmax
   *     indoors.
   */
  const { bg, fx, sprite } = useMemo(() => {
    let b: string | undefined;
    let f: string[] = [];
    let s: string | undefined;
    let lastSpeaker: string | null | undefined;

    for (let i = 0; i <= index; i++) {
      const l = script.lines[i];
      if (l.bg && l.bg !== b) {
        b = l.bg;
        f = [];
      }
      if (l.fx) f = l.fx;

      if (l.sprite) {
        s = l.sprite === 'none' ? undefined : l.sprite;
      } else if (l.speaker && l.speaker !== lastSpeaker) {
        s = `${l.speaker}:normal`;
      }

      // Narration (no speaker) leaves the standing character in place.
      if (l.speaker !== undefined && l.speaker !== null) lastSpeaker = l.speaker;
    }
    return { bg: b ?? 'mukashi_village', fx: f, sprite: s };
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

  // オート: turn the page after a reading pause. Choices always wait.
  useEffect(() => {
    if (!auto || showLog || !line || line.choices?.length) return;
    const t = setTimeout(advance, autoDelay(line.text));
    return () => clearTimeout(t);
  }, [auto, showLog, line, advance]);

  if (!line) return null;

  const topButton = 'g-btn g-btn-accent !min-h-[36px] !px-3 !gap-1 text-xs';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#cfe9f5]">
      {/* 絵本 ------------------------------------------------------------ */}
      <PictureBook scene={bg} fx={fx} />

      {/* 大きな字（きざんだ字など） -------------------------------------- */}
      <AnimatePresence>
        {line.glyph && (
          <motion.div
            key={line.glyph}
            initial={{ opacity: 0, scale: 1.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="pointer-events-none absolute top-[16dvh] left-1/2 z-10 -translate-x-1/2 text-center text-[88px] leading-none font-black"
            style={{
              color: '#fff3c2',
              textShadow: '0 0 18px rgba(255,210,90,0.95), 0 0 42px rgba(255,190,60,0.7), 0 4px 0 #7a4a26',
            }}
          >
            <RubyText showFurigana>{line.glyph}</RubyText>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 立ち絵（切り抜き） ------------------------------------------------ */}
      <AnimatePresence>
        {spriteSrc && (
          <motion.div
            key={spriteSrc}
            initial={{ opacity: 0, y: 24, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35 }}
            // Anchored above the dialogue box so the character is never cut
            // off by it.
            className="pointer-events-none absolute bottom-[33dvh] left-1/2 z-10 h-[34dvh] -translate-x-1/2"
          >
            <motion.img
              src={assetPath(spriteSrc)}
              alt=""
              aria-hidden
              className="h-full w-auto object-contain"
              // A paper cut-out: white rim, soft shadow — the same finish as
              // the scene, without redrawing the character.
              style={{
                filter:
                  'drop-shadow(2px 0 0 #fffaf0) drop-shadow(-2px 0 0 #fffaf0) drop-shadow(0 2px 0 #fffaf0) drop-shadow(0 -2px 0 #fffaf0) drop-shadow(0 8px 10px rgba(40,25,5,0.35))',
              }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 上: 看板とボタン ------------------------------------------------ */}
      <div className="absolute top-0 right-0 left-0 z-20 flex items-start justify-between gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))]">
        {chapter ? (
          <div className="flex min-w-0 flex-col items-start">
            <div className="g-wood flex items-center gap-1.5 px-3 py-1 text-sm font-black whitespace-nowrap">
              <span aria-hidden>📖</span>
              <RubyText showFurigana={showFurigana}>{chapter.label}</RubyText>
            </div>
            <div className="g-parchment -mt-1 ml-2 max-w-[52vw] truncate !rounded-md px-3 py-0.5 text-xs font-bold">
              <RubyText showFurigana={showFurigana}>{chapter.title}</RubyText>
            </div>
          </div>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            className={topButton}
            aria-pressed={auto}
            style={auto ? { background: 'linear-gradient(180deg,#ffd24a,#f28a00)' } : undefined}
            onClick={() => setAuto((a) => !a)}
          >
            <span aria-hidden>▶</span>オート
          </button>
          <button type="button" className={topButton} onClick={() => setShowLog(true)}>
            <span aria-hidden>≡</span>ログ
          </button>
          <button type="button" className={topButton} onClick={onFinish}>
            <span aria-hidden>»</span>スキップ
          </button>
        </div>
      </div>

      {/* 画面ぜんたいで ページを めくる --------------------------------- */}
      <button
        type="button"
        onClick={advance}
        aria-label="つぎへ"
        className="absolute inset-0 z-10 cursor-pointer"
        disabled={Boolean(line.choices?.length)}
      />

      {/* 会話ボックス（巻物） ------------------------------------------- */}
      <div className="absolute right-0 bottom-0 left-0 z-20 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {speaker && (
          <div className="g-wood relative z-10 mb-[-10px] ml-3 inline-flex items-center px-4 py-1 text-base font-black">
            <RubyText showFurigana={showFurigana}>{speaker.name}</RubyText>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0.6, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="g-novel-box min-h-[29dvh] px-5 pt-5 pb-3"
            onClick={advance}
          >
            <p className="text-[16px] leading-[2.15] font-bold whitespace-pre-line">
              <RubyText showFurigana={showFurigana}>{line.text}</RubyText>
            </p>

            {wordsFor === index && (
              <div className="mt-1 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                {lineWords(line.text).map(({ word, gloss }) => (
                  <span key={word} className="rounded-lg border border-[#caa468] bg-white/80 px-2 text-[12px] leading-[2]">
                    <RubyText showFurigana>{word}</RubyText>
                    <span className="ml-1 font-bold" style={{ color: '#1b63b0' }}>
                      {gloss}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {line.choices?.length ? (
              <div className="mt-3 flex flex-col gap-2">
                {line.choices.map((c) => (
                  <button
                    key={c.next}
                    type="button"
                    className="g-btn g-btn-accent w-full !min-h-[52px] text-sm leading-snug"
                    onClick={(e) => {
                      e.stopPropagation();
                      choose(c.next);
                    }}
                  >
                    <RubyText showFurigana={showFurigana}>{c.label}</RubyText>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-end gap-1 text-xs font-bold" style={{ color: '#8a6a44' }}>
                <div className="mr-auto flex gap-1.5">
                  {canSpeak() && (
                    <button
                      type="button"
                      aria-label="よみあげ"
                      className="rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(line.text);
                      }}
                    >
                      🔊 よみあげ
                    </button>
                  )}
                  {lineWords(line.text).length > 0 && (
                    <button
                      type="button"
                      aria-pressed={wordsFor === index}
                      className="rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWordsFor(wordsFor === index ? null : index);
                      }}
                    >
                      ？ ことば
                    </button>
                  )}
                </div>
                タップで つづく
                <motion.span
                  aria-hidden
                  animate={{ y: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-base"
                >
                  ▼
                </motion.span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ログ ------------------------------------------------------------ */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col bg-black/80 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="g-title text-white">ログ</h2>
              <button type="button" className="g-btn g-btn-accent !min-h-[40px]" onClick={() => setShowLog(false)}>
                とじる
              </button>
            </div>
            <div className="g-parchment flex-1 space-y-3 overflow-y-auto p-4 pb-6">
              {seen
                .slice()
                .sort((a, b) => a - b)
                .map((i) => {
                  const l = script.lines[i];
                  const who = l.speaker ? castById.get(l.speaker) : undefined;
                  return (
                    <div key={i} className="text-sm">
                      {who && (
                        <span className="mr-2 font-black" style={{ color: who.color }}>
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
