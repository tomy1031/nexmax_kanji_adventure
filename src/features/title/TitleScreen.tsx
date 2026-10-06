import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { useBgm } from '../../lib/bgm';
import { preloadImages } from '../../lib/preload';
import { PROLOGUE_PICTURE } from '../../data/scripts/prologue';
import { useStill } from '../../hooks/useStill';

/**
 * Title (the layout example delivered with the parts, 「ChatGPT 画像 2026年9月29日
 * 17_02_34.png」): the city at sunset, the logo across the sky, Nexmax on the
 * ledge pointing out over the river, and three plates.
 *
 * Every part is a delivered picture (art-src/titlesozai/, kept out of git;
 * made web-sized into public/img/title/ by scripts/prepare_ui_assets.mjs);
 * nothing is drawn in CSS. Phones get the tall city, PCs the wide one.
 *
 * The plates follow the usual phone-game title: the one thing to do next is
 * the big blue plate on top, everything else is a smaller brown plate of one
 * size. Both lead into 文字が 消えた 町 (08), which is the game now; the
 * picture-book worlds are closing (2026-09-30) and are reached only from the
 * route map's small ほかの 物語 link.
 *
 *   new player    はじめから (blue) → the prologue, which leads into 0章 or 1章
 *                 つづきから (brown, greyed: nothing to continue yet)
 *   returning     つづきから (blue) → ステージせんたく, whose つづき bar names
 *                   the next episode — one tap to play it (08 §3.8)
 *                 はじめから (brown) → asks first: watch the prologue again
 *                   (nothing is lost) or carry on; wiping the save lives in
 *                   せってい, behind its own confirmation.
 *   always        せってい (brown)
 *
 * The screen comes in as a sequence — the logo drops in, Nexmax rises, the
 * plates slide up — and the blue plate keeps glowing softly. Nothing that
 * moves carries a CSS filter: on iPhone and iPad a filter on a moving layer is
 * redrawn every frame (2026-09-26「オープニングから重い」).
 */

const art = (name: string) => assetPath(`img/title/${name}.webp`);

/**
 * The button pictures, all cut with one box (width : height = 3.8). Where the
 * plate itself starts and ends inside each, as a fraction of its height,
 * measured from the WebP: gears and glow stick out differently on each, so
 * equal margins would leave unequal gaps.
 */
const PLATE_ASPECT = 3.8;
const PLATES = {
  newBlue: { src: 'btn_new_blue', label: 'はじめから', en: 'Start', top: 0.11, bottom: 0.955 },
  newBrown: { src: 'btn_new_brown', label: 'はじめから', en: 'Start', top: 0.143, bottom: 0.952 },
  continueBlue: { src: 'btn_continue_blue', label: 'つづきから', en: 'Continue', top: 0.12, bottom: 0.92 },
  continueBrown: { src: 'btn_continue_brown', label: 'つづきから', en: 'Continue', top: 0.082, bottom: 0.925 },
  settings: { src: 'btn_settings', label: 'せってい', en: 'Settings', top: 0.102, bottom: 0.925 },
} as const;
type PlateArt = (typeof PLATES)[keyof typeof PLATES];

/** Widths in % of the column: the big plate, and every other one. */
const BIG = 60;
const SMALL = 43;
/**
 * Visible gap between two plates, in % of the column width — room for the
 * English under each plate (the player cannot read Japanese yet).
 */
const GAP = 6.4;

type PlateSpec = { art: PlateArt; width: number; onClick: () => void; disabled?: boolean; glow?: boolean };

/** margin-top (in %, which CSS takes of the width) that leaves GAP between the drawn plates. */
const marginAbove = (above: PlateSpec, below: PlateSpec) =>
  GAP - (1 - above.art.bottom) * (above.width / PLATE_ASPECT) - below.art.top * (below.width / PLATE_ASPECT);

const Plate = ({ spec, marginTop, still }: { spec: PlateSpec; marginTop: number; still: boolean }) => (
  <motion.button
    type="button"
    data-tap
    disabled={spec.disabled}
    whileTap={spec.disabled ? undefined : { scale: 0.95 }}
    className="relative block disabled:opacity-60 disabled:grayscale"
    style={{ width: `${spec.width}%`, marginTop: `${marginTop}%` }}
    onClick={spec.onClick}
  >
    {spec.glow && !still && (
      <motion.span
        aria-hidden
        className="absolute -inset-x-[4%] -inset-y-[18%] rounded-full"
        style={{ background: 'radial-gradient(ellipse closest-side, rgba(255,214,110,0.85) 0%, rgba(255,190,60,0.3) 55%, transparent 100%)', willChange: 'opacity' }}
        animate={{ opacity: [0.15, 0.85, 0.15] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    )}
    <img src={art(spec.art.src)} alt={spec.art.label} draggable={false} className="relative block h-auto w-full select-none" />
    {/* The plate's word in English, just under the drawn plate. */}
    <span
      aria-hidden
      lang="en"
      className="absolute left-1/2 -translate-x-1/2 text-[clamp(10px,3vw,13px)] leading-none font-bold whitespace-nowrap text-[#ffe9c2]"
      style={{ top: `${spec.art.bottom * 100 + 4}%`, textShadow: '0 1px 2px rgba(10,6,30,0.95), 0 0 6px rgba(10,6,30,0.8)' }}
    >
      {spec.art.en}
    </span>
  </motion.button>
);

export const TitleScreen = () => {
  useBgm('town');
  const navigate = useNavigate();
  const hasSave = useGameStore((s) => s.clearedStages.length > 0 || s.weapons.length > 0);
  const seenIntro = useGameStore((s) => s.tutorials.intro);
  const seenPrologue = useGameStore((s) => s.tutorials.prologue);
  const canContinue = seenPrologue || seenIntro || hasSave;
  // A new player's はじめから opens the prologue: have its pictures ready by then.
  useEffect(() => {
    if (!canContinue) preloadImages([...new Set(Object.values(PROLOGUE_PICTURE))]);
  }, [canContinue]);
  const still = useStill();

  // A new player starts with the prologue of 文字が 消えた 町 (08 §10.2). A
  // returning one is asked first (08 §3.8): はじめから keeps the record, and
  // wiping it is in せってい — so nobody loses their progress to a tap here.
  const [asking, setAsking] = useState(false);
  const startOver = () => (canContinue ? setAsking(true) : navigate('/prologue'));
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const carryOn = () => navigate('/map/moji');
  const settings: PlateSpec = { art: PLATES.settings, width: SMALL, onClick: () => navigate('/settings') };
  const plates: PlateSpec[] = canContinue
    ? [
        { art: PLATES.continueBlue, width: BIG, onClick: carryOn, glow: true },
        { art: PLATES.newBrown, width: SMALL, onClick: startOver },
        settings,
      ]
    : [
        { art: PLATES.newBlue, width: BIG, onClick: startOver, glow: true },
        { art: PLATES.continueBrown, width: SMALL, onClick: carryOn, disabled: true },
        settings,
      ];

  return (
    <div className="relative h-dvh overflow-hidden bg-[#2a2350]">
      <picture>
        <source media="(orientation: landscape)" srcSet={art('bg_wide')} />
        <img src={art('bg')} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      </picture>

      {/* The composition keeps the reference's 9:16 proportions; on a wide
          screen the city still fills the window behind it. */}
      <div className="relative mx-auto flex h-full w-[min(100%,56dvh)] flex-col items-center pt-[max(3dvh,env(safe-area-inset-top))] pb-[max(8dvh,env(safe-area-inset-bottom))]">
        {/* ロゴ ---------------------------------------------------------- */}
        <motion.h1
          className="w-[86%]"
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.2 }}
        >
          <img
            src={art('logo')}
            alt="ネクマックスの漢字アドベンチャー　なくなった ことばを 取りもどそう！"
            fetchPriority="high"
            className="block h-auto w-full"
          />
        </motion.h1>

        <div className="flex-1" />

        {/* ネクマックスと ボタン ------------------------------------------- */}
        <div className="relative w-full">
          <motion.div
            aria-hidden
            className="absolute bottom-full left-[12%] mb-[0.6dvh] w-[min(40%,19.5dvh)]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.5 }}
          >
            <motion.img
              src={art('nexmax')}
              alt=""
              draggable={false}
              className="block h-auto w-full select-none"
              style={{ willChange: 'transform' }}
              animate={still ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <motion.div
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {plates.map((p, i) => (
              <Plate key={p.art.src} spec={p} marginTop={i === 0 ? 0 : marginAbove(plates[i - 1], p)} still={still} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* はじめから, with a save: what it does and does not do */}
      <AnimatePresence>
        {asking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 px-6"
            onClick={() => setAsking(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="g-parchment w-full max-w-sm px-5 py-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xl leading-[2] font-black" style={{ color: 'var(--accent-2)' }}>
                はじめから
              </p>
              <p className="mt-1 text-sm leading-[2] font-bold">
                <RubyText showFurigana={showFurigana}>プロローグから もう一度(いちど) 見(み)ます。きろくは のこります。</RubyText>
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" className="g-btn g-btn-primary w-full" onClick={() => navigate('/prologue')}>
                  <RubyText showFurigana={showFurigana}>プロローグを 見(み)る</RubyText>
                </button>
                <button type="button" className="g-btn g-btn-accent w-full" onClick={carryOn}>
                  <RubyText showFurigana={showFurigana}>つづきから あそぶ</RubyText>
                </button>
                <button type="button" className="g-btn g-btn-ghost w-full" onClick={() => setAsking(false)}>
                  やめる
                </button>
              </div>
              <p className="mt-3 text-xs font-bold" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>データを 消(け)す ときは「せってい」から。</RubyText>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TitleScreen;
