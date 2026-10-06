import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CastMember, NovelScript } from '../../types/novel';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { stripRuby } from '../../lib/ruby';
import { wordsOfLine as lineWords } from '../../data/glossary';
import { canSpeak, speak, stopSpeaking } from '../../lib/speech';
import { useGameStore } from '../../store/gameStore';
import PictureBook from '../picturebook/PictureBook';
import { SCENES } from '../picturebook/scenes';
import { TypeReveal } from '../../components/ui/TypeReveal';
import { NamePlate } from './NamePlate';
import { useKnownLetters } from '../picturebook/useKnownLetters';
import { nameRevealed } from '../../lib/nameReveal';
import { useKnownKana } from '../kana/useKnownKana';
import { useOwnedKanji } from '../moji/useOwnedKanji';
import { useBgm, type BgmTrack } from '../../lib/bgm';
import { useStill } from '../../hooks/useStill';

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
  /**
   * Draws the lines and names instead of furigana notation. かな編 uses it
   * to put romaji over the kana the learner has not written yet.
   */
  renderText?: (text: string) => ReactNode;
  /**
   * What よみあげ says for a line; null hides the button. かな編 speaks only
   * the letters that have come back, and not the English lines.
   */
  speechFor?: (text: string) => string | null;
  /**
   * Who says the narration (lines with no speaker) — かな編's lines are the
   * player's own thoughts, so their plate says わたし (2026-10-02「誰の
   * セリフか 表示 必要」). Without it narration has no plate.
   */
  narrator?: string;
  /**
   * Draws names and translations: plain readable text. かな編 uses it so a
   * name plate is never eaten to holes the way Nexmax's speech is.
   * Defaults to renderText.
   */
  renderPlain?: (text: string) => ReactNode;
  /**
   * paper: the picture-book box (むかし編・現代編). night: 文字が 消えた 町's
   * indigo-and-brass box, with the speaker's face on the name plate.
   */
  look?: 'paper' | 'night';
  /** The music of this scene (lib/bgm.ts): the story's mood. */
  bgm?: BgmTrack;
  /**
   * Letters whose signs stay dark in this scene — the episode's own, in its
   * opening: the story is the town before they were written, even on a replay.
   */
  holdLetters?: readonly string[];
}

/** The colours that differ between the two boxes. */
const TONE = {
  paper: { ja: '#7a5a3a', en: '#1b63b0', foot: '#8a6a44', pill: 'rounded-full border-2 border-[#caa468] bg-white/80 px-2.5 py-0.5 text-[12px] whitespace-nowrap', button: 'g-btn g-btn-accent' },
  night: { ja: '#e9cfa4', en: '#9fd4ff', foot: '#d9bf8a', pill: 'g-pill-night rounded-full border-2 px-2.5 py-0.5 text-[12px] whitespace-nowrap', button: 'g-btn g-btn-night' },
} as const;

/** One carved letter is huge; a row of them (日 月 火 水 木) has to fit the screen. */
const glyphSize = (glyph: string): string => {
  // A kanji not written yet shows as its sound (やま for 山), which is longer:
  // size for whichever is longer, the letters or their readings.
  const readings = glyph.replace(/([^\s(（]+)[(（]([^)）]+)[)）]/g, '$2');
  const n = Math.max([...stripRuby(glyph).replace(/\s/g, '')].length, [...readings.replace(/\s/g, '')].length);
  return n <= 2 ? '88px' : n <= 4 ? '64px' : 'min(48px, 11vw)';
};

/** Reading time for auto mode: a base plus a little per character. */
const autoDelay = (text: string) => 1600 + stripRuby(text).length * 85;

export const NovelScene = ({ script, cast, onFinish, chapter, renderText, speechFor, narrator, renderPlain, look = 'paper', bgm = 'story', holdLetters }: NovelSceneProps) => {
  const night = look === 'night';
  const tone = TONE[look];
  const knownKana = useKnownKana();
  const owned = useOwnedKanji();
  useBgm(bgm);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const [index, setIndex] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [auto, setAuto] = useState(false);
  const [seen, setSeen] = useState<number[]>([0]);
  /**
   * ことば: the words of this line with their English. With the English
   * setting on (the default, 2026-10-04「言葉の 意味の 英語は デフォルトで ON」)
   * they are open on every line and ？ことば closes them for that line; with it
   * off they open only on ？ことば — the learner tries the line first, then
   * looks up what they could not read (docs/design/07 §3).
   */
  const wordsByDefault = useGameStore((s) => s.settings.english);
  const [wordsToggled, setWordsToggled] = useState<number | null>(null);
  const wordsOpen = wordsByDefault !== (wordsToggled === index);
  /** The line whose English is open. */
  const [enFor, setEnFor] = useState<number | null>(null);
  /** The line whose text has finished appearing (a tap while it appears shows it all). */
  const [shown, setShown] = useState(-1);
  const still = useStill();
  useEffect(() => stopSpeaking, []);

  const castById = useMemo(() => new Map(cast.map((c) => [c.id, c])), [cast]);
  const line = script.lines[index];

  // Fetch every portrait this script will show, so a change of expression
  // never leaves an empty gap while the picture loads.
  useEffect(() => {
    const srcs = new Set<string>();
    for (const l of script.lines) {
      const [id, expr] = (l.sprite && l.sprite !== 'none' ? l.sprite : l.speaker ? `${l.speaker}:normal` : '').split(':');
      const src = id ? (castById.get(id)?.sprites[expr ?? 'normal'] ?? castById.get(id)?.sprites.normal) : undefined;
      if (src) srcs.add(src);
    }
    for (const src of srcs) {
      const img = new Image();
      img.src = assetPath(src);
    }
  }, [script, castById]);

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
  const plain = renderPlain ?? renderText;
  /**
   * The letters of the big glyph are lit signs in this very scene: the town
   * already shows them, so the glyph is not drawn a second time over it.
   * (Letters still missing keep their glyph — that is how the gap is shown.)
   */
  const knownLetters = useKnownLetters();
  const glyph = line?.glyph;
  const glyphOnSigns = useMemo(() => {
    const spots = SCENES[bg]?.signs?.spots;
    if (!glyph || !spots) return false;
    const chars = [...stripRuby(glyph).replace(/\s/g, '')];
    return chars.length > 0 && chars.every((c) => knownLetters.has(c) && !holdLetters?.includes(c) && spots.some((s) => s.char === c));
  }, [bg, glyph, knownLetters, holdLetters]);

  const [spriteId, spriteExpr] = sprite?.split(':') ?? [];
  const spriteMember = spriteId ? castById.get(spriteId) : undefined;
  const spriteSrc = spriteMember?.sprites[spriteExpr ?? 'normal'] ?? spriteMember?.sprites.normal;
  /**
   * The standing character is not the one saying this line. A line that sets
   * the picture itself is showing that character's reaction, so it stays bright.
   */
  const listening = Boolean(spriteId) && line?.speaker !== spriteId && !line?.sprite;

  // The first line on 文字が 消えた 町 that has English: say once what the
  // small buttons do, in English (2026-10-02, a player who cannot read Japanese
  // meets an all-Japanese line here for the first time after 0章).
  const toolsSeen = useGameStore((s) => s.tutorials.tools);
  const markSeen = useGameStore((s) => s.markTutorialSeen);
  const toolsHint = night && !toolsSeen && Boolean(line?.en);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (toolsHint) markSeen('tools');
      if (nextIndex >= script.lines.length) {
        onFinish();
        return;
      }
      setIndex(nextIndex);
      setSeen((s) => (s.includes(nextIndex) ? s : [...s, nextIndex]));
    },
    [script.lines.length, onFinish, toolsHint, markSeen],
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

  /** A tap while the line is still appearing shows the rest of it; the next tap turns the page. */
  const tap = useCallback(() => {
    if (shown !== index) setShown(index);
    else advance();
  }, [shown, index, advance]);

  const choose = (label: string) => {
    const target = script.lines.findIndex((l) => l.label === label);
    goTo(target === -1 ? index + 1 : target);
  };

  // Space and Enter advance, for anyone on a keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap]);

  // オート: turn the page after a reading pause. Choices always wait.
  useEffect(() => {
    if (!auto || showLog || !line || line.choices?.length) return;
    const t = setTimeout(advance, autoDelay(line.text));
    return () => clearTimeout(t);
  }, [auto, showLog, line, advance]);

  if (!line) return null;

  const topButton = `${tone.button} !min-h-[36px] !px-3 !gap-1 text-xs`;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#cfe9f5]">
      {/* 絵本 ------------------------------------------------------------ */}
      <PictureBook scene={bg} fx={fx} signsFaint={Boolean(line.glyph) && !glyphOnSigns} signHold={holdLetters} />

      {/* 大きな字（きざんだ字など） -------------------------------------- */}
      <AnimatePresence>
        {line.glyph && !glyphOnSigns && (
          <motion.div
            key={line.glyph}
            initial={{ opacity: 0, scale: 1.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className={`pointer-events-none absolute top-[16dvh] left-1/2 z-10 w-max max-w-[92vw] -translate-x-1/2 text-center leading-[1.15] ${
              night ? 'rt-light rounded-2xl border-2 border-[#c9a052] bg-[#1b1640]/80 px-5 py-1 font-bold' : 'font-black'
            }`}
            // One carved letter is huge; a row of them (日 月 火 水 木) has to fit the screen.
            // On 文字が 消えた 町 the letters sit plain on a dark plate — not glowing
            // and swollen (2026-10-02「漢字 自体が 光で 太字に 表示されるのは よくない」).
            style={
              night
                ? { fontSize: glyphSize(line.glyph), color: '#fff3dc' }
                : {
                    fontSize: glyphSize(line.glyph),
                    color: '#fff3c2',
                    textShadow: '0 0 18px rgba(255,210,90,0.95), 0 0 42px rgba(255,190,60,0.7), 0 4px 0 #7a4a26',
                  }
            }
          >
            {renderText ? renderText(line.glyph) : <RubyText showFurigana>{line.glyph}</RubyText>}
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
            className="pointer-events-none absolute bottom-[27dvh] left-1/2 z-10 h-[38dvh] -translate-x-1/2"
          >
            {/* The breathing moves this wrapper; the filtered picture inside
                stays still, so the phone draws its outline once instead of
                every frame. */}
            <motion.div
              className="h-full"
              style={{ willChange: 'transform' }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img
                src={assetPath(spriteSrc)}
                alt=""
                aria-hidden
                className="h-full w-auto object-contain"
                // On the paper picture book: a paper cut-out, white rim and soft
                // shadow — the same finish as the scene. On a painted scene the
                // character stands in it: only a soft shadow, no sticker rim.
                // Not the one talking (narration, or someone else): a little
                // darker, so it is clear who says the line (2026-10-02「誰の セリフか」).
                style={{
                  filter: spriteMember?.silhouette
                    ? 'brightness(0.08) drop-shadow(0 0 14px rgba(130,70,210,0.85))'
                    : `${listening ? 'brightness(0.7) ' : ''}${
                        SCENES[bg]?.photo
                          ? 'drop-shadow(0 10px 14px rgba(10,6,30,0.45))'
                          : 'drop-shadow(2px 0 0 #fffaf0) drop-shadow(-2px 0 0 #fffaf0) drop-shadow(0 2px 0 #fffaf0) drop-shadow(0 -2px 0 #fffaf0) drop-shadow(0 8px 10px rgba(40,25,5,0.35))'
                      }`,
                  transition: 'filter 200ms',
                }}
              />
            </motion.div>
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
        onClick={tap}
        aria-label="つぎへ"
        className="absolute inset-0 z-10 cursor-pointer"
        disabled={Boolean(line.choices?.length)}
      />

      {/* 会話ボックス（巻物） ------------------------------------------- */}
      {/* On a tablet the box stops at a readable width and the text grows with it,
          instead of one small line across a 1160px-wide empty box. */}
      <div className="absolute right-0 bottom-0 left-0 z-20 mx-auto max-w-[880px] p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <NamePlate
          member={speaker}
          narrator={line && !line.speaker ? narrator : undefined}
          night={night}
          render={(t) => (plain ? plain(t) : <RubyText showFurigana={showFurigana}>{t}</RubyText>)}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0.6, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className={`g-novel-box min-h-[23dvh] px-5 pt-5 pb-3 ${night ? 'g-novel-night' : ''}`}
            onClick={tap}
          >
            <TypeReveal
              revealKey={index}
              full={still || shown === index}
              onDone={() => setShown(index)}
              className="text-[16px] leading-[2.15] font-bold whitespace-pre-line md:text-[22px]"
            >
              {renderText ? renderText(line.text) : <RubyText showFurigana={showFurigana}>{line.text}</RubyText>}
            </TypeReveal>

            {/* The Japanese of an English line, once the line has appeared. */}
            {line.ja && (
              <p
                className={`mt-0.5 text-[14px] leading-[2.2] font-bold transition-opacity duration-300 md:text-[18px] ${shown === index ? 'opacity-100' : 'opacity-0'}`}
                style={{ color: tone.ja }}
                lang="ja"
              >
                {plain ? plain(line.ja) : <RubyText showFurigana={showFurigana}>{line.ja}</RubyText>}
              </p>
            )}

            {enFor === index && line.en && (
              <p className="mt-1 text-[13px] leading-snug font-bold md:text-[16px]" style={{ color: tone.en }} lang="en">
                {line.en}
              </p>
            )}

            {wordsOpen && (
              <div className="mt-1 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                {lineWords(line.text).map(({ word, gloss }) => (
                  <span
                    key={word}
                    className={`rounded-lg border px-2 text-[13px] leading-[2] font-bold ${night ? 'border-[#c9a052]/70 bg-white/10 text-[#fff3dc]' : 'border-[#caa468] bg-white/85 text-[#3a2814] [&_rt]:text-[#8a6a44]'}`}
                  >
                    <RubyText showFurigana>{word}</RubyText>
                    <span lang="en" className="ml-1.5 font-extrabold" style={{ color: tone.en }}>
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
              <div className="mt-1 flex items-center justify-end gap-1 text-xs font-bold" style={{ color: tone.foot }}>
                <div className="mr-auto flex min-w-0 flex-wrap gap-1.5">
                  {canSpeak() && (speechFor ? speechFor(line.text) : line.text) && (
                    <button
                      type="button"
                      aria-label="よみあげ"
                      className={tone.pill}
                      onClick={(e) => {
                        e.stopPropagation();
                        speak((speechFor ? speechFor(line.text) : line.text) ?? '');
                      }}
                    >
                      🔊 よみあげ
                    </button>
                  )}
                  {line.en && (
                    <button
                      type="button"
                      aria-pressed={enFor === index}
                      className={tone.pill}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnFor(enFor === index ? null : index);
                      }}
                    >
                      EN
                    </button>
                  )}
                  {lineWords(line.text).length > 0 && (
                    <button
                      type="button"
                      aria-pressed={wordsOpen}
                      className={tone.pill}
                      onClick={(e) => {
                        e.stopPropagation();
                        setWordsToggled(wordsToggled === index ? null : index);
                      }}
                    >
                      ？ ことば
                    </button>
                  )}
                </div>
                {/* The page-turn mark appears once the line has finished appearing. */}
                <span className={`flex shrink-0 items-center gap-1 whitespace-nowrap transition-opacity duration-200 ${shown === index ? 'opacity-100' : 'opacity-0'}`}>
                  タップで つづく
                  <motion.span
                    aria-hidden
                    animate={{ y: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-base"
                  >
                    ▼
                  </motion.span>
                </span>
              </div>
            )}

            {toolsHint && (
              <motion.p
                lang="en"
                className="mt-2 rounded-xl border-2 border-dashed border-[#c9a052] px-3 py-1.5 text-[12px] leading-snug font-bold text-[#ffe7b8]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                👆 <b>🔊</b> listen · <b>EN</b> English · <b>？ ことば</b> word meanings
              </motion.p>
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
                  const name = who?.nameChars && !nameRevealed(who.nameChars, knownKana, owned) ? '？？？' : (who?.name ?? (l.speaker ? undefined : narrator));
                  return (
                    <div key={i} className="text-sm">
                      {name && (
                        <span className="mr-2 font-black" style={{ color: who?.color ?? '#7a5a3a' }}>
                          {plain ? plain(name) : <RubyText showFurigana={showFurigana}>{name}</RubyText>}
                        </span>
                      )}
                      {renderText ? renderText(l.text) : <RubyText showFurigana={showFurigana}>{l.text}</RubyText>}
                      {l.ja && <span className="block text-xs" style={{ color: '#7a5a3a' }}>{plain ? plain(l.ja) : l.ja}</span>}
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
