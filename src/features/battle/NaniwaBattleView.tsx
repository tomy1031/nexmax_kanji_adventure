import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion, type LegacyAnimationControls } from 'framer-motion';
import { GiCog, GiLightBulb, GiSpeaker } from 'react-icons/gi';
import type { KanjiData } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { FillIn } from '../../components/ui/Readings';
import { assetPath } from '../../lib/assetPath';
import { exampleWord, kanjiRuby } from '../../lib/reading';
import { parseRuby } from '../../lib/ruby';
import { speak } from '../../lib/speech';
import { comboMultiplier, type Stars } from '../../lib/mastery';
import { useGameStore } from '../../store/gameStore';

/**
 * 文字が 消えた 町の たたかい — laid out after the delivered example
 * (art-src/battle/00_配置例_バトル.png, 941 × 1672), built from its parts
 * (public/img/battle/, made by scripts/prepare_ui_assets.mjs):
 *
 *   the terrace at sunset; on top, the opponent's parchment plate and red bar
 *   with モジクイ under it; Nexmax with his brush on the deck, his dark plate
 *   and blue bar under him; the reading panel (よみ / 意味) with a speaker
 *   button; the parchment writing board with a dashed cross; もどる bottom
 *   left; the bulb (書きじゅん) and the gear (せってい) bottom right.
 *
 * The UI frame comes in two pieces cut across its empty middle, so a taller
 * phone gets a taller sky instead of a stretched frame: the top piece hangs
 * from the top of the screen, the bottom piece stands on the bottom. Every
 * place below is the example's own pixel (x, y) on its 941-wide canvas, turned
 * into a share of the piece it sits on; text sizes are pixels of that canvas
 * too, in container units, so the whole screen scales as one.
 *
 * What the example does not show but the fight needs is kept small and out of
 * the way: the opponent's patience (ミス) under its bar, the fill-in word and
 * the kanji's stars in the reading panel's empty right half, and the line that
 * tells what a write did, over the deck for a moment.
 */

const W = 941;
const TOP_H = 660;
const BOT_Y = 660;
const BOT_H = 1012;

const pct = (n: number) => `${n * 100}%`;
/** A box on the top piece, in the example's pixels. */
const onTop = (x: number, y: number, w: number, h: number) => ({ left: pct(x / W), top: pct(y / TOP_H), width: pct(w / W), height: pct(h / TOP_H) });
/** A box on the bottom piece, in the example's pixels. */
const onBottom = (x: number, y: number, w: number, h: number) => ({
  left: pct(x / W),
  top: pct((y - BOT_Y) / BOT_H),
  width: pct(w / W),
  height: pct(h / BOT_H),
});
/** A size in the example's pixels, scaled with the screen. */
const cq = (px: number) => `${(px / W) * 100}cqw`;

/** The writing square: the board's paper is 450 × 423, centred on (470, 1296). */
const PAPER = { x: 245, y: 1085, w: 450, h: 423 };
const WRITE_PX = 423;

const art = (name: string) => assetPath(`img/battle/${name}.webp`);
const MINCHO = { fontFamily: 'var(--font-mincho)' } as const;

/** The reading the blank in the fill-in word takes, else the kanji's usual one. */
const readingFor = (k: KanjiData): string => {
  const word = exampleWord(k);
  const inWord = word ? parseRuby(word).find((s) => s.text === k.char)?.reading : undefined;
  return inWord ?? /\(([^)]*)\)/.exec(kanjiRuby(k))?.[1] ?? '';
};

/** A bar baked full into the frame: the part already lost is covered from the right. */
const Bar = ({ value, max, delay, style }: { value: number; max: number; delay: number; style: React.CSSProperties }) => (
  <div className="absolute overflow-hidden" style={style}>
    <motion.div
      className="absolute inset-y-0 right-0"
      style={{ background: 'linear-gradient(180deg, #24150b 0%, #120803 100%)' }}
      initial={false}
      animate={{ width: pct(1 - Math.max(0, value) / max) }}
      transition={{ type: 'spring', stiffness: 220, damping: 26, delay }}
    />
  </div>
);

const RoundKey = ({ icon: Icon, label, onClick, style }: { icon: typeof GiCog; label: string; onClick: () => void; style: React.CSSProperties }) => (
  <motion.button
    type="button"
    data-tap
    aria-label={label}
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className="absolute flex items-center justify-center rounded-full border-[0.35cqw] border-[#d4a04a] text-[#f2c45a]"
    style={{ ...style, background: 'radial-gradient(circle at 50% 38%, #3b2a1c 0%, #140c06 78%)', boxShadow: 'inset 0 0 0 0.3cqw #3a250f' }}
  >
    <Icon aria-hidden className="h-[62%] w-[62%]" />
  </motion.button>
);

/** A reading turn as the view needs it (BattleScene, lib/readTurn.ts). */
export interface ReadTurnView {
  kanji: KanjiData;
  choices: string[];
  answer: string;
  /** The turn, so each question starts fresh. */
  n: number;
  picked: string | null;
  onPick: (choice: string) => void;
  onNext: () => void;
}

const TONE = {
  idle: { background: 'linear-gradient(180deg, #fffaf0 0%, #f1e2bf 100%)', borderColor: '#b8863f', color: '#24180d' },
  right: { background: 'linear-gradient(180deg, #fff2b8 0%, #f2c45a 100%)', borderColor: '#d4a04a', color: '#3b2208' },
  wrong: { background: 'linear-gradient(180deg, #f2a596 0%, #d2392f 100%)', borderColor: '#8f1f17', color: '#fff' },
  dim: { background: 'rgba(255,255,255,0.35)', borderColor: 'rgba(184,134,63,0.4)', color: 'rgba(36,24,13,0.4)' },
} as const;

/**
 * 読む ターン (08 §6.4): the opponent throws a kanji; it lands on the panel
 * and four readings wait under it. The reading stays hidden until one is
 * picked — then it shows above the kanji, and a wrong pick gets the right
 * one read aloud and a つぎへ. A reading turn follows a write, so the kanji
 * waits for that write's light to land (`enter`) before it is thrown; the
 * buttons stay faint and asleep until it lands, so nothing is pressed unseen.
 */
const ReadPanel = ({ read, showFurigana, still, enter }: { read: ReadTurnView; showFurigana: boolean; still: boolean; enter: number }) => {
  const [landed, setLanded] = useState(still);
  const wrong = read.picked != null && read.picked !== read.answer;
  const chip = 'rounded-full border-[0.35cqw] border-[#b8863f] px-[3cqw] font-black';
  return (
    <div
      className="absolute flex flex-col items-center justify-evenly rounded-[2cqw] border-[0.4cqw] border-[#c9973f] text-[#24180d]"
      style={{ ...onBottom(134, 905, 672, 620), background: 'linear-gradient(180deg, #f6ead0 0%, #ead7ae 100%)', boxShadow: 'inset 0 0 0 0.4cqw #fff6dd', ...MINCHO }}
    >
      <p className="rounded-full bg-[#2c1d10] px-[3cqw] leading-[2] font-black text-[#fff1cf]" style={{ fontSize: cq(30) }}>
        <RubyText showFurigana={showFurigana}>読(よ)みは どれ？</RubyText>
      </p>
      <motion.p
        className="leading-[1.45] font-extrabold"
        style={{ fontSize: cq(140), willChange: 'transform' }}
        initial={still ? false : { x: '60%', y: '-70%', scale: 0.4, rotate: -25, opacity: 0 }}
        animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: still ? 0 : enter }}
        onAnimationComplete={() => setLanded(true)}
      >
        <RubyText showFurigana={showFurigana && read.picked != null}>{`${read.kanji.char}(${read.answer})`}</RubyText>
      </motion.p>
      <div
        className="grid w-[86%] grid-cols-2 gap-[2.4cqw] transition-opacity duration-200"
        style={{ pointerEvents: landed && read.picked == null ? 'auto' : 'none', opacity: landed ? 1 : 0.45 }}
      >
        {read.choices.map((c) => {
          const tone = read.picked == null ? 'idle' : c === read.answer ? 'right' : c === read.picked ? 'wrong' : 'dim';
          return (
            <motion.button
              key={c}
              type="button"
              data-tap
              whileTap={{ scale: 0.95 }}
              disabled={read.picked != null}
              onClick={() => read.onPick(c)}
              className="rounded-[1.6cqw] border-[0.4cqw] font-extrabold"
              style={{ minHeight: cq(100), fontSize: cq(46), ...TONE[tone] }}
            >
              {c}
            </motion.button>
          );
        })}
      </div>
      {wrong && (
        <div className="flex gap-[2.4cqw]">
          <button type="button" data-tap onClick={() => speak(read.answer)} className={chip} style={{ fontSize: cq(30), lineHeight: 2, background: '#fffaf0' }}>
            🔊 {read.answer}
          </button>
          <button type="button" data-tap onClick={read.onNext} className={chip} style={{ fontSize: cq(30), lineHeight: 2, background: '#f2c45a' }}>
            つぎへ ▶
          </button>
        </div>
      )}
    </div>
  );
};

export interface NaniwaBattleViewProps {
  bossName: string;
  /** The opponent's picture; the grown Mojikui when not given. */
  bossImg?: string;
  bossHp: number;
  bossMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  /** Slips since the opponent last struck, and how many it lets pass. */
  rage: number;
  patience: number;
  target: KanjiData;
  targetStars: Stars;
  showFurigana: boolean;
  /** The bars drop when the light lands (lib/lightFlow), not when the write ends. */
  hpDelay: number;
  /** The writer, built by BattleScene (it owns the quiz), at this many pixels square. */
  renderWriter: (size: number) => ReactNode;
  /** What the last write did; `flashKey` changes with every new one. Shown for a moment. */
  flash: string | null;
  flashKey: number;
  /** Said while nothing has happened yet (the first turn). */
  idle: string | null;
  hit: { n: number; damage: number; critical?: boolean } | null;
  combo: number;
  still: boolean;
  heroCtl: LegacyAnimationControls;
  enemyCtl: LegacyAnimationControls;
  fieldCtl: LegacyAnimationControls;
  /** Where the written light starts, passes and lands (LightFlow). */
  boardRef: RefObject<HTMLDivElement | null>;
  heroRef: RefObject<HTMLDivElement | null>;
  enemyRef: RefObject<HTMLDivElement | null>;
  onStrokeOrder: () => void;
  onFlee: () => void;
  /** 読む ターン: a thrown kanji to read, in place of the reading panel and the board. */
  read?: ReadTurnView | null;
}

export const NaniwaBattleView = ({
  bossName,
  bossImg,
  bossHp,
  bossMaxHp,
  playerHp,
  playerMaxHp,
  rage,
  patience,
  target,
  targetStars,
  showFurigana,
  hpDelay,
  renderWriter,
  flash,
  flashKey,
  idle,
  hit,
  combo,
  still,
  heroCtl,
  enemyCtl,
  fieldCtl,
  boardRef,
  heroRef,
  enemyRef,
  onStrokeOrder,
  onFlee,
  read = null,
}: NaniwaBattleViewProps) => {
  const colRef = useRef<HTMLDivElement>(null);
  const [colW, setColW] = useState(0);
  useLayoutEffect(() => {
    const el = colRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setColW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const writeSize = Math.floor((colW * WRITE_PX) / W);

  const [menu, setMenu] = useState(false);
  const settings = useGameStore((s) => s.settings);
  const setSetting = useGameStore((s) => s.setSetting);

  // A line stays up for a moment, then gives the deck back.
  const [hiddenKey, setHiddenKey] = useState<number | null>(null);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setHiddenKey(flashKey), 2200);
    return () => clearTimeout(t);
  }, [flash, flashKey]);
  const line = flash && hiddenKey !== flashKey ? { text: flash, key: `f${flashKey}` } : idle ? { text: idle, key: 'idle' } : null;

  const reading = readingFor(target);
  const hasWord = exampleWord(target) != null;

  return (
    <div className="relative h-dvh overflow-hidden bg-[#140c06] text-white">
      {/* Wider than the column (PCs, tablets): the terrace across the whole
          window, and the column's sky lets it through. A background image, so
          a phone — where the column is the window — never downloads it. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-cover bg-center [@media(min-aspect-ratio:3/5)]:block"
        style={{ backgroundImage: `url(${art('bg_wide')})` }}
      />

      {/* Inside the safe area: on a notched iPhone played from the home screen the
          status bar and the home bar would otherwise cover the HP bar and もどる. */}
      <div ref={colRef} className="relative mx-auto flex h-full w-[min(100%,56dvh)] flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] [container-type:inline-size]">
        {/* 上: 空・あいて ------------------------------------------------- */}
        <motion.div className="relative min-h-0 flex-1" animate={fieldCtl}>
          {/* たて画面: the sky, the city and the river down to the deck line */}
          <img
            src={art('bg_tall')}
            alt=""
            aria-hidden
            className="absolute inset-x-0 top-0 h-[calc(100%+16cqw)] w-full object-cover object-[30%_100%] [@media(min-aspect-ratio:3/5)]:hidden"
          />

          {/* モジクイ — under the top frame, so its bar sits over it */}
          <div className="absolute" style={{ ...onTop(390, 38, 489, 652), height: 'auto', aspectRatio: '3 / 4' }}>
            <motion.div className="relative h-full w-full" animate={enemyCtl}>
              <motion.img
                src={bossImg ? assetPath(bossImg) : art('mojikui')}
                alt=""
                aria-hidden
                draggable={false}
                className="h-full w-full object-contain select-none"
                style={{ willChange: 'transform' }}
                animate={still ? undefined : { y: ['0%', '-1.5%', '0%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* the face: where the light lands */}
              <div ref={enemyRef} aria-hidden className="absolute h-px w-px" style={{ left: '52.5%', top: '42.5%' }} />
              <AnimatePresence>
                {hit && (
                  <motion.span
                    key={hit.n}
                    initial={{ opacity: 0, y: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1.2 }}
                    transition={{ duration: 1.1 }}
                    // Over the dark body, not the white talismans.
                    className="g-outline-text pointer-events-none absolute top-[46%] left-1/2 -translate-x-1/2 font-black"
                    style={{ fontSize: cq(hit.critical ? 96 : 76), color: hit.critical ? '#ffe27a' : '#fff6dc' }}
                  >
                    {hit.damage}
                  </motion.span>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {combo >= 2 && (
                  <motion.span
                    key={`combo-${combo}`}
                    initial={{ opacity: 0, scale: 2.2, rotate: -12 }}
                    animate={{ opacity: 1, scale: 1, rotate: -8 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                    className="g-outline-text pointer-events-none absolute top-[22%] left-[2%] font-black whitespace-nowrap"
                    style={{ fontSize: cq(44), color: '#ffe27a', willChange: 'transform' }}
                  >
                    {combo} COMBO!
                    <span className="block" style={{ fontSize: cq(24) }}>
                      +{Math.round((comboMultiplier(combo) - 1) * 100)}%
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 上の わく: corner posts, the opponent's plate and bar */}
          <div className="absolute inset-x-0 top-0 aspect-[941/660] [@media(min-aspect-ratio:3/5)]:[mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
            <img src={art('frame_top')} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />
            <p
              className="absolute flex items-center justify-center leading-none font-extrabold whitespace-nowrap text-[#2a1a0c]"
              style={{ ...onTop(402, 40, 339, 48), ...MINCHO, fontSize: cq(30) }}
            >
              <RubyText showFurigana={showFurigana}>{bossName}</RubyText>
            </p>
            <span className="absolute flex items-center justify-center leading-none font-bold" style={{ ...onTop(296, 96, 70, 24), ...MINCHO, fontSize: cq(24) }}>
              HP
            </span>
            <Bar value={bossHp} max={bossMaxHp} delay={hpDelay} style={onTop(377, 98, 385, 21)} />
            <span
              className="absolute flex items-center justify-center leading-none font-bold tabular-nums"
              // Hard's HP runs to four and five digits: smaller, so it stays on the plate.
              style={{ ...onTop(768, 94, 137, 28), ...MINCHO, fontSize: cq(bossMaxHp >= 10000 ? 16 : bossMaxHp >= 1000 ? 20 : 26) }}
            >
              {Math.max(0, bossHp)} / {bossMaxHp}
            </span>
            {/* がまん: the slips left before it strikes. Five fit the example's
                plate; the level and a charm can add more, so it grows to the left. */}
            <div
              className="absolute flex items-center justify-end gap-[0.6cqw] rounded-full border border-[#b8863f]/70 bg-[#140c06]/80 px-[1.2cqw]"
              style={onTop(735 - Math.max(0, patience - 5) * 22, 134, 170 + Math.max(0, patience - 5) * 22, 30)}
              aria-label={`ミス ${rage} / ${patience}`}
            >
              <span className="leading-none font-black" style={{ fontSize: cq(18) }}>
                ミス
              </span>
              {Array.from({ length: patience }, (_, i) => (
                <motion.span
                  key={i}
                  className="aspect-square rounded-full border border-white/70"
                  style={{ width: cq(16) }}
                  animate={{ background: i < rage ? '#ff5a4a' : 'rgba(255,255,255,0.12)', scale: i === rage - 1 ? [1.6, 1] : 1 }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* 下: 甲板・ネクマックス・読み・書く台 -------------------------------- */}
        <div className="relative aspect-[941/1012] shrink-0">
          {/* the frame's deck stops a little short of its canvas: carry the planks on */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[5%]" style={{ background: 'linear-gradient(180deg, #3a2414 0%, #1c1009 100%)' }} />
          <img
            src={art('frame_bottom')}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full select-none [@media(min-aspect-ratio:3/5)]:[mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]"
          />

          {/* ネクマックス — stands on the deck, over the frame */}
          <motion.div className="absolute" style={onBottom(55, 374, 379, 505)} animate={heroCtl}>
            <img src={art('nexmax_brush')} alt="" aria-hidden draggable={false} className="h-full w-full select-none" />
            {/* the chest: where the light goes in */}
            <div ref={heroRef} aria-hidden className="absolute h-px w-px" style={{ left: '60%', top: '62%' }} />
          </motion.div>

          {/* 名前と HP */}
          <p
            className="absolute flex items-center justify-center leading-none font-bold tracking-[0.06em] whitespace-nowrap"
            style={{ ...onBottom(45, 818, 240, 44), ...MINCHO, fontSize: cq(28) }}
          >
            ネクマックス
          </p>
          <span className="absolute flex items-center justify-center leading-none font-bold" style={{ ...onBottom(22, 868, 78, 24), ...MINCHO, fontSize: cq(24) }}>
            HP
          </span>
          <Bar value={playerHp} max={playerMaxHp} delay={0} style={onBottom(103, 870, 279, 22)} />
          <span
            className="absolute flex items-center justify-center leading-none font-bold tabular-nums"
            style={{ ...onBottom(392, 866, 140, 28), ...MINCHO, fontSize: cq(26) }}
          >
            {Math.max(0, playerHp)} / {playerMaxHp}
          </span>

          {read && <ReadPanel key={read.n} read={read} showFurigana={showFurigana} still={still} enter={hpDelay + 0.15} />}
          {!read && (
          <>
          {/* よみ・意味 */}
          <div className="absolute text-[#24180d]" style={{ ...onBottom(134, 912, 672, 165), ...MINCHO }}>
            <p className="absolute flex items-center gap-[1.2cqw] leading-none" style={{ left: pct(66 / 672), top: pct(28 / 165), height: pct(56 / 165) }}>
              <span className="font-semibold" style={{ fontSize: cq(26) }}>
                よみ：
              </span>
              <span className="font-extrabold text-[#140c06]" style={{ fontSize: cq(52) }}>
                {reading}
              </span>
            </p>
            {hasWord && (
              <p
                className="absolute flex items-end justify-center leading-[1.7] font-bold whitespace-nowrap"
                style={{ left: pct(400 / 672), width: pct(250 / 672), top: pct(10 / 165), height: pct(78 / 165), fontSize: cq(42) }}
              >
                <FillIn kanji={target} showFurigana={showFurigana} />
              </p>
            )}
            <p className="absolute flex items-center gap-[1.2cqw] leading-none" style={{ left: pct(66 / 672), top: pct(100 / 165), height: pct(40 / 165), width: pct(400 / 672) }}>
              <span className="shrink-0 font-semibold" style={{ fontSize: cq(26) }}>
                <RubyText showFurigana={showFurigana}>意味(いみ)：</RubyText>
              </span>
              <span className="truncate font-semibold" style={{ fontSize: cq(30) }}>
                {target.meanings.slice(0, 2).join(' / ')}
              </span>
            </p>
            <p
              className="absolute flex items-center justify-end leading-none tracking-[0.1em]"
              style={{ right: pct(30 / 672), top: pct(100 / 165), height: pct(40 / 165), fontSize: cq(30), color: '#b8741a' }}
              aria-label={`★${targetStars}`}
            >
              {'★'.repeat(targetStars) + '☆'.repeat(3 - targetStars)}
            </p>
          </div>
          <motion.button
            type="button"
            data-tap
            aria-label="よみあげ"
            whileTap={{ scale: 0.92 }}
            onClick={() => speak(reading)}
            className="absolute flex items-center justify-center rounded-[22%] border-[0.35cqw] border-[#c9973f]"
            style={{ ...onBottom(843, 945, 84, 80), background: 'linear-gradient(180deg, #2c1d10 0%, #120a04 100%)' }}
          >
            <span
              className="flex h-[86%] w-[86%] items-center justify-center rounded-full border-[0.3cqw] border-[#d4a04a] text-[#f2d79a]"
              style={{ background: 'radial-gradient(circle at 50% 38%, #3b2a1c 0%, #140c06 78%)' }}
            >
              <GiSpeaker aria-hidden className="h-[72%] w-[72%] text-[#f2c45a]" />
            </span>
          </motion.button>

          {/* 書く台: the dashed cross, then the writer over it */}
          <svg aria-hidden className="pointer-events-none absolute" style={onBottom(PAPER.x, PAPER.y, PAPER.w, PAPER.h)} viewBox={`0 0 ${PAPER.w} ${PAPER.h}`}>
            <g stroke="#b6a08a" strokeWidth="1.6" strokeDasharray="9 7" fill="none">
              <line x1={PAPER.w / 2} y1="14" x2={PAPER.w / 2} y2={PAPER.h - 14} />
              <line x1="12" y1={PAPER.h / 2} x2={PAPER.w - 12} y2={PAPER.h / 2} />
            </g>
          </svg>
          <div ref={boardRef} className="absolute flex items-center justify-center" style={onBottom(PAPER.x, PAPER.y, PAPER.w, PAPER.h)}>
            {writeSize > 0 && renderWriter(writeSize)}
          </div>
          </>
          )}

          {/* もどる（にげる） */}
          <motion.button type="button" data-tap whileTap={{ scale: 0.95 }} onClick={onFlee} className="absolute" style={{ ...onBottom(30, 1533, 228, 85), height: 'auto' }}>
            <img src={art('btn_back')} alt="もどる" draggable={false} className="block h-auto w-full select-none" />
          </motion.button>

          {/* 書きじゅん・せってい */}
          <div
            aria-hidden
            className="absolute rounded-[1.4cqw] border-[0.35cqw] border-[#b8863f]"
            style={{ ...onBottom(826, 1458, 86, 167), background: 'linear-gradient(180deg, #2a1b0e 0%, #0f0803 100%)' }}
          />
          {!read && <RoundKey icon={GiLightBulb} label="かきじゅん（ミス＋1）" onClick={onStrokeOrder} style={onBottom(833, 1464, 72, 72)} />}
          <RoundKey icon={GiCog} label="せってい" onClick={() => setMenu((m) => !m)} style={onBottom(833, 1549, 72, 72)} />
          <AnimatePresence>
            {menu && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="absolute flex flex-col gap-[1cqw] rounded-[1.4cqw] border-[0.35cqw] border-[#b8863f] p-[1.6cqw] text-[#fff1cf]"
                style={{ right: pct(130 / W), bottom: pct((1672 - 1625) / BOT_H), background: 'linear-gradient(180deg, #2a1b0e 0%, #0f0803 100%)', fontSize: cq(26) }}
              >
                {(
                  [
                    ['furigana', 'ふりがな', settings.furigana],
                    ['muted', '音(おと)', !settings.muted],
                  ] as const
                ).map(([key, label, on]) => (
                  <button
                    key={key}
                    type="button"
                    data-tap
                    aria-pressed={on}
                    onClick={() => setSetting(key, key === 'muted' ? on : !on)}
                    className="flex items-center justify-between gap-[3cqw] rounded-[1cqw] px-[1.6cqw] py-[1cqw] font-black whitespace-nowrap"
                    style={{ background: on ? 'rgba(242,196,90,0.18)' : 'rgba(255,255,255,0.05)' }}
                  >
                    <RubyText showFurigana={settings.furigana}>{label}</RubyText>
                    <span style={{ color: on ? '#f2c45a' : 'rgba(255,255,255,0.45)' }}>{on ? 'ON' : 'OFF'}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 書いた ことの 結果 — a moment over the deck */}
          <AnimatePresence>
            {line && (
              <motion.p
                key={line.key}
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                aria-live="polite"
                className="pointer-events-none absolute z-10 flex items-center justify-center rounded-full border-[0.3cqw] border-[#d4a04a] px-[2.4cqw] text-center leading-snug font-black"
                style={{ ...onBottom(430, 748, 490, 54), background: 'rgba(20,12,6,0.86)', fontSize: cq(24), color: '#fff1cf', willChange: 'transform' }}
              >
                <RubyText showFurigana={showFurigana}>{line.text}</RubyText>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default NaniwaBattleView;
